import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.stock import StockMovement
from app.models.user import User
from app.dependencies import get_current_user, require_role
from app.schemas.sale import SaleCreate, SaleResponse

router = APIRouter()


def sale_to_response(s: Sale) -> SaleResponse:
    return SaleResponse(
        id=str(s.id),
        sale_number=s.sale_number,
        status=s.status,
        payment_method=s.payment_method,
        subtotal=s.subtotal,
        discount_amount=s.discount_amount,
        tax_amount=s.tax_amount,
        total_amount=s.total_amount,
        paid_amount=s.paid_amount,
        change_amount=s.change_amount,
        customer_name=s.customer_name,
        customer_phone=s.customer_phone,
        customer_email=s.customer_email,
        created_at=s.created_at.isoformat() if s.created_at else "",
    )


@router.get("/", response_model=list[SaleResponse])
def list_sales(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    user: User = Depends(require_role("owner", "pharmacist", "cashier")),
    db: Session = Depends(get_db),
):
    q = db.query(Sale).filter(Sale.tenant_id == user.tenant_id)
    if status:
        q = q.filter(Sale.status == status)
    sales = q.order_by(Sale.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return [sale_to_response(s) for s in sales]


@router.get("/pending", response_model=list[SaleResponse])
def pending_sales(
    user: User = Depends(require_role("owner", "pharmacist", "cashier")),
    db: Session = Depends(get_db),
):
    sales = (
        db.query(Sale)
        .filter(Sale.tenant_id == user.tenant_id, Sale.status == "pending")
        .order_by(Sale.created_at.desc())
        .limit(20)
        .all()
    )
    return [sale_to_response(s) for s in sales]


@router.get("/report")
def sales_report(
    period: str = Query("today"),
    user: User = Depends(require_role("owner", "pharmacist", "cashier")),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        raise HTTPException(status_code=400, detail="Invalid period. Use: today, week, month, year")

    sales = (
        db.query(Sale)
        .filter(
            Sale.tenant_id == user.tenant_id,
            Sale.created_at >= start,
            Sale.status != "refunded",
        )
        .all()
    )

    total_sales = len(sales)
    total_revenue = sum(s.total_amount for s in sales)
    average_ticket = round(total_revenue / total_sales, 2) if total_sales > 0 else 0

    by_payment_method = {}
    for s in sales:
        method = s.payment_method or "unknown"
        by_payment_method.setdefault(method, {"count": 0, "total": 0.0})
        by_payment_method[method]["count"] += 1
        by_payment_method[method]["total"] += s.total_amount

    return {
        "period": period,
        "total_revenue": round(total_revenue, 2),
        "total_sales": total_sales,
        "average_ticket": average_ticket,
        "by_payment_method": by_payment_method,
    }


@router.post("/", response_model=SaleResponse, status_code=201)
def create_sale(
    data: SaleCreate,
    user: User = Depends(require_role("owner", "pharmacist", "cashier")),
    db: Session = Depends(get_db),
):
    subtotal = 0
    tax_amount = 0
    sale_items = []

    for item in data.items:
        product = (
            db.query(Product)
            .filter(Product.tenant_id == user.tenant_id, Product.id == uuid.UUID(item.product_id))
            .first()
        )
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.current_stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insufficient for {product.name}: {product.current_stock} available, {item.quantity} requested")

        total_price = item.unit_price * item.quantity * (1 - item.discount_percentage / 100)
        subtotal += item.unit_price * item.quantity
        tax_amount += total_price * (product.vat_rate / 100)

        sale_items.append(
            SaleItem(
                tenant_id=user.tenant_id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_percentage=item.discount_percentage,
                total_price=total_price,
            )
        )

        product.current_stock -= item.quantity
        db.add(
            StockMovement(
                tenant_id=user.tenant_id,
                product_id=product.id,
                movement_type="out",
                quantity=-item.quantity,
                reason="sale",
                performed_by=user.id,
            )
        )

    total = subtotal - data.discount_amount + tax_amount
    sale = Sale(
        tenant_id=user.tenant_id,
        sale_number=f"VENTE-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        customer_id=data.customer_id,
        cashier_id=data.cashier_id or user.id,
        status="completed",
        payment_method=data.payment_method,
        subtotal=subtotal,
        discount_amount=data.discount_amount,
        tax_amount=tax_amount,
        total_amount=total,
        paid_amount=total,
        change_amount=0,
        notes=data.notes,
    )
    db.add(sale)
    db.flush()

    for si in sale_items:
        si.sale_id = sale.id
        db.add(si)

    db.commit()
    db.refresh(sale)
    return sale_to_response(sale)


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: uuid.UUID,
    user: User = Depends(require_role("owner", "pharmacist", "cashier")),
    db: Session = Depends(get_db),
):
    sale = (
        db.query(Sale)
        .filter(Sale.tenant_id == user.tenant_id, Sale.id == sale_id)
        .first()
    )
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale_to_response(sale)


@router.post("/{sale_id}/refund", response_model=SaleResponse)
def refund_sale(
    sale_id: uuid.UUID,
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    sale = (
        db.query(Sale)
        .filter(Sale.tenant_id == user.tenant_id, Sale.id == sale_id)
        .first()
    )
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    if sale.status == "refunded":
        raise HTTPException(status_code=400, detail="Sale already refunded")

    items = db.query(SaleItem).filter(SaleItem.sale_id == sale.id).all()
    for item in items:
        product = db.query(Product).filter(Product.id == uuid.UUID(item.product_id)).first()
        if product:
            product.current_stock += item.quantity
            db.add(
                StockMovement(
                    tenant_id=user.tenant_id,
                    product_id=product.id,
                    movement_type="return",
                    quantity=item.quantity,
                    reason="refund",
                    performed_by=user.id,
                )
            )

    sale.status = "refunded"
    db.commit()
    db.refresh(sale)
    return sale_to_response(sale)


@router.put("/{sale_id}/status", response_model=SaleResponse)
def update_sale_status(
    sale_id: uuid.UUID,
    status: str = Query(...),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    sale = (
        db.query(Sale)
        .filter(Sale.tenant_id == user.tenant_id, Sale.id == sale_id)
        .first()
    )
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    sale.status = status
    db.commit()
    db.refresh(sale)
    return sale_to_response(sale)


@router.delete("/{sale_id}", status_code=204)
def delete_sale(
    sale_id: uuid.UUID,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    sale = db.query(Sale).filter(Sale.id == sale_id, Sale.tenant_id == user.tenant_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Vente introuvable")
    db.delete(sale)
    db.commit()


@router.put("/{sale_id}", response_model=SaleResponse)
def update_sale(
    sale_id: uuid.UUID,
    data: SaleCreate,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    sale = db.query(Sale).filter(Sale.id == sale_id, Sale.tenant_id == user.tenant_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    for key, val in data.model_dump(exclude={"items", "customer_id", "cashier_id"}, exclude_unset=True).items():
        setattr(sale, key, val)
    db.commit()
    db.refresh(sale)
    return sale_to_response(sale)


@router.get("/{sale_id}/items")
def get_sale_items(
    sale_id: uuid.UUID,
    user: User = Depends(require_role("owner", "pharmacist", "cashier")),
    db: Session = Depends(get_db),
):
    sale = db.query(Sale).filter(Sale.id == sale_id, Sale.tenant_id == user.tenant_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Vente introuvable")
    items = db.query(SaleItem).filter(SaleItem.sale_id == sale_id).all()
    return [
        {
            "id": str(i.id),
            "product_id": str(i.product_id) if i.product_id else None,
            "quantity": i.quantity,
            "unit_price": i.unit_price,
            "discount_percentage": i.discount_percentage,
            "total_price": i.total_price,
        }
        for i in items
    ]

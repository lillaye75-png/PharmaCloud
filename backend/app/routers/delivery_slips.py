import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from app.database import get_db
from app.models.delivery import DeliverySlip, DeliverySlipItem
from app.models.product import Product
from app.models.stock import StockMovement
from app.models.user import User
from app.dependencies import require_role

router = APIRouter()


class SlipItemCreate(BaseModel):
    product_id: str
    quantity_ordered: int
    quantity_received: int
    unit_cost: float


class SlipCreate(BaseModel):
    supplier_name: str
    notes: Optional[str] = None
    items: list[SlipItemCreate]


@router.get("/")
def list_slips(
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    slips = (
        db.query(DeliverySlip)
        .filter(DeliverySlip.tenant_id == user.tenant_id)
        .order_by(DeliverySlip.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": str(s.id),
            "slip_number": s.slip_number,
            "supplier_name": s.supplier_name,
            "status": s.status,
            "total_amount": s.total_amount,
            "created_at": s.created_at.isoformat() if s.created_at else "",
        }
        for s in slips
    ]


@router.post("/", status_code=201)
def create_slip(
    data: SlipCreate,
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    total = sum(item.unit_cost * item.quantity_received for item in data.items)
    slip = DeliverySlip(
        tenant_id=user.tenant_id,
        slip_number=f"BL-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        supplier_name=data.supplier_name,
        status="pending",
        total_amount=total,
        notes=data.notes,
    )
    db.add(slip)
    db.flush()

    for item in data.items:
        product = db.query(Product).filter(
            Product.tenant_id == user.tenant_id,
            Product.id == uuid.UUID(item.product_id),
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Produit {item.product_id} introuvable")

        db.add(DeliverySlipItem(
            slip_id=slip.id,
            product_id=product.id,
            quantity_ordered=item.quantity_ordered,
            quantity_received=item.quantity_received or 0,
            unit_cost=item.unit_cost,
        ))

    db.commit()
    return {"id": str(slip.id), "slip_number": slip.slip_number, "total_amount": total}


@router.get("/returns")
def list_returns(
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    returns = (
        db.query(StockMovement)
        .filter(
            StockMovement.tenant_id == user.tenant_id,
            StockMovement.movement_type == "return",
        )
        .order_by(StockMovement.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": str(r.id),
            "product_id": str(r.product_id),
            "quantity": r.quantity,
            "reason": r.reason,
            "created_at": r.created_at.isoformat() if r.created_at else "",
        }
        for r in returns
    ]


@router.post("/returns", status_code=201)
def create_return(
    product_id: str = Query(...),
    quantity: int = Query(...),
    reason: str = Query(...),
    notes: Optional[str] = Query(None),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.tenant_id == user.tenant_id,
        Product.id == uuid.UUID(product_id),
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.current_stock -= quantity

    movement = StockMovement(
        tenant_id=user.tenant_id,
        product_id=product.id,
        movement_type="return",
        quantity=-quantity,
        reason=reason,
        performed_by=user.id,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return {
        "id": str(movement.id),
        "product_id": str(movement.product_id),
        "quantity": -quantity,
        "reason": movement.reason,
        "created_at": movement.created_at.isoformat() if movement.created_at else "",
    }


@router.get("/return-reasons")
def list_return_reasons():
    return [
        "Produit périmé",
        "Produit défectueux",
        "Erreur commande",
        "Stock excédentaire",
        "Autre",
    ]


@router.get("/{slip_id}")
def get_slip(
    slip_id: uuid.UUID,
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    slip = (
        db.query(DeliverySlip)
        .filter(DeliverySlip.tenant_id == user.tenant_id, DeliverySlip.id == slip_id)
        .first()
    )
    if not slip:
        raise HTTPException(status_code=404, detail="Delivery slip not found")

    items = db.query(DeliverySlipItem).filter(DeliverySlipItem.slip_id == slip_id).all()
    return {
        "id": str(slip.id),
        "slip_number": slip.slip_number,
        "supplier_name": slip.supplier_name,
        "status": slip.status,
        "total_amount": slip.total_amount,
        "received_by": str(slip.received_by),
        "received_at": slip.received_at.isoformat() if slip.received_at else "",
        "notes": slip.notes,
        "created_at": slip.created_at.isoformat() if slip.created_at else "",
        "items": [
            {
                "id": str(item.id),
                "product_id": str(item.product_id),
                "quantity_ordered": item.quantity_ordered,
                "quantity_received": item.quantity_received,
                "unit_cost": item.unit_cost,
            }
            for item in items
        ],
    }


@router.put("/{slip_id}/receive")
def receive_slip(
    slip_id: uuid.UUID,
    items: list[dict],
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    slip = (
        db.query(DeliverySlip)
        .filter(DeliverySlip.tenant_id == user.tenant_id, DeliverySlip.id == slip_id)
        .first()
    )
    if not slip:
        raise HTTPException(status_code=404, detail="Delivery slip not found")

    for item_data in items:
        product_id = item_data.get("product_id")
        quantity_received = item_data.get("quantity_received", 0)
        if not product_id or quantity_received is None:
            continue

        product = db.query(Product).filter(
            Product.tenant_id == user.tenant_id,
            Product.id == uuid.UUID(product_id),
        ).first()
        if not product:
            continue

        product.current_stock += quantity_received

        db.add(StockMovement(
            tenant_id=user.tenant_id,
            product_id=product.id,
            movement_type="in",
            quantity=quantity_received,
            reason="delivery_receipt",
            performed_by=user.id,
        ))

    slip.status = "received"
    slip.received_by = user.id
    slip.received_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(slip)
    return {"id": str(slip.id), "status": slip.status}

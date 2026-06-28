import uuid
import csv
from io import StringIO
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.models.stock import StockMovement
from app.dependencies import get_current_user, require_role
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()


def product_to_response(p: Product) -> ProductResponse:
    return ProductResponse(
        id=str(p.id),
        name=p.name,
        generic_name=p.generic_name,
        barcode=p.barcode,
        description=p.description,
        dosage_form=p.dosage_form,
        dosage_strength=p.dosage_strength,
        requires_prescription=p.requires_prescription,
        selling_price=p.selling_price,
        purchase_price=p.purchase_price,
        current_stock=p.current_stock,
        min_stock_alert=p.min_stock_alert,
        is_visible_in_shop=p.is_visible_in_shop,
        expiry_date=p.expiry_date,
        manufacturer=p.manufacturer,
        created_at=p.created_at.isoformat() if p.created_at else "",
    )


@router.get("/", response_model=list[ProductResponse])
def list_products(
    search: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    low_stock: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    user: User = Depends(require_role("owner", "pharmacist", "cashier")),
    db: Session = Depends(get_db),
):
    q = db.query(Product).filter(Product.tenant_id == user.tenant_id)

    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                Product.name.ilike(term),
                Product.generic_name.ilike(term),
                Product.barcode.ilike(term),
            )
        )
    if category_id:
        q = q.filter(Product.category_id == uuid.UUID(category_id))
    if low_stock:
        q = q.filter(Product.current_stock <= Product.min_stock_alert)

    total = q.count()
    products = q.order_by(Product.name).offset((page - 1) * size).limit(size).all()
    return [product_to_response(p) for p in products]


@router.get("/search", response_model=list[ProductResponse])
def search_products(
    q: str = Query(..., min_length=1),
    user: User = Depends(require_role("owner", "pharmacist", "cashier")),
    db: Session = Depends(get_db),
):
    term = f"%{q}%"
    products = (
        db.query(Product)
        .filter(
            Product.tenant_id == user.tenant_id,
            or_(
                Product.name.ilike(term),
                Product.generic_name.ilike(term),
                Product.barcode.ilike(term),
            ),
        )
        .limit(20)
        .all()
    )
    return [product_to_response(p) for p in products]


@router.get("/barcode/{code}", response_model=Optional[ProductResponse])
def get_by_barcode(
    code: str,
    user: User = Depends(require_role("owner", "pharmacist", "cashier")),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.tenant_id == user.tenant_id, Product.barcode == code)
        .first()
    )
    return product_to_response(product) if product else None


@router.get("/alerts/low-stock", response_model=list[ProductResponse])
def low_stock_alerts(
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    products = (
        db.query(Product)
        .filter(
            Product.tenant_id == user.tenant_id,
            Product.current_stock <= Product.min_stock_alert,
        )
        .all()
    )
    return [product_to_response(p) for p in products]


@router.get("/alerts/expiry", response_model=list[ProductResponse])
def expiry_alerts(
    days: int = Query(30),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    threshold = datetime.now(timezone.utc).date() + timedelta(days=days)
    products = (
        db.query(Product)
        .filter(
            Product.tenant_id == user.tenant_id,
            Product.expiry_date <= threshold,
            Product.expiry_date >= datetime.now(timezone.utc).date(),
        )
        .all()
    )
    return [product_to_response(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: uuid.UUID,
    user: User = Depends(require_role("owner", "pharmacist", "cashier")),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.tenant_id == user.tenant_id, Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_to_response(product)


def _to_uuid(val):
    if isinstance(val, str):
        return uuid.UUID(val)
    return val

@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(
    data: ProductCreate,
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    dump = data.model_dump()
    for fld in ("category_id", "department_id", "range_id"):
        if dump.get(fld):
            dump[fld] = _to_uuid(dump[fld])
    product = Product(tenant_id=user.tenant_id, **dump)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product_to_response(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.tenant_id == user.tenant_id, Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(product, key, val)

    db.commit()
    db.refresh(product)
    return product_to_response(product)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: uuid.UUID,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.tenant_id == user.tenant_id, Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()


@router.get("/{product_id}/history")
def product_stock_history(
    product_id: uuid.UUID,
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    product = (
        db.query(Product)
        .filter(Product.tenant_id == user.tenant_id, Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    movements = (
        db.query(StockMovement)
        .filter(
            StockMovement.product_id == product_id,
            StockMovement.tenant_id == user.tenant_id,
        )
        .order_by(StockMovement.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(m.id),
            "type": m.movement_type,
            "quantity": m.quantity,
            "reason": m.reason,
            "created_at": m.created_at.isoformat() if m.created_at else "",
        }
        for m in movements
    ]


@router.post("/import-csv")
def import_products_csv(
    file: UploadFile = File(...),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    content = file.file.read().decode("utf-8-sig")
    reader = csv.DictReader(StringIO(content))
    created = 0
    for row in reader:
        product = Product(
            tenant_id=user.tenant_id,
            name=row.get("name", "").strip(),
            generic_name=row.get("generic_name", "").strip() or None,
            barcode=row.get("barcode", "").strip() or None,
            selling_price=float(row["selling_price"]) if row.get("selling_price") else 0,
            purchase_price=float(row["purchase_price"]) if row.get("purchase_price") else 0,
            current_stock=int(row["current_stock"]) if row.get("current_stock") else 0,
            min_stock_alert=int(row["min_stock_alert"]) if row.get("min_stock_alert") else 0,
        )
        db.add(product)
        created += 1
    db.commit()
    return {"created": created}


@router.get("/export-csv")
def export_products_csv(
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    products = (
        db.query(Product)
        .filter(Product.tenant_id == user.tenant_id)
        .order_by(Product.name)
        .all()
    )

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["name", "generic_name", "barcode", "selling_price", "purchase_price", "current_stock", "min_stock_alert"]
    )
    for p in products:
        writer.writerow(
            [
                p.name,
                p.generic_name or "",
                p.barcode or "",
                p.selling_price,
                p.purchase_price,
                p.current_stock,
                p.min_stock_alert,
            ]
        )
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=products.csv"},
    )


@router.get("/alerts/dormant", response_model=list[ProductResponse])
def dormant_product_alerts(
    days: int = Query(90),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    products = (
        db.query(Product)
        .filter(
            Product.tenant_id == user.tenant_id,
            Product.current_stock > 0,
            ~Product.id.in_(
                db.query(StockMovement.product_id).filter(
                    StockMovement.tenant_id == user.tenant_id,
                    StockMovement.created_at >= cutoff,
                    StockMovement.product_id.isnot(None),
                )
            ),
        )
        .all()
    )
    return [product_to_response(p) for p in products]

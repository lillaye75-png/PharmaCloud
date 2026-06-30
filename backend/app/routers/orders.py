import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.stock import StockMovement
from app.models.expense import Expense
from app.models.user import User
from app.dependencies import get_current_user, require_role
from app.schemas.order import OrderCreate, OrderResponse

router = APIRouter()


def order_to_response(o: Order) -> OrderResponse:
    return OrderResponse(
        id=str(o.id),
        order_number=o.order_number,
        status=o.status,
        delivery_type=o.delivery_type,
        subtotal=o.subtotal,
        total=o.total,
        payment_status=o.payment_status,
        created_at=o.created_at.isoformat() if o.created_at else "",
    )


@router.get("/", response_model=list[OrderResponse])
def list_orders(
    status: Optional[str] = Query(None),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    q = db.query(Order).filter(Order.tenant_id == user.tenant_id)
    if status:
        q = q.filter(Order.status == status)
    orders = q.order_by(Order.created_at.desc()).limit(50).all()
    return [order_to_response(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: uuid.UUID,
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.tenant_id == user.tenant_id, Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order_to_response(order)


@router.put("/{order_id}/status")
def update_order_status(
    order_id: uuid.UUID,
    status: str,
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.tenant_id == user.tenant_id, Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    old_status = order.status
    order.status = status
    if status == "delivered" and old_status != "delivered":
        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.current_stock -= item.quantity
                db.add(StockMovement(
                    tenant_id=order.tenant_id,
                    product_id=item.product_id,
                    quantity=-item.quantity,
                    movement_type="exit",
                    reason=f"Commande {order.order_number} livrée",
                ))
        db.add(Expense(
            tenant_id=order.tenant_id,
            category="frais_livraison",
            amount=order.delivery_fee or 0,
            description=f"Frais livraison commande {order.order_number}",
            date=datetime.now().date(),
        ))
    db.commit()
    return {"status": status}


UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-prescription")
async def upload_prescription(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    url = f"/uploads/{filename}"
    return {"url": url, "filename": filename}


@router.post("/{order_id}/prescription")
async def upload_order_prescription(
    order_id: uuid.UUID,
    file: UploadFile = File(...),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id, Order.tenant_id == user.tenant_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    url = f"/uploads/{filename}"
    order.prescription_url = url
    db.commit()
    return {"url": url, "order_id": str(order_id)}


@router.delete("/{order_id}", status_code=204)
def delete_order(
    order_id: uuid.UUID,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id, Order.tenant_id == user.tenant_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
    db.delete(order)
    db.commit()

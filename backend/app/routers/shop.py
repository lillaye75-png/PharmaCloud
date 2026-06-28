import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models.tenant import Tenant
from app.models.product import Product, Category
from app.models.order import Order, OrderItem
from app.models.user import User
from app.dependencies import get_current_user
from pydantic import BaseModel, ConfigDict
from typing import List

router = APIRouter()


class ShopProductResponse(BaseModel):
    id: str
    name: str
    generic_name: Optional[str] = None
    description: Optional[str] = None
    dosage_form: Optional[str] = None
    dosage_strength: Optional[str] = None
    selling_price: float
    requires_prescription: bool
    manufacturer: Optional[str] = None
    is_visible: bool

    model_config = ConfigDict(from_attributes=True)


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int


class ShopOrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    delivery_type: str = "pickup"
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemCreate]


@router.get("/{slug}")
def get_shop_info(
    slug: str,
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.slug == slug, Tenant.is_active == True).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Pharmacie introuvable")
    return {
        "id": str(tenant.id),
        "name": tenant.name,
        "slug": tenant.slug,
        "logo_url": tenant.logo_url,
        "address": tenant.address,
        "phone": tenant.phone,
        "email": tenant.email,
        "description": tenant.description,
        "latitude": tenant.latitude,
        "longitude": tenant.longitude,
    }


@router.get("/{slug}/products", response_model=list[ShopProductResponse])
def shop_products(
    slug: str,
    search: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.slug == slug, Tenant.is_active == True).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Pharmacie introuvable")

    q = db.query(Product).filter(
        Product.tenant_id == tenant.id,
        Product.is_visible_in_shop == True,
        Product.current_stock > 0,
    )

    if search:
        term = f"%{search}%"
        q = q.filter(or_(Product.name.ilike(term), Product.generic_name.ilike(term)))
    if category_id:
        q = q.filter(Product.category_id == uuid.UUID(category_id))

    products = q.limit(100).all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "generic_name": p.generic_name,
            "description": p.description,
            "dosage_form": p.dosage_form,
            "dosage_strength": p.dosage_strength,
            "selling_price": p.selling_price,
            "requires_prescription": p.requires_prescription,
            "manufacturer": p.manufacturer,
            "is_visible": p.is_visible_in_shop,
        }
        for p in products
    ]


@router.post("/{slug}/orders", status_code=201)
def shop_create_order(
    slug: str,
    data: ShopOrderCreate,
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.slug == slug, Tenant.is_active == True).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Pharmacie introuvable")

    subtotal = 0
    order_items = []

    for item in data.items:
        product = db.query(Product).filter(
            Product.tenant_id == tenant.id,
            Product.id == uuid.UUID(item.product_id),
            Product.is_visible_in_shop == True,
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Produit {item.product_id} indisponible")
        if product.current_stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuffisant pour {product.name}")

        total_price = product.selling_price * item.quantity
        subtotal += total_price
        order_items.append(
            OrderItem(
                tenant_id=tenant.id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.selling_price,
                total_price=total_price,
            )
        )

    order = Order(
        tenant_id=tenant.id,
        order_number=f"CMD-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        status="pending",
        delivery_type=data.delivery_type,
        delivery_address=data.delivery_address,
        subtotal=subtotal,
        total=subtotal,
        notes=data.notes,
        payment_status="unpaid",
    )
    db.add(order)
    db.flush()

    for oi in order_items:
        oi.order_id = order.id
        db.add(oi)

    db.commit()
    db.refresh(order)
    return {
        "id": str(order.id),
        "order_number": order.order_number,
        "total": order.total,
    }

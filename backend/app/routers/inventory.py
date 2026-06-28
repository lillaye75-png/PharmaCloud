import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models.inventory import Inventory, InventoryItem
from app.models.product import Product
from app.models.stock import StockMovement
from app.models.user import User
from app.dependencies import get_current_user, require_role
from app.schemas.inventory import InventoryCreate, InventoryResponse

router = APIRouter()


def inventory_to_response(inv: Inventory) -> InventoryResponse:
    return InventoryResponse(
        id=str(inv.id),
        type=inv.type,
        status=inv.status,
        started_at=inv.started_at.isoformat() if inv.started_at else "",
        completed_at=inv.completed_at.isoformat() if inv.completed_at else None,
        notes=inv.notes,
    )


@router.get("/", response_model=list[InventoryResponse])
def list_inventories(
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    items = (
        db.query(Inventory)
        .filter(Inventory.tenant_id == user.tenant_id)
        .order_by(Inventory.started_at.desc())
        .limit(50)
        .all()
    )
    return [inventory_to_response(i) for i in items]


@router.post("/", response_model=InventoryResponse, status_code=201)
def create_inventory(
    data: InventoryCreate,
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    inv = Inventory(
        tenant_id=user.tenant_id,
        type=data.type,
        status="in_progress",
        started_by=user.id,
        notes=data.notes,
    )
    db.add(inv)
    db.flush()

    for item in data.items:
        product = db.query(Product).filter(
            Product.tenant_id == user.tenant_id,
            Product.id == uuid.UUID(item.product_id),
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

        db.add(
            InventoryItem(
                inventory_id=inv.id,
                tenant_id=user.tenant_id,
                product_id=product.id,
                theoretical_stock=product.current_stock,
                counted_stock=item.counted_stock,
                unit_cost=item.unit_cost or product.purchase_price,
                notes=item.notes,
            )
        )

    db.commit()
    db.refresh(inv)
    return inventory_to_response(inv)


@router.post("/{inventory_id}/validate", response_model=InventoryResponse)
def validate_inventory(
    inventory_id: uuid.UUID,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    inv = (
        db.query(Inventory)
        .filter(Inventory.tenant_id == user.tenant_id, Inventory.id == inventory_id)
        .first()
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")

    items = db.query(InventoryItem).filter(InventoryItem.inventory_id == inv.id).all()
    for item in items:
        if item.counted_stock is not None and item.theoretical_stock is not None:
            variance = item.counted_stock - item.theoretical_stock
            if variance != 0:
                product = db.query(Product).filter(Product.id == uuid.UUID(item.product_id)).first()
                if product:
                    product.current_stock = item.counted_stock
                    db.add(
                        StockMovement(
                            tenant_id=user.tenant_id,
                            product_id=product.id,
                            movement_type="adjustment",
                            quantity=variance,
                            reason=f"inventory_adjustment_{inv.type}",
                            performed_by=user.id,
                        )
                    )

    inv.status = "completed"
    inv.completed_at = datetime.now(timezone.utc)
    inv.validated_by = user.id
    db.commit()
    db.refresh(inv)
    return inventory_to_response(inv)


@router.get("/{inventory_id}/items")
def list_inventory_items(
    inventory_id: uuid.UUID,
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    inv = (
        db.query(Inventory)
        .filter(Inventory.tenant_id == user.tenant_id, Inventory.id == inventory_id)
        .first()
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")

    items = db.query(InventoryItem).filter(InventoryItem.inventory_id == inventory_id).all()
    return [
        {
            "id": str(item.id),
            "product_id": str(item.product_id),
            "theoretical_stock": item.theoretical_stock,
            "counted_stock": item.counted_stock,
            "variance": (item.counted_stock - item.theoretical_stock)
            if (item.counted_stock is not None and item.theoretical_stock is not None)
            else None,
            "unit_cost": item.unit_cost,
            "notes": item.notes,
        }
        for item in items
    ]


@router.post("/{inventory_id}/items", status_code=201)
def add_inventory_item(
    inventory_id: uuid.UUID,
    product_id: str = Query(...),
    counted_stock: int = Query(...),
    unit_cost: Optional[float] = Query(None),
    notes: Optional[str] = Query(None),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    inv = (
        db.query(Inventory)
        .filter(Inventory.tenant_id == user.tenant_id, Inventory.id == inventory_id)
        .first()
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")

    product = db.query(Product).filter(
        Product.tenant_id == user.tenant_id,
        Product.id == uuid.UUID(product_id),
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    item = InventoryItem(
        inventory_id=inventory_id,
        tenant_id=user.tenant_id,
        product_id=product.id,
        theoretical_stock=product.current_stock,
        counted_stock=counted_stock,
        unit_cost=unit_cost or product.purchase_price,
        notes=notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "id": str(item.id),
        "product_id": str(item.product_id),
        "theoretical_stock": item.theoretical_stock,
        "counted_stock": item.counted_stock,
        "variance": (item.counted_stock - item.theoretical_stock)
        if (item.counted_stock is not None and item.theoretical_stock is not None)
        else None,
        "unit_cost": item.unit_cost,
        "notes": item.notes,
    }


@router.put("/{inventory_id}/items/{item_id}")
def update_inventory_item(
    inventory_id: uuid.UUID,
    item_id: uuid.UUID,
    counted_stock: Optional[int] = Query(None),
    notes: Optional[str] = Query(None),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    inv = (
        db.query(Inventory)
        .filter(Inventory.tenant_id == user.tenant_id, Inventory.id == inventory_id)
        .first()
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")

    item = (
        db.query(InventoryItem)
        .filter(InventoryItem.id == item_id, InventoryItem.inventory_id == inventory_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    if counted_stock is not None:
        item.counted_stock = counted_stock
    if notes is not None:
        item.notes = notes

    db.commit()
    db.refresh(item)
    return {
        "id": str(item.id),
        "product_id": str(item.product_id),
        "theoretical_stock": item.theoretical_stock,
        "counted_stock": item.counted_stock,
        "variance": (item.counted_stock - item.theoretical_stock)
        if (item.counted_stock is not None and item.theoretical_stock is not None)
        else None,
        "unit_cost": item.unit_cost,
        "notes": item.notes,
    }


@router.get("/stock-movements")
def list_stock_movements(
    product_id: Optional[str] = Query(None),
    movement_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    q = db.query(StockMovement, Product.name).outerjoin(
        Product, StockMovement.product_id == Product.id
    ).filter(StockMovement.tenant_id == user.tenant_id)

    if product_id:
        q = q.filter(StockMovement.product_id == uuid.UUID(product_id))
    if movement_type:
        q = q.filter(StockMovement.movement_type == movement_type)

    results = (
        q.order_by(StockMovement.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return [
        {
            "id": str(m.id),
            "product_id": str(m.product_id),
            "product_name": name or "Inconnu",
            "movement_type": m.movement_type,
            "quantity": m.quantity,
            "reason": m.reason,
            "unit_cost": m.unit_cost,
            "performed_by": str(m.performed_by) if m.performed_by else None,
            "created_at": m.created_at.isoformat() if m.created_at else "",
        }
        for m, name in results
    ]

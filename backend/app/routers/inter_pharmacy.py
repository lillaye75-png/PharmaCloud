import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.tenant import Tenant
from app.models.inter_pharmacy import InterPharmacyRequest
from app.models.user import User
from app.dependencies import require_role, get_current_user

router = APIRouter()


@router.get("/pharmacies")
def list_network_pharmacies(
    search: Optional[str] = Query(None),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    q = db.query(Tenant).filter(Tenant.is_active == True)
    if search:
        q = q.filter(Tenant.name.ilike(f"%{search}%"))
    tenants = q.limit(50).all()
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "slug": t.slug,
            "address": t.address,
            "phone": t.phone,
            "email": t.email,
            "latitude": t.latitude,
            "longitude": t.longitude,
        }
        for t in tenants
    ]


@router.get("/requests")
def list_requests(
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    reqs = (
        db.query(InterPharmacyRequest)
        .filter(
            (InterPharmacyRequest.requesting_tenant_id == user.tenant_id)
            | (InterPharmacyRequest.supplying_tenant_id == user.tenant_id)
        )
        .order_by(InterPharmacyRequest.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": str(r.id),
            "product_name": r.product_name,
            "quantity_needed": r.quantity_needed,
            "status": r.status,
            "urgency": r.urgency,
            "message": r.message,
            "created_at": r.created_at.isoformat() if r.created_at else "",
        }
        for r in reqs
    ]


@router.post("/requests", status_code=201)
def create_request(
    supplying_tenant_id: uuid.UUID,
    product_name: str,
    quantity_needed: int,
    urgency: str = "normal",
    message: Optional[str] = None,
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    req = InterPharmacyRequest(
        requesting_tenant_id=user.tenant_id,
        supplying_tenant_id=supplying_tenant_id,
        product_name=product_name,
        quantity_needed=quantity_needed,
        urgency=urgency,
        message=message,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return {"id": str(req.id), "status": "pending"}


@router.put("/requests/{request_id}/respond")
def respond_to_request(
    request_id: uuid.UUID,
    status: str,
    response_message: Optional[str] = None,
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    req = (
        db.query(InterPharmacyRequest)
        .filter(
            InterPharmacyRequest.id == request_id,
            InterPharmacyRequest.supplying_tenant_id == user.tenant_id,
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = status
    req.response_message = response_message
    db.commit()
    return {"status": status}

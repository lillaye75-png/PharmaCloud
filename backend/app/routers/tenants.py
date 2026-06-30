from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid

from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.dependencies import get_current_user, require_role

router = APIRouter()


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    wilaya: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    settings: Optional[str] = None


UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/me")
def get_tenant(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return {
        "id": str(tenant.id),
        "name": tenant.name,
        "slug": tenant.slug,
        "logo_url": tenant.logo_url,
        "address": tenant.address,
        "phone": tenant.phone,
        "email": tenant.email,
        "wilaya": tenant.wilaya,
        "latitude": tenant.latitude,
        "longitude": tenant.longitude,
        "description": tenant.description,
        "settings": tenant.settings or "{}",
        "billing_plan": tenant.billing_plan,
        "is_active": tenant.is_active,
    }


@router.get("/slug-check/{slug}")
def check_slug(slug: str, db: Session = Depends(get_db)):
    exists = db.query(Tenant).filter(Tenant.slug == slug).first()
    return {"available": exists is None}


@router.put("/me")
def update_tenant(
    data: TenantUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tenant, key, value)
    db.commit()
    db.refresh(tenant)
    return {
        "id": str(tenant.id),
        "name": tenant.name,
        "slug": tenant.slug,
        "logo_url": tenant.logo_url,
        "address": tenant.address,
        "phone": tenant.phone,
        "email": tenant.email,
        "wilaya": tenant.wilaya,
        "latitude": tenant.latitude,
        "longitude": tenant.longitude,
        "description": tenant.description,
        "settings": tenant.settings or "{}",
        "billing_plan": tenant.billing_plan,
        "is_active": tenant.is_active,
    }


@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    ext = file.filename.split(".")[-1] if file.filename else "png"
    filename = f"logo_{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    url = f"/uploads/{filename}"
    tenant.logo_url = url
    db.commit()
    return {"logo_url": url}

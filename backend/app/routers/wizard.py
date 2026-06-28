from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.dependencies import get_current_user, require_role

router = APIRouter()


class Step1(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None


class Step2(BaseModel):
    slug: Optional[str] = None
    description: Optional[str] = None


class Step3(BaseModel):
    join_network: bool = True


@router.get("/status")
def wizard_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {
        "completed": user.onboarding_completed,
        "current_step": user.onboarding_step,
    }


@router.put("/step/{step_number}")
def update_step(
    step_number: int,
    data: Step1 | Step2 | Step3,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant introuvable")

    if step_number == 1 and isinstance(data, Step1):
        if data.name: tenant.name = data.name
        if data.address: tenant.address = data.address
        if data.phone: tenant.phone = data.phone
        if data.license_number: tenant.license_number = data.license_number
    elif step_number == 2 and isinstance(data, Step2):
        if data.slug: tenant.slug = data.slug
        if data.slug: tenant.slug = data.slug
    elif step_number == 3 and isinstance(data, Step3):
        pass

    user.onboarding_step = step_number
    db.commit()
    return {"step": step_number}


@router.post("/complete")
def complete_wizard(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.onboarding_completed = True
    user.onboarding_step = 0
    db.commit()
    return {"completed": True}

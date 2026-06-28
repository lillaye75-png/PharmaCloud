import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict

from app.database import get_db
from app.models.reminder import MedicationReminder
from app.models.user import User
from app.dependencies import get_current_user

router = APIRouter()


class ReminderResponse(BaseModel):
    id: str
    user_id: str
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    times: list
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    instructions: Optional[str] = None
    is_active: bool
    created_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReminderCreate(BaseModel):
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    times: list = []
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    instructions: Optional[str] = None
    is_active: bool = True


class ReminderUpdate(BaseModel):
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    times: Optional[list] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    instructions: Optional[str] = None
    is_active: Optional[bool] = None


def reminder_to_response(r: MedicationReminder) -> ReminderResponse:
    return ReminderResponse(
        id=str(r.id),
        user_id=str(r.user_id),
        product_id=str(r.product_id) if r.product_id else None,
        product_name=r.product_name,
        dosage=r.dosage,
        frequency=r.frequency,
        times=json.loads(r.times) if r.times else [],
        start_date=r.start_date,
        end_date=r.end_date,
        instructions=r.instructions,
        is_active=r.is_active,
        created_at=r.created_at.isoformat() if r.created_at else None,
    )


@router.get("/", response_model=list[ReminderResponse])
def list_reminders(
    is_active: Optional[bool] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(MedicationReminder).filter(MedicationReminder.user_id == user.id)
    if is_active is not None:
        q = q.filter(MedicationReminder.is_active == is_active)
    reminders = q.order_by(MedicationReminder.created_at.desc()).all()
    return [reminder_to_response(r) for r in reminders]


@router.post("/", response_model=ReminderResponse, status_code=201)
def create_reminder(
    data: ReminderCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reminder = MedicationReminder(
        user_id=user.id,
        product_id=uuid.UUID(data.product_id) if data.product_id else None,
        product_name=data.product_name,
        dosage=data.dosage,
        frequency=data.frequency,
        times=json.dumps(data.times),
        start_date=data.start_date,
        end_date=data.end_date,
        instructions=data.instructions,
        is_active=data.is_active,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder_to_response(reminder)


@router.get("/adherence-report")
def adherence_report(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total = db.query(func.count(MedicationReminder.id)).filter(
        MedicationReminder.user_id == user.id
    ).scalar()

    active = db.query(func.count(MedicationReminder.id)).filter(
        MedicationReminder.user_id == user.id,
        MedicationReminder.is_active == True,
    ).scalar()

    freq_rows = db.query(
        MedicationReminder.frequency,
        func.count(MedicationReminder.id),
    ).filter(
        MedicationReminder.user_id == user.id,
    ).group_by(MedicationReminder.frequency).all()

    return {
        "total": total,
        "active": active,
        "by_frequency": {row[0] or "unknown": row[1] for row in freq_rows},
    }


@router.get("/{reminder_id}", response_model=ReminderResponse)
def get_reminder(
    reminder_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reminder = db.query(MedicationReminder).filter(
        MedicationReminder.id == reminder_id,
        MedicationReminder.user_id == user.id,
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Rappel introuvable")
    return reminder_to_response(reminder)


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: uuid.UUID,
    data: ReminderUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reminder = db.query(MedicationReminder).filter(
        MedicationReminder.id == reminder_id,
        MedicationReminder.user_id == user.id,
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Rappel introuvable")

    update_data = data.model_dump(exclude_unset=True)
    if "times" in update_data and update_data["times"] is not None:
        update_data["times"] = json.dumps(update_data["times"])
    if "product_id" in update_data:
        update_data["product_id"] = uuid.UUID(update_data["product_id"]) if update_data["product_id"] else None

    for key, val in update_data.items():
        setattr(reminder, key, val)

    db.commit()
    db.refresh(reminder)
    return reminder_to_response(reminder)


@router.delete("/{reminder_id}", status_code=204)
def delete_reminder(
    reminder_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reminder = db.query(MedicationReminder).filter(
        MedicationReminder.id == reminder_id,
        MedicationReminder.user_id == user.id,
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Rappel introuvable")
    db.delete(reminder)
    db.commit()

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, date, timezone
from pydantic import BaseModel, ConfigDict

from app.database import get_db
from app.models.expense import Expense
from app.models.user import User
from app.dependencies import require_role

router = APIRouter()


class ExpenseCreate(BaseModel):
    category: str
    amount: float
    description: Optional[str] = None
    date: Optional[date] = None


class ExpenseResponse(BaseModel):
    id: str
    category: str
    amount: float
    description: Optional[str] = None
    date: str

    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=list[ExpenseResponse])
def list_expenses(
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    expenses = (
        db.query(Expense)
        .filter(Expense.tenant_id == user.tenant_id)
        .order_by(Expense.date.desc())
        .limit(100)
        .all()
    )
    return [
        ExpenseResponse(
            id=str(e.id), category=e.category, amount=e.amount,
            description=e.description, date=e.date.isoformat() if e.date else "",
        )
        for e in expenses
    ]


@router.post("/", response_model=ExpenseResponse, status_code=201)
def create_expense(
    data: ExpenseCreate,
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    expense = Expense(
        tenant_id=user.tenant_id,
        category=data.category,
        amount=data.amount,
        description=data.description,
        date=data.date or datetime.now(timezone.utc).date(),
        recorded_by=user.id,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return ExpenseResponse(
        id=str(expense.id), category=expense.category, amount=expense.amount,
        description=expense.description, date=expense.date.isoformat() if expense.date else "",
    )


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: uuid.UUID,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.tenant_id == user.tenant_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Dépense introuvable")
    db.delete(expense)
    db.commit()

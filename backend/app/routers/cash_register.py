from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.cash_register import CashRegisterSession
from app.models.user import User
from app.dependencies import require_role

router = APIRouter()


class OpenSession(BaseModel):
    opening_amount: float = 0
    notes: Optional[str] = None


@router.post("/open")
def open_register(
    data: OpenSession,
    user: User = Depends(require_role("owner", "pharmacist", "cashier")),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(CashRegisterSession)
        .filter(CashRegisterSession.tenant_id == user.tenant_id, CashRegisterSession.status == "open")
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Une session caisse est déjà ouverte")

    session = CashRegisterSession(
        tenant_id=user.tenant_id,
        cashier_id=user.id,
        opening_amount=data.opening_amount,
        status="open",
        notes=data.notes,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": str(session.id), "status": "open", "opening_amount": session.opening_amount}


@router.post("/close")
def close_register(
    closing_amount: float,
    notes: Optional[str] = None,
    user: User = Depends(require_role("owner", "pharmacist", "cashier")),
    db: Session = Depends(get_db),
):
    session = (
        db.query(CashRegisterSession)
        .filter(CashRegisterSession.tenant_id == user.tenant_id, CashRegisterSession.status == "open")
        .first()
    )
    if not session:
        raise HTTPException(status_code=400, detail="Aucune session caisse ouverte")

    session.closing_amount = closing_amount
    session.expected_amount = closing_amount
    session.difference = closing_amount - session.opening_amount
    session.closed_at = datetime.now(timezone.utc)
    session.status = "closed"
    session.notes = notes
    db.commit()
    return {"status": "closed", "difference": session.difference}


@router.get("/current")
def current_session(
    user: User = Depends(require_role("owner", "pharmacist", "cashier")),
    db: Session = Depends(get_db),
):
    session = (
        db.query(CashRegisterSession)
        .filter(CashRegisterSession.tenant_id == user.tenant_id, CashRegisterSession.status == "open")
        .first()
    )
    if not session:
        return {"status": "none"}
    return {"id": str(session.id), "status": "open", "opened_at": session.opened_at.isoformat()}


@router.get("/history")
def session_history(
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(CashRegisterSession)
        .filter(CashRegisterSession.tenant_id == user.tenant_id)
        .order_by(CashRegisterSession.opened_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": str(s.id),
            "opened_at": s.opened_at.isoformat() if s.opened_at else "",
            "closed_at": s.closed_at.isoformat() if s.closed_at else None,
            "opening_amount": s.opening_amount,
            "closing_amount": s.closing_amount,
            "difference": s.difference,
            "status": s.status,
        }
        for s in sessions
    ]

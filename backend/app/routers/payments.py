from fastapi import APIRouter, Depends, HTTPException, Request
from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.payment import PaymentTransaction, PaymentStatus
from app.services import payment_service
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import datetime, uuid, random

router = APIRouter()

class PaymentRequest(BaseModel):
    order_id: Optional[str] = None
    amount: int
    method: str
    phone: Optional[str] = None
    customer_name: Optional[str] = None
    return_url: Optional[str] = "http://localhost:3000/paiements"
    description: Optional[str] = None

class PaymentMethodResponse(BaseModel):
    id: str
    name: str
    icon: str

@router.post("/initiate")
async def initiate_payment(data: PaymentRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order_id = data.order_id or str(uuid.uuid4())

    txn = PaymentTransaction(
        order_id=order_id,
        amount=float(data.amount),
        method=data.method,
        status=PaymentStatus.PENDING,
        phone=data.phone,
        customer_name=data.customer_name,
        description=data.description,
        tenant_id=str(user.tenant_id) if hasattr(user, 'tenant_id') else None,
        created_by=str(user.id),
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    if data.method == "orange_money":
        result = await payment_service.initiate_orange_money(
            amount=data.amount,
            order_id=order_id,
            phone=data.phone or "",
            return_url=data.return_url,
            db_session=db,
        )
    elif data.method == "wave":
        result = await payment_service.initiate_wave(
            amount=data.amount,
            order_id=order_id,
            success_url=data.return_url + "?status=success",
            error_url=data.return_url + "?status=failed",
            db_session=db,
        )
    else:
        result = {
            "success": True,
            "transaction_id": f"TXN{random.randint(100000, 999999)}",
            "payment_url": None,
            "message": f"Paiement par {data.method} traité",
            "mode": "simulated",
        }

    if result.get("success"):
        txn.transaction_id = result.get("transaction_id")
        txn.payment_url = result.get("payment_url")
        if result.get("mode") == "sandbox":
            txn.status = PaymentStatus.SUCCESS
    else:
        txn.status = PaymentStatus.FAILED
        txn.error_message = result.get("error")

    db.commit()

    return {
        "id": txn.id,
        "status": txn.status,
        "transaction_id": txn.transaction_id,
        "payment_url": txn.payment_url,
        "message": result.get("message", ""),
        "mode": result.get("mode", "simulated"),
    }

@router.get("/methods")
def get_payment_methods():
    return {
        "methods": [
            {"id": "orange_money", "name": "Orange Money", "icon": "orange_money"},
            {"id": "wave", "name": "Wave", "icon": "wave"},
            {"id": "free_money", "name": "Free Money", "icon": "free_money"},
            {"id": "card", "name": "Carte bancaire", "icon": "card"},
        ]
    }

@router.get("/transactions")
def list_transactions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txns = db.query(PaymentTransaction).order_by(PaymentTransaction.created_at.desc()).limit(50).all()
    return {
        "transactions": [
            {
                "id": t.id,
                "order_id": t.order_id,
                "amount": t.amount,
                "method": t.method,
                "status": t.status,
                "transaction_id": t.transaction_id,
                "phone": t.phone,
                "customer_name": t.customer_name,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in txns
        ]
    }

@router.get("/transactions/{id}")
def get_transaction(id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txn = db.query(PaymentTransaction).filter(PaymentTransaction.id == id).first()
    if not txn:
        raise HTTPException(404, "Transaction non trouvée")
    return {
        "id": txn.id,
        "order_id": txn.order_id,
        "amount": txn.amount,
        "method": txn.method,
        "status": txn.status,
        "transaction_id": txn.transaction_id,
        "phone": txn.phone,
        "customer_name": txn.customer_name,
        "payment_url": txn.payment_url,
        "error_message": txn.error_message,
        "created_at": txn.created_at.isoformat() if txn.created_at else None,
        "updated_at": txn.updated_at.isoformat() if txn.updated_at else None,
    }

@router.post("/webhook/wave")
async def wave_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    signature = request.headers.get("X-Wave-Signature", "")

    if not payment_service.verify_wave_webhook(payload, signature):
        raise HTTPException(400, "Invalid signature")

    session_id = payload.get("data", {}).get("id", "")
    event_type = payload.get("type", "")

    if event_type == "checkout.session.completed":
        txn = db.query(PaymentTransaction).filter(
            PaymentTransaction.transaction_id == session_id
        ).first()
        if txn:
            txn.status = PaymentStatus.SUCCESS
            db.commit()

    return {"received": True}

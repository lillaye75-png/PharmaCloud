from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.models.user import User
from app.services.tax_service import calculate_tax, generate_invoice_number
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

router = APIRouter()

# In-memory store — replace with DB model in production
_invoices: list[dict] = []
_invoice_counter = 0


class InvoiceRequest(BaseModel):
    sale_id: str
    customer_tin: Optional[str] = None  # Tax Identification Number


@router.get("/")
def list_invoices(user: User = Depends(get_current_user)):
    return [
        {
            "id": inv["id"],
            "invoice_number": inv["invoice_number"],
            "amount": inv["amount"],
            "vat": inv["vat"],
            "customer_tin": inv["customer_tin"],
            "status": inv["status"],
            "created_at": inv["created_at"],
        }
        for inv in _invoices
    ]


@router.get("/invoices")
def list_invoices_alt(user: User = Depends(get_current_user)):
    return [
        {
            "id": inv["id"],
            "invoice_number": inv["invoice_number"],
            "amount": inv["amount"],
            "vat": inv["vat"],
            "customer_tin": inv["customer_tin"],
            "status": inv["status"],
            "created_at": inv["created_at"],
        }
        for inv in _invoices
    ]


@router.post("/generate", status_code=201)
def generate_invoice(data: InvoiceRequest, user: User = Depends(get_current_user)):
    global _invoice_counter
    _invoice_counter += 1
    amount = 100000  # would come from the sale
    tax = calculate_tax(amount)
    invoice = {
        "id": f"inv_{_invoice_counter}",
        "invoice_number": generate_invoice_number("PHARMACLOUD", _invoice_counter),
        "amount": amount,
        "vat": tax["tax"],
        "customer_tin": data.customer_tin or "N/A",
        "status": "generated",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _invoices.append(invoice)
    return invoice

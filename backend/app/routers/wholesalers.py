from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.models.user import User
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class WholesalerOrder(BaseModel):
    wholesaler_id: str
    products: List[dict]  # [{product_id, quantity}]
    notes: Optional[str] = None

WHOLESALERS = [
    {"id": "cophad", "name": "COPHAD", "city": "Dakar", "phone": "+221 33 889 00 00"},
    {"id": "pharmaplus", "name": "Pharma Plus", "city": "Dakar", "phone": "+221 33 823 45 67"},
    {"id": "sdp", "name": "SDP", "city": "Thiès", "phone": "+221 33 951 23 45"},
]

@router.get("/wholesalers")
def list_wholesalers(user: User = Depends(get_current_user)):
    return {"wholesalers": WHOLESALERS}

@router.post("/orders")
def create_wholesaler_order(data: WholesalerOrder, user: User = Depends(get_current_user)):
    return {
        "status": "submitted",
        "wholesaler_id": data.wholesaler_id,
        "order_ref": f"WHO-{user.tenant_id.hex[:8].upper()}",
        "message": "Commande transmise au grossiste",
    }

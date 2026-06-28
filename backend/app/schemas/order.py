from pydantic import BaseModel, ConfigDict
from typing import Optional, List


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int


class OrderCreate(BaseModel):
    customer_id: Optional[str] = None
    delivery_type: str = "pickup"
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemCreate]


class OrderResponse(BaseModel):
    id: str
    order_number: Optional[str] = None
    status: str
    delivery_type: str
    subtotal: float
    total: float
    payment_status: str
    created_at: str

    model_config = ConfigDict(from_attributes=True)

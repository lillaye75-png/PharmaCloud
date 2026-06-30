from pydantic import BaseModel, ConfigDict
from typing import Optional, List


class SaleItemCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: float
    discount_percentage: float = 0


class SaleCreate(BaseModel):
    customer_id: Optional[str] = None
    cashier_id: Optional[str] = None
    payment_method: Optional[str] = None
    discount_amount: float = 0
    notes: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    items: List[SaleItemCreate]


class SaleResponse(BaseModel):
    id: str
    sale_number: Optional[str] = None
    status: str
    payment_method: Optional[str] = None
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    paid_amount: Optional[float] = None
    change_amount: Optional[float] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    cashier_name: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)

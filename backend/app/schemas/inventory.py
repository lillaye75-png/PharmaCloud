from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class InventoryItemCreate(BaseModel):
    product_id: str
    counted_stock: int
    unit_cost: Optional[float] = None
    notes: Optional[str] = None


class InventoryCreate(BaseModel):
    type: str = "general"
    notes: Optional[str] = None
    items: List[InventoryItemCreate] = []


class InventoryResponse(BaseModel):
    id: str
    type: str
    status: str
    started_at: str
    completed_at: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

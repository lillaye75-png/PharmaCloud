from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date


class ProductCreate(BaseModel):
    name: str
    generic_name: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[str] = None
    department_id: Optional[str] = None
    range_id: Optional[str] = None
    description: Optional[str] = None
    composition: Optional[str] = None
    dosage_form: Optional[str] = None
    dosage_strength: Optional[str] = None
    unit_of_measure: Optional[str] = None
    requires_prescription: bool = False
    contraindications: Optional[str] = None
    side_effects: Optional[str] = None
    storage_conditions: Optional[str] = None
    manufacturer: Optional[str] = None
    country_of_origin: Optional[str] = None
    purchase_price: Optional[float] = None
    selling_price: float
    vat_rate: float = 0
    current_stock: int = 0
    min_stock_alert: int = 5
    max_stock: int = 1000
    is_visible_in_shop: bool = True
    expiry_date: Optional[date] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    barcode: Optional[str] = None
    selling_price: Optional[float] = None
    current_stock: Optional[int] = None
    min_stock_alert: Optional[int] = None
    is_visible_in_shop: Optional[bool] = None
    expiry_date: Optional[date] = None


class ProductResponse(BaseModel):
    id: str
    name: str
    generic_name: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    dosage_form: Optional[str] = None
    dosage_strength: Optional[str] = None
    requires_prescription: bool
    selling_price: float
    purchase_price: Optional[float] = None
    current_stock: int
    min_stock_alert: int
    is_visible_in_shop: bool
    expiry_date: Optional[date] = None
    manufacturer: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)

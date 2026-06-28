import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Float, ForeignKey
from sqlalchemy import Uuid
from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid, nullable=False, index=True)
    sale_number = Column(String(50), unique=True, nullable=True)
    customer_id = Column(Uuid, ForeignKey("users.id"), nullable=True)
    cashier_id = Column(Uuid, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="pending")
    payment_method = Column(String(50), nullable=True)
    subtotal = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    tax_amount = Column(Float, default=0)
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, nullable=True)
    change_amount = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    prescription_id = Column(Uuid, nullable=True)
    customer_name = Column(String(255), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    customer_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    sale_id = Column(Uuid, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(Uuid, nullable=False)
    product_id = Column(Uuid, ForeignKey("products.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount_percentage = Column(Float, default=0)
    total_price = Column(Float, nullable=False)

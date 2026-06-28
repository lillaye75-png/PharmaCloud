import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Integer, Float, ForeignKey, Date
from sqlalchemy import Uuid
from app.database import Base


class DeliverySlip(Base):
    __tablename__ = "delivery_slips"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid, nullable=False, index=True)
    slip_number = Column(String(50), unique=True, nullable=True)
    supplier_name = Column(String(255), nullable=True)
    status = Column(String(50), default="pending")
    total_amount = Column(Float, default=0)
    received_by = Column(Uuid, ForeignKey("users.id"), nullable=True)
    received_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class DeliverySlipItem(Base):
    __tablename__ = "delivery_slip_items"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    slip_id = Column(Uuid, ForeignKey("delivery_slips.id"), nullable=False)
    product_id = Column(Uuid, ForeignKey("products.id"), nullable=True)
    quantity_ordered = Column(Integer, nullable=True)
    quantity_received = Column(Integer, nullable=True)
    unit_cost = Column(Float, nullable=True)
    expiry_date = Column(Date, nullable=True)

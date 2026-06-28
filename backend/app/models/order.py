import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Integer, Float, ForeignKey
from sqlalchemy import Uuid
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid, nullable=False, index=True)
    order_number = Column(String(50), unique=True, nullable=True)
    customer_id = Column(Uuid, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="pending")
    delivery_type = Column(String(50), nullable=True)
    delivery_address = Column(Text, nullable=True)
    subtotal = Column(Float, default=0)
    delivery_fee = Column(Float, default=0)
    total = Column(Float, default=0)
    payment_status = Column(String(50), default="unpaid")
    payment_method = Column(String(50), nullable=True)
    prescription_url = Column(Text, nullable=True)
    ai_analysis = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    order_id = Column(Uuid, ForeignKey("orders.id"), nullable=False)
    tenant_id = Column(Uuid, nullable=False)
    product_id = Column(Uuid, ForeignKey("products.id"), nullable=True)
    quantity = Column(Integer, nullable=True)
    unit_price = Column(Float, nullable=True)
    total_price = Column(Float, nullable=True)

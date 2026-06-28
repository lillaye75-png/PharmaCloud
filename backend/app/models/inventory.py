import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Integer, Float, ForeignKey
from sqlalchemy import Uuid
from app.database import Base


class Inventory(Base):
    __tablename__ = "inventories"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid, nullable=False, index=True)
    type = Column(String(50), default="general")
    status = Column(String(50), default="in_progress")
    started_by = Column(Uuid, ForeignKey("users.id"), nullable=True)
    validated_by = Column(Uuid, ForeignKey("users.id"), nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    inventory_id = Column(Uuid, ForeignKey("inventories.id"), nullable=False)
    tenant_id = Column(Uuid, nullable=False)
    product_id = Column(Uuid, ForeignKey("products.id"), nullable=True)
    theoretical_stock = Column(Integer, nullable=True)
    counted_stock = Column(Integer, nullable=True)
    unit_cost = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

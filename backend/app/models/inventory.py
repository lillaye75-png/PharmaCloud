import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Inventory(Base):
    __tablename__ = "inventories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    type = Column(String(50), default="general")
    status = Column(String(50), default="in_progress")
    started_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    validated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventories.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    theoretical_stock = Column(Integer, nullable=True)
    counted_stock = Column(Integer, nullable=True)
    unit_cost = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

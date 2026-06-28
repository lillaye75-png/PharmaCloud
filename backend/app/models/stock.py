import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Integer, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    movement_type = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=True)
    reference_id = Column(UUID(as_uuid=True), nullable=True)
    unit_cost = Column(Float, nullable=True)
    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

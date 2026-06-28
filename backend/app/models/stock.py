import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Integer, Float, ForeignKey
from sqlalchemy import Uuid
from app.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid, nullable=False, index=True)
    product_id = Column(Uuid, ForeignKey("products.id"), nullable=True)
    movement_type = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=True)
    reference_id = Column(Uuid, nullable=True)
    unit_cost = Column(Float, nullable=True)
    performed_by = Column(Uuid, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

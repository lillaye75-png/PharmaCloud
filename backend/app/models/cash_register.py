import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class CashRegisterSession(Base):
    __tablename__ = "cash_register_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    cashier_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    opening_amount = Column(Float, default=0)
    closing_amount = Column(Float, nullable=True)
    expected_amount = Column(Float, nullable=True)
    difference = Column(Float, nullable=True)
    opened_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    closed_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="open")
    notes = Column(Text, nullable=True)

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Float, ForeignKey
from sqlalchemy import Uuid
from app.database import Base


class CashRegisterSession(Base):
    __tablename__ = "cash_register_sessions"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid, nullable=False, index=True)
    cashier_id = Column(Uuid, ForeignKey("users.id"), nullable=True)
    opening_amount = Column(Float, default=0)
    closing_amount = Column(Float, nullable=True)
    expected_amount = Column(Float, nullable=True)
    difference = Column(Float, nullable=True)
    opened_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    closed_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="open")
    notes = Column(Text, nullable=True)

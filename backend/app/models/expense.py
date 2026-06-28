import uuid
from datetime import datetime, date, timezone
from sqlalchemy import Column, String, DateTime, Text, Float, Date, ForeignKey
from sqlalchemy import Uuid
from app.database import Base


class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid, nullable=False, index=True)
    category = Column(String(100), nullable=True)
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    date = Column(Date, default=date.today)
    recorded_by = Column(Uuid, ForeignKey("users.id"), nullable=True)
    receipt_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

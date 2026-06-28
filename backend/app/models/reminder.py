import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class MedicationReminder(Base):
    __tablename__ = "medication_reminders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    product_name = Column(String(255), nullable=True)
    dosage = Column(String(100), nullable=True)
    frequency = Column(String(50), nullable=True)
    times = Column(Text, default="[]")
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    instructions = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

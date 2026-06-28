import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class InterPharmacyRequest(Base):
    __tablename__ = "inter_pharmacy_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requesting_tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    supplying_tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    product_name = Column(String(255), nullable=True)
    quantity_needed = Column(Integer, nullable=True)
    status = Column(String(50), default="pending")
    urgency = Column(String(20), default="normal")
    message = Column(Text, nullable=True)
    response_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

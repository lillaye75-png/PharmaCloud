from sqlalchemy import Column, String, Float, DateTime, Enum as SAEnum
from app.database import Base
import datetime, uuid, enum

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="XOF")
    method = Column(String, nullable=False)
    status = Column(String, default=PaymentStatus.PENDING)
    transaction_id = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)
    payment_url = Column(String, nullable=True)
    description = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC), onupdate=lambda: datetime.datetime.now(datetime.UTC))
    tenant_id = Column(String, nullable=True)
    created_by = Column(String, nullable=True)

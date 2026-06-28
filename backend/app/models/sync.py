import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy import Uuid
from app.database import Base


class SyncQueue(Base):
    __tablename__ = "sync_queue"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid, nullable=False)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=True)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(Uuid, nullable=True)
    operation = Column(String(20), nullable=True)
    payload = Column(Text, nullable=True)
    synced = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    synced_at = Column(DateTime, nullable=True)

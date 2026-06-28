from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.sync import SyncQueue
from app.models.user import User


router = APIRouter()


class SyncOperation(BaseModel):
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    operation: Optional[str] = None
    payload: Optional[str] = None


class PushRequest(BaseModel):
    operations: List[SyncOperation]


class SyncRecord(BaseModel):
    id: str
    tenant_id: str
    user_id: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    operation: Optional[str] = None
    payload: Optional[str] = None
    synced: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SyncStatus(BaseModel):
    total_pending: int
    total_synced: int
    by_entity_type: dict


@router.post("/push", status_code=201)
def push_operations(
    req: PushRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    for op in req.operations:
        record = SyncQueue(
            tenant_id=user.tenant_id,
            user_id=user.id,
            entity_type=op.entity_type,
            entity_id=UUID(op.entity_id) if op.entity_id else None,
            operation=op.operation,
            payload=op.payload,
            synced=False,
            created_at=now,
        )
        db.add(record)
    db.commit()
    return {"message": f"{len(req.operations)} operation(s) queued"}


@router.get("/pull", response_model=List[SyncRecord])
def pull_operations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    records = (
        db.query(SyncQueue)
        .filter(SyncQueue.tenant_id == user.tenant_id, SyncQueue.synced == False)
        .all()
    )
    result = []
    for r in records:
        result.append(
            SyncRecord(
                id=str(r.id),
                tenant_id=str(r.tenant_id),
                user_id=str(r.user_id) if r.user_id else None,
                entity_type=r.entity_type,
                entity_id=str(r.entity_id) if r.entity_id else None,
                operation=r.operation,
                payload=r.payload,
                synced=r.synced,
                created_at=r.created_at,
            )
        )
    return result


@router.get("/status")
def sync_status(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    total_pending = (
        db.query(SyncQueue)
        .filter(SyncQueue.tenant_id == user.tenant_id, SyncQueue.synced == False)
        .count()
    )
    total_synced = (
        db.query(SyncQueue)
        .filter(SyncQueue.tenant_id == user.tenant_id, SyncQueue.synced == True)
        .count()
    )
    return {
        "total_pending": total_pending,
        "total_synced": total_synced,
        "by_entity_type": {},
    }

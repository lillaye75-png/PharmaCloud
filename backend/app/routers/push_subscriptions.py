from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.models.user import User
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class PushSubscription(BaseModel):
    endpoint: str
    keys: dict
    user_agent: Optional[str] = None

subscriptions = []

@router.post("/subscribe")
def subscribe(data: PushSubscription, user: User = Depends(get_current_user)):
    subscriptions.append({"user_id": str(user.id), "subscription": data.model_dump()})
    return {"status": "subscribed"}

@router.post("/unsubscribe")
def unsubscribe(user: User = Depends(get_current_user)):
    global subscriptions
    subscriptions = [s for s in subscriptions if s["user_id"] != str(user.id)]
    return {"status": "unsubscribed"}

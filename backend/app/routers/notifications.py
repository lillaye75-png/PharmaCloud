from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.models.user import User
from app.services.notification_service import send_email
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class NotificationTest(BaseModel):
    email: str
    message: str

@router.post("/test-email")
async def test_email(data: NotificationTest, user: User = Depends(get_current_user)):
    result = await send_email(data.email, "Test PharmaCloud", f"<h2>Test</h2><p>{data.message}</p>")
    return result

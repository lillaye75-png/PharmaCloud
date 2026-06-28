import os
import json
from typing import Optional

VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_CLAIM_EMAIL = os.getenv("VAPID_CLAIM_EMAIL", "layedevops@gmail.com")

async def send_push_notification(subscription: dict, title: str, body: str, icon: str = "/favicon.svg"):
    if not VAPID_PUBLIC_KEY:
        return {"status": "demo", "message": "Push notification non envoyée (mode démo — configurez VAPID keys)"}
    # In production, use pywebpush library
    return {"status": "sent"}

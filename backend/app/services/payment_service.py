import os
import httpx
import json
import uuid
import random
from typing import Optional
from datetime import datetime, timezone

ORANGE_MONEY_CLIENT_ID = os.getenv("ORANGE_MONEY_CLIENT_ID", "")
ORANGE_MONEY_CLIENT_SECRET = os.getenv("ORANGE_MONEY_CLIENT_SECRET", "")
ORANGE_MONEY_MERCHANT_KEY = os.getenv("ORANGE_MONEY_MERCHANT_KEY", "")

WAVE_API_KEY = os.getenv("WAVE_API_KEY", "")
WAVE_WEBHOOK_SECRET = os.getenv("WAVE_WEBHOOK_SECRET", "")

def is_sandbox() -> bool:
    return not (ORANGE_MONEY_CLIENT_ID and WAVE_API_KEY)

async def initiate_orange_money(amount: int, order_id: str, phone: str, return_url: str, db_session=None) -> dict:
    if not ORANGE_MONEY_CLIENT_ID:
        txn_id = f"OM{random.randint(100000, 999999)}"
        payment_token = str(uuid.uuid4())
        return {
            "success": True,
            "transaction_id": txn_id,
            "payment_token": payment_token,
            "payment_url": f"https://webpayment.orange-money.com/sandbox?token={payment_token}",
            "message": f"Orange Money sandbox: paiement de {amount} FCFA initié",
            "mode": "sandbox",
        }
    try:
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://api.orange.com/oauth/v3/token",
                auth=(ORANGE_MONEY_CLIENT_ID, ORANGE_MONEY_CLIENT_SECRET),
                data={"grant_type": "client_credentials"},
            )
            token_resp.raise_for_status()
            access_token = token_resp.json().get("access_token")

            currency = "OUV" if is_sandbox() else "XOF"
            pay_resp = await client.post(
                "https://api.orange.com/omcoreapis/1.0.2/mp/init",
                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
                json={
                    "merchant_key": ORANGE_MONEY_MERCHANT_KEY,
                    "currency": currency,
                    "order_id": order_id,
                    "amount": amount,
                    "return_url": return_url,
                    "cancel_url": return_url,
                    "notif_url": return_url.replace("/payment", "/api/v1/payments/orange-webhook"),
                    "lang": "fr",
                },
            )
            pay_resp.raise_for_status()
            data = pay_resp.json()
            return {
                "success": True,
                "transaction_id": data.get("payment_token"),
                "payment_token": data.get("payment_token"),
                "payment_url": f"https://webpayment.orange-money.com?token={data.get('payment_token')}",
                "message": "Redirection vers Orange Money...",
                "mode": "live",
            }
    except Exception as e:
        return {"success": False, "error": str(e), "mode": "live"}

async def initiate_wave(amount: int, order_id: str, success_url: str, error_url: str, db_session=None) -> dict:
    if not WAVE_API_KEY:
        txn_id = f"WV{random.randint(100000, 999999)}"
        session_id = str(uuid.uuid4())
        return {
            "success": True,
            "transaction_id": txn_id,
            "session_id": session_id,
            "payment_url": f"https://pay.wave.com/sandbox/{session_id}",
            "message": f"Wave sandbox: paiement de {amount} FCFA initié",
            "mode": "sandbox",
        }
    try:
        base_url = "https://api.wave.com/v1/sandbox" if is_sandbox() else "https://api.wave.com/v1"
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{base_url}/checkout/sessions",
                headers={"Authorization": f"Bearer {WAVE_API_KEY}", "Content-Type": "application/json"},
                json={
                    "amount": amount,
                    "currency": "XOF",
                    "success_url": success_url,
                    "error_url": error_url,
                    "client_reference": order_id,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "success": True,
                "transaction_id": data.get("id", ""),
                "session_id": data.get("id", ""),
                "payment_url": data.get("wave_launch_url", ""),
                "message": "Redirection vers Wave...",
                "mode": "live",
            }
    except Exception as e:
        return {"success": False, "error": str(e), "mode": "live"}

async def check_payment_status(provider: str, transaction_id: str) -> dict:
    if provider == "orange_money":
        return {"status": "pending", "transaction_id": transaction_id}
    elif provider == "wave":
        return {"status": "pending", "transaction_id": transaction_id}
    return {"status": "unknown"}

def verify_wave_webhook(payload: dict, signature: str) -> bool:
    if not WAVE_WEBHOOK_SECRET:
        return True
    import hmac, hashlib
    expected = hmac.new(WAVE_WEBHOOK_SECRET.encode(), json.dumps(payload).encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)

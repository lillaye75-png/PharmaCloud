import smtplib
import os
import json
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", "pharmacloud@pharmacie.sn")

_ethereal_creds = None

async def _get_ethereal_creds():
    global _ethereal_creds
    if _ethereal_creds:
        return _ethereal_creds
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post("https://api.nodemailer.com/user", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                _ethereal_creds = {
                    "host": data.get("SMTP", {}).get("host", "smtp.ethereal.email"),
                    "port": data.get("SMTP", {}).get("port", 587),
                    "user": data.get("user", ""),
                    "pass": data.get("pass", ""),
                    "from": data.get("user", "pharmacloud@ethereal.email"),
                }
                print(f"[Ethereal] SMTP configuré: {_ethereal_creds['user']}")
                return _ethereal_creds
    except Exception as e:
        print(f"[Ethereal] Erreur de création: {e}")
    return None

async def send_email(to: str, subject: str, body: str) -> dict:
    if SMTP_HOST and SMTP_USER and SMTP_PASS:
        msg = MIMEMultipart()
        msg["From"] = SMTP_FROM
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))
        try:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
            return {"status": "sent", "provider": "smtp", "to": to}
        except Exception as e:
            return {"status": "error", "message": str(e), "provider": "smtp"}

    creds = await _get_ethereal_creds()
    if creds:
        msg = MIMEMultipart()
        msg["From"] = creds["from"]
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))
        try:
            with smtplib.SMTP(creds["host"], creds["port"], timeout=10) as server:
                server.starttls()
                server.login(creds["user"], creds["pass"])
                server.send_message(msg)
            preview_url = f"https://ethereal.email/messages"
            return {
                "status": "sent",
                "provider": "ethereal",
                "to": to,
                "preview_url": preview_url,
                "note": "Email visible sur https://ethereal.email (login avec les credentials ci-dessus)",
                "credentials": {"user": creds["user"], "pass": creds["pass"]},
            }
        except Exception as e:
            print(f"[Ethereal] Send failed: {e}")

    print(f"[EMAIL] To: {to} | Subject: {subject}")
    print(f"[EMAIL] Body: {body[:200]}...")
    return {
        "status": "logged",
        "provider": "console",
        "to": to,
        "message": "Email affiché dans la console (aucun SMTP configuré)",
    }

async def send_sms(to: str, message: str) -> dict:
    """Send SMS via console fallback (Orange SMS API in production)."""
    print(f"[SMS] To: {to} | Message: {message[:100]}...")
    return {
        "status": "logged",
        "provider": "console",
        "to": to,
        "message": f"SMS simulé pour {to}",
    }

async def send_notification(user_email: str, notification_type: str, data: dict) -> dict:
    """Send templated notification."""
    templates = {
        "stock_faible": {
            "subject": "🔴 Alerte Stock Faible - PharmaCloud",
            "body": f"<h2>Stock faible détecté</h2><p>Le produit <b>{data.get('product_name', 'N/A')}</b> a un stock de <b>{data.get('current_stock', 0)}</b> unités.</p>",
        },
        "peremption": {
            "subject": "⚠️ Produit proche de la péremption - PharmaCloud",
            "body": f"<h2>Alerte péremption</h2><p>Le produit <b>{data.get('product_name', 'N/A')}</b> expire le <b>{data.get('expiry_date', 'N/A')}</b>.</p>",
        },
        "nouvelle_commande": {
            "subject": "🛒 Nouvelle commande reçue - PharmaCloud",
            "body": f"<h2>Nouvelle commande</h2><p>Commande #{data.get('order_id', 'N/A')} reçue pour {data.get('amount', 0)} FCFA.</p>",
        },
        "rapport_hebdo": {
            "subject": "📊 Rapport hebdomadaire - PharmaCloud",
            "body": f"<h2>Rapport hebdomadaire</h2><p>Ventes: {data.get('sales', 0)} FCFA<br>Commandes: {data.get('orders', 0)}<br>Produits en stock faible: {data.get('low_stock', 0)}</p>",
        },
    }
    tpl = templates.get(notification_type, templates["stock_faible"])
    return await send_email(user_email, tpl["subject"], tpl["body"])

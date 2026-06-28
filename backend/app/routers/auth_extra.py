import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.dependencies import pwd_context

router = APIRouter()

reset_tokens: dict[str, dict] = {}


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé."}
    token = secrets.token_urlsafe(32)
    reset_tokens[token] = {
        "user_id": user.id,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé."}


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    token_data = reset_tokens.pop(data.token, None)
    if not token_data:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré.")
    if token_data["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token invalide ou expiré.")
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré.")
    user.hashed_password = pwd_context.hash(data.password)
    db.commit()
    return {"message": "Mot de passe réinitialisé avec succès."}

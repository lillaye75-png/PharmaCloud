import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.dependencies import get_current_user, require_role, pwd_context
from app.services.notification_service import send_email

router = APIRouter()


class UserCreate(BaseModel):
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: str = "cashier"


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=list[UserResponse])
def list_users(
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    users = db.query(User).filter(User.tenant_id == user.tenant_id).all()
    return [
        UserResponse(
            id=str(u.id),
            email=u.email,
            first_name=u.first_name,
            last_name=u.last_name,
            phone=u.phone,
            role=u.role,
            is_active=u.is_active,
        )
        for u in users
    ]


@router.post("/invite", response_model=UserResponse, status_code=201)
async def invite_user(
    data: UserCreate,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    new_user = User(
        tenant_id=user.tenant_id,
        email=data.email,
        password_hash=pwd_context.hash(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        role=data.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    login_url = f"https://pharma-cloud.vercel.app/login"
    email_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">PharmaCloud</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 5px;">ERP Pharmacie</p>
        </div>
        <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 12px 12px;">
            <h2 style="margin-top: 0;">Invitation à rejoindre {tenant.name if tenant else 'la pharmacie'}</h2>
            <p>Bonjour {data.first_name or ''},</p>
            <p>Vous avez été invité à rejoindre PharmaCloud. Voici vos identifiants :</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Email :</strong> {data.email}</p>
                <p><strong>Mot de passe :</strong> {data.password}</p>
            </div>
            <p>Connectez-vous ici :</p>
            <a href="{login_url}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Se connecter</a>
            <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">PharmaCloud - L'ERP intelligent pour les pharmacies africaines</p>
        </div>
    </div>
    """
    await send_email(data.email, f"Invitation à rejoindre PharmaCloud - {tenant.name if tenant else 'Pharmacie'}", email_body)

    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        phone=new_user.phone,
        role=new_user.role,
        is_active=new_user.is_active,
    )


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    u = db.query(User).filter(User.id == user_id, User.tenant_id == current_user.tenant_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(u, key, val)
    db.commit()
    db.refresh(u)
    return UserResponse(
        id=str(u.id), email=u.email, first_name=u.first_name,
        last_name=u.last_name, phone=u.phone, role=u.role, is_active=u.is_active,
    )


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    u = db.query(User).filter(User.id == user_id, User.tenant_id == current_user.tenant_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    db.delete(u)
    db.commit()

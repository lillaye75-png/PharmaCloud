import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.database import get_db
from app.models.user import User
from app.dependencies import get_current_user, require_role, pwd_context

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
def invite_user(
    data: UserCreate,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

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

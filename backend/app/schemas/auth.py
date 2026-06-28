from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional


class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    tenant_name: str
    tenant_slug: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str
    tenant_id: Optional[str] = None
    onboarding_completed: bool
    onboarding_step: int

    model_config = ConfigDict(from_attributes=True)

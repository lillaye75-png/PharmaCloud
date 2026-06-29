from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "PharmaCloud"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "sqlite:///./pharmacloud.db"
    SECRET_KEY: str = "change-me-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    ORANGE_MONEY_CLIENT_ID: Optional[str] = None
    ORANGE_MONEY_CLIENT_SECRET: Optional[str] = None
    ORANGE_MONEY_MERCHANT_KEY: Optional[str] = None
    WAVE_API_KEY: Optional[str] = None
    WAVE_WEBHOOK_SECRET: Optional[str] = None

    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    SMTP_FROM: str = "pharmacloud@pharmacie.sn"

    REDIS_URL: Optional[str] = None
    CLOUDINARY_URL: Optional[str] = None
    RESEND_API_KEY: Optional[str] = None

    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    model_config = ConfigDict(env_file=".env")

    @property
    def is_postgres(self) -> bool:
        return self.DATABASE_URL.startswith("postgresql")

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()

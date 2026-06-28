from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.dependencies import require_role, get_current_user

router = APIRouter()

PLANS = [
    {
        "id": "free",
        "name": "Gratuit",
        "price_monthly": 0,
        "price_yearly": 0,
        "max_users": 2,
        "max_products": 100,
        "features": ["Caisse", "Produits", "Inventaire", "Support email"],
    },
    {
        "id": "starter",
        "name": "Starter",
        "price_monthly": 9900,
        "price_yearly": 89000,
        "max_users": 5,
        "max_products": 500,
        "features": ["Tout du Gratuit", "Boutique en ligne", "Réseau inter-pharmacies", "Assistance IA (100/mois)"],
    },
    {
        "id": "pro",
        "name": "Pro",
        "price_monthly": 24900,
        "price_yearly": 220000,
        "max_users": 20,
        "max_products": -1,
        "features": ["Tout du Starter", "IA illimitée", "Domaine personnalisé", "Rapports avancés", "Support prioritaire"],
    },
]


@router.get("/plans")
def list_plans():
    return PLANS


@router.get("/subscription")
def get_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    return {
        "plan": tenant.billing_plan if tenant else "free",
        "expires_at": tenant.billing_expires_at.isoformat() if tenant and tenant.billing_expires_at else None,
    }


@router.post("/upgrade")
def upgrade_plan(
    plan_id: str,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not tenant:
        return {"error": "Tenant not found"}
    tenant.billing_plan = plan_id
    db.commit()
    return {"plan": plan_id}

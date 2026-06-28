"""
Minimal seed — creates ONLY the admin tenant and owner account.
Run: python -m app.seed
"""

from app.database import SessionLocal, init_db
from app.models.tenant import Tenant
from app.models.user import User
from app.dependencies import pwd_context


def seed():
    init_db()
    db = SessionLocal()

    if db.query(Tenant).count() > 0:
        print("Database already seeded. Skipping.")
        db.close()
        return

    tenant = Tenant(
        name="Ma Pharmacie",
        slug="ma-pharmacie",
        address="",
        phone="",
        email="",
        license_number="",
        billing_plan="starter",
    )
    db.add(tenant)
    db.flush()

    owner = User(
        tenant_id=tenant.id,
        email="owner@pharmacie.sn",
        password_hash=pwd_context.hash("password123"),
        first_name="Admin",
        last_name="Principal",
        phone="",
        role="owner",
        onboarding_completed=True,
    )
    db.add(owner)
    db.commit()

    print("=== Seed terminé ===")
    print(f"Tenant: {tenant.name}")
    print(f"Admin: owner@pharmacie.sn / password123")
    print("Aucune donnée de test — base vierge.")

    db.close()


if __name__ == "__main__":
    seed()

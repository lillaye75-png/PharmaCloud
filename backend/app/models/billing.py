from sqlalchemy import Column, String, Boolean, Text, Float
from app.database import Base


class BillingPlan(Base):
    __tablename__ = "billing_plans"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    price_monthly = Column(Float, default=0)
    price_yearly = Column(Float, default=0)
    max_users = Column(Float, nullable=True)
    max_products = Column(Float, nullable=True)
    max_orders_per_month = Column(Float, nullable=True)
    features = Column(Text, default="{}")
    is_active = Column(Boolean, default=True)

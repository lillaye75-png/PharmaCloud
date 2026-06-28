import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Float, ForeignKey, Date
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship
from app.database import Base


class Category(Base):
    __tablename__ = "categories"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid, ForeignKey("tenants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Department(Base):
    __tablename__ = "departments"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid, ForeignKey("tenants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    color = Column(String(50), nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Range(Base):
    __tablename__ = "ranges"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid, ForeignKey("tenants.id"), nullable=False)
    department_id = Column(Uuid, ForeignKey("departments.id"), nullable=True)
    name = Column(String(255), nullable=False)
    color = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Product(Base):
    __tablename__ = "products"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id = Column(Uuid, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    generic_name = Column(String(255), nullable=True)
    barcode = Column(String(100), nullable=True, index=True)
    category_id = Column(Uuid, ForeignKey("categories.id"), nullable=True)
    department_id = Column(Uuid, ForeignKey("departments.id"), nullable=True)
    range_id = Column(Uuid, ForeignKey("ranges.id"), nullable=True)
    description = Column(Text, nullable=True)
    composition = Column(Text, nullable=True)
    dosage_form = Column(String(100), nullable=True)
    dosage_strength = Column(String(100), nullable=True)
    unit_of_measure = Column(String(50), nullable=True)
    requires_prescription = Column(Boolean, default=False)
    contraindications = Column(Text, nullable=True)
    side_effects = Column(Text, nullable=True)
    storage_conditions = Column(Text, nullable=True)
    manufacturer = Column(String(255), nullable=True)
    country_of_origin = Column(String(100), nullable=True)
    purchase_price = Column(Float, nullable=True)
    selling_price = Column(Float, nullable=False)
    vat_rate = Column(Float, default=0)
    current_stock = Column(Integer, default=0)
    min_stock_alert = Column(Integer, default=5)
    max_stock = Column(Integer, default=1000)
    is_visible_in_shop = Column(Boolean, default=True)
    images = Column(Text, default="[]")
    expiry_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="products")

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Category, Department
from app.models.user import User
from app.dependencies import require_role
from pydantic import BaseModel, ConfigDict
from typing import Optional

router = APIRouter()


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=list[CategoryResponse])
def list_categories(
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    cats = db.query(Category).filter(Category.tenant_id == user.tenant_id).all()
    return [{"id": str(c.id), "name": c.name, "description": ""} for c in cats]


@router.post("/", response_model=CategoryResponse, status_code=201)
def create_category(
    data: CategoryCreate,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    cat = Category(tenant_id=user.tenant_id, name=data.name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"id": str(cat.id), "name": cat.name, "description": ""}


@router.get("/departments", response_model=list[dict])
def list_departments(
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    deps = db.query(Department).filter(Department.tenant_id == user.tenant_id).all()
    return [{"id": str(d.id), "name": d.name} for d in deps]


class DepartmentCreate(BaseModel):
    name: str


@router.post("/departments", status_code=201)
def create_department(
    data: DepartmentCreate,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    dept = Department(tenant_id=user.tenant_id, name=data.name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {"id": str(dept.id), "name": dept.name}


class ReorderRequest(BaseModel):
    department_ids: list[uuid.UUID]


@router.delete("/departments/{department_id}", status_code=204)
def delete_department(
    department_id: uuid.UUID,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    dept = db.query(Department).filter(
        Department.id == department_id,
        Department.tenant_id == user.tenant_id,
    ).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()


@router.put("/departments/reorder")
def reorder_departments(
    data: ReorderRequest,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    return {"message": "Reorder acknowledged", "department_ids": [str(uid) for uid in data.department_ids]}


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: uuid.UUID,
    data: CategoryCreate,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    cat = db.query(Category).filter(
        Category.id == category_id,
        Category.tenant_id == user.tenant_id,
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.name = data.name
    db.commit()
    db.refresh(cat)
    return {"id": str(cat.id), "name": cat.name, "description": ""}


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: uuid.UUID,
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    cat = db.query(Category).filter(
        Category.id == category_id,
        Category.tenant_id == user.tenant_id,
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()

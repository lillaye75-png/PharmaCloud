from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.product import Product
from app.models.user import User
import csv, io

router = APIRouter()

@router.post("/products/import")
async def import_products(file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
    count = 0
    for row in reader:
        product = Product(
            tenant_id=user.tenant_id,
            name=row.get("name", "").strip(),
            generic_name=row.get("generic_name", "").strip() or None,
            barcode=row.get("barcode", "").strip() or None,
            selling_price=float(row["selling_price"]) if row.get("selling_price") else 0,
            purchase_price=float(row["purchase_price"]) if row.get("purchase_price") else 0,
            current_stock=int(row["current_stock"]) if row.get("current_stock") else 0,
            min_stock_alert=int(row["min_stock_alert"]) if row.get("min_stock_alert") else 5,
        )
        db.add(product)
        count += 1
    db.commit()
    return {"imported": count, "status": "success"}

@router.get("/products/export")
def export_products(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.tenant_id == user.tenant_id).order_by(Product.name).all()
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_ALL)
    writer.writerow(["name", "generic_name", "barcode", "selling_price", "purchase_price", "current_stock", "min_stock_alert"])
    for p in products:
        writer.writerow([p.name, p.generic_name or "", p.barcode or "", str(p.selling_price), str(p.purchase_price or ""), str(p.current_stock), str(p.min_stock_alert)])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=produits.csv"})

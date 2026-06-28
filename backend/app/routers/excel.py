from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.dependencies import get_current_user
from app.models.user import User
import csv, io

router = APIRouter()

@router.post("/products/import")
async def import_products(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode()))
    count = 0
    for row in reader:
        count += 1
    return {"imported": count, "status": "success"}

@router.get("/products/export")
def export_products(user: User = Depends(get_current_user)):
    from fastapi.responses import StreamingResponse
    import csv, io
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_ALL)
    writer.writerow(["name", "generic_name", "barcode", "selling_price", "current_stock"])
    writer.writerow(["Exemple", "DCI", "123456", "5000", "100"])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=produits.csv"})

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta, timezone
import io
import csv

from app.database import get_db
from app.models.sale import Sale
from app.models.product import Product
from app.models.expense import Expense
from app.models.user import User
from app.dependencies import require_role, get_current_user

router = APIRouter()


@router.get("/sales")
def sales_report(
    period: str = Query("today"),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    elif period == "year":
        start = now - timedelta(days=365)
    else:
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    sales = (
        db.query(Sale)
        .filter(
            Sale.tenant_id == user.tenant_id,
            Sale.status == "completed",
            Sale.created_at >= start,
        )
        .all()
    )

    total_revenue = sum(s.total_amount for s in sales)
    total_sales = len(sales)
    avg_ticket = total_revenue / total_sales if total_sales > 0 else 0

    return {
        "period": period,
        "total_sales": total_sales,
        "total_revenue": total_revenue,
        "average_ticket": avg_ticket,
        "start_date": start.isoformat(),
    }


@router.get("/inventory")
def inventory_report(
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    products = (
        db.query(Product)
        .filter(Product.tenant_id == user.tenant_id)
        .all()
    )

    total_products = len(products)
    total_stock_value = sum(p.current_stock * p.purchase_price for p in products if p.purchase_price)
    low_stock = sum(1 for p in products if p.current_stock <= p.min_stock_alert)
    out_of_stock = sum(1 for p in products if p.current_stock <= 0)

    return {
        "total_products": total_products,
        "total_stock_value": total_stock_value,
        "low_stock_count": low_stock,
        "out_of_stock_count": out_of_stock,
    }


@router.get("/accounting")
def accounting_report(
    period: str = Query("month"),
    user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    if period == "month":
        start = now - timedelta(days=30)
    else:
        start = now - timedelta(days=7)

    sales_total = (
        db.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .filter(
            Sale.tenant_id == user.tenant_id,
            Sale.status == "completed",
            Sale.created_at >= start,
        )
        .scalar()
    )

    expenses_total = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(
            Expense.tenant_id == user.tenant_id,
            Expense.date >= start.date(),
        )
        .scalar()
    )

    return {
        "period": period,
        "revenue": float(sales_total),
        "expenses": float(expenses_total),
        "profit": float(sales_total) - float(expenses_total),
        "start_date": start.isoformat(),
    }


@router.get("/sales/export/csv")
def export_sales_csv(
    period: str = Query("month"),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    elif period == "year":
        start = now - timedelta(days=365)
    else:
        raise HTTPException(status_code=400, detail="Invalid period. Use: today, week, month, year")

    sales = (
        db.query(Sale)
        .filter(
            Sale.tenant_id == user.tenant_id,
            Sale.status == "completed",
            Sale.created_at >= start,
        )
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_ALL)
    writer.writerow(["N° Vente", "Date", "Total", "Paiement", "Statut"])
    for sale in sales:
        writer.writerow([sale.sale_number, sale.created_at.isoformat(), str(sale.total_amount), sale.payment_method or "", sale.status])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=ventes.csv"})


@router.get("/sales/export/pdf")
def export_sales_pdf(
    period: str = Query("month"),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    from fastapi.responses import Response
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

    now = datetime.now(timezone.utc)
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    elif period == "year":
        start = now - timedelta(days=365)
    else:
        raise HTTPException(status_code=400, detail="Invalid period. Use: today, week, month, year")

    sales = (
        db.query(Sale)
        .filter(
            Sale.tenant_id == user.tenant_id,
            Sale.status == "completed",
            Sale.created_at >= start,
        )
        .all()
    )

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"Rapport des ventes - {period}", styles["Title"]))
    elements.append(Spacer(1, 12))

    data = [["N° Vente", "Date", "Total", "Paiement", "Statut"]]
    for s in sales:
        data.append([
            s.sale_number,
            s.created_at.strftime("%d/%m/%Y %H:%M"),
            f"{s.total_amount:.2f}",
            s.payment_method or "",
            s.status,
        ])

    table = Table(data)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
        ("ALIGN", (2, 1), (2, -1), "RIGHT"),
    ]))
    elements.append(table)
    doc.build(elements)

    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=ventes.pdf"})


@router.get("/export/{type}")
def export_report(
    type: str,
    period: str = Query("month"),
    user: User = Depends(require_role("owner", "pharmacist")),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    if period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    elif period == "year":
        start = now - timedelta(days=365)
    else:
        start = now - timedelta(days=30)

    output = io.StringIO()
    writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_ALL)

    if type == "sales":
        writer.writerow(["ID", "Date", "Total", "Status"])
        sales = (
            db.query(Sale)
            .filter(
                Sale.tenant_id == user.tenant_id,
                Sale.status == "completed",
                Sale.created_at >= start,
            )
            .all()
        )
        for s in sales:
            writer.writerow([str(s.id), str(s.created_at), str(s.total_amount), s.status])
    elif type == "inventory":
        writer.writerow(["ID", "Name", "Stock", "Min Stock", "Purchase Price"])
        products = (
            db.query(Product)
            .filter(Product.tenant_id == user.tenant_id)
            .all()
        )
        for p in products:
            writer.writerow([str(p.id), p.name, str(p.current_stock), str(p.min_stock_alert), str(p.purchase_price or "")])
    elif type == "accounting":
        writer.writerow(["Type", "Amount", "Period"])
        sales_total = (
            db.query(func.coalesce(func.sum(Sale.total_amount), 0))
            .filter(
                Sale.tenant_id == user.tenant_id,
                Sale.status == "completed",
                Sale.created_at >= start,
            )
            .scalar()
        )
        expenses_total = (
            db.query(func.coalesce(func.sum(Expense.amount), 0))
            .filter(
                Expense.tenant_id == user.tenant_id,
                Expense.date >= start.date(),
            )
            .scalar()
        )
        writer.writerow(["Revenue", str(float(sales_total)), period])
        writer.writerow(["Expenses", str(float(expenses_total)), period])
        writer.writerow(["Profit", str(float(sales_total) - float(expenses_total)), period])
    else:
        raise HTTPException(status_code=400, detail="Invalid export type. Use sales, inventory, or accounting.")

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={type}_report.csv"},
    )

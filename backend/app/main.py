import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.routers import auth, tenants, products, sales, inventory, categories, orders, shop, ai, inter_pharmacy, reports, billing, users, auth_extra, expenses, cash_register, delivery_slips, wizard, reminders, sync, notifications, payments, push_subscriptions, invoicing, wholesalers, excel


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(tenants.router, prefix="/api/v1/tenant", tags=["Tenant"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["Sales"])
app.include_router(inventory.router, prefix="/api/v1/inventories", tags=["Inventory"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["Categories"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(shop.router, prefix="/api/v1/shop", tags=["Shop"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])
app.include_router(inter_pharmacy.router, prefix="/api/v1/network", tags=["Network"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["Billing"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(auth_extra.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(expenses.router, prefix="/api/v1/expenses", tags=["Expenses"])
app.include_router(cash_register.router, prefix="/api/v1/cash-register", tags=["Cash Register"])
app.include_router(delivery_slips.router, prefix="/api/v1/delivery-slips", tags=["Delivery Slips"])
app.include_router(wizard.router, prefix="/api/v1/wizard", tags=["Wizard"])
app.include_router(reminders.router, prefix="/api/v1/reminders", tags=["Reminders"])
app.include_router(sync.router, prefix="/api/v1/sync", tags=["Sync"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(push_subscriptions.router, prefix="/api/v1/push", tags=["Push"])
app.include_router(invoicing.router, prefix="/api/v1/invoicing", tags=["Invoicing"])
app.include_router(wholesalers.router, prefix="/api/v1/wholesalers", tags=["Wholesalers"])
app.include_router(excel.router, prefix="/api/v1/excel", tags=["Excel"])

uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok", "version": settings.VERSION}

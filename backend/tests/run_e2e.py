"""
Full E2E test — verifies ALL features end-to-end.
Run: python -m tests.test_e2e
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

passed = 0
failed = 0

def check(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  [OK] {name}")
    else:
        failed += 1
        print(f"  [FAIL] {name} — {detail}")

def assert_status(resp, expected=200):
    if resp.status_code != expected:
        print(f"     Got {resp.status_code}: {resp.text[:200]}")
    return resp.status_code == expected

# ── 1. Health ──
r = client.get("/health")
check("Health endpoint", assert_status(r) and r.json()["status"] == "ok")

# ── 2. Login ──
r = client.post("/api/v1/auth/login", json={"email": "owner@pharmacie.sn", "password": "password123"})
check("Login success", assert_status(r) and "access_token" in r.json())
token = r.json().get("access_token", "")
headers = {"Authorization": f"Bearer {token}"}

# ── 3. Get current user ──
r = client.get("/api/v1/auth/me", headers=headers)
check("Get current user", assert_status(r) and r.json()["email"] == "owner@pharmacie.sn")

# ── 4. Tenant info ──
r = client.get("/api/v1/tenant/me", headers=headers)
check("Get tenant info", assert_status(r) and "name" in r.json())
tenant_id = r.json().get("id", "")

# ── 5. Create category ──
r = client.post("/api/v1/categories/", json={"name": "Antalgiques"}, headers=headers)
check("Create category", assert_status(r, 201) and r.json()["name"] == "Antalgiques")
cat_id = r.json().get("id", "")

# ── 6. Create department ──
r = client.post("/api/v1/categories/departments", json={"name": "Adultes"}, headers=headers)
check("Create department", assert_status(r, 201))

# ── 7. List categories ──
r = client.get("/api/v1/categories/", headers=headers)
check("List categories", assert_status(r))

# ── 8. Create product ──
r = client.post("/api/v1/products/", json={
    "name": "Doliprane 500mg",
    "category_id": cat_id,
    "selling_price": 1500,
    "purchase_price": 900,
    "current_stock": 200,
    "min_stock_alert": 20,
}, headers=headers)
check("Create product", assert_status(r, 201) and "id" in r.json())
product_id = r.json().get("id", "")

# ── 9. Get product ──
r = client.get(f"/api/v1/products/{product_id}", headers=headers)
check("Get product detail", assert_status(r) and r.json()["name"] == "Doliprane 500mg")

# ── 10. List products ──
r = client.get("/api/v1/products/", headers=headers)
check("List products", assert_status(r) and len(r.json()) > 0)

# ── 11. Search products ──
r = client.get("/api/v1/products/search?q=Doliprane", headers=headers)
check("Search products", assert_status(r))

# ── 12. Low stock alerts ──
r = client.get("/api/v1/products/alerts/low-stock", headers=headers)
check("Low stock alerts", assert_status(r))

# ── 13. Update product ──
r = client.put(f"/api/v1/products/{product_id}", json={"selling_price": 1800}, headers=headers)
check("Update product", assert_status(r) and r.json()["selling_price"] == 1800)

# ── 14. Create sale ──
r = client.post("/api/v1/sales/", json={
    "payment_method": "cash",
    "items": [{"product_id": product_id, "quantity": 2, "unit_price": 1800}],
}, headers=headers)
check("Create sale", assert_status(r, 201) and r.json()["status"] == "completed")
sale_id = r.json().get("id", "")

# ── 15. Get sale detail ──
r = client.get(f"/api/v1/sales/{sale_id}", headers=headers)
check("Get sale detail", assert_status(r) and r.json()["id"] == sale_id)

# ── 16. List sales ──
r = client.get("/api/v1/sales/", headers=headers)
check("List sales", assert_status(r) and len(r.json()) > 0)

# ── 17. Sale items ──
r = client.get(f"/api/v1/sales/{sale_id}/items", headers=headers)
check("Sale items", assert_status(r))

# ── 18. Sales report ──
r = client.get("/api/v1/reports/sales?period=today", headers=headers)
check("Sales report", assert_status(r))

# ── 19. Inventory report ──
r = client.get("/api/v1/reports/inventory", headers=headers)
check("Inventory report", assert_status(r))

# ── 20. Create expense ──
r = client.post("/api/v1/expenses/", json={
    "category": "Loyer", "amount": 350000, "description": "Loyer juin"
}, headers=headers)
check("Create expense", assert_status(r, 201))
expense_id = r.json().get("id", "")

# ── 21. List expenses ──
r = client.get("/api/v1/expenses/", headers=headers)
check("List expenses", assert_status(r) and len(r.json()) > 0)

# ── 22. Delete expense ──
r = client.delete(f"/api/v1/expenses/{expense_id}", headers=headers)
check("Delete expense", assert_status(r, 204))

# ── 23. Payment methods ──
r = client.get("/api/v1/payments/methods", headers=headers)
check("Payment methods", assert_status(r) and len(r.json()["methods"]) == 4)

# ── 24. Initiate payment (sandbox) ──
r = client.post("/api/v1/payments/initiate", json={
    "amount": 5000, "method": "orange_money", "phone": "+221771234567"
}, headers=headers)
check("Initiate payment", assert_status(r) and r.json()["mode"] == "sandbox")

# ── 25. Payment transactions ──
r = client.get("/api/v1/payments/transactions", headers=headers)
check("List transactions", assert_status(r))

# ── 26. Wholesalers list ──
r = client.get("/api/v1/wholesalers/wholesalers", headers=headers)
check("List wholesalers", assert_status(r) and len(r.json()["wholesalers"]) == 3)

# ── 27. Wholesaler order ──
r = client.post("/api/v1/wholesalers/orders", json={
    "wholesaler_id": "cophad",
    "products": [{"product_id": product_id, "quantity": 10}],
}, headers=headers)
check("Wholesaler order", assert_status(r) and r.json()["status"] == "submitted")

# ── 28. Generate invoice ──
r = client.post("/api/v1/invoicing/generate", json={
    "sale_id": sale_id, "customer_tin": "SN123456"
}, headers=headers)
check("Generate invoice", assert_status(r) and r.json()["status"] == "generated")

# ── 29. Push subscribe ──
r = client.post("/api/v1/push/subscribe", json={
    "endpoint": "https://example.com/push", "keys": {"p256dh": "abc", "auth": "def"}
}, headers=headers)
check("Push subscribe", assert_status(r) and r.json()["status"] == "subscribed")

# ── 30. Push unsubscribe ──
r = client.post("/api/v1/push/unsubscribe", headers=headers)
check("Push unsubscribe", assert_status(r) and r.json()["status"] == "unsubscribed")

# ── 31. Excel export ──
r = client.get("/api/v1/excel/products/export", headers=headers)
check("Excel export", assert_status(r) and "text/csv" in r.headers.get("content-type", ""))

# ── 32. Network pharmacies list ──
r = client.get("/api/v1/network/pharmacies", headers=headers)
check("Network pharmacies", assert_status(r))

# ── 33. Delete sale ──
r = client.delete(f"/api/v1/sales/{sale_id}", headers=headers)
check("Delete sale", assert_status(r, 204))

# ── 34. Delete product (create standalone then delete) ──
r = client.post("/api/v1/products/", json={
    "name": "Temp Product", "selling_price": 1000, "current_stock": 10,
}, headers=headers)
check("Create temp product for delete", assert_status(r, 201))
temp_id = r.json()["id"]
r = client.delete(f"/api/v1/products/{temp_id}", headers=headers)
check("Delete product", assert_status(r, 204))

# ── 35. Register a new user (unique email per run) ──
import random
new_email = f"test{random.randint(10000,99999)}@demo.sn"
r = client.post("/api/v1/auth/register", json={
    "email": new_email, "password": "Test1234!",
    "first_name": "Test", "last_name": "User",
    "tenant_name": "Demo Pharmacy", "tenant_slug": f"demo-pharmacy-{random.randint(100,999)}",
})
check("Register new tenant", assert_status(r) and "access_token" in r.json())

# ── 36. Login as new user ──
r = client.post("/api/v1/auth/login", json={"email": new_email, "password": "Test1234!"})
check("Login as new user", assert_status(r) and "access_token" in r.json())
token2 = r.json()["access_token"]
headers2 = {"Authorization": f"Bearer {token2}"}

# ── 37. New user has empty data ──
r = client.get("/api/v1/products/", headers=headers2)
check("New user — empty products", assert_status(r) and len(r.json()) == 0)

r = client.get("/api/v1/sales/", headers=headers2)
check("New user — empty sales", assert_status(r))

r = client.get("/api/v1/expenses/", headers=headers2)
check("New user — empty expenses", assert_status(r))

# ── 38. Test notification email (console mode) ──
r = client.post("/api/v1/notifications/test-email", json={
    "email": "test@pharmacie.sn",
    "message": "Test notification depuis PharmaCloud",
}, headers=headers)
check("Notification test email", assert_status(r))

# ── Summary ──
print(f"\n{'='*50}")
print(f"E2E TEST RESULTS: {passed} passed, {failed} failed out of {passed+failed} tests")
print(f"{'='*50}")
if failed > 0:
    sys.exit(1)

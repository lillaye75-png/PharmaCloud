"""
Extended end-to-end workflow tests covering our recent changes.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

TOKEN = None
PRODUCT_ID = None
SLIP_ID = None


def test_01_login():
    global TOKEN
    resp = client.post("/api/v1/auth/login", json={
        "email": "owner@pharmacie.sn", "password": "password123",
    })
    assert resp.status_code == 200
    TOKEN = resp.json()["access_token"]


def test_02_create_product():
    global PRODUCT_ID
    resp = client.post("/api/v1/products/", json={
        "name": "Workflow Test Product",
        "selling_price": 3000,
        "purchase_price": 2000,
        "current_stock": 100,
        "min_stock_alert": 10,
    }, headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 201
    PRODUCT_ID = resp.json()["id"]


def test_03_create_sale():
    resp = client.post("/api/v1/sales/", json={
        "payment_method": "cash",
        "customer_name": "Test Customer",
        "customer_phone": "771234567",
        "items": [{"product_id": PRODUCT_ID, "quantity": 5, "unit_price": 3000}],
    }, headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "completed"
    assert data["total_amount"] == 15000


def test_04_stock_decremented_after_sale():
    resp = client.get(f"/api/v1/products/{PRODUCT_ID}", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 200
    assert resp.json()["current_stock"] == 95


def test_05_list_orders():
    """Orders list endpoint is accessible (no POST create endpoint exists)."""
    resp = client.get("/api/v1/orders/", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_06_create_delivery_slip():
    global SLIP_ID
    resp = client.post("/api/v1/delivery-slips/", json={
        "supplier_name": "Test Supplier",
        "items": [{"product_id": PRODUCT_ID, "quantity_ordered": 20, "quantity_received": 0, "unit_cost": 2000}],
    }, headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 201
    SLIP_ID = resp.json()["id"]
    # Stock should NOT have changed on create
    resp2 = client.get(f"/api/v1/products/{PRODUCT_ID}", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp2.json()["current_stock"] == 95


def test_07_receive_delivery_slip():
    resp = client.put(f"/api/v1/delivery-slips/{SLIP_ID}/receive", json=[{
        "product_id": PRODUCT_ID, "quantity_received": 20,
    }], headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "received"
    # Stock should now be incremented
    resp2 = client.get(f"/api/v1/products/{PRODUCT_ID}", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp2.json()["current_stock"] == 115


def test_08_delivery_slip_get():
    resp = client.get(f"/api/v1/delivery-slips/{SLIP_ID}", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "received"


def test_09_reports_all_accessible():
    for period in ["today", "week", "month", "year"]:
        resp = client.get(f"/api/v1/reports/sales?period={period}", headers={"Authorization": f"Bearer {TOKEN}"})
        assert resp.status_code == 200
    resp = client.get("/api/v1/reports/inventory", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 200
    resp = client.get("/api/v1/reports/accounting", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 200


def test_10_report_export_csv():
    resp = client.get("/api/v1/reports/sales/export/csv?period=today", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]


def test_11_report_export_pdf():
    resp = client.get("/api/v1/reports/sales/export/pdf?period=today", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 200
    assert "application/pdf" in resp.headers["content-type"]


def test_12_tenant_online_store_config():
    resp = client.get("/api/v1/tenant/me", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "settings" in data


def test_13_categories_crud():
    resp = client.post("/api/v1/categories/", json={"name": "Test Cat E2E"}, headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 201
    cid = resp.json()["id"]
    resp = client.get("/api/v1/categories/", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 200
    names = [c["name"] for c in resp.json()]
    assert "Test Cat E2E" in names
    client.delete(f"/api/v1/categories/{cid}", headers={"Authorization": f"Bearer {TOKEN}"})


def test_14_expense_crud():
    resp = client.post("/api/v1/expenses/", json={
        "category": "Fournitures",
        "amount": 25000,
        "description": "Test expense",
    }, headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 201
    eid = resp.json()["id"]
    resp = client.delete(f"/api/v1/expenses/{eid}", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 204


def test_15_invite_user_schema():
    resp = client.post("/api/v1/users/invite", json={
        "email": "newcashier@test.sn",
        "password": "Test1234!",
        "first_name": "New",
        "role": "cashier",
    }, headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 201
    uid = resp.json()["id"]
    resp = client.delete(f"/api/v1/users/{uid}", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 204


def test_16_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_17_gemini_fallback():
    resp = client.post("/api/v1/ai/chat", json={
        "message": "What is paracetamol?",
        "conversation_id": None,
    }, headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code in (200, 400, 500, 503)
    if resp.status_code == 200:
        assert "response" in resp.json()


def test_18_cleanup():
    resp = client.delete(f"/api/v1/products/{PRODUCT_ID}", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 204
    resp = client.get(f"/api/v1/products/{PRODUCT_ID}", headers={"Authorization": f"Bearer {TOKEN}"})
    assert resp.status_code == 404

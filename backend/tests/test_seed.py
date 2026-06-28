"""Test that seed data is accessible via the API with authentication."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_seed_data():
    # Login
    resp = client.post("/api/v1/auth/login", json={
        "email": "owner@pharmacie.sn",
        "password": "password123",
    })
    assert resp.status_code == 200
    data = resp.json()
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Logged in as owner@pharmacie.sn")

    # Products
    resp = client.get("/api/v1/products/?size=200", headers=headers)
    assert resp.status_code == 200
    products = resp.json()
    print(f"Products: {len(products)}")
    for p in products[:3]:
        print(f"  - {p['name']}: {p['selling_price']} FCFA (stock: {p['current_stock']})")

    # Sales
    resp = client.get("/api/v1/sales/", headers=headers)
    print(f"Sales: {len(resp.json())}")

    # Expenses
    resp = client.get("/api/v1/expenses/", headers=headers)
    print(f"Expenses: {len(resp.json())}")

    # Low stock alerts
    resp = client.get("/api/v1/products/alerts/low-stock", headers=headers)
    print(f"Low stock alerts: {len(resp.json())}")

    # Reports
    resp = client.get("/api/v1/reports/sales?period=month", headers=headers)
    data = resp.json()
    print(f"Sales report: {data['total_sales']} sales, {data['total_revenue']} FCFA")

    resp = client.get("/api/v1/reports/inventory", headers=headers)
    data = resp.json()
    print(f"Inventory: {data['total_products']} products, {data['low_stock_count']} low stock")

if __name__ == "__main__":
    test_seed_data()

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture
def auth_token():
    resp = client.post("/api/v1/auth/login", json={"email": "owner@pharmacie.sn", "password": "password123"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


class TestProductsIntegration:
    def test_create_and_get_product(self, auth_headers):
        resp = client.post("/api/v1/products/", json={
            "name": "Test Product INT",
            "selling_price": 5000,
            "current_stock": 100,
        }, headers=auth_headers)
        assert resp.status_code == 201
        pid = resp.json()["id"]

        resp = client.get(f"/api/v1/products/{pid}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Product INT"

        client.delete(f"/api/v1/products/{pid}", headers=auth_headers)


class TestSalesIntegration:
    def test_create_sale(self, auth_headers):
        resp = client.get("/api/v1/products/?size=1", headers=auth_headers)
        products = resp.json()
        if not products:
            pytest.skip("No products available")
        product = products[0]

        resp = client.post("/api/v1/sales/", json={
            "payment_method": "cash",
            "items": [{"product_id": product["id"], "quantity": 1, "unit_price": product["selling_price"]}],
        }, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["status"] == "completed"


class TestReportsIntegration:
    def test_sales_report(self, auth_headers):
        resp = client.get("/api/v1/reports/sales?period=today", headers=auth_headers)
        assert resp.status_code == 200

    def test_inventory_report(self, auth_headers):
        resp = client.get("/api/v1/reports/inventory", headers=auth_headers)
        assert resp.status_code == 200


class TestCategoriesIntegration:
    def test_categories_crud(self, auth_headers):
        resp = client.post("/api/v1/categories/", json={"name": "Test Cat INT"}, headers=auth_headers)
        assert resp.status_code == 201
        cid = resp.json()["id"]

        resp = client.get("/api/v1/categories/", headers=auth_headers)
        assert resp.status_code == 200

        client.delete(f"/api/v1/categories/{cid}", headers=auth_headers)


class TestExpensesIntegration:
    def test_create_expense(self, auth_headers):
        resp = client.post("/api/v1/expenses/", json={
            "category": "Fournitures",
            "amount": 50000,
            "description": "Test integration",
        }, headers=auth_headers)
        assert resp.status_code == 201

        eid = resp.json()["id"]
        resp = client.delete(f"/api/v1/expenses/{eid}", headers=auth_headers)
        assert resp.status_code == 204

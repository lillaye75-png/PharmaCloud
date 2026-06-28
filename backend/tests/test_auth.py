import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_login_invalid():
    response = client.post("/api/v1/auth/login", json={"email": "test@test.com", "password": "wrong"})
    assert response.status_code == 401

def test_register():
    import uuid
    uid = uuid.uuid4().hex[:8]
    slug = f"test-{uid}"
    response = client.post("/api/v1/auth/register", json={
        "email": f"{uid}@test.com",
        "password": "Test1234!",
        "first_name": "Test",
        "last_name": "User",
        "tenant_name": "Test Pharmacy",
        "tenant_slug": slug,
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_products_unauthorized():
    response = client.get("/api/v1/products/")
    assert response.status_code == 401

"""
Basic health check test.
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_register_and_login():
    resp = client.post("/api/v1/auth/register", json={
        "email": "test@pharmacloud.app",
        "password": "Test1234!",
        "first_name": "Test",
        "last_name": "User",
        "tenant_name": "Test Pharmacy",
        "tenant_slug": "test-pharmacy",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data

    login_resp = client.post("/api/v1/auth/login", json={
        "email": "test@pharmacloud.app",
        "password": "Test1234!",
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User

client = TestClient(app)

def test_register_and_login():
    # Register a new user
    res = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "password123", "name": "Test User", "role": "caregiver"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]

    # Login with the new user
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"},
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["status"] == "success"
    assert "access_token" in login_data["data"]
    assert "refresh_token" in login_data["data"]

    # Test refresh token
    refresh_token = login_data["data"]["refresh_token"]
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_res.status_code == 200
    refresh_data = refresh_res.json()
    assert "access_token" in refresh_data["data"]

    # Cleanup (since we use sqlite, let's keep it simple)
    db = SessionLocal()
    user = db.query(User).filter(User.email == "test@example.com").first()
    if user:
        db.delete(user)
        db.commit()
    db.close()


def test_rbac():
    # Setup mock protected route
    from fastapi import Depends
    from app.api.deps import RoleChecker

    @app.get("/api/v1/test_protected", dependencies=[Depends(RoleChecker(["admin"]))])
    def protected_route():
        return {"status": "success"}

    # Register a new caregiver (which is not an admin)
    client.post(
        "/api/v1/auth/register",
        json={"email": "rbac@example.com", "password": "pwd", "name": "RBAC", "role": "caregiver"},
    )
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "rbac@example.com", "password": "pwd"},
    )
    access_token = login_res.json()["data"]["access_token"]

    # Try accessing admin route with caregiver token
    res = client.get(
        "/api/v1/test_protected",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert res.status_code == 403

    # Cleanup
    db = SessionLocal()
    user = db.query(User).filter(User.email == "rbac@example.com").first()
    if user:
        db.delete(user)
        db.commit()
    db.close()

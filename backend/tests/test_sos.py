"""
Phase 8 tests — Emergency SOS System

Tests cover:
  1. Triggering an SOS (deduplication of active events)
  2. Viewing SOS history
  3. Resolving an SOS (caregiver only)
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, Patient
from app.models.sos import EmergencyEvent

client = TestClient(app)

@pytest.fixture(scope="module")
def setup():
    # Register caregiver
    client.post(
        "/api/v1/auth/register",
        json={"email": "sos_cg@example.com", "password": "pwd", "name": "SosCG", "role": "caregiver"},
    )
    login = client.post("/api/v1/auth/login", data={"username": "sos_cg@example.com", "password": "pwd"})
    token = login.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create patient
    p = client.post(
        "/api/v1/patients/",
        json={"name": "SOS Patient", "dob": "1950-01-01", "medical_notes": ""},
        headers=headers,
    )
    patient_id = p.json()["data"]["id"]

    yield {"headers": headers, "patient_id": patient_id}

    # Teardown
    db = SessionLocal()
    try:
        db.query(EmergencyEvent).filter(EmergencyEvent.patient_id == patient_id).delete()
        pat = db.query(Patient).filter(Patient.id == patient_id).first()
        if pat:
            db.delete(pat)
        user = db.query(User).filter(User.email == "sos_cg@example.com").first()
        if user:
            db.delete(user)
        db.commit()
    finally:
        db.close()


def test_trigger_sos(setup):
    headers = setup["headers"]
    patient_id = setup["patient_id"]

    res = client.post(
        "/api/v1/sos/trigger",
        json={"patient_id": patient_id, "trigger_method": "button"},
        headers=headers,
    )
    assert res.status_code == 200, res.text
    data = res.json()["data"]
    assert data["trigger_method"] == "button"
    assert data["is_active"] is True
    assert data["resolved_at"] is None

    # Test deduplication: trigger again, should return the same active event
    res2 = client.post(
        "/api/v1/sos/trigger",
        json={"patient_id": patient_id, "trigger_method": "voice"},
        headers=headers,
    )
    assert res2.status_code == 200
    data2 = res2.json()["data"]
    assert data2["id"] == data["id"]
    assert data2.get("already_active") is True


def test_sos_history(setup):
    headers = setup["headers"]
    patient_id = setup["patient_id"]

    res = client.get(f"/api/v1/sos/{patient_id}/history", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) == 1
    assert data[0]["is_active"] is True


def test_resolve_sos(setup):
    headers = setup["headers"]
    patient_id = setup["patient_id"]

    # Get history to find ID
    history = client.get(f"/api/v1/sos/{patient_id}/history", headers=headers).json()["data"]
    event_id = history[0]["id"]

    # Resolve
    res = client.patch(f"/api/v1/sos/{event_id}/resolve", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["is_active"] is False
    assert data["resolved_at"] is not None

    # Try resolving again -> 400
    res2 = client.patch(f"/api/v1/sos/{event_id}/resolve", headers=headers)
    assert res2.status_code == 400
    assert "already resolved" in res2.json()["error"]["message"]

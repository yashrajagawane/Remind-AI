"""
Phase 6 tests — Reminder & Medication System

Tests cover:
  1. Create reminder (caregiver)
  2. List reminders (with status/category filters)
  3. Mark reminder as completed (patient can do it too)
  4. Update reminder fields
  5. Delete reminder
  6. Today's reminders endpoint
"""
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, Patient
from app.models.reminder import Reminder

client = TestClient(app)


@pytest.fixture(scope="module")
def setup():
    """Create caregiver + patient, yield tokens and IDs, tear down after."""
    # Register caregiver
    client.post(
        "/api/v1/auth/register",
        json={"email": "rem_cg@example.com", "password": "pwd", "name": "RemCG", "role": "caregiver"},
    )
    login = client.post("/api/v1/auth/login", data={"username": "rem_cg@example.com", "password": "pwd"})
    token = login.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create patient
    p = client.post(
        "/api/v1/patients/",
        json={"name": "Reminder Patient", "dob": "1950-01-01", "medical_notes": ""},
        headers=headers,
    )
    patient_id = p.json()["data"]["id"]

    yield {"headers": headers, "patient_id": patient_id}

    # Teardown
    db = SessionLocal()
    try:
        db.query(Reminder).filter(Reminder.patient_id == patient_id).delete()
        pat = db.query(Patient).filter(Patient.id == patient_id).first()
        if pat:
            db.delete(pat)
        user = db.query(User).filter(User.email == "rem_cg@example.com").first()
        if user:
            db.delete(user)
        db.commit()
    finally:
        db.close()


def test_create_reminder(setup):
    headers = setup["headers"]
    patient_id = setup["patient_id"]

    now = datetime.now(timezone.utc)
    res = client.post(
        "/api/v1/reminders/",
        json={
            "patient_id": patient_id,
            "category": "medication",
            "title": "Take Blood Pressure Pill",
            "description": "1 tablet with water",
            "scheduled_at": now.isoformat(),
            "recurrence": "daily",
            "priority": "high",
        },
        headers=headers,
    )
    assert res.status_code == 200, res.text
    data = res.json()["data"]
    assert data["title"] == "Take Blood Pressure Pill"
    assert data["status"] == "upcoming"
    assert data["category"] == "medication"


def test_list_reminders(setup):
    headers = setup["headers"]
    patient_id = setup["patient_id"]

    res = client.get(f"/api/v1/reminders/?patient_id={patient_id}", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["data"]) >= 1


def test_list_reminders_filter_status(setup):
    headers = setup["headers"]
    patient_id = setup["patient_id"]

    res = client.get(
        f"/api/v1/reminders/?patient_id={patient_id}&status=upcoming",
        headers=headers,
    )
    assert res.status_code == 200
    for r in res.json()["data"]:
        assert r["status"] == "upcoming"


def test_list_reminders_filter_category(setup):
    headers = setup["headers"]
    patient_id = setup["patient_id"]

    # Create a meal reminder
    now = datetime.now(timezone.utc)
    client.post(
        "/api/v1/reminders/",
        json={
            "patient_id": patient_id,
            "category": "meal",
            "title": "Lunch",
            "scheduled_at": now.isoformat(),
        },
        headers=headers,
    )

    res = client.get(
        f"/api/v1/reminders/?patient_id={patient_id}&category=medication",
        headers=headers,
    )
    assert res.status_code == 200
    for r in res.json()["data"]:
        assert r["category"] == "medication"


def test_mark_completed(setup):
    headers = setup["headers"]
    patient_id = setup["patient_id"]

    # Get first reminder
    res = client.get(f"/api/v1/reminders/?patient_id={patient_id}", headers=headers)
    reminder_id = res.json()["data"][0]["id"]

    # Mark completed
    patch_res = client.patch(
        f"/api/v1/reminders/{reminder_id}/status",
        json={"status": "completed"},
        headers=headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["status"] == "completed"


def test_update_reminder(setup):
    headers = setup["headers"]
    patient_id = setup["patient_id"]

    # Get a reminder
    res = client.get(f"/api/v1/reminders/?patient_id={patient_id}", headers=headers)
    reminder_id = res.json()["data"][0]["id"]

    put_res = client.put(
        f"/api/v1/reminders/{reminder_id}",
        json={"title": "Updated Title", "priority": "critical"},
        headers=headers,
    )
    assert put_res.status_code == 200
    assert put_res.json()["data"]["title"] == "Updated Title"
    assert put_res.json()["data"]["priority"] == "critical"


def test_todays_reminders(setup):
    headers = setup["headers"]
    patient_id = setup["patient_id"]

    res = client.get(f"/api/v1/reminders/today?patient_id={patient_id}", headers=headers)
    assert res.status_code == 200
    # All reminders we created are today, so should have results
    assert isinstance(res.json()["data"], list)


def test_delete_reminder(setup):
    headers = setup["headers"]
    patient_id = setup["patient_id"]

    # Create one to delete
    now = datetime.now(timezone.utc)
    create_res = client.post(
        "/api/v1/reminders/",
        json={
            "patient_id": patient_id,
            "category": "other",
            "title": "Deletable",
            "scheduled_at": now.isoformat(),
        },
        headers=headers,
    )
    rem_id = create_res.json()["data"]["id"]

    del_res = client.delete(f"/api/v1/reminders/{rem_id}", headers=headers)
    assert del_res.status_code == 200

    # Confirm gone
    get_res = client.get(f"/api/v1/reminders/?patient_id={patient_id}", headers=headers)
    ids = [r["id"] for r in get_res.json()["data"]]
    assert rem_id not in ids


def test_invalid_status_rejected(setup):
    headers = setup["headers"]
    patient_id = setup["patient_id"]

    res = client.get(f"/api/v1/reminders/?patient_id={patient_id}", headers=headers)
    if res.json()["data"]:
        reminder_id = res.json()["data"][0]["id"]
        bad_res = client.patch(
            f"/api/v1/reminders/{reminder_id}/status",
            json={"status": "invalid_status"},
            headers=headers,
        )
        assert bad_res.status_code == 400

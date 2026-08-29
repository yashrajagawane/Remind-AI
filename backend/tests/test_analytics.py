import pytest
from fastapi.testclient import TestClient

from app.models.recognition import Recognition
from app.models.reminder import Reminder
from app.models.sos import EmergencyEvent


def test_analytics_endpoints(client: TestClient, db_session, test_user, test_patient):
    # Seed some data for analytics
    # 1 Recognition
    rec = Recognition(patient_id=test_patient.id, member_id=None, confidence_score=0.9, photo_url=None)
    db_session.add(rec)
    
    # 1 Reminder (completed)
    rem = Reminder(patient_id=test_patient.id, created_by=test_user.id, category="medication", title="Pill", scheduled_at="2025-01-01T10:00:00Z", status="completed")
    db_session.add(rem)
    
    # 1 SOS Event
    sos = EmergencyEvent(patient_id=test_patient.id, trigger_method="button", contacts_notified=1)
    db_session.add(sos)
    db_session.commit()

    headers = {"Authorization": f"Bearer {test_user.id}"}  # mocked auth

    # 1. Summary
    res = client.get(f"/api/v1/analytics/{test_patient.id}/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["faces_recognized_today"] >= 0
    assert data["total_reminders"] == 1
    assert data["completed_reminders"] == 1
    assert data["sos_events"] == 1

    # 2. Recognitions
    res = client.get(f"/api/v1/analytics/{test_patient.id}/recognitions", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["data"]) == 7  # 7 days of the week

    # 3. Reminders
    res = client.get(f"/api/v1/analytics/{test_patient.id}/reminders", headers=headers)
    assert res.status_code == 200
    r_data = res.json()["data"]
    assert len(r_data) == 1
    assert r_data[0]["category"] == "Medication"
    assert r_data[0]["completed"] == 1

    # 4. SOS
    res = client.get(f"/api/v1/analytics/{test_patient.id}/sos", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["data"]) == 1

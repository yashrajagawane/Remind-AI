import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, Patient

client = TestClient(app)

@pytest.fixture
def caregiver_token():
    # Register caregiver
    client.post(
        "/api/v1/auth/register",
        json={"email": "caregiver_patient@example.com", "password": "pwd", "name": "CG", "role": "caregiver"}
    )
    res = client.post("/api/v1/auth/login", data={"username": "caregiver_patient@example.com", "password": "pwd"})
    yield res.json()["data"]["access_token"]
    
    # Teardown
    db = SessionLocal()
    user = db.query(User).filter(User.email == "caregiver_patient@example.com").first()
    if user:
        # Also clean up patients
        patients = db.query(Patient).filter(Patient.caregiver_id == user.id).all()
        for p in patients:
            db.delete(p)
        db.delete(user)
        db.commit()
    db.close()


def test_create_and_get_patient(caregiver_token):
    headers = {"Authorization": f"Bearer {caregiver_token}"}
    
    # Create patient
    res = client.post(
        "/api/v1/patients/",
        json={"name": "John Doe", "dob": "1940-01-01", "medical_notes": "None"},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["name"] == "John Doe"
    patient_id = data["id"]
    
    # Get patient
    res_get = client.get(f"/api/v1/patients/{patient_id}", headers=headers)
    assert res_get.status_code == 200
    assert res_get.json()["data"]["name"] == "John Doe"
    
    # Update patient
    res_put = client.put(
        f"/api/v1/patients/{patient_id}",
        json={"name": "John Smith", "dob": "1940-01-01", "medical_notes": "Updated"},
        headers=headers
    )
    assert res_put.status_code == 200
    assert res_put.json()["data"]["name"] == "John Smith"
    
    # List patients
    res_list = client.get("/api/v1/patients/", headers=headers)
    assert res_list.status_code == 200
    assert len(res_list.json()["data"]) == 1

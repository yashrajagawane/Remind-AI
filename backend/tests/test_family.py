import pytest
import io
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, Patient, FamilyMember

client = TestClient(app)

@pytest.fixture
def caregiver_setup():
    # Register caregiver
    client.post(
        "/api/v1/auth/register",
        json={"email": "cg_family@example.com", "password": "pwd", "name": "CG", "role": "caregiver"}
    )
    res = client.post("/api/v1/auth/login", data={"username": "cg_family@example.com", "password": "pwd"})
    token = res.json()["data"]["access_token"]
    
    # Create patient
    headers = {"Authorization": f"Bearer {token}"}
    p_res = client.post(
        "/api/v1/patients/",
        json={"name": "Patient 1", "dob": "1940-01-01", "medical_notes": "None"},
        headers=headers
    )
    patient_id = p_res.json()["data"]["id"]
    
    yield {"token": token, "patient_id": patient_id}
    
    # Teardown
    db = SessionLocal()
    user = db.query(User).filter(User.email == "cg_family@example.com").first()
    if user:
        members = db.query(FamilyMember).filter(FamilyMember.patient_id == patient_id).all()
        for m in members:
            db.delete(m)
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if patient:
            db.delete(patient)
        db.delete(user)
        db.commit()
    db.close()


def test_family_crud(caregiver_setup):
    token = caregiver_setup["token"]
    patient_id = caregiver_setup["patient_id"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create family member
    res = client.post(
        "/api/v1/family/",
        data={
            "patient_id": patient_id,
            "name": "Jane Doe",
            "relationship": "Daughter",
            "phone_number": "1234567890"
        },
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["name"] == "Jane Doe"
    member_id = data["id"]
    
    # List family members
    res_list = client.get(f"/api/v1/family/?patient_id={patient_id}", headers=headers)
    assert res_list.status_code == 200
    assert len(res_list.json()["data"]) == 1
    
    # Update family member
    res_put = client.put(
        f"/api/v1/family/{member_id}",
        data={
            "name": "Jane Smith",
            "relationship": "Daughter",
            "phone_number": "0987654321"
        },
        headers=headers
    )
    assert res_put.status_code == 200
    assert res_put.json()["data"]["name"] == "Jane Smith"
    
    # Delete family member
    res_del = client.delete(f"/api/v1/family/{member_id}", headers=headers)
    assert res_del.status_code == 200


def test_family_bulk_import(caregiver_setup):
    token = caregiver_setup["token"]
    patient_id = caregiver_setup["patient_id"]
    headers = {"Authorization": f"Bearer {token}"}
    
    csv_content = "name,relationship,phone_number\nBob,Son,111\nAlice,Wife,222"
    file = io.BytesIO(csv_content.encode("utf-8"))
    
    res = client.post(
        "/api/v1/family/bulk-import",
        data={"patient_id": patient_id},
        files={"file": ("import.csv", file, "text/csv")},
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["data"]["imported_count"] == 2

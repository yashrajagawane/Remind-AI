from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import Patient, User
from app.schemas.common import success
from app.api.deps import RoleChecker, get_current_user

router = APIRouter()


class PatientCreate(BaseModel):
    name: str
    dob: str
    medical_notes: str


class PatientResponse(PatientCreate):
    id: str
    caregiver_id: str


@router.get("/")
def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin", "family"]))
):
    if current_user.role == "admin":
        patients = db.query(Patient).all()
    elif current_user.role == "family":
        # Family members see patients they are linked to via FamilyMember records
        from app.models.user import FamilyMember
        linked_patient_ids = (
            db.query(FamilyMember.patient_id)
            .filter(FamilyMember.name == current_user.name)
            .distinct()
            .all()
        )
        patient_ids = [pid for (pid,) in linked_patient_ids]
        patients = db.query(Patient).filter(Patient.id.in_(patient_ids)).all() if patient_ids else []
    else:
        patients = db.query(Patient).filter(Patient.caregiver_id == current_user.id).all()
    
    return success([
        {
            "id": p.id,
            "name": p.name,
            "dob": p.dob,
            "medical_notes": p.medical_notes,
            "caregiver_id": p.caregiver_id,
        } for p in patients
    ])


@router.post("/")
def create_patient(
    patient: PatientCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"]))
):
    db_patient = Patient(
        id=str(uuid.uuid4()),
        name=patient.name,
        dob=patient.dob,
        medical_notes=patient.medical_notes,
        caregiver_id=current_user.id,
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return success({
        "id": db_patient.id,
        "name": db_patient.name,
        "dob": db_patient.dob,
        "medical_notes": db_patient.medical_notes,
        "caregiver_id": db_patient.caregiver_id,
    })


@router.get("/{id}")
def get_patient(
    id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin", "family", "patient"]))
):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Basic authorization check
    if current_user.role == "caregiver" and patient.caregiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this patient")
    if current_user.role == "family":
        from app.models.user import FamilyMember
        link = db.query(FamilyMember).filter(
            FamilyMember.patient_id == id,
            FamilyMember.name == current_user.name
        ).first()
        if not link:
            raise HTTPException(status_code=403, detail="Not authorized (not linked to this patient)")
        
    return success({
        "id": patient.id,
        "name": patient.name,
        "dob": patient.dob,
        "medical_notes": patient.medical_notes,
        "caregiver_id": patient.caregiver_id,
    })


@router.put("/{id}")
def update_patient(
    id: str, 
    patient_update: PatientCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"]))
):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.role == "caregiver" and patient.caregiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this patient")

    patient.name = patient_update.name
    patient.dob = patient_update.dob
    patient.medical_notes = patient_update.medical_notes
    db.commit()
    db.refresh(patient)
    return success({
        "id": patient.id,
        "name": patient.name,
        "dob": patient.dob,
        "medical_notes": patient.medical_notes,
        "caregiver_id": patient.caregiver_id,
    })

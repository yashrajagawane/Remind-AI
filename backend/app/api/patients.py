from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import Patient

router = APIRouter()

class PatientCreate(BaseModel):
    name: str
    dob: str
    medical_notes: str

class PatientResponse(PatientCreate):
    id: str
    caregiver_id: str

@router.get("/", response_model=List[PatientResponse])
def list_patients(db: Session = Depends(get_db)):
    # Note: In a real app we would get the caregiver_id from the JWT token
    patients = db.query(Patient).all()
    return patients

@router.post("/", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    db_patient = Patient(
        name=patient.name,
        dob=patient.dob,
        medical_notes=patient.medical_notes,
        caregiver_id="admin_placeholder" # Placeholder until JWT injection is fully implemented
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.get("/{id}", response_model=PatientResponse)
def get_patient(id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{id}", response_model=PatientResponse)
def update_patient(id: str, patient_update: PatientCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient.name = patient_update.name
    patient.dob = patient_update.dob
    patient.medical_notes = patient_update.medical_notes
    db.commit()
    db.refresh(patient)
    return patient

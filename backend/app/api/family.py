import csv
import io
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import FamilyMember, Patient, User
from app.schemas.common import success
from app.api.deps import RoleChecker, get_current_user
from app.services.media import upload_image

router = APIRouter()


def _member_dict(m: FamilyMember) -> dict:
    return {
        "id": m.id,
        "patient_id": m.patient_id,
        "name": m.name,
        "relationship": m.relationship_label,
        "phone_number": m.phone,
        "photo_url": getattr(m, "photo_url", None),
    }


@router.get("/")
def list_family_members(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin", "family"]))
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user.role == "caregiver" and patient.caregiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    members = db.query(FamilyMember).filter(FamilyMember.patient_id == patient_id).all()
    return success([_member_dict(m) for m in members])


@router.post("/")
def create_family_member(
    patient_id: str = Form(...),
    name: str = Form(...),
    relationship: str = Form(...),
    phone_number: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"]))
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user.role == "caregiver" and patient.caregiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    photo_url = None
    if photo:
        photo_url = upload_image(photo)

    new_member = FamilyMember(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        name=name,
        relationship_label=relationship,
        phone=phone_number,
    )
    # photo_url lives in a later migration; set it only if the column exists
    if hasattr(FamilyMember, "photo_url"):
        new_member.photo_url = photo_url

    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return success(_member_dict(new_member))


@router.put("/{id}")
def update_family_member(
    id: str,
    name: str = Form(...),
    relationship: str = Form(...),
    phone_number: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"]))
):
    member = db.query(FamilyMember).filter(FamilyMember.id == id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")

    patient = db.query(Patient).filter(Patient.id == member.patient_id).first()
    if current_user.role == "caregiver" and patient and patient.caregiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    member.name = name
    member.relationship_label = relationship
    member.phone = phone_number

    if photo and hasattr(FamilyMember, "photo_url"):
        member.photo_url = upload_image(photo)

    db.commit()
    db.refresh(member)
    return success(_member_dict(member))


@router.delete("/{id}")
def delete_family_member(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"]))
):
    member = db.query(FamilyMember).filter(FamilyMember.id == id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")

    patient = db.query(Patient).filter(Patient.id == member.patient_id).first()
    if current_user.role == "caregiver" and patient and patient.caregiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(member)
    db.commit()
    return success({"detail": "Family member deleted successfully"})


@router.post("/bulk-import")
def bulk_import_family(
    patient_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"]))
):
    """
    Expects a CSV with columns: name, relationship, phone_number, photo_url
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user.role == "caregiver" and patient.caregiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))

    required_cols = {"name", "relationship"}
    if not reader.fieldnames or not required_cols.issubset(set(reader.fieldnames)):
        raise HTTPException(status_code=400, detail="CSV must contain 'name' and 'relationship' columns")

    added = []
    for row in reader:
        name = row.get("name", "").strip()
        rel = row.get("relationship", "").strip()
        if not name or not rel:
            continue

        member = FamilyMember(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            name=name,
            relationship_label=rel,
            phone=row.get("phone_number", "").strip() or None,
        )
        db.add(member)
        added.append(member)

    db.commit()
    return success({"imported_count": len(added)})


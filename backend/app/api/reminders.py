"""
ReMind AI — Reminder & Medication API (Phase 6)

Endpoints:
  GET    /reminders/?patient_id=...          — List reminders for a patient (filterable by status/category)
  POST   /reminders/                         — Create a new reminder
  PUT    /reminders/{id}                     — Update a reminder
  PATCH  /reminders/{id}/status              — Mark as completed / missed / snoozed
  DELETE /reminders/{id}                     — Delete a reminder
  GET    /reminders/today?patient_id=...     — Today's reminders only
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.reminder import Reminder
from app.models.user import Patient, User
from app.schemas.common import success
from app.api.deps import RoleChecker, get_current_user

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

class ReminderCreate(BaseModel):
    patient_id: str
    category: str = "medication"
    title: str
    description: Optional[str] = None
    scheduled_at: datetime
    recurrence: Optional[str] = None  # none | daily | weekly | monthly
    priority: str = "normal"          # critical | high | normal | low


class ReminderUpdate(BaseModel):
    category: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    recurrence: Optional[str] = None
    priority: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str  # completed | missed | snoozed | upcoming


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _reminder_dict(r: Reminder) -> dict:
    return {
        "id": r.id,
        "patient_id": r.patient_id,
        "created_by": r.created_by,
        "category": r.category,
        "title": r.title,
        "description": r.description,
        "scheduled_at": r.scheduled_at.isoformat() if r.scheduled_at else None,
        "recurrence": r.recurrence,
        "priority": r.priority,
        "status": r.status,
        "created_at": r.created_at.isoformat() if hasattr(r, "created_at") and r.created_at else None,
    }


def _assert_patient_access(patient_id: str, user: User, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if user.role == "caregiver" and patient.caregiver_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if user.role == "family":
        from app.models.user import FamilyMember
        link = db.query(FamilyMember).filter(
            FamilyMember.patient_id == patient_id,
            FamilyMember.name == user.name
        ).first()
        if not link:
            raise HTTPException(status_code=403, detail="Not authorized (not linked to this patient)")
    return patient


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/")
def list_reminders(
    patient_id: str,
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin", "patient", "family"])),
):
    """List reminders for a patient, optionally filtered by status and category."""
    _assert_patient_access(patient_id, current_user, db)

    q = db.query(Reminder).filter(Reminder.patient_id == patient_id)
    if status:
        q = q.filter(Reminder.status == status)
    if category:
        q = q.filter(Reminder.category == category)
    q = q.order_by(Reminder.scheduled_at)

    return success([_reminder_dict(r) for r in q.all()])


@router.get("/today")
def todays_reminders(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin", "patient"])),
):
    """Return only today's reminders for the patient interface."""
    _assert_patient_access(patient_id, current_user, db)

    today = datetime.now(timezone.utc).date()
    reminders = (
        db.query(Reminder)
        .filter(
            Reminder.patient_id == patient_id,
            func.date(Reminder.scheduled_at) == today,
        )
        .order_by(Reminder.scheduled_at)
        .all()
    )
    return success([_reminder_dict(r) for r in reminders])


@router.post("/")
def create_reminder(
    body: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"])),
):
    """Create a new reminder. Only caregivers / admins can create."""
    _assert_patient_access(body.patient_id, current_user, db)

    reminder = Reminder(
        id=str(uuid.uuid4()),
        patient_id=body.patient_id,
        created_by=current_user.id,
        category=body.category,
        title=body.title,
        description=body.description,
        scheduled_at=body.scheduled_at,
        recurrence=body.recurrence,
        priority=body.priority,
        status="upcoming",
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return success(_reminder_dict(reminder))


@router.put("/{reminder_id}")
def update_reminder(
    reminder_id: str,
    body: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"])),
):
    """Update fields of an existing reminder."""
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    _assert_patient_access(reminder.patient_id, current_user, db)

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(reminder, key, value)

    db.commit()
    db.refresh(reminder)
    return success(_reminder_dict(reminder))


@router.patch("/{reminder_id}/status")
def update_status(
    reminder_id: str,
    body: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin", "patient"])),
):
    """Mark a reminder as completed / missed / snoozed. Patients can mark their own."""
    valid_statuses = {"upcoming", "completed", "missed", "snoozed"}
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    _assert_patient_access(reminder.patient_id, current_user, db)

    reminder.status = body.status
    db.commit()
    db.refresh(reminder)
    return success(_reminder_dict(reminder))


@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"])),
):
    """Delete a reminder. Only caregivers / admins."""
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    _assert_patient_access(reminder.patient_id, current_user, db)

    db.delete(reminder)
    db.commit()
    return success({"detail": "Reminder deleted"})

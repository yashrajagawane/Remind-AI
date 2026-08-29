"""
ReMind AI — Analytics API (Phase 10)

Real database-backed analytics for the caregiver dashboard.

Endpoints:
  GET /analytics/{patient_id}/summary       - KPI card data
  GET /analytics/{patient_id}/recognitions  - Recognition events grouped by day
  GET /analytics/{patient_id}/reminders     - Reminder compliance by category
  GET /analytics/{patient_id}/sos           - SOS event timeline
"""
from datetime import datetime, timedelta, timezone
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, Patient
from app.models.reminder import Reminder
from app.models.recognition import Recognition
from app.models.sos import EmergencyEvent
from app.schemas.common import success
from app.api.deps import RoleChecker

router = APIRouter()

WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _assert_patient(patient_id: str, user: User, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if user.role == "caregiver" and patient.caregiver_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return patient


@router.get("/{patient_id}/summary")
def get_analytics_summary(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"])),
):
    """KPI summary data for the caregiver dashboard."""
    _assert_patient(patient_id, current_user, db)

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Faces recognized today
    faces_today = (
        db.query(func.count(Recognition.id))
        .filter(Recognition.patient_id == patient_id, Recognition.created_at >= today_start)
        .scalar()
    ) or 0

    # Reminder stats (all time for this patient)
    total_reminders = db.query(func.count(Reminder.id)).filter(Reminder.patient_id == patient_id).scalar() or 0
    completed = db.query(func.count(Reminder.id)).filter(
        Reminder.patient_id == patient_id, Reminder.status == "completed"
    ).scalar() or 0
    missed = db.query(func.count(Reminder.id)).filter(
        Reminder.patient_id == patient_id, Reminder.status == "missed"
    ).scalar() or 0
    compliance = round((completed / total_reminders) * 100) if total_reminders > 0 else 0

    # SOS events (all time)
    sos_count = db.query(func.count(EmergencyEvent.id)).filter(
        EmergencyEvent.patient_id == patient_id
    ).scalar() or 0

    return success({
        "faces_recognized_today": faces_today,
        "reminders_completed_pct": compliance,
        "missed_reminders": missed,
        "sos_events": sos_count,
        "total_reminders": total_reminders,
        "completed_reminders": completed,
    })


@router.get("/{patient_id}/recognitions")
def get_recognition_trends(
    patient_id: str,
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"])),
):
    """Recognition events grouped by day for chart display."""
    _assert_patient(patient_id, current_user, db)

    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days)

    events = (
        db.query(Recognition.created_at)
        .filter(Recognition.patient_id == patient_id, Recognition.created_at >= start)
        .all()
    )

    # Group by day-of-week
    counts: Counter = Counter()
    for (ts,) in events:
        if ts:
            day_name = ts.strftime("%a")[:3]
            counts[day_name] += 1

    # Ensure all 7 days present
    result = [{"name": d, "recognitions": counts.get(d, 0)} for d in WEEKDAYS]
    return success(result)


@router.get("/{patient_id}/reminders")
def get_reminder_compliance(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"])),
):
    """Reminder compliance grouped by category."""
    _assert_patient(patient_id, current_user, db)

    reminders = db.query(Reminder).filter(Reminder.patient_id == patient_id).all()

    # Group by category
    cats: dict[str, dict[str, int]] = {}
    for r in reminders:
        cat = r.category or "other"
        if cat not in cats:
            cats[cat] = {"completed": 0, "missed": 0, "total": 0}
        cats[cat]["total"] += 1
        if r.status == "completed":
            cats[cat]["completed"] += 1
        elif r.status == "missed":
            cats[cat]["missed"] += 1

    result = [
        {
            "category": cat.capitalize(),
            "completed": v["completed"],
            "missed": v["missed"],
            "total": v["total"],
            "pct": round((v["completed"] / v["total"]) * 100) if v["total"] > 0 else 0,
        }
        for cat, v in cats.items()
    ]
    return success(result)


@router.get("/{patient_id}/sos")
def get_sos_timeline(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"])),
):
    """SOS event timeline for the analytics dashboard."""
    _assert_patient(patient_id, current_user, db)

    events = (
        db.query(EmergencyEvent)
        .filter(EmergencyEvent.patient_id == patient_id)
        .order_by(EmergencyEvent.created_at.desc())
        .limit(50)
        .all()
    )

    return success([
        {
            "id": e.id,
            "trigger_method": e.trigger_method,
            "contacts_notified": e.contacts_notified,
            "is_active": e.resolved_at is None,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "resolved_at": e.resolved_at.isoformat() if e.resolved_at else None,
        }
        for e in events
    ])

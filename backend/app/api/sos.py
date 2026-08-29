"""
ReMind AI — Emergency SOS API (Phase 8)

Endpoints:
  POST   /sos/trigger                 - Trigger an emergency event
  GET    /sos/{patient_id}/history    - Get history of SOS events for a patient
  PATCH  /sos/{event_id}/resolve      - Mark an SOS event as resolved
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.sos import EmergencyEvent
from app.models.user import User, Patient
from app.api.deps import RoleChecker, get_current_user
from app.schemas.common import success

router = APIRouter()


class SOSCreate(BaseModel):
    patient_id: str
    trigger_method: str = "button"  # button, voice, auto


def _event_dict(e: EmergencyEvent) -> dict:
    return {
        "id": e.id,
        "patient_id": e.patient_id,
        "trigger_method": e.trigger_method,
        "contacts_notified": e.contacts_notified,
        "resolved_at": e.resolved_at.isoformat() if e.resolved_at else None,
        "created_at": e.created_at.isoformat() if e.created_at else None,
        "is_active": e.resolved_at is None,
    }


def _assert_patient_access(patient_id: str, user: User, db: Session) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if user.role == "caregiver" and patient.caregiver_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this patient's SOS data")
    if user.role == "family":
        from app.models.user import FamilyMember
        link = db.query(FamilyMember).filter(
            FamilyMember.patient_id == patient_id,
            FamilyMember.name == user.name
        ).first()
        if not link:
            raise HTTPException(status_code=403, detail="Not authorized (not linked to this patient)")
    return patient


def dispatch_emergency_notifications(patient_id: str, method: str):
    """
    Mock background task to simulate SMS/Call dispatch to family members.
    In a real app, this would use Twilio or similar APIs.
    """
    print(f"🚨 URGENT: Dispatched SOS alerts for patient {patient_id} triggered via {method}.")


@router.post("/trigger")
def trigger_sos(
    sos: SOSCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin", "patient"])),
):
    """
    Trigger an emergency protocol.
    Patients, caregivers, or admins can trigger an SOS on behalf of a patient.
    """
    _assert_patient_access(sos.patient_id, current_user, db)

    # Check if there's already an active (unresolved) SOS for this patient to prevent spam
    active_event = (
        db.query(EmergencyEvent)
        .filter(EmergencyEvent.patient_id == sos.patient_id, EmergencyEvent.resolved_at == None)
        .first()
    )
    
    if active_event:
        # Just return the active event data, maybe inject a flag
        result = _event_dict(active_event)
        result["already_active"] = True
        return success(result)

    # Create the event record
    db_sos = EmergencyEvent(
        patient_id=sos.patient_id,
        trigger_method=sos.trigger_method,
        contacts_notified=3,  # Simulated
    )
    db.add(db_sos)
    db.commit()
    db.refresh(db_sos)

    # Dispatch alerts asynchronously
    background_tasks.add_task(dispatch_emergency_notifications, sos.patient_id, sos.trigger_method)

    return success(_event_dict(db_sos))


@router.get("/{patient_id}/history")
def get_sos_history(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin", "patient", "family"])),
):
    """View SOS history."""
    _assert_patient_access(patient_id, current_user, db)

    events = (
        db.query(EmergencyEvent)
        .filter(EmergencyEvent.patient_id == patient_id)
        .order_by(EmergencyEvent.created_at.desc())
        .all()
    )
    return success([_event_dict(e) for e in events])


@router.patch("/{event_id}/resolve")
def resolve_sos(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"])),
):
    """Resolve an active SOS event. Only caregivers or admins can resolve."""
    db_sos = db.query(EmergencyEvent).filter(EmergencyEvent.id == event_id).first()
    if not db_sos:
        raise HTTPException(status_code=404, detail="Emergency event not found")

    _assert_patient_access(db_sos.patient_id, current_user, db)

    if db_sos.resolved_at:
        raise HTTPException(status_code=400, detail="Event is already resolved")

    db_sos.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_sos)
    return success(_event_dict(db_sos))

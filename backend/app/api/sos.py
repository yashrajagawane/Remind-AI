from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.sos import EmergencyEvent

router = APIRouter()


class SOSCreate(BaseModel):
    patient_id: str
    trigger_method: str = "button"


class SOSResponse(SOSCreate):
    id: str
    contacts_notified: int
    resolved_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.post("/trigger", response_model=SOSResponse)
def trigger_sos(sos: SOSCreate, db: Session = Depends(get_db)):
    """
    Trigger an emergency protocol.
    """
    # Create the event record
    db_sos = EmergencyEvent(
        patient_id=sos.patient_id,
        trigger_method=sos.trigger_method,
        contacts_notified=3,  # Simulated
    )
    db.add(db_sos)
    db.commit()
    db.refresh(db_sos)

    # In a real scenario, this would dispatch SMS, calls, or push notifications asynchronously
    print(f"SOS TRIGGERED for patient {sos.patient_id} via {sos.trigger_method}")

    return db_sos


@router.get("/{patient_id}/history", response_model=list[SOSResponse])
def get_sos_history(patient_id: str, db: Session = Depends(get_db)):
    events = (
        db.query(EmergencyEvent)
        .filter(EmergencyEvent.patient_id == patient_id)
        .order_by(EmergencyEvent.created_at.desc())
        .all()
    )
    return events


@router.patch("/{event_id}/resolve", response_model=SOSResponse)
def resolve_sos(event_id: str, db: Session = Depends(get_db)):
    db_sos = db.query(EmergencyEvent).filter(EmergencyEvent.id == event_id).first()
    if not db_sos:
        raise HTTPException(status_code=404, detail="Event not found")

    db_sos.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(db_sos)
    return db_sos

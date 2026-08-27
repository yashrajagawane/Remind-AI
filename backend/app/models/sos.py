"""Emergency SOS event model (Module 5, Phase 8)."""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class EmergencyEvent(BaseModel):
    """A triggered SOS event and its resolution state."""

    __tablename__ = "emergency_events"

    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    trigger_method = Column(String(50), nullable=False)  # 'button' | 'voice' | 'auto'
    contacts_notified = Column(Integer, nullable=False, default=0)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    patient = relationship("Patient", back_populates="emergency_events")

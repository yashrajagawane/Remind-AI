from sqlalchemy import Column, String, ForeignKey, DateTime, Integer
from app.models.base import BaseModel

class EmergencyEvent(BaseModel):
    __tablename__ = "emergency_events"
    
    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    trigger_method = Column(String(50), nullable=False) # e.g., 'button', 'voice'
    contacts_notified = Column(Integer, default=0)
    resolved_at = Column(DateTime, nullable=True)

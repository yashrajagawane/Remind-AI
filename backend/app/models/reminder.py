from sqlalchemy import Column, String, ForeignKey, DateTime
from app.models.base import BaseModel

class Reminder(BaseModel):
    __tablename__ = "reminders"
    
    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    
    category = Column(String(50), nullable=False) # e.g., 'medication', 'meal', 'appointment', 'hydration'
    title = Column(String(255), nullable=False)
    description = Column(String(1024), nullable=True)
    scheduled_at = Column(DateTime, nullable=False)
    recurrence = Column(String(50), nullable=True) # e.g., 'daily', 'weekly', 'none'
    priority = Column(String(50), default="Normal") # 'Critical', 'High', 'Normal', 'Low'
    status = Column(String(50), default="upcoming") # 'upcoming', 'completed', 'missed', 'snoozed'

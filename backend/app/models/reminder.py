"""Reminder & medication scheduling model (Module 4, Phase 6)."""

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Reminder(BaseModel):
    """A scheduled prompt for the patient (medication, meal, appointment, ...)."""

    __tablename__ = "reminders"

    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)

    # 'medication' | 'meal' | 'appointment' | 'hydration' | 'activity' | 'other'
    category = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String(1024), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    recurrence = Column(String(50), nullable=True)  # 'none' | 'daily' | 'weekly' | 'monthly'
    priority = Column(String(50), nullable=False, default="normal")  # critical|high|normal|low
    # 'upcoming' | 'completed' | 'missed' | 'snoozed'
    status = Column(String(50), nullable=False, default="upcoming", index=True)

    patient = relationship("Patient", back_populates="reminders")
    creator = relationship("User", foreign_keys=[created_by])

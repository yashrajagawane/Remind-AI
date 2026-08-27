"""Audit log model — records every mutation for accountability (Phase 11 coverage)."""

from sqlalchemy import Column, ForeignKey, String
from sqlalchemy.orm import relationship

from app.models.base import BaseModel, JSONColumn


class ActivityLog(BaseModel):
    """An audit record scoped to a patient. ``detail`` holds structured context."""

    __tablename__ = "activity_logs"

    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    # e.g. 'reminder.created', 'face.recognized', 'sos.triggered', 'patient.updated'
    action_type = Column(String(100), nullable=False, index=True)
    detail = Column(JSONColumn, nullable=True)

    patient = relationship("Patient", back_populates="activity_logs")

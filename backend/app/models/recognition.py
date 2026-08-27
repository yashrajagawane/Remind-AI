"""Face-recognition event log (Module 2, Phase 4)."""

from sqlalchemy import Boolean, Column, Float, ForeignKey, String
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Recognition(BaseModel):
    """One face-recognition attempt and its outcome.

    ``matched_member_id`` is null when no known face matched; ``is_unknown``
    makes that case explicit for analytics and caregiver review.
    """

    __tablename__ = "recognitions"

    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    matched_member_id = Column(
        String(36), ForeignKey("family_members.id"), index=True, nullable=True
    )
    confidence = Column(Float, nullable=False, default=0.0)  # cosine similarity, 0..1
    is_unknown = Column(Boolean, nullable=False, default=False)
    image_url = Column(String(1024), nullable=True)

    patient = relationship("Patient", back_populates="recognitions")
    matched_member = relationship("FamilyMember", foreign_keys=[matched_member_id])

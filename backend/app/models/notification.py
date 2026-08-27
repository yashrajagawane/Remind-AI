"""User notification model (wired app-wide in Phase 11)."""

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Notification(BaseModel):
    """An in-app message for a user. ``read_at`` is null until it is read."""

    __tablename__ = "notifications"

    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    # 'reminder' | 'sos' | 'recognition' | 'system' | 'missed_medication'
    type = Column(String(50), nullable=False, index=True)
    message = Column(Text, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True, index=True)

    user = relationship("User", back_populates="notifications")

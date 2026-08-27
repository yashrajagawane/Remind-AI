"""SQLAlchemy ORM models.

Every model module is imported here so that ``Base.metadata`` is fully
populated — required for Alembic autogenerate and for cross-model
``relationship()`` resolution.
"""

from app.models.activity_log import ActivityLog  # noqa: F401
from app.models.base import BaseModel  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.recognition import Recognition  # noqa: F401
from app.models.reminder import Reminder  # noqa: F401
from app.models.sos import EmergencyEvent  # noqa: F401
from app.models.user import (  # noqa: F401
    FaceEmbedding,
    FamilyMember,
    Patient,
    User,
)

__all__ = [
    "ActivityLog",
    "BaseModel",
    "EmergencyEvent",
    "FaceEmbedding",
    "FamilyMember",
    "Notification",
    "Patient",
    "Recognition",
    "Reminder",
    "User",
]

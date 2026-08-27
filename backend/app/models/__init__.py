"""SQLAlchemy ORM models.

Individual model modules are imported here so that ``Base.metadata`` is fully
populated (used by Alembic autogenerate in Phase 1).
"""

from app.models.base import BaseModel  # noqa: F401
from app.models.user import (  # noqa: F401
    FaceEmbedding,
    FamilyMember,
    Patient,
    User,
)

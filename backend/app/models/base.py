"""Declarative base and the shared mixin every ORM model inherits.

Every table gets a UUID string primary key and timezone-aware
``created_at`` / ``updated_at`` timestamps. A portable ``JSONColumn`` type is
also exported here: native ``JSONB`` on PostgreSQL, plain ``JSON`` on the
SQLite dev fallback.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


def generate_uuid() -> str:
    """Return a random UUID4 as a 36-char string (portable PK across dialects)."""
    return str(uuid.uuid4())


def utcnow() -> datetime:
    """Timezone-aware current UTC time (replaces the deprecated ``datetime.utcnow``)."""
    return datetime.now(timezone.utc)


# Portable JSON column type: indexable binary ``JSONB`` on PostgreSQL/Neon,
# plain ``JSON`` everywhere else (e.g. the local SQLite fallback).
JSONColumn = JSON().with_variant(JSONB, "postgresql")


class BaseModel(Base):
    """Abstract base: UUID PK + created/updated timestamps for every table."""

    __abstract__ = True

    id = Column(String(36), primary_key=True, default=generate_uuid)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String

from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class BaseModel(Base):
    __abstract__ = True

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

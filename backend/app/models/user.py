"""Core identity & domain models: users, patients, family members, face embeddings."""

from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel, JSONColumn


class User(BaseModel):
    """An authenticated account. ``role`` drives RBAC (Phase 2)."""

    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    # 'admin' | 'caregiver' | 'family_member' | 'patient'
    role = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)

    # Patients this user is the responsible caregiver for.
    patients_as_caregiver = relationship(
        "Patient",
        foreign_keys="Patient.caregiver_id",
        back_populates="caregiver",
    )
    # Notifications addressed to this user.
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Patient(BaseModel):
    """A person living with dementia, managed by a caregiver."""

    __tablename__ = "patients"

    # The patient's own login account, if they have one (optional).
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=True)
    # The caregiver responsible for this patient (required).
    caregiver_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    dob = Column(String(50), nullable=True)
    medical_notes = Column(Text, nullable=True)

    caregiver = relationship(
        "User",
        foreign_keys=[caregiver_id],
        back_populates="patients_as_caregiver",
    )
    account = relationship("User", foreign_keys=[user_id])

    family_members = relationship(
        "FamilyMember",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    reminders = relationship(
        "Reminder",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    recognitions = relationship(
        "Recognition",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    emergency_events = relationship(
        "EmergencyEvent",
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    activity_logs = relationship(
        "ActivityLog",
        back_populates="patient",
        cascade="all, delete-orphan",
    )


class FamilyMember(BaseModel):
    """A loved one the patient should recognize (and who may have portal access)."""

    __tablename__ = "family_members"

    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    # Optional link to a login account (for the Family Portal, Phase 9).
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=True)
    name = Column(String(255), nullable=False)
    relationship_label = Column("relationship", String(100), nullable=False)
    phone = Column(String(50), nullable=True)

    patient = relationship("Patient", back_populates="family_members")
    account = relationship("User", foreign_keys=[user_id])
    face_embeddings = relationship(
        "FaceEmbedding",
        back_populates="family_member",
        cascade="all, delete-orphan",
    )


class FaceEmbedding(BaseModel):
    """A 128-d face embedding for a family member (populated by the AI engine, Phase 4)."""

    __tablename__ = "face_embeddings"

    family_member_id = Column(
        String(36), ForeignKey("family_members.id"), index=True, nullable=False
    )
    # 128-d vector stored as JSON (JSONB on Postgres); pgvector is a Phase 4 option.
    embedding = Column(JSONColumn, nullable=False)
    photo_url = Column(String(1024), nullable=True)

    family_member = relationship("FamilyMember", back_populates="face_embeddings")

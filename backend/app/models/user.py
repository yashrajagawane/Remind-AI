from sqlalchemy import Column, String, ForeignKey, JSON, Boolean, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # 'caregiver', 'family_member', 'admin'
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)

class Patient(BaseModel):
    __tablename__ = "patients"
    
    user_id = Column(String(36), ForeignKey("users.id"), index=True) # Patient's own user record if any
    caregiver_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    dob = Column(String(50), nullable=True)
    medical_notes = Column(Text, nullable=True)

class FamilyMember(BaseModel):
    __tablename__ = "family_members"
    
    patient_id = Column(String(36), ForeignKey("patients.id"), index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=True) # Optional link to a User account
    name = Column(String(255), nullable=False)
    relationship = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)

class FaceEmbedding(BaseModel):
    __tablename__ = "face_embeddings"
    
    family_member_id = Column(String(36), ForeignKey("family_members.id"), index=True, nullable=False)
    embedding = JSON() # JSON to store the 128-d vector since SQLite doesn't have pgvector
    photo_url = Column(String(1024), nullable=True)

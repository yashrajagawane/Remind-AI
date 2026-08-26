from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.reminder import Reminder

router = APIRouter()

class ReminderBase(BaseModel):
    category: str
    title: str
    description: Optional[str] = None
    scheduled_at: datetime
    recurrence: Optional[str] = None
    priority: str = "Normal"

class ReminderCreate(ReminderBase):
    patient_id: str

class ReminderUpdateStatus(BaseModel):
    status: str

class ReminderResponse(ReminderBase):
    id: str
    patient_id: str
    created_by: str
    status: str
    
    class Config:
        from_attributes = True

@router.get("/{patient_id}", response_model=List[ReminderResponse])
def get_reminders(patient_id: str, db: Session = Depends(get_db)):
    reminders = db.query(Reminder).filter(Reminder.patient_id == patient_id).order_by(Reminder.scheduled_at).all()
    return reminders

@router.post("/", response_model=ReminderResponse)
def create_reminder(reminder: ReminderCreate, db: Session = Depends(get_db)):
    db_reminder = Reminder(
        **reminder.model_dump(),
        created_by="admin_placeholder" # Placeholder until JWT is fully wired up
    )
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.put("/{id}", response_model=ReminderResponse)
def update_reminder(id: str, reminder: ReminderBase, db: Session = Depends(get_db)):
    db_reminder = db.query(Reminder).filter(Reminder.id == id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    for key, value in reminder.model_dump().items():
        setattr(db_reminder, key, value)
        
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.patch("/{id}/status", response_model=ReminderResponse)
def update_reminder_status(id: str, status_update: ReminderUpdateStatus, db: Session = Depends(get_db)):
    db_reminder = db.query(Reminder).filter(Reminder.id == id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    db_reminder.status = status_update.status
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.delete("/{id}")
def delete_reminder(id: str, db: Session = Depends(get_db)):
    db_reminder = db.query(Reminder).filter(Reminder.id == id).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    db.delete(db_reminder)
    db.commit()
    return {"status": "success"}

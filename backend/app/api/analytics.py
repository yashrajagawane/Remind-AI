from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db

router = APIRouter()

class DashboardSummary(BaseModel):
    faces_recognized_today: int
    reminders_completed_pct: int
    missed_reminders: int
    sos_events: int

@router.get("/{patient_id}/summary", response_model=DashboardSummary)
def get_analytics_summary(patient_id: str, db: Session = Depends(get_db)):
    """
    Get KPI summary data for the Caregiver Dashboard.
    """
    # In a real scenario, this would query the DB. We return mock data for the MVP.
    return DashboardSummary(
        faces_recognized_today=12,
        reminders_completed_pct=85,
        missed_reminders=2,
        sos_events=0
    )

@router.get("/{patient_id}/recognitions")
def get_recognition_trends(patient_id: str, db: Session = Depends(get_db)):
    """
    Get recognition trend data for charts.
    """
    # Mock data for Recharts
    return [
        {"name": "Mon", "recognitions": 5},
        {"name": "Tue", "recognitions": 8},
        {"name": "Wed", "recognitions": 12},
        {"name": "Thu", "recognitions": 6},
        {"name": "Fri", "recognitions": 10},
        {"name": "Sat", "recognitions": 15},
        {"name": "Sun", "recognitions": 9},
    ]

@router.get("/{patient_id}/reminders")
def get_reminder_compliance(patient_id: str, db: Session = Depends(get_db)):
    """
    Get reminder compliance data for charts.
    """
    return [
        {"category": "Medication", "completed": 90, "missed": 10},
        {"category": "Meals", "completed": 85, "missed": 15},
        {"category": "Appointments", "completed": 100, "missed": 0},
        {"category": "Hydration", "completed": 60, "missed": 40},
    ]

import os
import uuid
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="backend/.env")

# Try to get database URL from environment, fallback to local sqlite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///backend/remind_ai.db")
print(f"Connecting to database: {DATABASE_URL}")

# Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def get_password_hash(password: str) -> str:
    # Passlib using bcrypt
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)

def seed_data():
    from app.models import User, Patient, FamilyMember, Reminder, EmergencyEvent

    caregiver_email = "demo@remind.ai"
    
    # Check if demo user already exists
    existing_user = db.query(User).filter(User.email == caregiver_email).first()
    if existing_user:
        print("Demo account already exists! Cleaning up old data...")
        db.query(EmergencyEvent).delete()
        db.query(Reminder).delete()
        db.query(FamilyMember).delete()
        db.query(Patient).delete()
        db.delete(existing_user)
        db.commit()

    print("\n--- Seeding Demo Account ---")

    # 1. Create Caregiver
    caregiver_id = str(uuid.uuid4())
    demo_caregiver = User(
        id=caregiver_id,
        email=caregiver_email,
        password_hash=get_password_hash("Demo123!"),
        name="Sarah Johnson",
        role="caregiver",
        created_at=datetime.datetime.utcnow()
    )
    db.add(demo_caregiver)
    print(f"Created Caregiver: {demo_caregiver.email} (Password: Demo123!)")

    # 2. Create Patient
    patient_id = str(uuid.uuid4())
    demo_patient = Patient(
        id=patient_id,
        caregiver_id=caregiver_id,
        name="Robert Johnson",
        dob="1942-08-15",
        medical_notes="Early-stage Alzheimer's. Mild hypertension. Allergic to Penicillin. Enjoys classical music.",
        created_at=datetime.datetime.utcnow()
    )
    db.add(demo_patient)
    print(f"Created Patient: {demo_patient.name}")

    # 3. Create Family Members (Support Network)
    family_members = [
        {"name": "Sarah Johnson", "rel": "Daughter", "phone": "+15550100"},
        {"name": "Michael Johnson", "rel": "Son", "phone": "+15550200"},
        {"name": "Emma Smith", "rel": "Granddaughter", "phone": "+15550300"},
        {"name": "Dr. Miller", "rel": "Primary Doctor", "phone": "+15550999"}
    ]
    
    for fm in family_members:
        member = FamilyMember(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            name=fm["name"],
            relationship_label=fm["rel"],
            phone=fm["phone"],
            created_at=datetime.datetime.utcnow()
        )
        db.add(member)
    print(f"Added {len(family_members)} Family Members")

    # 4. Create Reminders
    now = datetime.datetime.utcnow()
    reminders = [
        {"title": "Morning Medication (Donepezil)", "category": "medication", "time": now - datetime.timedelta(hours=2), "status": "completed"},
        {"title": "Drink a glass of water", "category": "hydration", "time": now - datetime.timedelta(minutes=30), "status": "completed"},
        {"title": "Afternoon Walk", "category": "activity", "time": now + datetime.timedelta(minutes=45), "status": "pending"},
        {"title": "Dinner time", "category": "meal", "time": now + datetime.timedelta(hours=4), "status": "pending"},
        {"title": "Evening Medication", "category": "medication", "time": now + datetime.timedelta(hours=6), "status": "pending"},
        {"title": "Doctor's Appointment", "category": "appointment", "time": now + datetime.timedelta(days=1, hours=2), "status": "pending"}
    ]
    
    for r in reminders:
        reminder = Reminder(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            created_by=caregiver_id,
            title=r["title"],
            category=r["category"],
            scheduled_at=r["time"],
            status=r["status"],
            created_at=datetime.datetime.utcnow()
        )
        db.add(reminder)
    print(f"Added {len(reminders)} Scheduled Reminders")

    # 5. Create SOS Events
    sos_events = [
        {"method": "button", "resolved": True, "time": now - datetime.timedelta(days=2)},
        {"method": "voice", "resolved": True, "time": now - datetime.timedelta(days=5)},
    ]
    
    for s in sos_events:
        sos = EmergencyEvent(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            trigger_method=s["method"],
            resolved_at=s["time"] + datetime.timedelta(minutes=15) if s["resolved"] else None,
            created_at=s["time"]
        )
        db.add(sos)
    print(f"Added {len(sos_events)} Historical SOS Events")

    # Commit all changes
    db.commit()
    print("\n[SUCCESS] Demo account successfully seeded!")
    print("--------------------------------------------------")
    print("Login Details:")
    print("Email:    demo@remind.ai")
    print("Password: Demo123!")
    print("--------------------------------------------------")

if __name__ == "__main__":
    try:
        seed_data()
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

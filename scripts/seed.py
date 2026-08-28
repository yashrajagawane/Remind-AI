"""Seed the ReMind AI database with realistic demo data.

Usage (from the repo root):
    cd backend
    python -m scripts.seed          # via module import
    # — or —
    python ../scripts/seed.py       # direct script execution

The script is **idempotent**: it checks for existing seed data (by email)
before inserting, so re-running it is safe.

Requires: the migration to have been applied first (`alembic upgrade head`).
"""

from __future__ import annotations

import random
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Ensure `backend/` is on sys.path so `app.*` imports work regardless of CWD.
# ---------------------------------------------------------------------------
_backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from app.core.database import SessionLocal  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
from app.models import (  # noqa: E402
    ActivityLog,
    EmergencyEvent,
    FaceEmbedding,
    FamilyMember,
    Notification,
    Patient,
    Recognition,
    Reminder,
    User,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


def _dummy_embedding(seed: int) -> list[float]:
    """Deterministic 128-dim dummy embedding for demo/testing purposes."""
    rng = random.Random(seed)
    return [round(rng.uniform(-1, 1), 6) for _ in range(128)]


# ---------------------------------------------------------------------------
# Seed data constants
# ---------------------------------------------------------------------------

CAREGIVER_EMAIL = "dr.sharma@remind-ai.demo"
FAMILY_EMAILS = [
    "priya.sharma@remind-ai.demo",
    "rahul.sharma@remind-ai.demo",
    "meera.deshpande@remind-ai.demo",
]

SEED_PASSWORD = "Demo@12345"  # bcrypt-hashed below; never used in production


def seed() -> None:
    """Insert demo data into all 9 tables."""
    db = SessionLocal()
    try:
        # Check idempotency — skip if already seeded
        existing = db.query(User).filter_by(email=CAREGIVER_EMAIL).first()
        if existing:
            print("[OK] Seed data already present — skipping. (Delete the DB to re-seed.)")
            return

        now = _utcnow()
        hashed_pw = get_password_hash(SEED_PASSWORD)

        # ── 1. Users ─────────────────────────────────────────────────────
        caregiver = User(
            id=_uuid(),
            email=CAREGIVER_EMAIL,
            password_hash=hashed_pw,
            role="caregiver",
            name="Dr. Anand Sharma",
            phone="+91-9876543210",
            created_at=now,
            updated_at=now,
        )

        patient_user = User(
            id=_uuid(),
            email="sarah.jenkins@remind-ai.demo",
            password_hash=hashed_pw,
            role="patient",
            name="Sarah Jenkins",
            phone="+91-9123456789",
            created_at=now,
            updated_at=now,
        )

        family_users = [
            User(
                id=_uuid(),
                email=FAMILY_EMAILS[0],
                password_hash=hashed_pw,
                role="family_member",
                name="Priya Sharma",
                phone="+91-9988776655",
                created_at=now,
                updated_at=now,
            ),
            User(
                id=_uuid(),
                email=FAMILY_EMAILS[1],
                password_hash=hashed_pw,
                role="family_member",
                name="Rahul Sharma",
                phone="+91-9876001122",
                created_at=now,
                updated_at=now,
            ),
            User(
                id=_uuid(),
                email=FAMILY_EMAILS[2],
                password_hash=hashed_pw,
                role="family_member",
                name="Meera Deshpande",
                phone="+91-9090909090",
                created_at=now,
                updated_at=now,
            ),
        ]

        admin_user = User(
            id=_uuid(),
            email="admin@remind-ai.demo",
            password_hash=hashed_pw,
            role="admin",
            name="System Admin",
            created_at=now,
            updated_at=now,
        )

        all_users = [caregiver, patient_user, *family_users, admin_user]
        db.add_all(all_users)
        db.flush()
        print(f"  [+] Created {len(all_users)} users")

        # ── 2. Patient ───────────────────────────────────────────────────
        patient = Patient(
            id=_uuid(),
            user_id=patient_user.id,
            caregiver_id=caregiver.id,
            name="Sarah Jenkins",
            dob="1955-03-15",
            medical_notes=(
                "Mild-to-moderate Alzheimer's (diagnosed 2023). "
                "Responds well to familiar faces and gentle prompts. "
                "Allergic to penicillin. Vegetarian diet preferred."
            ),
            created_at=now,
            updated_at=now,
        )
        db.add(patient)
        db.flush()
        print("  [+] Created patient: Sarah Jenkins")

        # ── 3. Family Members ────────────────────────────────────────────
        family_data = [
            ("Priya Sharma", "Daughter", family_users[0], "+91-9988776655"),
            ("Rahul Sharma", "Son", family_users[1], "+91-9876001122"),
            ("Meera Deshpande", "Neighbour", family_users[2], "+91-9090909090"),
            ("Dr. Anand Sharma", "Doctor", None, "+91-9876543210"),
            ("Sunita Jenkins", "Daughter-in-law", None, "+91-8877665544"),
        ]

        family_members: list[FamilyMember] = []
        for name, rel, user, phone in family_data:
            fm = FamilyMember(
                id=_uuid(),
                patient_id=patient.id,
                user_id=user.id if user else None,
                name=name,
                relationship_label=rel,
                phone=phone,
                created_at=now,
                updated_at=now,
            )
            family_members.append(fm)

        db.add_all(family_members)
        db.flush()
        print(f"  [+] Created {len(family_members)} family members")

        # ── 4. Face Embeddings (dummy 128-d vectors) ─────────────────────
        embeddings: list[FaceEmbedding] = []
        for idx, fm in enumerate(family_members):
            # 2 embeddings per person for robustness
            for photo_idx in range(2):
                emb = FaceEmbedding(
                    id=_uuid(),
                    family_member_id=fm.id,
                    embedding=_dummy_embedding(idx * 100 + photo_idx),
                    photo_url=f"https://ui-avatars.com/api/?name={fm.name.replace(' ', '+')}&size=256&background=random",
                    created_at=now,
                    updated_at=now,
                )
                embeddings.append(emb)

        db.add_all(embeddings)
        db.flush()
        print(f"  [+] Created {len(embeddings)} face embeddings")

        # ── 5. Reminders ─────────────────────────────────────────────────
        tomorrow = now + timedelta(days=1)
        reminders_data = [
            ("medication", "Morning Medicine", "Take Donepezil 10mg with water", "critical", "daily",
             now.replace(hour=8, minute=0, second=0), "completed"),
            ("medication", "Evening Medicine", "Take Memantine 5mg after dinner", "critical", "daily",
             now.replace(hour=20, minute=0, second=0), "upcoming"),
            ("meal", "Breakfast", "Oatmeal with fruits — in the kitchen", "high", "daily",
             now.replace(hour=9, minute=0, second=0), "completed"),
            ("meal", "Lunch", "Vegetable khichdi — Priya will bring it", "normal", "daily",
             now.replace(hour=13, minute=0, second=0), "upcoming"),
            ("hydration", "Drink Water", "Have a glass of water — stay hydrated!", "normal", "daily",
             now.replace(hour=11, minute=0, second=0), "snoozed"),
            ("appointment", "Doctor Visit", "Visit Dr. Sharma at City Hospital", "high", "none",
             tomorrow.replace(hour=10, minute=30, second=0), "upcoming"),
            ("activity", "Evening Walk", "Take a walk in the garden with Rahul", "low", "daily",
             now.replace(hour=17, minute=0, second=0), "upcoming"),
            ("other", "Call Meera", "Meera said she'll call at 4 PM", "normal", "none",
             now.replace(hour=16, minute=0, second=0), "missed"),
        ]

        reminders: list[Reminder] = []
        for cat, title, desc, priority, recurrence, sched, status in reminders_data:
            rem = Reminder(
                id=_uuid(),
                patient_id=patient.id,
                created_by=caregiver.id,
                category=cat,
                title=title,
                description=desc,
                priority=priority,
                recurrence=recurrence,
                scheduled_at=sched,
                status=status,
                created_at=now,
                updated_at=now,
            )
            reminders.append(rem)

        db.add_all(reminders)
        db.flush()
        print(f"  [+] Created {len(reminders)} reminders")

        # ── 6. Recognitions ──────────────────────────────────────────────
        recognitions_data = [
            (family_members[0], 0.94, False),   # Priya — high confidence
            (family_members[1], 0.87, False),   # Rahul — good match
            (family_members[3], 0.72, False),   # Dr. Sharma — medium
            (None, 0.31, True),                  # Unknown person
            (family_members[0], 0.96, False),   # Priya again
            (family_members[2], 0.82, False),   # Meera
        ]

        recognitions: list[Recognition] = []
        for idx, (member, conf, is_unk) in enumerate(recognitions_data):
            rec = Recognition(
                id=_uuid(),
                patient_id=patient.id,
                matched_member_id=member.id if member else None,
                confidence=conf,
                is_unknown=is_unk,
                image_url=None,
                created_at=now - timedelta(hours=len(recognitions_data) - idx),
                updated_at=now - timedelta(hours=len(recognitions_data) - idx),
            )
            recognitions.append(rec)

        db.add_all(recognitions)
        db.flush()
        print(f"  [+] Created {len(recognitions)} recognition events")

        # ── 7. Emergency Events ──────────────────────────────────────────
        sos_resolved = EmergencyEvent(
            id=_uuid(),
            patient_id=patient.id,
            trigger_method="button",
            contacts_notified=3,
            resolved_at=now - timedelta(days=2, hours=1),
            created_at=now - timedelta(days=2, hours=2),
            updated_at=now - timedelta(days=2, hours=1),
        )
        sos_unresolved = EmergencyEvent(
            id=_uuid(),
            patient_id=patient.id,
            trigger_method="voice",
            contacts_notified=3,
            resolved_at=None,
            created_at=now - timedelta(hours=5),
            updated_at=now - timedelta(hours=5),
        )
        db.add_all([sos_resolved, sos_unresolved])
        db.flush()
        print("  [+] Created 2 emergency events (1 resolved, 1 open)")

        # ── 8. Activity Logs ─────────────────────────────────────────────
        log_entries = [
            ("patient.created", {"patient_name": "Sarah Jenkins", "by": caregiver.name}),
            ("face.registered", {"family_member": "Priya Sharma", "photos": 2}),
            ("face.recognized", {"match": "Priya Sharma", "confidence": 0.94}),
            ("reminder.completed", {"title": "Morning Medicine", "category": "medication"}),
            ("reminder.missed", {"title": "Call Meera", "category": "other"}),
            ("sos.triggered", {"method": "button", "contacts_notified": 3}),
            ("sos.resolved", {"resolved_by": caregiver.name}),
            ("face.recognized", {"match": "Unknown Person", "confidence": 0.31, "is_unknown": True}),
        ]

        logs: list[ActivityLog] = []
        for idx, (action, detail) in enumerate(log_entries):
            log = ActivityLog(
                id=_uuid(),
                patient_id=patient.id,
                action_type=action,
                detail=detail,
                created_at=now - timedelta(hours=len(log_entries) - idx),
                updated_at=now - timedelta(hours=len(log_entries) - idx),
            )
            logs.append(log)

        db.add_all(logs)
        db.flush()
        print(f"  [+] Created {len(logs)} activity logs")

        # ── 9. Notifications ─────────────────────────────────────────────
        notifications_data = [
            (caregiver.id, "sos", "[SOS] Emergency SOS triggered for Sarah Jenkins!", None),
            (caregiver.id, "missed_medication", "[!] Sarah missed 'Call Meera' reminder.", None),
            (caregiver.id, "recognition", "[!] Unknown person detected near Sarah.", None),
            (caregiver.id, "system", "[i] Welcome to ReMind AI! Your account is set up.", now - timedelta(days=5)),
            (family_users[0].id, "sos", "[SOS] Emergency alert for Sarah Jenkins!", None),
            (family_users[0].id, "reminder", "[i] Sarah completed 'Morning Medicine'.", now - timedelta(hours=3)),
            (family_users[1].id, "sos", "[SOS] Emergency alert for Sarah Jenkins!", None),
        ]

        notifications: list[Notification] = []
        for idx, (uid, ntype, msg, read) in enumerate(notifications_data):
            notif = Notification(
                id=_uuid(),
                user_id=uid,
                type=ntype,
                message=msg,
                read_at=read,
                created_at=now - timedelta(hours=len(notifications_data) - idx),
                updated_at=now - timedelta(hours=len(notifications_data) - idx),
            )
            notifications.append(notif)

        db.add_all(notifications)
        db.flush()
        print(f"  [+] Created {len(notifications)} notifications")

        # ── Commit ────────────────────────────────────────────────────────
        db.commit()
        print("\n[SUCCESS] Seed complete! Database populated with demo data.")
        print(f"    Login credentials: any seeded email / {SEED_PASSWORD}")
        print(f"    Caregiver: {CAREGIVER_EMAIL}")
        print(f"    Patient:   sarah.jenkins@remind-ai.demo")
        print(f"    Family:    {', '.join(FAMILY_EMAILS)}")
        print(f"    Admin:     admin@remind-ai.demo")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

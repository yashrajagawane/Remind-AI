"""
ReMind AI — Face Recognition API (Phase 4)

Endpoints:
  POST /faces/register        — Upload a photo → generate embedding → store in DB
  POST /faces/recognize       — Upload a photo → rank top-3 matches → log event
  GET  /faces/{member_id}     — List all embeddings for a family member
  DELETE /faces/{embedding_id} — Remove an embedding
"""
from __future__ import annotations

import time
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.ai.face_engine import (
    confidence_label,
    generate_embedding_from_bytes,
    rank_matches,
)
from app.core.database import get_db
from app.models.recognition import Recognition
from app.models.user import FaceEmbedding, FamilyMember, Patient, User
from app.schemas.common import success
from app.api.deps import RoleChecker, get_current_user

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

class MatchResult(BaseModel):
    rank: int
    member_id: str
    name: str
    relationship: str
    confidence_score: float
    confidence_label: str
    photo_url: Optional[str]


class RecognizeResponse(BaseModel):
    matched: bool
    results: List[MatchResult]
    elapsed_ms: float


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _file_suffix(filename: Optional[str]) -> str:
    if filename and "." in filename:
        return "." + filename.rsplit(".", 1)[-1].lower()
    return ".jpg"


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/register")
async def register_face(
    family_member_id: str = Form(...),
    photo_url: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"])),
):
    """
    Upload a photo and store a face embedding for a family member.
    Multiple embeddings per member are supported (angle diversity improves accuracy).
    """
    member = db.query(FamilyMember).filter(FamilyMember.id == family_member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")

    # Authorisation: caregiver must own the patient
    patient = db.query(Patient).filter(Patient.id == member.patient_id).first()
    if current_user.role == "caregiver" and (not patient or patient.caregiver_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    embedding = generate_embedding_from_bytes(raw, suffix=_file_suffix(file.filename))
    if not embedding:
        raise HTTPException(
            status_code=422,
            detail="No face detected in the uploaded image. "
                   "Please upload a clear, front-facing photo.",
        )

    db_emb = FaceEmbedding(
        id=str(uuid.uuid4()),
        family_member_id=family_member_id,
        embedding=embedding,
        photo_url=photo_url,
    )
    db.add(db_emb)
    db.commit()
    db.refresh(db_emb)

    return success({
        "embedding_id": db_emb.id,
        "family_member_id": family_member_id,
        "dimensions": len(embedding),
    })


@router.post("/recognize")
async def recognize_face(
    patient_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin", "patient"])),
):
    """
    Submit an image; return up to 3 ranked matches and log the recognition event.
    Performance target: < 2 s per request.
    """
    t0 = time.perf_counter()

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")

    target_emb = generate_embedding_from_bytes(raw, suffix=_file_suffix(file.filename))
    if not target_emb:
        raise HTTPException(
            status_code=422,
            detail="No face detected in the uploaded image.",
        )

    # Load all known embeddings for this patient's family members
    family_ids = [
        row.id
        for row in db.query(FamilyMember).filter(FamilyMember.patient_id == patient_id).all()
    ]
    all_embs = (
        db.query(FaceEmbedding)
        .filter(FaceEmbedding.family_member_id.in_(family_ids))
        .all()
    ) if family_ids else []

    known = [(e.family_member_id, e.embedding) for e in all_embs if e.embedding]

    # Rank top-3 matches
    ranked = rank_matches(target_emb, known, threshold=0.65, top_k=3)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    results: List[MatchResult] = []
    matched = bool(ranked)

    # Build deduplicated result list (multiple embeddings may map to the same member)
    seen_members: set[str] = set()
    rank_idx = 1
    for member_id, sim in ranked:
        if member_id in seen_members:
            continue
        seen_members.add(member_id)
        member = db.query(FamilyMember).filter(FamilyMember.id == member_id).first()
        if not member:
            continue
        results.append(MatchResult(
            rank=rank_idx,
            member_id=member_id,
            name=member.name,
            relationship=member.relationship_label,
            confidence_score=round(sim, 4),
            confidence_label=confidence_label(sim),
            photo_url=getattr(member, "photo_url", None),
        ))
        rank_idx += 1

    # Log recognition event
    best_member_id = results[0].member_id if results else None
    best_confidence = results[0].confidence_score if results else 0.0
    event = Recognition(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        matched_member_id=best_member_id,
        confidence=best_confidence,
        is_unknown=not matched,
    )
    db.add(event)
    db.commit()

    return success({
        "matched": matched,
        "results": [r.model_dump() for r in results],
        "unknown": not matched,
        "elapsed_ms": round(elapsed_ms, 1),
    })


@router.get("/{member_id}")
def list_embeddings(
    member_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"])),
):
    """List all stored embeddings for a family member."""
    member = db.query(FamilyMember).filter(FamilyMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")

    patient = db.query(Patient).filter(Patient.id == member.patient_id).first()
    if current_user.role == "caregiver" and (not patient or patient.caregiver_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    embeddings = db.query(FaceEmbedding).filter(
        FaceEmbedding.family_member_id == member_id
    ).all()

    return success([
        {
            "embedding_id": e.id,
            "family_member_id": e.family_member_id,
            "photo_url": e.photo_url,
            "dimensions": len(e.embedding) if e.embedding else 0,
        }
        for e in embeddings
    ])


@router.delete("/{embedding_id}")
def delete_embedding(
    embedding_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["caregiver", "admin"])),
):
    """Remove a face embedding (e.g. stale / bad-quality photo)."""
    emb = db.query(FaceEmbedding).filter(FaceEmbedding.id == embedding_id).first()
    if not emb:
        raise HTTPException(status_code=404, detail="Embedding not found")

    member = db.query(FamilyMember).filter(FamilyMember.id == emb.family_member_id).first()
    if member:
        patient = db.query(Patient).filter(Patient.id == member.patient_id).first()
        if current_user.role == "caregiver" and (not patient or patient.caregiver_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(emb)
    db.commit()
    return success({"detail": "Embedding deleted"})

import os
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.ai.face_engine import find_best_match, generate_embedding
from app.core.database import get_db
from app.models.user import FaceEmbedding, FamilyMember

router = APIRouter()


class FaceMatchResult(BaseModel):
    name: str
    relationship: str
    confidence: str
    last_interaction: str


@router.post("/register")
async def register_face(
    family_member_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)
):
    """
    Upload a photo and generate a face embedding.
    """
    member = db.query(FamilyMember).filter(FamilyMember.id == family_member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")

    # Save file temporarily to generate embedding
    temp_file = f"temp_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    embedding = generate_embedding(temp_file)

    # Cleanup
    if os.path.exists(temp_file):
        os.remove(temp_file)

    if not embedding:
        raise HTTPException(status_code=400, detail="Could not detect face or generate embedding")

    db_emb = FaceEmbedding(
        family_member_id=family_member_id,
        embedding=embedding,
        photo_url=None,  # Will integrate Cloudinary later
    )
    db.add(db_emb)
    db.commit()
    db.refresh(db_emb)

    return {"status": "success", "embedding_id": db_emb.id}


@router.post("/recognize", response_model=list[FaceMatchResult])
async def recognize_face(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Submit an image and return top matches.
    """
    temp_file = f"temp_rec_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    target_emb = generate_embedding(temp_file)

    if os.path.exists(temp_file):
        os.remove(temp_file)

    if not target_emb:
        raise HTTPException(status_code=400, detail="No face detected in the image")

    # Fetch all embeddings
    all_embs = db.query(FaceEmbedding).all()
    known_embeddings = [(e.family_member_id, e.embedding) for e in all_embs if e.embedding]

    matched_id, confidence = find_best_match(target_emb, known_embeddings, threshold=0.6)

    if matched_id:
        member = db.query(FamilyMember).filter(FamilyMember.id == matched_id).first()
        if member:
            # Map confidence to string
            conf_str = "High" if confidence > 0.8 else ("Medium" if confidence > 0.65 else "Low")
            return [
                FaceMatchResult(
                    name=member.name,
                    relationship=member.relationship,
                    confidence=conf_str,
                    last_interaction="Today",
                )
            ]

    # Return Unknown Person if no match
    return [
        FaceMatchResult(
            name="Unknown Person", relationship="", confidence="Low", last_interaction="Never"
        )
    ]

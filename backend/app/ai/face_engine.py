"""
ReMind AI — Face Recognition Engine (Phase 4)

Strategy:
  - DeepFace + FaceNet512 (512-d) when DeepFace is installed (production).
  - Pure-NumPy deterministic dummy embeddings when DeepFace is absent (CI / local dev).

The engine is stateless — all state lives in the DB.
"""
from __future__ import annotations

import logging
import math
from typing import List, Optional, Tuple

import numpy as np

logger = logging.getLogger("remind.ai")

# ──────────────────────────────────────────────────────────────────────────────
# DeepFace availability guard
# ──────────────────────────────────────────────────────────────────────────────
try:
    from deepface import DeepFace  # type: ignore

    DEEPFACE_AVAILABLE = True
    EMBEDDING_DIM = 512  # FaceNet512 output
    logger.info("DeepFace loaded — using FaceNet512 model")
except ImportError:
    DEEPFACE_AVAILABLE = False
    EMBEDDING_DIM = 128  # dummy fallback dim
    logger.warning("DeepFace not installed — using dummy embedding generator (OK for dev/CI)")


# ──────────────────────────────────────────────────────────────────────────────
# Core functions
# ──────────────────────────────────────────────────────────────────────────────

def generate_embedding(img_path: str) -> List[float]:
    """
    Generate a face embedding from an image file path.

    Returns a list[float] (512-d with DeepFace, 128-d dummy otherwise).
    Returns an empty list if no face is detected.
    """
    if DEEPFACE_AVAILABLE:
        try:
            objs = DeepFace.represent(
                img_path=img_path,
                model_name="Facenet512",
                detector_backend="retinaface",
                enforce_detection=True,
            )
            if objs:
                return objs[0]["embedding"]
            return []
        except Exception as exc:
            # If face detection fails with enforce_detection=True, retry leniently
            try:
                objs = DeepFace.represent(
                    img_path=img_path,
                    model_name="Facenet512",
                    detector_backend="opencv",
                    enforce_detection=False,
                )
                if objs:
                    return objs[0]["embedding"]
            except Exception:
                pass
            logger.warning("Embedding generation failed for %s: %s", img_path, exc)
            return []
    else:
        # Deterministic dummy — same seed → same vector for the same path
        rng = np.random.default_rng(seed=abs(hash(img_path)) % (2**32))
        vec = rng.standard_normal(EMBEDDING_DIM)
        # Normalise to unit sphere so cosine sim works correctly
        norm = np.linalg.norm(vec)
        return (vec / norm).tolist() if norm > 0 else vec.tolist()


def generate_embedding_from_bytes(image_bytes: bytes, suffix: str = ".jpg") -> List[float]:
    """
    Generate an embedding directly from raw bytes (avoids temp files leaking on error).
    Writes to a BytesIO-backed temp path if needed, then cleans up.
    """
    import tempfile, os

    tmp = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(image_bytes)
            tmp = f.name
        return generate_embedding(tmp)
    finally:
        if tmp and os.path.exists(tmp):
            os.remove(tmp)


# ──────────────────────────────────────────────────────────────────────────────
# Similarity & matching
# ──────────────────────────────────────────────────────────────────────────────

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Cosine similarity in [−1, 1]. Returns 0 on zero/mismatched vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    a = np.array(v1, dtype=np.float64)
    b = np.array(v2, dtype=np.float64)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return float(np.dot(a, b) / denom) if denom > 0 else 0.0


def rank_matches(
    target: List[float],
    known: List[Tuple[str, List[float]]],  # [(family_member_id, embedding), ...]
    threshold: float = 0.65,
    top_k: int = 3,
) -> List[Tuple[str, float]]:
    """
    Return up to top_k (member_id, similarity) tuples above threshold,
    sorted descending by similarity.
    """
    scores: List[Tuple[str, float]] = []
    for member_id, emb in known:
        if not emb:
            continue
        sim = cosine_similarity(target, emb)
        if sim >= threshold:
            scores.append((member_id, sim))
    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[:top_k]


def find_best_match(
    target_embedding: List[float],
    known_embeddings: List[Tuple[str, List[float]]],
    threshold: float = 0.65,
) -> Tuple[Optional[str], float]:
    """Backwards-compatible helper — returns (best_member_id, similarity)."""
    ranked = rank_matches(target_embedding, known_embeddings, threshold, top_k=1)
    if ranked:
        return ranked[0]
    return None, 0.0


def confidence_label(similarity: float) -> str:
    """Map a float similarity to a human-readable label."""
    if similarity >= 0.85:
        return "High"
    if similarity >= 0.70:
        return "Medium"
    return "Low"

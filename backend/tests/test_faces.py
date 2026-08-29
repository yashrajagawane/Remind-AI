"""
Phase 4 tests — Face Recognition Engine

Tests run with a mocked embedding function so they work without GPU or real face images.
They verify:
  1. Embedding registration per family member
  2. Recognition returns a match when embeddings are stored  
  3. Recognition returns unknown when no embeddings exist
  4. Listing and deleting embeddings
  5. Performance: recognize endpoint responds in < 2 s with 10 embeddings
"""
import io
import time
import numpy as np
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, Patient, FamilyMember, FaceEmbedding
from app.models.recognition import Recognition

client = TestClient(app)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_emb(seed: int, dim: int = 128) -> list[float]:
    """Deterministic normalised random embedding."""
    rng = np.random.default_rng(seed=seed)
    v = rng.standard_normal(dim)
    return (v / np.linalg.norm(v)).tolist()


def _fake_file() -> io.BytesIO:
    return io.BytesIO(b"fake-image-bytes")


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def setup():
    """Create a caregiver, one patient, and one family member. Tear down after module."""
    client.post(
        "/api/v1/auth/register",
        json={"email": "face_cg@example.com", "password": "pwd", "name": "FaceCG", "role": "caregiver"},
    )
    login = client.post("/api/v1/auth/login", data={"username": "face_cg@example.com", "password": "pwd"})
    token = login.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    p = client.post(
        "/api/v1/patients/",
        json={"name": "Face Patient", "dob": "1945-06-01", "medical_notes": ""},
        headers=headers,
    )
    patient_id = p.json()["data"]["id"]

    m = client.post(
        "/api/v1/family/",
        data={"patient_id": patient_id, "name": "Alice", "relationship": "Daughter"},
        headers=headers,
    )
    member_id = m.json()["data"]["id"]

    yield {"headers": headers, "patient_id": patient_id, "member_id": member_id}

    db = SessionLocal()
    try:
        db.query(FaceEmbedding).filter(FaceEmbedding.family_member_id == member_id).delete()
        db.query(Recognition).filter(Recognition.patient_id == patient_id).delete()
        fm = db.query(FamilyMember).filter(FamilyMember.id == member_id).first()
        if fm:
            db.delete(fm)
        pat = db.query(Patient).filter(Patient.id == patient_id).first()
        if pat:
            db.delete(pat)
        user = db.query(User).filter(User.email == "face_cg@example.com").first()
        if user:
            db.delete(user)
        db.commit()
    finally:
        db.close()


# ── Tests ─────────────────────────────────────────────────────────────────────

MOCK_EMB = _make_emb(42)
MOCK_TARGET = "app.api.faces.generate_embedding_from_bytes"


def test_register_face(setup):
    headers = setup["headers"]
    member_id = setup["member_id"]

    with patch(MOCK_TARGET, return_value=MOCK_EMB):
        res = client.post(
            "/api/v1/faces/register",
            data={"family_member_id": member_id},
            files={"file": ("face.jpg", _fake_file(), "image/jpeg")},
            headers=headers,
        )
    assert res.status_code == 200, res.text
    data = res.json()["data"]
    assert "embedding_id" in data
    assert data["dimensions"] == len(MOCK_EMB)


def test_list_embeddings(setup):
    headers = setup["headers"]
    member_id = setup["member_id"]

    res = client.get(f"/api/v1/faces/{member_id}", headers=headers)
    assert res.status_code == 200
    assert len(res.json()["data"]) >= 1


def test_recognize_returns_match(setup):
    """Seed a known embedding then recognize with the same vector → must match Alice."""
    headers = setup["headers"]
    patient_id = setup["patient_id"]
    member_id = setup["member_id"]

    known_emb = _make_emb(99)
    db = SessionLocal()
    try:
        fe = FaceEmbedding(id="test-emb-known", family_member_id=member_id, embedding=known_emb)
        db.add(fe)
        db.commit()
    finally:
        db.close()

    t0 = time.perf_counter()
    with patch(MOCK_TARGET, return_value=known_emb):
        res = client.post(
            "/api/v1/faces/recognize",
            data={"patient_id": patient_id},
            files={"file": ("probe.jpg", _fake_file(), "image/jpeg")},
            headers=headers,
        )
    elapsed_ms = (time.perf_counter() - t0) * 1000

    assert res.status_code == 200, res.text
    payload = res.json()["data"]
    assert payload["matched"] is True
    assert payload["results"][0]["name"] == "Alice"
    assert elapsed_ms < 2000, f"recognize took {elapsed_ms:.0f} ms (limit: 2000)"

    db = SessionLocal()
    try:
        db.query(FaceEmbedding).filter(FaceEmbedding.id == "test-emb-known").delete()
        db.commit()
    finally:
        db.close()


def test_recognize_unknown(setup):
    """With no matching embeddings, recognition must return unknown."""
    headers = setup["headers"]
    patient_id = setup["patient_id"]
    member_id = setup["member_id"]

    # Wipe stored embeddings
    db = SessionLocal()
    try:
        db.query(FaceEmbedding).filter(FaceEmbedding.family_member_id == member_id).delete()
        db.commit()
    finally:
        db.close()

    # Use a completely different vector → similarity will be low → unknown
    probe_emb = _make_emb(77777)
    stored_emb = _make_emb(99999)

    db = SessionLocal()
    try:
        db.add(FaceEmbedding(id="test-unknown-emb", family_member_id=member_id, embedding=stored_emb))
        db.commit()
    finally:
        db.close()

    with patch(MOCK_TARGET, return_value=probe_emb):
        res = client.post(
            "/api/v1/faces/recognize",
            data={"patient_id": patient_id},
            files={"file": ("probe.jpg", _fake_file(), "image/jpeg")},
            headers=headers,
        )
    assert res.status_code == 200, res.text
    payload = res.json()["data"]
    assert payload["matched"] is False
    assert payload["unknown"] is True


def test_register_10_embeddings_performance(setup):
    """Register 10 embeddings and verify recognize < 2 s."""
    headers = setup["headers"]
    member_id = setup["member_id"]
    patient_id = setup["patient_id"]

    # Clear first
    db = SessionLocal()
    try:
        db.query(FaceEmbedding).filter(FaceEmbedding.family_member_id == member_id).delete()
        db.commit()
    finally:
        db.close()

    for i in range(10):
        with patch(MOCK_TARGET, return_value=_make_emb(i + 100)):
            client.post(
                "/api/v1/faces/register",
                data={"family_member_id": member_id},
                files={"file": ("face.jpg", _fake_file(), "image/jpeg")},
                headers=headers,
            )

    probe = _make_emb(101)
    t0 = time.perf_counter()
    with patch(MOCK_TARGET, return_value=probe):
        res = client.post(
            "/api/v1/faces/recognize",
            data={"patient_id": patient_id},
            files={"file": ("probe.jpg", _fake_file(), "image/jpeg")},
            headers=headers,
        )
    elapsed_ms = (time.perf_counter() - t0) * 1000

    assert res.status_code == 200, res.text
    assert elapsed_ms < 2000, f"recognize with 10 embeddings took {elapsed_ms:.0f} ms"


def test_delete_embedding(setup):
    headers = setup["headers"]
    member_id = setup["member_id"]

    res = client.get(f"/api/v1/faces/{member_id}", headers=headers)
    embs = res.json()["data"]
    assert len(embs) > 0
    emb_id = embs[0]["embedding_id"]

    del_res = client.delete(f"/api/v1/faces/{emb_id}", headers=headers)
    assert del_res.status_code == 200

    res2 = client.get(f"/api/v1/faces/{member_id}", headers=headers)
    remaining_ids = [e["embedding_id"] for e in res2.json()["data"]]
    assert emb_id not in remaining_ids

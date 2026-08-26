import math
import numpy as np
from typing import List, Tuple

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    print("WARNING: DeepFace is not installed. Using dummy embedding generator for local testing.")

def generate_embedding(img_path_or_base64: str) -> List[float]:
    """
    Generates a 128-dimensional FaceNet embedding.
    """
    if DEEPFACE_AVAILABLE:
        try:
            # DeepFace returns a list of dictionaries if multiple faces are detected,
            # we just take the first one or assume single face for simplicity.
            objs = DeepFace.represent(img_path=img_path_or_base64, model_name="Facenet", enforce_detection=False)
            if objs and len(objs) > 0:
                return objs[0]["embedding"]
            return []
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return []
    else:
        # Dummy 128-d vector
        np.random.seed(len(img_path_or_base64))
        return np.random.rand(128).tolist()

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """
    Computes cosine similarity between two vectors.
    """
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    
    dot_product = sum(a * b for a, b in zip(v1, v2))
    magnitude_v1 = math.sqrt(sum(a * a for a in v1))
    magnitude_v2 = math.sqrt(sum(b * b for b in v2))
    
    if magnitude_v1 == 0 or magnitude_v2 == 0:
        return 0.0
    
    return dot_product / (magnitude_v1 * magnitude_v2)

def find_best_match(target_embedding: List[float], known_embeddings: List[Tuple[str, List[float]]], threshold: float = 0.6) -> Tuple[str, float]:
    """
    Finds the best match from a list of known embeddings.
    Returns (matched_id, confidence) or (None, 0.0) if no match above threshold.
    """
    best_match = None
    best_similarity = -1.0
    
    for member_id, emb in known_embeddings:
        sim = cosine_similarity(target_embedding, emb)
        if sim > best_similarity:
            best_similarity = sim
            best_match = member_id
            
    if best_similarity >= threshold:
        return best_match, best_similarity
    
    return None, best_similarity

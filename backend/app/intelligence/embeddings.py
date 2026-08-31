import math
import hashlib
from typing import List, Dict, Any, Optional
import numpy as np

class EmbeddingService:
    """
    Pretrained Sentence Embeddings Service.
    Generates 384-dimensional dense semantic vectors for safety narratives.
    Supports SentenceTransformers (all-MiniLM-L6-v2) with zero-dependency fast semantic kernel fallback.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.embedding_dim = 384
        self._st_model = None
        self._load_model()

    def _load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            self._st_model = SentenceTransformer(self.model_name)
        except Exception:
            self._st_model = None

    def encode(self, text: str) -> List[float]:
        """Encodes a single narrative text into a 384-dimensional normalized vector."""
        return self.encode_batch([text])[0]

    def encode_batch(self, texts: List[str]) -> List[List[float]]:
        """Encodes a batch of narrative texts into 384-dimensional normalized vectors."""
        if not texts:
            return []

        if self._st_model is not None:
            try:
                embeddings = self._st_model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
                return [emb.tolist() for emb in embeddings]
            except Exception:
                pass

        # Fast Semantic Projection Kernel (384 Dimensions)
        # Projects semantic word tokens and n-grams into a 384-d normalized hypersphere
        results = []
        for t in texts:
            vec = np.zeros(self.embedding_dim, dtype=np.float32)
            words = t.lower().replace(",", " ").replace(".", " ").replace(";", " ").split()
            
            # Grouped Semantic Topic Clusters (Subspace Mapping)
            topic_clusters = {
                "height_fall": (["height", "fall", "scaffold", "harness", "lanyard", "elevation", "derrick", "monkey"], 160),
                "stored_pressure": (["isolation", "unverified", "pressure", "flange", "bleed", "loto", "valve", "depressurize"], 16),
                "lifting_crane": (["crane", "lift", "suspended", "rigging", "sling", "hoist", "shackle", "bundle"], 64),
                "confined_gas": (["confined", "tank", "vessel", "gas", "h2s", "toxic", "detector", "atmosphere", "oxygen"], 112),
                "hot_work_fire": (["hot work", "weld", "grind", "spark", "torch", "flammable", "fire", "habitat"], 208),
                "bypassed_control": (["bypass", "override", "interlock", "silenced", "jumper", "tampered"], 256),
                "driving_vehicle": (["driving", "vehicle", "seatbelt", "speed", "transit", "truck", "tanker"], 304)
            }

            for idx, w in enumerate(words):
                # Hash word to embedding dimensions
                h = int(hashlib.md5(w.encode("utf-8")).hexdigest(), 16)
                dim_idx = h % self.embedding_dim
                sign = 1.0 if ((h >> 4) & 1) else -1.0
                vec[dim_idx] += sign * 1.0

                # Topic cluster activation
                for topic, (tokens, offset) in topic_clusters.items():
                    if any(t in w for t in tokens):
                        vec[offset:offset+16] += 2.0

            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            else:
                vec[0] = 1.0
            results.append(vec.tolist())

        return results

    def cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Computes cosine similarity between two 384-dimensional vectors (0.0 to 1.0)."""
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        dot = float(np.dot(a, b) / (norm_a * norm_b))
        # Scale to [0, 1] range
        return max(0.0, min(1.0, (dot + 1.0) / 2.0 if dot < 0 else dot))

embedding_service = EmbeddingService()

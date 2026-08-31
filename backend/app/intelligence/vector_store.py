from typing import List, Dict, Any, Optional, Tuple
import numpy as np

class InMemoryVectorStore:
    """
    High-performance in-memory Cosine Vector Index for semantic similarity search.
    Provides sub-millisecond retrieval with metadata filtering.
    """

    def __init__(self):
        self.doc_ids: List[str] = []
        self.vectors: Optional[np.ndarray] = None
        self.metadata: List[Dict[str, Any]] = []

    def clear(self):
        self.doc_ids = []
        self.vectors = None
        self.metadata = []

    def add_documents(self, doc_ids: List[str], embeddings: List[List[float]], metadata: List[Dict[str, Any]]):
        """Adds a batch of document vectors and metadata to the index."""
        if not doc_ids:
            return

        new_vecs = np.array(embeddings, dtype=np.float32)
        # Normalize vectors for fast dot product cosine similarity
        norms = np.linalg.norm(new_vecs, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        new_vecs = new_vecs / norms

        if self.vectors is None or len(self.doc_ids) == 0:
            self.doc_ids = list(doc_ids)
            self.vectors = new_vecs
            self.metadata = list(metadata)
        else:
            self.doc_ids.extend(doc_ids)
            self.vectors = np.vstack([self.vectors, new_vecs])
            self.metadata.extend(metadata)

    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        exclude_id: Optional[str] = None,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes Cosine Similarity search returning top_k nearest neighbors with metadata.
        """
        if self.vectors is None or len(self.doc_ids) == 0:
            return []

        q_vec = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []
        q_vec = q_vec / q_norm

        # Vectorized dot product for cosine similarity
        similarities = np.dot(self.vectors, q_vec)

        # Sort descending
        ranked_indices = np.argsort(similarities)[::-1]
        results = []

        for idx in ranked_indices:
            doc_id = self.doc_ids[idx]
            if exclude_id and doc_id == exclude_id:
                continue

            meta = self.metadata[idx]
            # Apply metadata filters if provided
            if filter_dict:
                match = True
                for k, v in filter_dict.items():
                    if meta.get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            sim_score = float(similarities[idx])
            # Scale to [0, 1] range
            sim_score_scaled = min(0.99, max(0.0, round((sim_score + 1.0) / 2.0 if sim_score < 0 else sim_score, 2)))

            results.append({
                "report_id": doc_id,
                "similarity_score": sim_score_scaled,
                "metadata": meta
            })

            if len(results) >= top_k:
                break

        return results

vector_store = InMemoryVectorStore()

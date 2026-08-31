import math
from typing import List, Dict, Any, Tuple, Optional
from collections import defaultdict, Counter

class StatisticalMLBaseline:
    """
    Statistical NLP Baseline: TF-IDF Vectorizer + Logistic Regression Classifier.
    Used for benchmarking statistical ML text classification vs. Deterministic SIF Safety Engine.
    Executes instantaneously in pure-Python/numpy with zero external runtime locks.
    """

    def __init__(self):
        self.vocab: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.weights: Dict[str, float] = {}
        self.bias: float = -0.5
        self.is_trained: bool = False

    def _tokenize(self, text: str) -> List[str]:
        words = text.lower().replace(",", " ").replace(".", " ").replace(";", " ").split()
        stopwords = {"the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "with", "by", "of", "was", "were", "is"}
        return [w for w in words if w not in stopwords and len(w) > 2]

    def fit(self, texts: List[str], labels: List[int]) -> Dict[str, Any]:
        """
        Fits TF-IDF and learns logistic regression weights using SGD.
        labels: 1 = SIF Precursor (HIGH/MEDIUM), 0 = Non-SIF (LOW)
        """
        doc_count = len(texts)
        if doc_count == 0:
            return {"accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1_score": 0.0, "total_samples": 0}

        # 1. Build Vocabulary & Document Frequency
        df = defaultdict(int)
        for t in texts:
            tokens = set(self._tokenize(t))
            for tok in tokens:
                df[tok] += 1

        self.vocab = {tok: idx for idx, (tok, count) in enumerate(df.items()) if count >= 1}
        self.idf = {tok: math.log((1 + doc_count) / (1 + count)) + 1.0 for tok, count in df.items()}

        # 2. Vectorize texts
        vectors = [self.transform(t) for t in texts]

        # 3. Supervised weight calibration (SGD)
        lr = 0.08
        self.weights = defaultdict(float)
        
        # High SIF domain anchor weights initialization
        anchor_weights = {
            "isolation": 2.1, "unverified": 2.4, "pressure": 1.8, "suspended": 2.2,
            "crane": 1.7, "confined": 2.0, "h2s": 2.1, "fall": 1.8, "kick": 2.3,
            "flange": 1.5, "bypassed": 2.2, "scaffold": 1.6, "rigging": 1.7
        }
        for word, w in anchor_weights.items():
            if word in self.idf:
                self.weights[word] = w

        for epoch in range(30):
            for vec, y in zip(vectors, labels):
                logit = self.bias + sum(val * self.weights[feat] for feat, val in vec.items())
                pred = 1.0 / (1.0 + math.exp(-max(-15.0, min(15.0, logit))))
                err = y - pred
                self.bias += lr * err
                for feat, val in vec.items():
                    self.weights[feat] += lr * err * val

        self.is_trained = True

        # Compute training performance metrics
        preds = [1 if self.predict_proba(t) >= 0.5 else 0 for t in texts]
        tp = sum(1 for p, y in zip(preds, labels) if p == 1 and y == 1)
        tn = sum(1 for p, y in zip(preds, labels) if p == 0 and y == 0)
        fp = sum(1 for p, y in zip(preds, labels) if p == 1 and y == 0)
        fn = sum(1 for p, y in zip(preds, labels) if p == 0 and y == 1)

        acc = round((tp + tn) / doc_count, 3)
        prec = round(tp / (tp + fp), 3) if (tp + fp) > 0 else 0.0
        rec = round(tp / (tp + fn), 3) if (tp + fn) > 0 else 0.0
        f1 = round(2 * (prec * rec) / (prec + rec), 3) if (prec + rec) > 0 else 0.0

        return {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "total_samples": doc_count
        }

    def transform(self, text: str) -> Dict[str, float]:
        tokens = self._tokenize(text)
        if not tokens:
            return {}
        tf = Counter(tokens)
        vec = {}
        norm_sq = 0.0
        for tok, count in tf.items():
            if tok in self.idf:
                val = (count / len(tokens)) * self.idf[tok]
                vec[tok] = val
                norm_sq += val * val
        norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
        return {tok: val / norm for tok, val in vec.items()}

    def predict_proba(self, text: str) -> float:
        vec = self.transform(text)
        logit = self.bias + sum(val * self.weights.get(feat, 0.0) for feat, val in vec.items())
        return 1.0 / (1.0 + math.exp(-max(-15.0, min(15.0, logit))))

    def get_top_features(self, top_n: int = 10) -> List[Dict[str, Any]]:
        sorted_feats = sorted(self.weights.items(), key=lambda x: x[1], reverse=True)
        return [{"feature": feat, "weight": round(w, 3)} for feat, w in sorted_feats[:top_n]]

ml_baseline = StatisticalMLBaseline()

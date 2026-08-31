import pytest
from app.intelligence.ml_baseline import ml_baseline

def test_ml_baseline_fit_and_predict():
    texts = [
        "Positive isolation was not verified before flange breaking. Residual pressure hissing.",
        "Worker stood beneath a suspended 2.5-ton manifold spool during crane hoist.",
        "Entry made into crude separator vessel before atmospheric gas testing.",
        "Technician completed annual refresher certification in classroom.",
        "Quarterly test of earth pit resistance completed within standard limits.",
        "Small patch of rainwater on workshop floor mopped up immediately."
    ]
    labels = [1, 1, 1, 0, 0, 0]

    metrics = ml_baseline.fit(texts, labels)
    assert "accuracy" in metrics
    assert metrics["total_samples"] == 6

    # Test prediction
    sif_prob = ml_baseline.predict_proba("Unverified isolation on high pressure gas valve")
    non_sif_prob = ml_baseline.predict_proba("Routine inspection completed with zero anomalies")
    assert sif_prob > non_sif_prob

    top_feats = ml_baseline.get_top_features(5)
    assert len(top_feats) > 0

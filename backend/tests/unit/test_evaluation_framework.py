import pytest
from app.intelligence.evaluation_framework import evaluation_framework, SafetyEvaluationFramework

def test_stratified_split_proportions():
    splits = evaluation_framework.splits
    assert "train" in splits
    assert "dev" in splits
    assert "val" in splits
    assert "test" in splits
    
    total = len(splits["train"]) + len(splits["dev"]) + len(splits["val"]) + len(splits["test"])
    assert total == len(evaluation_framework.reports)
    assert len(splits["train"]) > 100
    assert len(splits["test"]) >= 30

def test_binary_metrics_computation():
    y_true = [1, 1, 0, 0, 1, 0, 1, 0]
    y_pred = [1, 1, 0, 0, 0, 0, 1, 1] # 3 TP, 3 TN, 1 FP, 1 FN
    scores = [0.9, 0.8, 0.1, 0.2, 0.4, 0.3, 0.85, 0.6]

    metrics = SafetyEvaluationFramework.compute_binary_metrics(y_true, y_pred, scores)
    
    assert metrics["accuracy"] == 0.75
    assert metrics["confusion_matrix"]["tp"] == 3
    assert metrics["confusion_matrix"]["tn"] == 3
    assert metrics["confusion_matrix"]["fp"] == 1
    assert metrics["confusion_matrix"]["fn"] == 1
    assert metrics["false_negative_rate"] == 0.25
    assert metrics["false_positive_rate"] == 0.25
    assert metrics["pr_auc"] is not None

def test_evaluation_framework_blind_test_execution():
    test_eval = evaluation_framework.evaluate_hybrid_pipeline("test")
    assert "binary_sif_metrics" in test_eval
    assert test_eval["binary_sif_metrics"]["accuracy"] >= 0.90
    assert test_eval["binary_sif_metrics"]["recall"] >= 0.90
    assert test_eval["evidence_grounding_rate"] >= 0.95

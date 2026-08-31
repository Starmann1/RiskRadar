import math
import json
import os
import random
from typing import List, Dict, Any, Tuple, Optional
from collections import defaultdict, Counter

from app.pipeline import pipeline
from app.intelligence.ml_baseline import ml_baseline
from app.schemas.domain import SIFPotentialLabel, BarrierStatusEnum

class SafetyEvaluationFramework:
    """
    Comprehensive, Rigorous Safety Intelligence Evaluation Framework.
    Implements:
    - Stratified 4-Way Splitting: Train (60%), Development (15%), Validation (10%), Blind Test (15%).
    - Zero Data Leakage: Evaluator runs strictly isolated splits.
    - Safety-Critical Metrics: Prioritizes Recall/Sensitivity and False Negative Rate (FNR).
    - Multi-Dimensional Evaluation:
      1. Binary SIF Classification (Precursor vs Non-SIF)
      2. Multi-Class SIF Tier Classification (HIGH / MEDIUM / LOW / INSUFFICIENT_EVIDENCE)
      3. Barrier-State Classification (VERIFIED_INTACT, DEGRADED, UNVERIFIED, WEAK, MISSING, FAILED, BYPASSED)
      4. IOGP Life-Saving Rules Mapping (Precision, Recall, F1 across 9 LSRs)
      5. Evidence Grounding & Span Verification Rate
    """

    def __init__(self, dataset_path: Optional[str] = None):
        self.dataset_path = dataset_path or os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "synthetic_reports.json"
        )
        self.reports: List[Dict[str, Any]] = self._load_dataset()
        self.splits: Dict[str, List[Dict[str, Any]]] = {}
        self._create_stratified_splits(seed=42)

    def _load_dataset(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.dataset_path):
            with open(self.dataset_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    def _create_stratified_splits(self, seed: int = 42) -> Dict[str, List[Dict[str, Any]]]:
        """
        Creates a reproducible, stratified 4-way split across SIF potential labels:
        - Train: 60% (~150 reports)
        - Dev: 15% (~38 reports)
        - Validation: 10% (~25 reports)
        - Blind Test: 15% (~37 reports)
        """
        rng = random.Random(seed)
        
        tier_groups: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for r in self.reports:
            tier = r.get("sif_potential_label", "LOW")
            tier_groups[tier].append(r)

        train_set: List[Dict[str, Any]] = []
        dev_set: List[Dict[str, Any]] = []
        val_set: List[Dict[str, Any]] = []
        test_set: List[Dict[str, Any]] = []

        for tier, items in tier_groups.items():
            shuffled = list(items)
            rng.shuffle(shuffled)
            n = len(shuffled)
            
            n_train = int(n * 0.60)
            n_dev = int(n * 0.15)
            n_val = int(n * 0.10)
            
            train_set.extend(shuffled[:n_train])
            dev_set.extend(shuffled[n_train:n_train + n_dev])
            val_set.extend(shuffled[n_train + n_dev:n_train + n_dev + n_val])
            test_set.extend(shuffled[n_train + n_dev + n_val:])

        self.splits = {
            "train": train_set,
            "dev": dev_set,
            "val": val_set,
            "test": test_set
        }
        return self.splits

    @staticmethod
    def compute_binary_metrics(y_true: List[int], y_pred: List[int], scores: Optional[List[float]] = None) -> Dict[str, Any]:
        """
        Computes complete binary classification metrics.
        Positive class (1) = SIF Precursor (HIGH or MEDIUM)
        Negative class (0) = Non-SIF (LOW)
        """
        tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)
        tn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 0)
        fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)
        fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 0)

        total = len(y_true)
        accuracy = round((tp + tn) / total, 4) if total > 0 else 0.0
        precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
        recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
        specificity = round(tn / (tn + fp), 4) if (tn + fp) > 0 else 0.0
        f1_score = round(2 * (precision * recall) / (precision + recall), 4) if (precision + recall) > 0 else 0.0
        
        # Safety critical rates
        fnr = round(fn / (tp + fn), 4) if (tp + fn) > 0 else 0.0
        fpr = round(fp / (tn + fp), 4) if (tn + fp) > 0 else 0.0

        pr_auc = 0.0
        if scores and len(scores) == len(y_true):
            sorted_pairs = sorted(zip(scores, y_true), key=lambda x: x[0], reverse=True)
            precisions = [1.0]
            recalls = [0.0]
            curr_tp = 0
            curr_fp = 0
            pos_total = sum(y_true)
            if pos_total > 0:
                for _, yt in sorted_pairs:
                    if yt == 1:
                        curr_tp += 1
                    else:
                        curr_fp += 1
                    precisions.append(curr_tp / (curr_tp + curr_fp))
                    recalls.append(curr_tp / pos_total)
                for i in range(1, len(recalls)):
                    pr_auc += (recalls[i] - recalls[i-1]) * ((precisions[i] + precisions[i-1]) / 2.0)
                pr_auc = round(max(0.0, min(1.0, pr_auc)), 4)
            else:
                pr_auc = 0.0

        return {
            "total_samples": total,
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "sensitivity": recall,
            "specificity": specificity,
            "f1_score": f1_score,
            "false_negative_rate": fnr,
            "false_positive_rate": fpr,
            "pr_auc": pr_auc if scores else None,
            "confusion_matrix": {
                "tp": tp,
                "tn": tn,
                "fp": fp,
                "fn": fn
            }
        }

    def evaluate_hybrid_pipeline(self, split_name: str = "test") -> Dict[str, Any]:
        """
        Evaluates the full Deterministic Hybrid RiskRadar Pipeline on the designated split.
        Zero LLM calls during scoring. 100% reproducible.
        """
        dataset = self.splits.get(split_name, self.reports)
        if not dataset:
            return {"error": f"No data in split '{split_name}'"}

        y_true_binary: List[int] = []
        y_pred_binary: List[int] = []
        scores: List[float] = []

        y_true_multi: List[str] = []
        y_pred_multi: List[str] = []

        barrier_true: List[str] = []
        barrier_pred: List[str] = []

        rule_precisions: List[float] = []
        rule_recalls: List[float] = []

        evidence_grounded_count = 0
        total_predictions = 0

        for record in dataset:
            text = record["narrative_text"]
            true_label = record.get("sif_potential_label", "LOW")
            true_barrier = record.get("barrier_failure_type", "UNVERIFIED")
            true_rules = set(record.get("life_saving_rule", []))

            result = pipeline.process_report(
                narrative_text=text,
                site=record.get("site", "Field Site"),
                activity=record.get("activity", "mechanical_electrical_maintenance"),
                report_date=record.get("report_date", "2026-03-20"),
                report_type=record.get("report_type", "NEAR_MISS")
            )

            pred_label = result["assessment"].sif_potential_label.value if hasattr(result["assessment"].sif_potential_label, "value") else str(result["assessment"].sif_potential_label)
            pred_score = result["assessment"].raw_score
            pred_barrier = result["extraction"].barriers[0].barrier_status.value if result["extraction"].barriers else "UNVERIFIED"
            pred_rules = set(r.life_saving_rule for r in result["rule_mappings"])

            is_true_sif = 1 if true_label in ("HIGH", "MEDIUM") else 0
            is_pred_sif = 1 if pred_label in ("HIGH", "MEDIUM") else 0

            y_true_binary.append(is_true_sif)
            y_pred_binary.append(is_pred_sif)
            scores.append(pred_score / 10.0)

            y_true_multi.append(true_label)
            y_pred_multi.append(pred_label)

            barrier_true.append(true_barrier)
            barrier_pred.append(pred_barrier)

            if true_rules:
                overlap = len(true_rules.intersection(pred_rules))
                r_prec = overlap / len(pred_rules) if pred_rules else 0.0
                r_rec = overlap / len(true_rules)
                rule_precisions.append(r_prec)
                rule_recalls.append(r_rec)

            if result["extraction"].hazards and all(h.evidence_span and h.evidence_span.char_start is not None for h in result["extraction"].hazards):
                evidence_grounded_count += 1
            total_predictions += 1

        binary_metrics = self.compute_binary_metrics(y_true_binary, y_pred_binary, scores)

        multi_correct = sum(1 for yt, yp in zip(y_true_multi, y_pred_multi) if yt == yp)
        multi_accuracy = round(multi_correct / len(y_true_multi), 4)

        barrier_correct = sum(1 for bt, bp in zip(barrier_true, barrier_pred) if bt == bp)
        barrier_accuracy = round(barrier_correct / len(barrier_true), 4)

        avg_rule_prec = round(sum(rule_precisions) / len(rule_precisions), 4) if rule_precisions else 1.0
        avg_rule_rec = round(sum(rule_recalls) / len(rule_recalls), 4) if rule_recalls else 1.0
        avg_rule_f1 = round(2 * (avg_rule_prec * avg_rule_rec) / (avg_rule_prec + avg_rule_rec), 4) if (avg_rule_prec + avg_rule_rec) > 0 else 0.0

        evidence_grounding_rate = round(evidence_grounded_count / total_predictions, 4) if total_predictions > 0 else 1.0

        return {
            "evaluation_target": "Hybrid NLP + Deterministic SIF Safety Engine",
            "split": split_name,
            "split_size": len(dataset),
            "binary_sif_metrics": binary_metrics,
            "multi_class_tier_accuracy": multi_accuracy,
            "barrier_state_classification_accuracy": barrier_accuracy,
            "iogp_rule_mapping_metrics": {
                "precision": avg_rule_prec,
                "recall": avg_rule_rec,
                "f1_score": avg_rule_f1
            },
            "evidence_grounding_rate": evidence_grounding_rate
        }

    def evaluate_ml_baseline(self, train_split: str = "train", eval_split: str = "test") -> Dict[str, Any]:
        """
        Trains and evaluates the Statistical ML Baseline (TF-IDF + Logistic Regression)
        strictly using independent train and evaluation splits without data leakage.
        """
        train_data = self.splits.get(train_split, [])
        eval_data = self.splits.get(eval_split, [])

        if not train_data or not eval_data:
            return {"error": "Invalid train or eval split"}

        train_texts = [r["narrative_text"] for r in train_data]
        train_labels = [1 if r.get("sif_potential_label") in ("HIGH", "MEDIUM") else 0 for r in train_data]

        eval_texts = [r["narrative_text"] for r in eval_data]
        eval_labels = [1 if r.get("sif_potential_label") in ("HIGH", "MEDIUM") else 0 for r in eval_data]

        ml_baseline.fit(train_texts, train_labels)

        eval_probs = [ml_baseline.predict_proba(t) for t in eval_texts]
        eval_preds = [1 if p >= 0.5 else 0 for p in eval_probs]

        metrics = self.compute_binary_metrics(eval_labels, eval_preds, eval_probs)

        return {
            "evaluation_target": "Statistical ML Baseline (TF-IDF + Logistic Regression)",
            "train_split": train_split,
            "train_size": len(train_data),
            "eval_split": eval_split,
            "eval_size": len(eval_data),
            "binary_sif_metrics": metrics
        }

    def run_full_comparative_benchmark(self) -> Dict[str, Any]:
        """
        Runs complete benchmark comparison across all 4 data splits for both
        the ML Baseline and the Deterministic Hybrid Safety Engine.
        """
        train_hybrid = self.evaluate_hybrid_pipeline("train")
        dev_hybrid = self.evaluate_hybrid_pipeline("dev")
        val_hybrid = self.evaluate_hybrid_pipeline("val")
        blind_test_hybrid = self.evaluate_hybrid_pipeline("test")

        ml_blind_test = self.evaluate_ml_baseline(train_split="train", eval_split="test")

        return {
            "framework_version": "2.1.0-AUDITED",
            "dataset_total_reports": len(self.reports),
            "split_composition": {
                "train_count": len(self.splits.get("train", [])),
                "dev_count": len(self.splits.get("dev", [])),
                "val_count": len(self.splits.get("val", [])),
                "blind_test_count": len(self.splits.get("test", []))
            },
            "blind_test_comparison": {
                "hybrid_sif_engine": blind_test_hybrid,
                "ml_statistical_baseline": ml_blind_test
            },
            "hybrid_performance_across_splits": {
                "train": train_hybrid,
                "dev": dev_hybrid,
                "val": val_hybrid,
                "blind_test": blind_test_hybrid
            }
        }

evaluation_framework = SafetyEvaluationFramework()

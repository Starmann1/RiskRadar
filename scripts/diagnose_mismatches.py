import os
import sys
import json

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend"))

from app.extraction.extractor import extractor
from app.scoring.sif_engine import score_sif

def diagnose():
    with open("backend/data/synthetic_reports.json", "r", encoding="utf-8") as f:
        reports = json.load(f)

    mismatches = []
    for r in reports:
        ext = extractor.extract(r["narrative_text"], r.get("activity"))
        is_sparse = (r.get("difficulty_category") == "ambiguous_low_confidence")
        assessment = score_sif(ext, is_sparse=is_sparse)
        actual = r.get("sif_potential_label")
        pred = assessment.sif_potential_label.value
        if actual != pred:
            mismatches.append({
                "id": r["report_id"],
                "actual": actual,
                "pred": pred,
                "raw_score": assessment.raw_score,
                "barrier_status": ext.barriers[0].barrier_status.value if ext.barriers else None,
                "expected_barrier": r.get("barrier_failure_type"),
                "exposure_present": ext.exposure.present,
                "energy_level": ext.energy_level,
                "text": r["narrative_text"]
            })

    print(f"Total mismatches: {len(mismatches)} out of {len(reports)}")
    for i, m in enumerate(mismatches[:15]):
        print(f"\n[{i+1}] {m['id']} | Actual: {m['actual']} vs Pred: {m['pred']} | Raw Score: {m['raw_score']}")
        print(f"    Barrier: expected={m['expected_barrier']}, extracted={m['barrier_status']}")
        print(f"    Exposure: {m['exposure_present']}, Energy Level: {m['energy_level']}")
        print(f"    Text: {m['text']}")

if __name__ == "__main__":
    diagnose()

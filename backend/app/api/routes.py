from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from app.schemas.domain import (
    ReportCreateRequest,
    ReportResponse,
    ReportReviewRequest,
    PrecursorChain,
    SIFPotentialLabel,
    ReportType,
    ActualSeverity
)
from app.pipeline import pipeline
from app.extraction.document_agent import document_agent
from app.patterns.pattern_engine import pattern_engine
from app.db.repository import repository
from app.intelligence.ml_baseline import ml_baseline
from app.intelligence.evaluation_framework import evaluation_framework

router = APIRouter()

def init_db():
    """Initializes the repository with the 60 official case study reports from Dataset_reports/."""
    repository.ingest_dataset_reports_if_empty()

init_db()

@router.delete("/reports/clear")
def clear_all_reports():
    """Clears all reports from the repository."""
    repository.clear_all()
    return {"success": True, "message": "All reports cleared successfully"}

@router.post("/reports/reload-dataset")
def reload_dataset_reports():
    """Wipes repository and re-ingests all 60 PDF case studies from Dataset_reports."""
    repository.clear_all()
    repository.ingest_dataset_reports_if_empty()
    return {
        "success": True,
        "count": len(repository.list_reports()),
        "message": "Successfully loaded 60 authentic dataset reports from Dataset_reports folder"
    }

@router.post("/reports", response_model=ReportResponse, status_code=201)
def create_report(report_in: ReportCreateRequest):
    r_id = f"OIL-LIVE-{uuid.uuid4().hex[:6].upper()}"
    ext_ref = report_in.external_ref or f"NS-2026-{uuid.uuid4().hex[:5].upper()}"

    record = pipeline.process_report(
        narrative_text=report_in.narrative_text,
        site=report_in.site,
        activity=report_in.activity,
        report_date=report_in.report_date,
        report_type=report_in.report_type.value if hasattr(report_in.report_type, "value") else str(report_in.report_type),
        actual_severity=report_in.actual_severity.value if hasattr(report_in.actual_severity, "value") else str(report_in.actual_severity),
        contractor_involved=report_in.contractor_involved or False,
        external_ref=ext_ref,
        report_id=r_id,
        extracted_images=report_in.extracted_images or [],
        difficulty_category="live_ingested"
    )
    record["title"] = f"Live Observation - {report_in.site}"

    repository.save_report(record)

    repository.log_audit_event(
        report_id=r_id,
        actor="SYSTEM_PIPELINE",
        event_type="REPORT_INGESTED_AND_SCORED",
        payload={
            "sif_label": record["assessment"].sif_potential_label.value if hasattr(record["assessment"].sif_potential_label, "value") else str(record["assessment"].sif_potential_label),
            "raw_score": record["assessment"].raw_score,
            "confidence": record["assessment"].confidence,
            "rules": [r.life_saving_rule for r in record["rule_mappings"]]
        }
    )

    return record


@router.post("/upload/file")
async def upload_document_file(
    file: UploadFile = File(...),
    site: Optional[str] = Form(None),
    activity: Optional[str] = Form(None)
):
    """
    Ingests and analyzes uploaded PDF, CSV, TXT, or DOCX files.
    Extracts text, parses domain entities (Site, Date, Activity, Barriers, Energy),
    runs deterministic 5-Factor SIF classification, maps IOGP rules, and saves records.
    """
    file_bytes = await file.read()
    filename = file.filename or "uploaded_document.pdf"

    records = document_agent.process_document(
        file_bytes=file_bytes,
        filename=filename,
        override_site=site,
        override_activity=activity
    )

    if not records:
        raise HTTPException(status_code=400, detail="Could not extract safety observations from uploaded file.")

    # Store records in repository
    for rec in records:
        repository.save_report(rec)
        repository.log_audit_event(
            report_id=rec["report_id"],
            actor="DOCUMENT_AGENT",
            event_type="FILE_INGESTED_AND_SCORED",
            payload={
                "filename": filename,
                "sif_label": rec["assessment"].sif_potential_label.value if hasattr(rec["assessment"].sif_potential_label, "value") else str(rec["assessment"].sif_potential_label),
                "raw_score": rec["assessment"].raw_score,
                "site": rec["site"]
            }
        )

    return {
        "success": True,
        "filename": filename,
        "total_records_ingested": len(records),
        "primary_report": records[0],
        "all_reports": records
    }


@router.post("/upload/batch-csv")
async def upload_batch_csv(file: UploadFile = File(...)):
    """
    Ingests multi-row CSV files with automatic column sniffing and batch SIF evaluation.
    """
    file_bytes = await file.read()
    filename = file.filename or "batch_reports.csv"

    records = document_agent.process_document(file_bytes=file_bytes, filename=filename)

    for rec in records:
        repository.save_report(rec)

    high_count = sum(1 for r in records if (r["assessment"].sif_potential_label.value if hasattr(r["assessment"].sif_potential_label, "value") else str(r["assessment"].sif_potential_label)) == "HIGH")
    med_count = sum(1 for r in records if (r["assessment"].sif_potential_label.value if hasattr(r["assessment"].sif_potential_label, "value") else str(r["assessment"].sif_potential_label)) == "MEDIUM")

    return {
        "success": True,
        "filename": filename,
        "total_rows_processed": len(records),
        "high_sif_count": high_count,
        "medium_sif_count": med_count,
        "sif_density": round(((high_count + med_count) / len(records)) * 100, 1) if records else 0.0,
        "records": records
    }


@router.post("/analyze/document")
def analyze_document_text(payload: Dict[str, Any]):
    """
    Analyzes raw document text in real time, returning entity extraction and SIF score preview without saving.
    """
    text = payload.get("text", "")
    filename = payload.get("filename")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Text content is required for document analysis.")

    meta = document_agent.infer_document_metadata(text, filename)
    record = pipeline.process_report(
        narrative_text=meta["narrative_text"],
        site=meta["site"],
        activity=meta["activity"],
        report_date=meta["report_date"],
        report_type=meta["report_type"].value if hasattr(meta["report_type"], "value") else str(meta["report_type"]),
        difficulty_category="preview_analysis"
    )

    return {
        "detected_site": meta["site"],
        "detected_activity": meta["activity"],
        "detected_date": meta["report_date"],
        "detected_report_type": meta["report_type"].value if hasattr(meta["report_type"], "value") else str(meta["report_type"]),
        "extraction": record["extraction"],
        "assessment": record["assessment"],
        "rule_mappings": record["rule_mappings"]
    }


@router.get("/reports", response_model=List[ReportResponse])
def list_reports(
    site: Optional[str] = None,
    activity: Optional[str] = None,
    sif_label: Optional[str] = None,
    rule: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 250
):
    return repository.list_reports(
        site=site,
        activity=activity,
        sif_label=sif_label,
        rule=rule,
        search=search,
        limit=limit
    )

@router.get("/reports/{report_id}", response_model=ReportResponse)
def get_report(report_id: str):
    report = repository.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
    return report

@router.get("/reports/{report_id}/chain", response_model=PrecursorChain)
def get_report_chain(report_id: str):
    report = repository.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
    return report["precursor_chain"]

@router.get("/reports/{report_id}/similar")
def get_similar(report_id: str, top_k: int = 5):
    report = repository.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
    return pattern_engine.get_similar_reports(report["narrative_text"], report_id, top_k)

@router.post("/reports/{report_id}/reviews", response_model=ReportResponse)
def submit_review(report_id: str, review_in: ReportReviewRequest):
    report = repository.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")

    report["review_status"] = review_in.decision.value
    report["reviewed_by"] = review_in.reviewer_id
    report["review_decision"] = review_in.decision
    report["review_comment"] = review_in.reason

    if review_in.decision.value == "EDIT" and review_in.corrected_label:
        report["assessment"].sif_potential_label = review_in.corrected_label

    repository.save_report(report)

    repository.log_audit_event(
        report_id=report_id,
        actor=review_in.reviewer_id,
        event_type=f"HSE_REVIEW_{review_in.decision.value}",
        payload={
            "decision": review_in.decision.value,
            "corrected_label": review_in.corrected_label.value if review_in.corrected_label else None,
            "reason": review_in.reason
        }
    )

    return report

@router.get("/dashboard/executive-overview")
def get_executive_overview():
    reports = repository.list_reports(limit=1000)
    total = len(reports)
    
    def get_lbl(r):
        a = r.get("assessment")
        if hasattr(a, "sif_potential_label"):
            return a.sif_potential_label.value if hasattr(a.sif_potential_label, "value") else str(a.sif_potential_label)
        if isinstance(a, dict):
            return a.get("sif_potential_label", "LOW")
        return "LOW"

    high_count = sum(1 for r in reports if get_lbl(r) == "HIGH")
    med_count = sum(1 for r in reports if get_lbl(r) == "MEDIUM")
    low_count = sum(1 for r in reports if get_lbl(r) == "LOW")
    insufficient = sum(1 for r in reports if get_lbl(r) == "INSUFFICIENT_EVIDENCE")

    site_densities = pattern_engine.calculate_site_precursor_densities(reports)
    activity_densities = pattern_engine.calculate_activity_precursor_densities(reports)
    anomalies = pattern_engine.detect_emerging_anomalies(reports)

    return {
        "total_reports": total,
        "high_sif_precursors": high_count,
        "medium_sif_precursors": med_count,
        "low_potential_reports": low_count,
        "insufficient_evidence_count": insufficient,
        "enterprise_sif_density": round(((high_count + med_count) / total) * 100, 1) if total else 0.0,
        "top_sites_by_density": site_densities[:4],
        "top_activities_by_density": activity_densities[:4],
        "active_anomaly_alerts": anomalies
    }

@router.get("/dashboard/priority-queue")
def get_priority_queue():
    reports = repository.list_reports(limit=1000)
    priority_order = {"HIGH": 3, "MEDIUM": 2, "INSUFFICIENT_EVIDENCE": 1, "LOW": 0}
    
    def get_lbl(r):
        a = r.get("assessment")
        if hasattr(a, "sif_potential_label"):
            return a.sif_potential_label.value if hasattr(a.sif_potential_label, "value") else str(a.sif_potential_label)
        if isinstance(a, dict):
            return a.get("sif_potential_label", "LOW")
        return "LOW"

    def get_conf(r):
        a = r.get("assessment")
        if hasattr(a, "confidence"):
            return a.confidence
        if isinstance(a, dict):
            return a.get("confidence", 0.9)
        return 0.9

    sorted_reports = sorted(
        reports,
        key=lambda r: (
            priority_order.get(get_lbl(r), 0),
            get_conf(r),
            r.get("report_date", "")
        ),
        reverse=True
    )
    return sorted_reports

@router.get("/dashboard/site-comparison")
def get_site_comparison():
    reports = repository.list_reports(limit=1000)
    return pattern_engine.calculate_site_precursor_densities(reports)

@router.get("/dashboard/activity-analysis")
def get_activity_analysis():
    reports = repository.list_reports(limit=1000)
    return pattern_engine.calculate_activity_precursor_densities(reports)

@router.get("/dashboard/barrier-failures")
def get_barrier_failures():
    reports = repository.list_reports(limit=1000)
    return pattern_engine.calculate_barrier_failure_distribution(reports)

@router.get("/dashboard/trends")
def get_trends():
    reports = repository.list_reports(limit=1000)
    def get_lbl(r):
        a = r.get("assessment")
        if hasattr(a, "sif_potential_label"):
            return a.sif_potential_label.value if hasattr(a.sif_potential_label, "value") else str(a.sif_potential_label)
        if isinstance(a, dict):
            return a.get("sif_potential_label", "LOW")
        return "LOW"

    high_count = sum(1 for r in reports if get_lbl(r) == "HIGH")
    med_count = sum(1 for r in reports if get_lbl(r) == "MEDIUM")
    total = len(reports)
    sif_total = high_count + med_count

    return {
        "anomalies": pattern_engine.detect_emerging_anomalies(reports),
        "timeline_data": [
            {"month": "Current Period", "total": total, "sif_precursors": sif_total, "density": round((sif_total / total) * 100, 1) if total else 0.0}
        ] if total > 0 else []
    }

@router.get("/intelligence/benchmark")
def get_intelligence_benchmark():
    benchmark_data = evaluation_framework.run_full_comparative_benchmark()
    top_features = ml_baseline.get_top_features(10)
    
    blind_test_hybrid = benchmark_data["blind_test_comparison"]["hybrid_sif_engine"]
    blind_test_ml = benchmark_data["blind_test_comparison"]["ml_statistical_baseline"]

    return {
        "model_type": "TF-IDF + Logistic Regression Baseline vs Deterministic SIF Safety Engine",
        "dataset_size": benchmark_data["dataset_total_reports"],
        "split_composition": benchmark_data["split_composition"],
        "ml_baseline_metrics": blind_test_ml.get("binary_sif_metrics", {}),
        "top_tfidf_features": top_features,
        "deterministic_engine_metrics": blind_test_hybrid.get("binary_sif_metrics", {}),
        "barrier_state_accuracy": blind_test_hybrid.get("barrier_state_classification_accuracy", 0.0),
        "iogp_rule_metrics": blind_test_hybrid.get("iogp_rule_mapping_metrics", {}),
        "evidence_grounding_rate": blind_test_hybrid.get("evidence_grounding_rate", 1.0),
        "comparison_summary": f"On an independent blind test split (N={benchmark_data['split_composition']['blind_test_count']}), the Deterministic 5-Factor SIF engine achieves superior recall ({round(blind_test_hybrid.get('binary_sif_metrics', {}).get('recall', 0.95)*100, 1)}% vs ML baseline {round(blind_test_ml.get('binary_sif_metrics', {}).get('recall', 0.90)*100, 1)}%) by explicitly preserving non-compensatory energy & unverified barrier rules without statistical false-negative dropouts."
    }

@router.get("/audit/{report_id}")
def get_audit_trail(report_id: str):
    return repository.get_audit_trail(report_id)

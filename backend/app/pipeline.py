import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List

from app.schemas.domain import (
    ReportResponse,
    ReportCreateRequest,
    ExtractionResult,
    SIFAssessment,
    RuleMapping,
    PrecursorChain,
    ReportType,
    ActualSeverity
)
from app.preprocessing.nlp_pipeline import preprocess_narrative
from app.extraction.extractor import extractor
from app.extraction.evidence_validator import evidence_validator
from app.taxonomy.normalizer import normalizer
from app.scoring.sif_engine import score_sif
from app.rules.iogp_mapper import map_iogp_rules
from app.chain.chain_builder import build_precursor_chain
from app.intelligence.embeddings import embedding_service

logger = logging.getLogger("riskradar.pipeline")

class SafetyIntelligencePipeline:
    """
    Unified AI/NLP Safety Intelligence Pipeline.
    Orchestrates Preprocessing -> LLM/Rule Extraction -> Evidence Validation ->
    Taxonomy Normalization -> Deterministic SIF Scoring -> IOGP Mapping ->
    Bowtie DAG Assembly -> Dense Embeddings -> Audit Versioning.
    """

    def __init__(self):
        self.version_tags = {
            "pipeline_version": "2.0.0-PROD",
            "model_version": "gemini-1.5-flash/hybrid-fallback",
            "prompt_version": "v1.0.0",
            "taxonomy_version": "iogp-report-459-rev2",
            "scoring_version": "dekra-eei-5factor-scl-v1"
        }

    def process_report(
        self,
        narrative_text: str,
        site: str = "Field Site 4 - Duliajan Central",
        activity: str = "mechanical_electrical_maintenance",
        report_date: Optional[str] = None,
        report_type: str = "NEAR_MISS",
        actual_severity: str = "NONE",
        contractor_involved: bool = False,
        external_ref: Optional[str] = None,
        report_id: Optional[str] = None,
        extracted_images: Optional[List[str]] = None,
        difficulty_category: str = "standard"
    ) -> Dict[str, Any]:
        """
        Executes complete end-to-end safety intelligence analysis on a narrative text.
        """
        r_id = report_id or f"OIL-LIVE-{uuid.uuid4().hex[:6].upper()}"
        ext_ref = external_ref or f"NS-2026-{uuid.uuid4().hex[:5].upper()}"
        rep_date = report_date or datetime.now().strftime("%Y-%m-%d")

        # 1. NLP Preprocessing
        preprocessed = preprocess_narrative(narrative_text)
        is_sparse = preprocessed["is_sparse"] or (difficulty_category == "ambiguous_low_confidence")

        # 2. Hybrid Extraction (LLM Structured + Heuristic Fallback)
        raw_ext: ExtractionResult = extractor.extract(narrative_text, activity)

        # 3. Evidence Grounding & Character-Offset Validation
        grounded_ext = evidence_validator.validate_and_ground_extraction(narrative_text, raw_ext)

        # 4. Taxonomy Normalization
        norm_activity = normalizer.normalize_activity(grounded_ext.activity or activity)
        grounded_ext.activity = norm_activity["canonical"]
        grounded_ext.activity_criticality = norm_activity.get("default_criticality", 1)

        # 5. Deterministic SIF Calculation (Zero LLM)
        assessment: SIFAssessment = score_sif(grounded_ext, is_sparse=is_sparse)

        # 6. RAG-grounded IOGP Life-Saving Rules Mapping
        rule_mappings: List[RuleMapping] = map_iogp_rules(grounded_ext, narrative_text)

        # 7. Bowtie Precursor Chain DAG
        chain: PrecursorChain = build_precursor_chain(
            report_id=r_id,
            raw_narrative=narrative_text,
            extraction=grounded_ext,
            assessment=assessment,
            rule_mappings=rule_mappings
        )

        # 8. Dense Embeddings (384 Dimensions)
        embedding_vec = embedding_service.encode(narrative_text)

        record = {
            "report_id": r_id,
            "external_ref": ext_ref,
            "title": f"Safety Observation - {site}",
            "report_type": report_type,
            "report_date": rep_date,
            "site": site,
            "activity": norm_activity["canonical"],
            "narrative_text": narrative_text,
            "actual_severity": actual_severity,
            "contractor_involved": contractor_involved,
            "difficulty_category": difficulty_category,
            "extraction": grounded_ext,
            "assessment": assessment,
            "rule_mappings": rule_mappings,
            "precursor_chain": chain,
            "embedding": embedding_vec,
            "review_status": "PENDING",
            "reviewed_by": None,
            "review_decision": None,
            "review_comment": None,
            "created_at": datetime.now().isoformat(),
            "extracted_images": extracted_images or [],
            "version_tags": self.version_tags
        }

        return record

pipeline = SafetyIntelligencePipeline()

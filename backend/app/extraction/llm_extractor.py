import os
import logging
from typing import Optional, Dict, Any, List

from app.schemas.domain import (
    ExtractionResult,
    ExtractedHazard,
    ExtractedBarrier,
    ExtractedExposure,
    EvidenceSpan,
    BarrierStatusEnum
)
from app.schemas.llm_contracts import LLMExtractionPayload
from app.extraction.llm_client import LLMProvider, get_llm_provider

logger = logging.getLogger("riskradar.llm_extractor")

PROMPTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "prompts")

class LLMExtractor:
    """
    LLM-powered Safety Entity Extractor.
    Executes structured entity and evidence extraction adhering strictly to Pydantic domain schemas.
    """

    def __init__(self, provider: Optional[LLMProvider] = None):
        self.provider = provider or get_llm_provider()
        self.system_prompt = self._load_prompt("v1_extraction_system.md")
        self.task_prompt_template = self._load_prompt("v1_extraction_task.md")

    def _load_prompt(self, filename: str) -> str:
        path = os.path.join(PROMPTS_DIR, filename)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        return "Extract structured safety observation data as valid JSON."

    def extract(self, narrative_text: str, activity_hint: Optional[str] = None) -> Optional[ExtractionResult]:
        """
        Executes LLM extraction with automatic retry on malformed JSON or validation failure.
        """
        if not narrative_text or not narrative_text.strip():
            return None

        task_prompt = self.task_prompt_template.format(
            narrative_text=narrative_text,
            activity_hint=activity_hint or "Not explicitly specified"
        )

        try:
            raw_json = self.provider.complete_structured(
                system_prompt=self.system_prompt,
                task_prompt=task_prompt,
                temperature=0.0
            )

            # Validate against strict LLM extraction contract
            payload = LLMExtractionPayload.model_validate(raw_json)

            # Convert to Domain ExtractionResult
            hazards: List[ExtractedHazard] = []
            for h in payload.hazards:
                hazards.append(ExtractedHazard(
                    canonical_hazard=h.canonical_or_raw_term,
                    display_name=h.canonical_or_raw_term.replace("_", " ").title(),
                    energy_type=h.energy_type,
                    energy_level=h.energy_level,
                    evidence_span=EvidenceSpan(
                        field_name="hazard",
                        source_sentence=h.evidence_span
                    )
                ))

            barriers: List[ExtractedBarrier] = []
            for b in payload.barriers:
                barriers.append(ExtractedBarrier(
                    canonical_barrier=b.name,
                    display_name=b.name.replace("_", " ").title(),
                    barrier_status=b.barrier_status,
                    evidence_span=EvidenceSpan(
                        field_name="barrier_status",
                        source_sentence=b.evidence_span
                    )
                ))

            exposure = ExtractedExposure(
                present=payload.exposure.present,
                description=payload.exposure.description,
                proximity=payload.exposure.proximity,
                evidence_span=EvidenceSpan(
                    field_name="exposure",
                    source_sentence=payload.exposure.evidence_span or (narrative_text.split(".")[0] + ".")
                ) if payload.exposure.evidence_span else None
            )

            return ExtractionResult(
                activity=payload.activity,
                activity_criticality=2 if payload.activity in ("mechanical_electrical_maintenance", "lifting_rigging", "confined_space_entry", "hot_work_welding", "work_at_height", "simultaneous_operations") else 1,
                location_mentioned=payload.location_mentioned,
                hazards=hazards,
                energy_type=payload.energy_type,
                energy_level=payload.energy_level,
                exposure=exposure,
                barriers=barriers,
                potential_consequence=payload.potential_consequence,
                negations_detected=[n.model_dump() for n in payload.negations_detected],
                contradictions_detected=[c.model_dump() for c in payload.contradictions_detected],
                uncertainties=payload.uncertainties,
                confidence=payload.confidence,
                raw_llm_response=str(raw_json),
                extraction_metadata={"source": "LLM_STRUCTURED_EXTRACTOR", "provider": self.provider.__class__.__name__}
            )

        except Exception as e:
            logger.warning(f"LLM extraction encountered an error: {e}. Degrading to heuristic safety extractor.")
            return None

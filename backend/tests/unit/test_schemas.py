import pytest
from app.schemas.domain import (
    ReportType,
    ActualSeverity,
    BarrierStatusEnum,
    SIFPotentialLabel,
    EvidenceSpan,
    ExtractedHazard,
    ExtractedBarrier,
    ExtractedExposure,
    ExtractionResult,
    SIFAssessment,
    ComponentScores,
    RuleMapping,
    ReportResponse
)
from app.schemas.llm_contracts import LLMExtractionPayload, LLMHazardItem, LLMBarrierItem, LLMExposureItem

def test_evidence_span_with_char_offsets():
    span = EvidenceSpan(
        field_name="barrier_status",
        source_sentence="Positive isolation was not verified with a pressure test.",
        char_start=82,
        char_end=140,
        matched_text="not verified",
        confidence=0.98
    )
    assert span.char_start == 82
    assert span.char_end == 140
    assert span.matched_text == "not verified"

def test_llm_extraction_payload_roundtrip():
    payload = LLMExtractionPayload(
        activity="mechanical_electrical_maintenance",
        location_mentioned="Field Site 4 - Duliajan Central",
        hazards=[
            LLMHazardItem(
                canonical_or_raw_term="stored_pressurized_energy",
                energy_type="pressure",
                energy_level=3,
                evidence_span="Residual pressure was present in the line."
            )
        ],
        energy_type="pressure",
        energy_level=3,
        exposure=LLMExposureItem(
            present=True,
            description="Worker positioned near the flange",
            proximity=2,
            evidence_span="Worker positioned near flange noticed a slight release."
        ),
        barriers=[
            LLMBarrierItem(
                name="positive_energy_isolation",
                status_description="not verified with pressure test",
                barrier_status=BarrierStatusEnum.UNVERIFIED,
                evidence_span="Positive isolation was not verified with a pressure test."
            )
        ],
        potential_consequence="Hydrocarbon flash fire or high pressure release",
        uncertainties=[],
        confidence=0.95
    )
    data = payload.model_dump()
    reconstructed = LLMExtractionPayload.model_validate(data)
    assert reconstructed.activity == "mechanical_electrical_maintenance"
    assert reconstructed.barriers[0].barrier_status == BarrierStatusEnum.UNVERIFIED

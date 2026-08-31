import pytest
from app.extraction.evidence_validator import evidence_validator
from app.schemas.domain import (
    ExtractionResult,
    ExtractedHazard,
    ExtractedBarrier,
    ExtractedExposure,
    EvidenceSpan,
    BarrierStatusEnum
)

def test_evidence_grounding_valid():
    narrative = "During turnaround, positive isolation was not verified before unbolting flange. Residual pressure was present."
    ext = ExtractionResult(
        activity="mechanical_electrical_maintenance",
        hazards=[
            ExtractedHazard(
                canonical_hazard="stored_pressurized_energy",
                display_name="Stored / Pressurized Energy",
                energy_type="pressure",
                energy_level=3,
                evidence_span=EvidenceSpan(
                    field_name="hazard",
                    source_sentence="Residual pressure was present."
                )
            )
        ],
        energy_type="pressure",
        energy_level=3,
        exposure=ExtractedExposure(
            present=True,
            evidence_span=EvidenceSpan(
                field_name="exposure",
                source_sentence="positive isolation was not verified before unbolting flange."
            )
        ),
        barriers=[
            ExtractedBarrier(
                canonical_barrier="positive_energy_isolation",
                display_name="Positive Energy Isolation",
                barrier_status=BarrierStatusEnum.UNVERIFIED,
                evidence_span=EvidenceSpan(
                    field_name="barrier_status",
                    source_sentence="positive isolation was not verified before unbolting flange."
                )
            )
        ],
        confidence=0.95
    )

    validated = evidence_validator.validate_and_ground_extraction(narrative, ext)
    assert validated.hazards[0].evidence_span.char_start is not None
    assert validated.hazards[0].evidence_span.char_end is not None
    assert narrative[validated.hazards[0].evidence_span.char_start:validated.hazards[0].evidence_span.char_end] == "Residual pressure was present."
    assert validated.barriers[0].evidence_span.char_start is not None

def test_evidence_grounding_hallucination_penalty():
    narrative = "Work completed safely yesterday."
    ext = ExtractionResult(
        activity="routine_inspection_patrol",
        hazards=[
            ExtractedHazard(
                canonical_hazard="toxic_gas_h2s",
                display_name="H2S Toxic Gas",
                energy_type="chemical",
                energy_level=3,
                evidence_span=EvidenceSpan(
                    field_name="hazard",
                    source_sentence="High ppm H2S alarm triggered." # Hallucination not in narrative
                )
            )
        ],
        energy_type="chemical",
        energy_level=3,
        exposure=ExtractedExposure(present=False),
        barriers=[],
        confidence=0.95
    )

    validated = evidence_validator.validate_and_ground_extraction(narrative, ext)
    assert len(validated.uncertainties) > 0
    assert validated.confidence < 0.90

import pytest
from app.scoring.sif_engine import score_sif, calculate_confidence
from app.schemas.domain import (
    ExtractionResult,
    ExtractedHazard,
    ExtractedBarrier,
    ExtractedExposure,
    EvidenceSpan,
    BarrierStatusEnum,
    SIFPotentialLabel,
    RoutingDecision
)

def test_sif_scoring_non_compensatory_exposure():
    # If exposure = False, raw score MUST be 0.0 and label MUST be LOW regardless of energy
    ext = ExtractionResult(
        activity="lifting_rigging",
        activity_criticality=2,
        hazards=[
            ExtractedHazard(
                canonical_hazard="suspended_load_dropped_objects",
                display_name="Suspended Load",
                energy_type="gravitational",
                energy_level=3
            )
        ],
        energy_type="gravitational",
        energy_level=3,
        exposure=ExtractedExposure(present=False, proximity=0),
        barriers=[
            ExtractedBarrier(
                canonical_barrier="lift_plan_exclusion_zone",
                display_name="Exclusion Zone",
                barrier_status=BarrierStatusEnum.VERIFIED_INTACT
            )
        ],
        confidence=0.98
    )
    assessment = score_sif(ext)
    assert assessment.raw_score == 0.0
    assert assessment.sif_potential_label == SIFPotentialLabel.LOW
    assert assessment.routing_decision == RoutingDecision.LOG_ONLY

def test_sif_scoring_high_sif_unverified_barrier():
    # High energy + unverified barrier + exposure = HIGH SIF
    ext = ExtractionResult(
        activity="mechanical_electrical_maintenance",
        activity_criticality=2,
        hazards=[
            ExtractedHazard(
                canonical_hazard="stored_pressurized_energy",
                display_name="Stored / Pressurized Energy",
                energy_type="pressure",
                energy_level=3
            )
        ],
        energy_type="pressure",
        energy_level=3,
        exposure=ExtractedExposure(present=True, proximity=2),
        barriers=[
            ExtractedBarrier(
                canonical_barrier="positive_energy_isolation",
                display_name="Positive Energy Isolation",
                barrier_status=BarrierStatusEnum.UNVERIFIED
            )
        ],
        confidence=0.95
    )
    assessment = score_sif(ext)
    assert assessment.raw_score >= 5.0
    assert assessment.sif_potential_label == SIFPotentialLabel.HIGH
    assert assessment.routing_decision == RoutingDecision.PRIORITY_QUEUE
    assert assessment.process_safety_relevant is True

def test_sif_scoring_sparse_insufficient_evidence():
    # Sparse report routes to human review
    ext = ExtractionResult(
        activity="general_operations",
        exposure=ExtractedExposure(present=True),
        confidence=0.42
    )
    assessment = score_sif(ext, is_sparse=True)
    assert assessment.sif_potential_label == SIFPotentialLabel.INSUFFICIENT_EVIDENCE
    assert assessment.routing_decision == RoutingDecision.ROUTE_TO_HUMAN_REVIEW

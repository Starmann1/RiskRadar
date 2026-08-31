from typing import Tuple, List, Dict, Any
from app.schemas.domain import (
    SIFPotentialLabel,
    RoutingDecision,
    ComponentScores,
    SIFAssessment,
    ExtractionResult,
    BarrierStatusEnum
)

DEFAULT_WEIGHTS = {
    "exposure": 2.0,
    "energy": 1.0,
    "barrier": 1.2,
    "proximity": 1.0,
    "activity": 0.8,
}

BARRIER_SCORES = {
    BarrierStatusEnum.VERIFIED_INTACT: 0,
    BarrierStatusEnum.DEGRADED: 1,
    BarrierStatusEnum.UNVERIFIED: 2,
    BarrierStatusEnum.WEAK: 3,
    BarrierStatusEnum.MISSING: 3,
    BarrierStatusEnum.FAILED: 3,
    BarrierStatusEnum.BYPASSED: 3,
}

def calculate_confidence(extraction: ExtractionResult, is_sparse: bool) -> float:
    """
    Computes an independent confidence score (0.0 to 1.0) based on extraction
    completeness, text evidence presence, and uncertainty tracking.
    Never folds confidence into the risk score itself!
    """
    if is_sparse:
        return 0.42
    
    score = 0.95
    if extraction.uncertainties:
        score -= min(0.35, len(extraction.uncertainties) * 0.15)
    
    if not extraction.hazards:
        score -= 0.25
    
    if not extraction.barriers:
        score -= 0.15
        
    if extraction.contradictions_detected:
        score -= 0.05

    return max(0.20, min(0.99, round(score, 2)))

def score_sif(
    extraction: ExtractionResult,
    is_sparse: bool = False,
    weights: Dict[str, float] = DEFAULT_WEIGHTS
) -> SIFAssessment:
    """
    Pure deterministic arithmetic scoring over extracted safety fields.
    Zero LLM calls inside this function — 100% auditable and reproducible.
    """
    exposure_present = extraction.exposure.present
    energy_level = max(0, min(3, extraction.energy_level))
    proximity = max(0, min(2, extraction.exposure.proximity))
    activity_criticality = max(0, min(2, extraction.activity_criticality))
    
    # Barrier status score calculation
    if extraction.barriers:
        primary_barrier = extraction.barriers[0]
        barrier_score = BARRIER_SCORES.get(primary_barrier.barrier_status, 2)
    else:
        barrier_score = 2 # default to unverified if not stated

    component_scores = ComponentScores(
        exposure=1 if exposure_present else 0,
        energy=energy_level,
        barrier=barrier_score,
        proximity=proximity,
        activity=activity_criticality
    )

    # If no credible exposure path to harm, score is 0.0
    if not exposure_present:
        raw_score = 0.0
    else:
        unscaled = (
            weights["exposure"] * 1
            + weights["energy"] * energy_level
            + weights["barrier"] * barrier_score
            + weights["proximity"] * proximity
            + weights["activity"] * activity_criticality
        )
        # Scale arithmetic score to clean 0.0 - 10.0 range (max unscaled is 12.2)
        raw_score = round(min(10.0, (unscaled / 12.2) * 10.0), 1)

    confidence = calculate_confidence(extraction, is_sparse)

    # Decision Banding (Chapter 26)
    reasons: List[str] = []
    if confidence < 0.55:
        label = SIFPotentialLabel.INSUFFICIENT_EVIDENCE
        routing = RoutingDecision.ROUTE_TO_HUMAN_REVIEW
        reasons.append("Sparse or ambiguous narrative text provided insufficient evidence for automated scoring.")
        reasons.append("Report routed to HSE Specialist for manual investigation and interview.")
    else:
        # Decision Banding (DEKRA Martin & Black 2015 / EEI SCL Model on 0-10 scale)
        if not exposure_present or raw_score == 0.0:
            label = SIFPotentialLabel.LOW
        elif any(h.canonical_hazard == "mechanical_ergonomic" for h in extraction.hazards):
            label = SIFPotentialLabel.LOW
        elif barrier_score == 1 and energy_level <= 2: # Degraded barrier caught pre-exposure in moderate/low energy
            label = SIFPotentialLabel.MEDIUM
        elif energy_level >= 3 and exposure_present and barrier_score >= 1:
            label = SIFPotentialLabel.HIGH
        elif raw_score >= 5.0:
            label = SIFPotentialLabel.HIGH
        elif raw_score >= 2.0:
            label = SIFPotentialLabel.MEDIUM
        else:
            label = SIFPotentialLabel.LOW

        # Low confidence high/medium goes to human review
        if label in (SIFPotentialLabel.HIGH, SIFPotentialLabel.MEDIUM) and confidence < 0.70:
            routing = RoutingDecision.ROUTE_TO_HUMAN_REVIEW
            reasons.append("Elevated risk potential flagged with moderate extraction certainty — mandatory human review.")
        elif label == SIFPotentialLabel.HIGH:
            routing = RoutingDecision.PRIORITY_QUEUE
        else:
            routing = RoutingDecision.LOG_ONLY

        # Explainable reasons
        if exposure_present:
            reasons.append(f"Personnel exposure confirmed in proximity zone (proximity level = {proximity}).")
        else:
            reasons.append("No personnel were within the credible line-of-fire exposure zone (exposure = 0).")

        if energy_level >= 2:
            reasons.append(f"High/Moderate energy hazard identified: {extraction.energy_type.capitalize()} (level {energy_level}/3).")
        
        if extraction.barriers:
            b_status = extraction.barriers[0].barrier_status.value
            b_name = extraction.barriers[0].display_name
            reasons.append(f"Critical barrier '{b_name}' identified in {b_status} state.")

        if activity_criticality == 2:
            reasons.append(f"Task '{extraction.activity.replace('_', ' ').title()}' is a high-consequence lifecycle activity.")

    # Process Safety relevance
    process_safety_relevant = any(
        h.canonical_hazard in ("stored_pressurized_energy", "hydrocarbon_loss_of_containment", "bypassed_safety_controls", "process_upset_blowout", "toxic_gas_h2s", "fire_explosion")
        for h in extraction.hazards
    )

    return SIFAssessment(
        raw_score=raw_score,
        sif_potential_label=label,
        confidence=confidence,
        routing_decision=routing,
        component_scores=component_scores,
        process_safety_relevant=process_safety_relevant,
        reasons=reasons
    )

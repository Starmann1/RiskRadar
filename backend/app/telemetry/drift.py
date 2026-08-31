from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from app.telemetry.state_vector import SafetyStateVector

class StateDelta(BaseModel):
    delta_energy: float
    delta_exposure: float
    delta_barrier_health: float
    delta_sif_potential: float
    delta_composite: float
    risk_drift_score: float
    drift_level: str

# Configurable Weights for Risk Drift Calculation (HSE calibrated)
DRIFT_WEIGHTS = {
    "energy": 0.25,
    "exposure": 0.25,
    "barrier_weakness": 0.30,  # Negative change in barrier health adds to drift
    "sif_potential": 0.20
}

def calculate_risk_drift(current_state: SafetyStateVector, previous_state: Optional[SafetyStateVector] = None) -> StateDelta:
    """
    Calculates the explainable Risk Drift between two consecutive safety states.
    ΔState = State(t) - State(t-1)
    """
    if not previous_state:
        return StateDelta(
            delta_energy=0.0,
            delta_exposure=0.0,
            delta_barrier_health=0.0,
            delta_sif_potential=0.0,
            delta_composite=0.0,
            risk_drift_score=0.0,
            drift_level="BASELINE"
        )
    
    d_energy = current_state.energy_intensity - previous_state.energy_intensity
    d_exp = current_state.exposure_level - previous_state.exposure_level
    d_barrier = current_state.barrier_health - previous_state.barrier_health
    d_sif = current_state.sif_potential - previous_state.sif_potential
    d_comp = current_state.composite_risk_index - previous_state.composite_risk_index

    # Risk Drift Formula:
    # Increased energy (+), Increased exposure (+), Decreased barrier health (+), Increased SIF (+)
    barrier_weakening = -d_barrier  # Loss of health is a positive drift in risk
    
    raw_drift = (
        (DRIFT_WEIGHTS["energy"] * d_energy) +
        (DRIFT_WEIGHTS["exposure"] * d_exp) +
        (DRIFT_WEIGHTS["barrier_weakness"] * barrier_weakening) +
        (DRIFT_WEIGHTS["sif_potential"] * d_sif)
    )

    drift_score = round(max(-100.0, min(100.0, raw_drift)), 1)

    if drift_score >= 35.0:
        drift_level = "CRITICAL"
    elif drift_score >= 18.0:
        drift_level = "HIGH"
    elif drift_score >= 8.0:
        drift_level = "MODERATE"
    elif drift_score <= -8.0:
        drift_level = "IMPROVING"
    else:
        drift_level = "STABLE"

    return StateDelta(
        delta_energy=round(d_energy, 1),
        delta_exposure=round(d_exp, 1),
        delta_barrier_health=round(d_barrier, 1),
        delta_sif_potential=round(d_sif, 1),
        delta_composite=round(d_comp, 1),
        risk_drift_score=drift_score,
        drift_level=drift_level
    )

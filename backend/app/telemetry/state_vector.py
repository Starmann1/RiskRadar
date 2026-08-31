from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from app.schemas.domain import ReportResponse, BarrierStatusEnum, SIFPotentialLabel

class SafetyStateVector(BaseModel):
    energy_intensity: float = Field(..., description="Estimated energy level normalized 0-100")
    exposure_level: float = Field(..., description="Personnel exposure severity normalized 0-100")
    barrier_health: float = Field(..., description="Integrity/verification of safety barriers 0-100")
    activity_criticality: float = Field(..., description="Inherent task criticality 0-100")
    sif_potential: float = Field(..., description="SIF potential score normalized 0-100")
    evidence_confidence: float = Field(..., description="AI NLP extraction grounding confidence 0-100")
    composite_risk_index: float = Field(..., description="Overall calculated instantaneous risk score 0-100")

# Activity Criticality Matrix (Configurable for HSE Team)
ACTIVITY_CRITICALITY_MAP: Dict[str, float] = {
    "exploration_drilling": 90.0,
    "confined_space_entry": 88.0,
    "hot_work_welding": 85.0,
    "lifting_rigging": 82.0,
    "simultaneous_operations": 80.0,
    "mechanical_electrical_maintenance": 65.0,
    "work_at_height": 70.0,
    "hazardous_chemical_handling": 75.0,
    "pipeline_pigging_operations": 68.0,
    "routine_inspection_patrol": 25.0,
    "other_operations": 40.0
}

# Barrier Health Score Mapping (Distinct unverified vs failed)
BARRIER_HEALTH_MAP: Dict[str, float] = {
    "VERIFIED_INTACT": 100.0,
    "DEGRADED": 60.0,
    "UNVERIFIED": 35.0,
    "WEAK": 20.0,
    "MISSING": 5.0,
    "BYPASSED": 0.0,
    "FAILED": 0.0
}

def calculate_safety_state_vector(report: Any) -> SafetyStateVector:
    """
    Computes a deterministic, explainable 6-dimensional Safety State Vector for a given report.
    Scale: 0.0 to 100.0 for every dimension.
    """
    # 1. Energy Intensity
    energy_lvl = 2
    if hasattr(report, "extraction") and report.extraction:
        energy_lvl = getattr(report.extraction, "energy_level", 2) or 2
    elif isinstance(report, dict) and "extraction" in report:
        energy_lvl = report["extraction"].get("energy_level", 2) or 2

    # Map energy level (1-3) to 0-100 scale
    energy_intensity = 35.0 if energy_lvl == 1 else (70.0 if energy_lvl == 2 else 95.0)

    # 2. Exposure Level
    exp_sev = 2
    if hasattr(report, "extraction") and report.extraction:
        exp_sev = getattr(report.extraction, "exposure_severity", 2) or 2
    elif isinstance(report, dict) and "extraction" in report:
        exp_sev = report["extraction"].get("exposure_severity", 2) or 2
    
    exposure_level = 30.0 if exp_sev == 1 else (65.0 if exp_sev == 2 else 92.0)

    # 3. Barrier Health
    barrier_st = "UNVERIFIED"
    if hasattr(report, "extraction") and report.extraction and report.extraction.barriers:
        barrier_st = report.extraction.barriers[0].barrier_status or "UNVERIFIED"
    elif isinstance(report, dict) and "extraction" in report and report["extraction"].get("barriers"):
        barrier_st = report["extraction"]["barriers"][0].get("barrier_status", "UNVERIFIED")
    
    barrier_health = BARRIER_HEALTH_MAP.get(str(barrier_st).upper(), 35.0)

    # 4. Activity Criticality
    act_raw = ""
    if hasattr(report, "activity"):
        act_raw = (report.activity or "").lower()
    elif isinstance(report, dict):
        act_raw = (report.get("activity") or "").lower()
    
    activity_criticality = ACTIVITY_CRITICALITY_MAP.get(act_raw, 50.0)

    # 5. SIF Potential
    raw_sif = 5.0
    if hasattr(report, "assessment") and report.assessment:
        raw_sif = getattr(report.assessment, "raw_score", 5.0) or 5.0
    elif isinstance(report, dict) and "assessment" in report:
        raw_sif = report["assessment"].get("raw_score", 5.0) or 5.0
    
    # Scale from 0-12 to 0-100
    sif_potential = min(100.0, max(0.0, (float(raw_sif) / 10.0) * 100.0))

    # 6. Evidence Confidence
    conf = 0.92
    if hasattr(report, "assessment") and report.assessment:
        conf = getattr(report.assessment, "confidence", 0.92) or 0.92
    elif isinstance(report, dict) and "assessment" in report:
        conf = report["assessment"].get("confidence", 0.92) or 0.92
    
    evidence_confidence = min(100.0, max(10.0, float(conf) * 100.0))

    # Composite Risk Index (Deterministic weighted aggregation)
    # High energy, high exposure, weak barrier (100 - health), high criticality, high SIF
    barrier_weakness = 100.0 - barrier_health
    composite_risk_index = round(
        (0.25 * energy_intensity) +
        (0.25 * exposure_level) +
        (0.25 * barrier_weakness) +
        (0.15 * sif_potential) +
        (0.10 * activity_criticality),
        1
    )

    return SafetyStateVector(
        energy_intensity=round(energy_intensity, 1),
        exposure_level=round(exposure_level, 1),
        barrier_health=round(barrier_health, 1),
        activity_criticality=round(activity_criticality, 1),
        sif_potential=round(sif_potential, 1),
        evidence_confidence=round(evidence_confidence, 1),
        composite_risk_index=composite_risk_index
    )

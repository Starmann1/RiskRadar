import pytest
from app.telemetry.state_vector import calculate_safety_state_vector, SafetyStateVector
from app.telemetry.drift import calculate_risk_drift, StateDelta
from app.telemetry.trajectory import compute_site_telemetry
from app.telemetry.synthetic_scenario import get_synthetic_demonstration_scenario

def test_safety_state_vector_calculation():
    """Test deterministic 6-dimensional state vector computation."""
    mock_report = {
        "activity": "mechanical_electrical_maintenance",
        "extraction": {
            "energy_level": 3,
            "exposure_severity": 3,
            "barriers": [{"barrier_status": "UNVERIFIED", "barrier_type": "LOTO"}]
        },
        "assessment": {
            "raw_score": 9.2,
            "confidence": 0.95
        }
    }
    vec = calculate_safety_state_vector(mock_report)
    assert vec.energy_intensity == 95.0
    assert vec.exposure_level == 92.0
    assert vec.barrier_health == 35.0  # UNVERIFIED barrier health is 35 (distinct from failed = 0)
    assert vec.activity_criticality == 65.0
    assert vec.sif_potential == 92.0
    assert vec.composite_risk_index > 70.0

def test_risk_drift_between_states():
    """Test explainable risk drift between consecutive states."""
    state1 = SafetyStateVector(
        energy_intensity=40.0,
        exposure_level=30.0,
        barrier_health=100.0,
        activity_criticality=50.0,
        sif_potential=20.0,
        evidence_confidence=95.0,
        composite_risk_index=25.0
    )
    state2 = SafetyStateVector(
        energy_intensity=85.0,
        exposure_level=80.0,
        barrier_health=20.0,
        activity_criticality=80.0,
        sif_potential=85.0,
        evidence_confidence=92.0,
        composite_risk_index=75.0
    )
    delta = calculate_risk_drift(state2, state1)
    assert delta.delta_energy == 45.0
    assert delta.delta_exposure == 50.0
    assert delta.delta_barrier_health == -80.0  # Barrier weakened by 80%
    assert delta.risk_drift_score > 30.0
    assert delta.drift_level in ["HIGH", "CRITICAL"]

def test_single_high_risk_report_does_not_force_critical_trajectory():
    """Test requirement: A single isolated high report must not create a critical trajectory without temporal sequence."""
    reports = [
        # Normal baseline log
        type("MockReport", (), {
            "site": "Test Site Alpha",
            "report_date": "2026-08-01",
            "activity": "routine_inspection_patrol",
            "extraction": type("Ext", (), {"energy_level": 1, "exposure_severity": 1, "barriers": [type("B", (), {"barrier_status": "VERIFIED_INTACT", "barrier_type": "Guard"})], "hazards": []}),
            "assessment": type("Ass", (), {"raw_score": 1.0, "sif_potential_label": "LOW", "confidence": 0.98}),
            "narrative_text": "Routine perimeter walk completed. No hazards."
        })(),
        # Single high score observation
        type("MockReport", (), {
            "site": "Test Site Alpha",
            "report_date": "2026-08-02",
            "activity": "hot_work_welding",
            "extraction": type("Ext", (), {"energy_level": 3, "exposure_severity": 2, "barriers": [type("B", (), {"barrier_status": "VERIFIED_INTACT", "barrier_type": "Fire Blanket"})], "hazards": []}),
            "assessment": type("Ass", (), {"raw_score": 8.0, "sif_potential_label": "HIGH", "confidence": 0.92}),
            "narrative_text": "Welding completed with active fire watch and verified screens."
        })(),
        # Follow-up normal baseline log
        type("MockReport", (), {
            "site": "Test Site Alpha",
            "report_date": "2026-08-03",
            "activity": "routine_inspection_patrol",
            "extraction": type("Ext", (), {"energy_level": 1, "exposure_severity": 1, "barriers": [type("B", (), {"barrier_status": "VERIFIED_INTACT", "barrier_type": "Guard"})], "hazards": []}),
            "assessment": type("Ass", (), {"raw_score": 1.0, "sif_potential_label": "LOW", "confidence": 0.98}),
            "narrative_text": "Routine patrol verified barriers intact."
        })()
    ]
    res = compute_site_telemetry(reports, "Test Site Alpha")
    # Should be STABLE or EMERGING, NOT CRITICAL because barriers remained intact and baseline resumed
    assert res["trajectory_status"] in ["STABLE", "EMERGING"]
    assert res["trajectory_status"] != "CRITICAL"

def test_synthetic_demonstration_scenario():
    """Verify the 6-week progressive deterioration demo."""
    demo = get_synthetic_demonstration_scenario()
    assert demo["is_synthetic_demo"] is True
    assert demo["total_points"] == 6
    assert demo["trajectory_status"] in ["DETERIORATING", "CRITICAL"]
    assert "explanation" in demo
    assert "primary_driver" in demo["explanation"]

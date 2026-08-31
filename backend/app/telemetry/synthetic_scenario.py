from typing import Dict, Any

def get_synthetic_demonstration_scenario() -> Dict[str, Any]:
    """
    Controlled 6-week progressive deterioration scenario for HSE telemetry demonstration.
    Clearly marked as 'Prototype / Synthetic Demonstration Data'.
    
    Week 1: Barrier healthy, low exposure (Stable baseline)
    Week 2: Verification step skipped (Latent gap)
    Week 3: Repeated isolation issue noted
    Week 4: Hydrocarbon pressure exposure in active line
    Week 5: Interlock bypassed during maintenance
    Week 6: Near-miss high-pressure blowout / gas release
    """
    timeline = [
        {
            "point_id": "demo-w1",
            "time_label": "Week 1",
            "date": "2026-07-07",
            "report_id": "SYN-101",
            "external_ref": "DOC-SYN-01",
            "activity": "Routine Maintenance",
            "hazard": "Stored Pressurized Gas",
            "barrier": "Double Block & Bleed Isolation",
            "barrier_status": "VERIFIED_INTACT",
            "sif_score": 1.2,
            "sif_label": "LOW",
            "confidence": 0.98,
            "narrative_excerpt": "Routine filter cartridge replacement on Gas Compressor Skid 2. Positive zero-energy isolation verified with local pressure gauge prior to opening manifold.",
            "state_vector": {
                "energy_intensity": 40.0,
                "exposure_level": 25.0,
                "barrier_health": 100.0,
                "activity_criticality": 55.0,
                "sif_potential": 12.0,
                "evidence_confidence": 98.0,
                "composite_risk_index": 22.5
            },
            "delta": {
                "delta_energy": 0.0,
                "delta_exposure": 0.0,
                "delta_barrier_health": 0.0,
                "delta_sif_potential": 0.0,
                "delta_composite": 0.0,
                "risk_drift_score": 0.0,
                "drift_level": "BASELINE"
            },
            "composite_risk": 22.5
        },
        {
            "point_id": "demo-w2",
            "time_label": "Week 2",
            "date": "2026-07-14",
            "report_id": "SYN-102",
            "external_ref": "DOC-SYN-02",
            "activity": "Mechanical Maintenance",
            "hazard": "Stored Hydraulic Fluid",
            "barrier": "LOTO Lockout Tagout",
            "barrier_status": "UNVERIFIED",
            "sif_score": 3.8,
            "sif_label": "LOW",
            "confidence": 0.94,
            "narrative_excerpt": "Maintenance crew performed scheduled cylinder seal replacement. Isolation was assumed complete from morning shift log, but lockbox verification was skipped.",
            "state_vector": {
                "energy_intensity": 55.0,
                "exposure_level": 45.0,
                "barrier_health": 35.0,
                "activity_criticality": 60.0,
                "sif_potential": 38.0,
                "evidence_confidence": 94.0,
                "composite_risk_index": 52.0
            },
            "delta": {
                "delta_energy": 15.0,
                "delta_exposure": 20.0,
                "delta_barrier_health": -65.0,
                "delta_sif_potential": 26.0,
                "delta_composite": 29.5,
                "risk_drift_score": 33.4,
                "drift_level": "HIGH"
            },
            "composite_risk": 52.0
        },
        {
            "point_id": "demo-w3",
            "time_label": "Week 3",
            "date": "2026-07-21",
            "report_id": "SYN-103",
            "external_ref": "DOC-SYN-03",
            "activity": "Valve Replacement",
            "hazard": "Flammable Hydrocarbon Gas",
            "barrier": "Isolation Blind Flange",
            "barrier_status": "DEGRADED",
            "sif_score": 6.5,
            "sif_label": "MEDIUM",
            "confidence": 0.91,
            "narrative_excerpt": "Technicians noted slight seepage past upstream gate valve during bonnet unbolting. Gasket was degraded; work continued under temporary drip pan workaround.",
            "state_vector": {
                "energy_intensity": 70.0,
                "exposure_level": 60.0,
                "barrier_health": 60.0,
                "activity_criticality": 68.0,
                "sif_potential": 65.0,
                "evidence_confidence": 91.0,
                "composite_risk_index": 59.0
            },
            "delta": {
                "delta_energy": 15.0,
                "delta_exposure": 15.0,
                "delta_barrier_health": 25.0,
                "delta_sif_potential": 27.0,
                "delta_composite": 7.0,
                "risk_drift_score": 10.4,
                "drift_level": "MODERATE"
            },
            "composite_risk": 59.0
        },
        {
            "point_id": "demo-w4",
            "time_label": "Week 4",
            "date": "2026-07-28",
            "report_id": "SYN-104",
            "external_ref": "DOC-SYN-04",
            "activity": "Hot Work Welding",
            "hazard": "Condensate Line Pressure",
            "barrier": "Physical Spacing & Positive Blind",
            "barrier_status": "WEAK",
            "sif_score": 8.2,
            "sif_label": "HIGH",
            "confidence": 0.88,
            "narrative_excerpt": "Structural welding permitted 1.8m from pressurized condensate line. Positive physical barrier blind was not installed; reliance on single closed plug cock valve.",
            "state_vector": {
                "energy_intensity": 85.0,
                "exposure_level": 80.0,
                "barrier_health": 20.0,
                "activity_criticality": 85.0,
                "sif_potential": 82.0,
                "evidence_confidence": 88.0,
                "composite_risk_index": 76.5
            },
            "delta": {
                "delta_energy": 15.0,
                "delta_exposure": 20.0,
                "delta_barrier_health": -40.0,
                "delta_sif_potential": 17.0,
                "delta_composite": 17.5,
                "risk_drift_score": 24.1,
                "drift_level": "HIGH"
            },
            "composite_risk": 76.5
        },
        {
            "point_id": "demo-w5",
            "time_label": "Week 5",
            "date": "2026-08-04",
            "report_id": "SYN-105",
            "external_ref": "DOC-SYN-05",
            "activity": "Confined Space Entry",
            "hazard": "Toxic H2S & Combustible Gas",
            "barrier": "Continuous Gas Monitoring & LOTO",
            "barrier_status": "BYPASSED",
            "sif_score": 9.4,
            "sif_label": "HIGH",
            "confidence": 0.95,
            "narrative_excerpt": "Vessel entry commenced with temporary ventilation ducting. Continuous multi-gas detector alarm was disabled due to nuisance chirping while 2 contractors worked inside.",
            "state_vector": {
                "energy_intensity": 95.0,
                "exposure_level": 92.0,
                "barrier_health": 0.0,
                "activity_criticality": 88.0,
                "sif_potential": 94.0,
                "evidence_confidence": 95.0,
                "composite_risk_index": 89.8
            },
            "delta": {
                "delta_energy": 10.0,
                "delta_exposure": 12.0,
                "delta_barrier_health": -20.0,
                "delta_sif_potential": 12.0,
                "delta_composite": 13.3,
                "risk_drift_score": 14.9,
                "drift_level": "MODERATE"
            },
            "composite_risk": 89.8
        },
        {
            "point_id": "demo-w6",
            "time_label": "Week 6",
            "date": "2026-08-11",
            "report_id": "SYN-106",
            "external_ref": "DOC-SYN-06",
            "activity": "High Pressure Gas Operations",
            "hazard": "Hydrocarbon Gas Release (120 Bar)",
            "barrier": "Emergency Shutdown Valve (ESDV)",
            "barrier_status": "FAILED",
            "sif_score": 9.8,
            "sif_label": "HIGH",
            "confidence": 0.96,
            "narrative_excerpt": "Uncontrolled gas release during startup of Separator Bank B. Primary isolation failed under line pressure. Near-miss catastrophic ignition intercepted by automatic deluge.",
            "state_vector": {
                "energy_intensity": 100.0,
                "exposure_level": 95.0,
                "barrier_health": 0.0,
                "activity_criticality": 90.0,
                "sif_potential": 98.0,
                "evidence_confidence": 96.0,
                "composite_risk_index": 92.5
            },
            "delta": {
                "delta_energy": 5.0,
                "delta_exposure": 3.0,
                "delta_barrier_health": 0.0,
                "delta_sif_potential": 4.0,
                "delta_composite": 2.7,
                "risk_drift_score": 2.8,
                "drift_level": "STABLE"
            },
            "composite_risk": 92.5
        }
    ]

    return {
        "is_synthetic_demo": True,
        "scenario_name": "Progressive Isolation Barrier Degradation Sequence",
        "badge_label": "Prototype / Synthetic Demonstration Scenario",
        "site": "Moran Drilling Rig 7 • High-Pressure Manifold",
        "activity": "Mechanical Maintenance & Pressure Operations",
        "trajectory_status": "DETERIORATING",
        "trajectory_badge": "🔴 CRITICAL TRAJECTORY",
        "risk_drift_label": "CRITICAL",
        "color": "#dc2626",
        "total_points": 6,
        "timeline": timeline,
        "explanation": {
            "primary_driver": "Progressive barrier degradation and repeated isolation verification omissions",
            "contributing_factors": [
                "Barrier health collapsed from 100% (Week 1) to 0% (Week 6)",
                "Personnel exposure increased from Low (25%) to Extreme (95%)",
                "SIF precursor potential elevated from 1.2/10 to 9.8/10",
                "Successive degradation went unintercepted across 6 operational shifts"
            ],
            "what_is_changing": {
                "barrier_health": "DOWN",
                "exposure": "UP",
                "sif_potential": "UP",
                "energy": "UP"
            },
            "hse_recommendation": "Critical trajectory — Immediate HSE investigation and positive isolation verification recommended across all drilling manifolds."
        }
    }

from typing import List, Dict, Any, Optional
from datetime import datetime
from app.telemetry.state_vector import calculate_safety_state_vector, SafetyStateVector
from app.telemetry.drift import calculate_risk_drift, StateDelta
from app.telemetry.explanation import generate_trajectory_explanation

def compute_site_telemetry(reports: List[Any], site_name: str, activity_filter: Optional[str] = None) -> Dict[str, Any]:
    """
    Processes all reports for a specific site over time to produce:
    1. Chronological Safety State Sequence
    2. Inter-report State Deltas (Risk Drift)
    3. Trajectory Status (🟢 STABLE, 🟡 EMERGING, 🟠 DETERIORATING, 🔴 CRITICAL)
    4. Causal Explanation & What is changing
    """
    # 1. Filter reports for site
    site_reports = [
        r for r in reports
        if (getattr(r, "site", "") or "").lower().startswith(site_name.lower()) or
           site_name.lower() in (getattr(r, "site", "") or "").lower()
    ]

    if activity_filter and activity_filter.strip():
        site_reports = [
            r for r in site_reports
            if (getattr(r, "activity", "") or "").lower() == activity_filter.lower()
        ]

    if len(site_reports) < 2:
        # Fallback to general repository if site has very few logs
        if not site_reports:
            site_reports = reports[:6]

    # 2. Sort chronologically
    def parse_date(r):
        d_str = getattr(r, "report_date", "2026-01-01") or "2026-01-01"
        try:
            return datetime.strptime(d_str[:10], "%Y-%m-%d")
        except Exception:
            return datetime(2026, 1, 1)

    sorted_reports = sorted(site_reports, key=parse_date)

    timeline_points = []
    prev_vector: Optional[SafetyStateVector] = None
    cumulative_drift = 0.0

    for idx, r in enumerate(sorted_reports):
        state_vec = calculate_safety_state_vector(r)
        delta = calculate_risk_drift(state_vec, prev_vector)
        cumulative_drift += delta.risk_drift_score

        # Format timeline label
        d_str = getattr(r, "report_date", "") or "2026-08-30"
        label = f"W{idx+1}" if len(sorted_reports) <= 8 else d_str[5:10]

        barrier_name = "Isolation Barrier"
        barrier_status = "UNVERIFIED"
        if hasattr(r, "extraction") and r.extraction and r.extraction.barriers:
            barrier_name = r.extraction.barriers[0].barrier_type or "Positive Isolation"
            barrier_status = r.extraction.barriers[0].barrier_status or "UNVERIFIED"

        hazard_name = "Hazardous Energy"
        if hasattr(r, "extraction") and r.extraction and r.extraction.hazards:
            hazard_name = r.extraction.hazards[0].display_name or "Stored Pressure"

        timeline_points.append({
            "point_id": f"pt-{idx+1}",
            "time_label": label,
            "date": d_str,
            "report_id": getattr(r, "report_id", f"R-{idx+1}"),
            "external_ref": getattr(r, "external_ref", f"DOC-{idx+1}"),
            "activity": getattr(r, "activity", "Maintenance").replace("_", " ").title(),
            "hazard": hazard_name,
            "barrier": barrier_name,
            "barrier_status": barrier_status,
            "sif_score": getattr(r.assessment, "raw_score", 5.0) if hasattr(r, "assessment") and r.assessment else 5.0,
            "sif_label": getattr(r.assessment, "sif_potential_label", "LOW") if hasattr(r, "assessment") and r.assessment else "LOW",
            "confidence": getattr(r.assessment, "confidence", 0.94) if hasattr(r, "assessment") and r.assessment else 0.94,
            "narrative_excerpt": getattr(r, "narrative_text", "")[:120] + "...",
            "state_vector": state_vec.model_dump(),
            "delta": delta.model_dump(),
            "composite_risk": state_vec.composite_risk_index
        })

        prev_vector = state_vec

    # 3. Classify Trajectory
    # Based on composite trajectory slope, final barrier health, and risk drift
    avg_risk = sum(p["composite_risk"] for p in timeline_points) / max(1, len(timeline_points))
    recent_points = timeline_points[-3:] if len(timeline_points) >= 3 else timeline_points
    recent_risk = sum(p["composite_risk"] for p in recent_points) / max(1, len(recent_points))
    last_barrier_health = timeline_points[-1]["state_vector"]["barrier_health"] if timeline_points else 50.0

    net_shift = recent_risk - timeline_points[0]["composite_risk"] if timeline_points else 0.0

    if recent_risk >= 70.0 and (last_barrier_health <= 25.0 or net_shift >= 25.0):
        trajectory_status = "CRITICAL"
        trajectory_badge = "🔴 CRITICAL TRAJECTORY"
        risk_drift_label = "CRITICAL"
        color = "#dc2626"
    elif net_shift >= 15.0 or recent_risk >= 60.0:
        trajectory_status = "DETERIORATING"
        trajectory_badge = "🟠 DETERIORATING"
        risk_drift_label = "HIGH"
        color = "#ea580c"
    elif net_shift >= 6.0 or recent_risk >= 45.0:
        trajectory_status = "EMERGING"
        trajectory_badge = "🟡 EMERGING"
        risk_drift_label = "MODERATE"
        color = "#d97706"
    else:
        trajectory_status = "STABLE"
        trajectory_badge = "🟢 STABLE"
        risk_drift_label = "CONTROLLED"
        color = "#059669"

    explanation = generate_trajectory_explanation(trajectory_status, timeline_points, cumulative_drift)

    return {
        "site": site_name,
        "trajectory_status": trajectory_status,
        "trajectory_badge": trajectory_badge,
        "risk_drift_label": risk_drift_label,
        "color": color,
        "total_points": len(timeline_points),
        "timeline": timeline_points,
        "explanation": explanation
    }

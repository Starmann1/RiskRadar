from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from app.db.repository import repository
from app.telemetry.trajectory import compute_site_telemetry
from app.telemetry.synthetic_scenario import get_synthetic_demonstration_scenario

router = APIRouter(prefix="/telemetry", tags=["SIF Telemetry Engine"])

@router.get("/synthetic-demo")
def get_synthetic_demo():
    """
    Returns the controlled 6-week progressive deterioration scenario.
    Clearly labelled as Prototype / Synthetic Demonstration Data.
    """
    return get_synthetic_demonstration_scenario()

@router.get("/sites-summary")
def get_all_sites_telemetry_summary():
    """
    Returns cross-site trajectory classifications for comparison across all OIL installations.
    """
    reports = repository.list_reports()
    
    # Unique sites in repository
    site_names = [
        "Crude Oil Terminal",
        "Refinery",
        "NRL Hydrocracker Unit 2",
        "Duliajan Central",
        "Moran Oilfield",
        "Digboi Refinery"
    ]
    
    summaries = []
    for s in site_names:
        telem = compute_site_telemetry(reports, s)
        summaries.append({
            "site": s,
            "trajectory_status": telem["trajectory_status"],
            "trajectory_badge": telem["trajectory_badge"],
            "risk_drift_label": telem["risk_drift_label"],
            "color": telem["color"],
            "total_points": telem["total_points"],
            "primary_driver": telem["explanation"]["primary_driver"],
            "hse_recommendation": telem["explanation"]["hse_recommendation"]
        })
    
    # Include synthetic scenario site
    demo = get_synthetic_demonstration_scenario()
    summaries.insert(0, {
        "site": "Moran Drilling Rig 7 (Demo Scenario)",
        "trajectory_status": demo["trajectory_status"],
        "trajectory_badge": demo["trajectory_badge"],
        "risk_drift_label": demo["risk_drift_label"],
        "color": demo["color"],
        "total_points": demo["total_points"],
        "primary_driver": demo["explanation"]["primary_driver"],
        "hse_recommendation": demo["explanation"]["hse_recommendation"],
        "is_synthetic": True
    })

    return {
        "total_sites": len(summaries),
        "summaries": summaries
    }

@router.get("/site/{site_name}")
def get_site_telemetry(site_name: str, activity: Optional[str] = None):
    """
    Returns detailed telemetry timeline, Safety State Vectors, and explainable trajectory for a site.
    """
    if "synthetic" in site_name.lower() or "rig 7" in site_name.lower():
        return get_synthetic_demonstration_scenario()

    reports = repository.list_reports()
    telemetry = compute_site_telemetry(reports, site_name, activity_filter=activity)
    return telemetry

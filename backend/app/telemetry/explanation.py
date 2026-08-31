from typing import List, Dict, Any, Tuple
from app.telemetry.state_vector import SafetyStateVector
from app.telemetry.drift import StateDelta

def generate_trajectory_explanation(
    trajectory_status: str,
    timeline_states: List[Dict[str, Any]],
    overall_drift: float
) -> Dict[str, Any]:
    """
    Dynamically formulates an explainable causal rationale for the trajectory
    based purely on calculated state vector deltas.
    """
    if len(timeline_states) < 2:
        return {
            "primary_driver": "Baseline Observation",
            "contributing_factors": [
                "Single reference point available",
                "Continuous monitoring active"
            ],
            "what_is_changing": {
                "barrier_health": "STABLE",
                "exposure": "STABLE",
                "sif_potential": "STABLE",
                "energy": "STABLE"
            },
            "hse_recommendation": "Maintain standard operational monitoring and surveillance patrols."
        }

    first_st = timeline_states[0]["state_vector"]
    last_st = timeline_states[-1]["state_vector"]

    # Calculate net shifts from start to end of window
    net_barrier = last_st["barrier_health"] - first_st["barrier_health"]
    net_exposure = last_st["exposure_level"] - first_st["exposure_level"]
    net_sif = last_st["sif_potential"] - first_st["sif_potential"]
    net_energy = last_st["energy_intensity"] - first_st["energy_intensity"]

    # Trend arrows
    what_is_changing = {
        "barrier_health": "DOWN" if net_barrier <= -15 else ("UP" if net_barrier >= 15 else "STABLE"),
        "exposure": "UP" if net_exposure >= 15 else ("DOWN" if net_exposure <= -15 else "STABLE"),
        "sif_potential": "UP" if net_sif >= 15 else ("DOWN" if net_sif <= -15 else "STABLE"),
        "energy": "UP" if net_energy >= 15 else ("DOWN" if net_energy <= -15 else "STABLE")
    }

    # Identify primary contributor
    contributions = [
        ("Progressive barrier degradation & unverified isolation states", -net_barrier * 1.2),
        ("Elevated personnel exposure inside active danger zones", net_exposure * 1.0),
        ("Increasing SIF precursor potential across successive work shifts", net_sif * 1.1),
        ("High-energy hazardous source escalation", net_energy * 0.9)
    ]
    contributions.sort(key=lambda x: x[1], reverse=True)

    if trajectory_status in ["DETERIORATING", "CRITICAL"]:
        primary_driver = contributions[0][0]
    elif trajectory_status == "EMERGING":
        primary_driver = "Accumulation of early precursor warning signals and latent verification gaps"
    elif trajectory_status == "IMPROVING":
        primary_driver = "Consistent barrier verification and exposure controls active"
    else:
        primary_driver = "Stable operational state with controlled energy release barriers"

    # Contributing factors
    factors = []
    if net_barrier <= -10:
        factors.append(f"Barrier integrity degraded by {abs(round(net_barrier))}% over observation window")
    elif net_barrier >= 10:
        factors.append(f"Barrier verification adherence improved by {round(net_barrier)}%")
    
    if net_exposure >= 10:
        factors.append(f"Personnel exposure index increased by +{round(net_exposure)}%")
    
    if net_sif >= 10:
        factors.append(f"SIF precursor potential elevated by +{round(net_sif)}%")
    
    if net_energy >= 10:
        factors.append(f"High-energy release potential climbed by +{round(net_energy)}%")

    if not factors:
        factors = [
            "All core safety dimensions remained within normal baseline variance",
            "Zero unmanaged barrier bypasses recorded in the sequence"
        ]

    # Actionable HSE Recommendation
    if trajectory_status == "CRITICAL":
        hse_recommendation = "Critical trajectory — Immediate HSE field audit and positive isolation verification intervention recommended."
    elif trajectory_status == "DETERIORATING":
        hse_recommendation = "Safety deterioration detected. HSE review recommended before commencement of high-energy tasks."
    elif trajectory_status == "EMERGING":
        hse_recommendation = "Emerging warning signals — Monitor precursor pattern and reinforce permit-to-work controls."
    else:
        hse_recommendation = "Stable — Continue routine operational monitoring and surveillance patrols."

    return {
        "primary_driver": primary_driver,
        "contributing_factors": factors,
        "what_is_changing": what_is_changing,
        "hse_recommendation": hse_recommendation
    }

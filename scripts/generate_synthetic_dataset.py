import json
import random
from datetime import datetime, timedelta

# Calibration parameters matching Chapter 12: ~22-26% SIF base rate
random.seed(42)

SITES = [
    "Field Site 4 - Duliajan Central",
    "Moran Oilfield Well #84",
    "Naharkatiya OCS-3",
    "NRL Hydrocracker Unit 2",
    "Digboi Heritage Wellhead 12",
    "Rajasthan Gas Field - Tanot GGS",
    "Naharkatiya-Barauni Pipeline Pump Station 7",
    "Offshore KG Basin Exploration Rig",
    "Duliajan LPG Plant",
    "Jorhat Exploratory Drilling Base",
    "Baghjan Production Facility",
    "Numaligarh Marketing Terminal"
]

ACTIVITIES = [
    ("mechanical_electrical_maintenance", 2),
    ("lifting_rigging", 2),
    ("confined_space_entry", 2),
    ("hot_work_welding", 2),
    ("work_at_height", 2),
    ("exploration_drilling", 2),
    ("well_intervention_completion", 2),
    ("pipeline_transport", 2),
    ("production_operations", 1),
    ("crude_gas_processing", 2),
    ("simultaneous_operations", 2),
    ("routine_inspection_patrol", 0)
]

SIF_TEMPLATES = [
    {
        "hazard": ["stored_pressurized_energy"],
        "energy_type": "pressure",
        "energy_level": 3,
        "barrier": ["positive_energy_isolation"],
        "barrier_failure_type": "UNVERIFIED",
        "lsr": ["ENERGY_ISOLATION"],
        "psf": True,
        "narrative": "During valve replacement on high pressure manifold line, positive isolation double block and bleed was not physically verified with needle bleed valve. Residual hydrocarbon gas hissed when flange bolts were cracked. Worker backed away immediately. Zero injury.",
        "consequence": "High-pressure gas blowout or flash fire injuring technician",
        "proximity": 2
    },
    {
        "hazard": ["suspended_load_dropped_objects", "line_of_fire"],
        "energy_type": "gravitational",
        "energy_level": 3,
        "barrier": ["lift_plan_exclusion_zone"],
        "barrier_failure_type": "WEAK",
        "lsr": ["SAFE_MECHANICAL_LIFTING", "LINE_OF_FIRE"],
        "psf": False,
        "narrative": "Crane rigger stood under suspended 3.8-ton casing bundle during yard stacking operation. Barrier tape was missing on north access corridor. Lift supervisor activated emergency stop.",
        "consequence": "Fatal crushing impact from dropped suspended casing bundle",
        "proximity": 2
    },
    {
        "hazard": ["toxic_gas_h2s", "confined_space"],
        "energy_type": "chemical",
        "energy_level": 3,
        "barrier": ["atmospheric_gas_testing"],
        "barrier_failure_type": "MISSING",
        "lsr": ["CONFINED_SPACE"],
        "psf": True,
        "narrative": "Contractor technician entered mud mixing tank pit to inspect bottom agitator without gas testing or obtaining signed confined space permit. Continuous gas detector was left outside tank hatch.",
        "consequence": "Toxic gas / H2S poisoning and asphyxiation inside enclosed sump",
        "proximity": 2
    },
    {
        "hazard": ["fire_explosion", "hot_work"],
        "energy_type": "thermal",
        "energy_level": 3,
        "barrier": ["fire_watch_flammable_containment"],
        "barrier_failure_type": "MISSING",
        "lsr": ["HOT_WORK"],
        "psf": True,
        "narrative": "Oxy-acetylene cutting carried out within 4 meters of open drain box containing oily condensate sheen. Fire blankets were not rigged and spark containment habitat was absent.",
        "consequence": "Flash fire or vapor explosion in hazardous operating unit",
        "proximity": 1
    },
    {
        "hazard": ["working_at_height"],
        "energy_type": "gravitational",
        "energy_level": 3,
        "barrier": ["certified_fall_protection"],
        "barrier_failure_type": "MISSING",
        "lsr": ["WORKING_AT_HEIGHT"],
        "psf": False,
        "narrative": "Contractor scaffolding helper working on monkey board at 14m elevation without securing dual safety lanyards to certified anchorage cable while passing scaffold tubes.",
        "consequence": "Fatal fall from 14m height onto hard steel sub-structure",
        "proximity": 2
    },
    {
        "hazard": ["bypassed_safety_controls", "hydrocarbon_loss_of_containment"],
        "energy_type": "pressure",
        "energy_level": 3,
        "barrier": ["esd_interlock_integrity"],
        "barrier_failure_type": "BYPASSED",
        "lsr": ["BYPASSING_SAFETY_CONTROLS"],
        "psf": True,
        "narrative": "High-level trip interlock on crude surge vessel was manually bypassed via software override without approved MOC authorization during liquid transfer pump changeover.",
        "consequence": "Surge vessel overfill, catastrophic hydrocarbon release into unconfined area",
        "proximity": 1
    },
    {
        "hazard": ["process_upset_blowout"],
        "energy_type": "pressure",
        "energy_level": 3,
        "barrier": ["blowout_preventer_well_control"],
        "barrier_failure_type": "FAILED",
        "lsr": [],
        "psf": True,
        "narrative": "Annular blowout preventer hydraulic accumulator pressure dropped below minimum operating spec during high-pressure drilling kick drill. Standby bottle bank valve was found closed.",
        "consequence": "Uncontrolled loss of well control leading to surface blowout",
        "proximity": 2
    },
    {
        "hazard": ["simultaneous_operations", "hot_work", "suspended_load_dropped_objects"],
        "energy_type": "gravitational",
        "energy_level": 3,
        "barrier": ["simops_matrix_coordination"],
        "barrier_failure_type": "MISSING",
        "lsr": ["SAFE_MECHANICAL_LIFTING", "HOT_WORK"],
        "psf": True,
        "narrative": "Rigging team conducted crane lift of structural skid over live welding habitat without cross-team coordination or documented SIMOPS authorization.",
        "consequence": "Load impact puncturing habitat and triggering catastrophic fire",
        "proximity": 2
    }
]

NON_SIF_TEMPLATES = [
    {
        "hazard": ["mechanical_ergonomic"],
        "energy_type": "mechanical",
        "energy_level": 1,
        "barrier": ["ergonomic_lifting_aids"],
        "barrier_failure_type": "MISSING",
        "lsr": [],
        "psf": False,
        "narrative": "Operator twisted wrist while hand-turning a stiff valve wheel on water cooling line. Applied ice pack at site first-aid dispensary. No lost work time.",
        "consequence": "Minor soft-tissue wrist sprain",
        "severity": "FIRST_AID",
        "proximity": 1
    },
    {
        "hazard": ["housekeeping_slip_trip"],
        "energy_type": "mechanical",
        "energy_level": 1,
        "barrier": ["housekeeping_standards"],
        "barrier_failure_type": "DEGRADED",
        "lsr": [],
        "psf": False,
        "narrative": "Small patch of rainwater and washdown soap on workshop walkway. Housekeeping crew mopped and placed yellow caution wet floor sign. Nobody fell.",
        "consequence": "Slip on wet floor",
        "severity": "NONE",
        "proximity": 0
    },
    {
        "hazard": ["stored_pressurized_energy"],
        "energy_type": "pressure",
        "energy_level": 1,
        "barrier": ["esd_interlock_integrity"],
        "barrier_failure_type": "VERIFIED_INTACT",
        "lsr": [],
        "psf": False,
        "narrative": "Routine pressure monitoring on trunk pipeline sector confirmed 48 bar pressure stable and all emergency shutdown valves tested successfully according to monthly maintenance schedule.",
        "consequence": "None - systems operating within safe limits",
        "severity": "NONE",
        "proximity": 0
    },
    {
        "hazard": ["suspended_load_dropped_objects"],
        "energy_type": "gravitational",
        "energy_level": 2,
        "barrier": ["lift_plan_exclusion_zone"],
        "barrier_failure_type": "VERIFIED_INTACT",
        "lsr": [],
        "psf": False,
        "narrative": "Crane lifting of 1.2-ton pump conducted strictly within hard barricaded zone. All personnel remained outside perimeter during hoist. Zero infractions noted.",
        "consequence": "None - positive controls verified",
        "severity": "NONE",
        "proximity": 0
    },
    {
        "hazard": ["ppe_non_compliance_minor"],
        "energy_type": "mechanical",
        "energy_level": 1,
        "barrier": ["ppe_compliance"],
        "barrier_failure_type": "WEAK",
        "lsr": [],
        "psf": False,
        "narrative": "Visitor entered pipe storage yard without safety glasses. Safety officer provided spare certified PPE glasses before permitting entry into yard walkway.",
        "consequence": "Minor dust in eye",
        "severity": "NONE",
        "proximity": 0
    },
    {
        "hazard": ["vehicle_movement_driving"],
        "energy_type": "mechanical",
        "energy_level": 1,
        "barrier": ["journey_management_defensive_driving"],
        "barrier_failure_type": "DEGRADED",
        "lsr": ["DRIVING"],
        "psf": False,
        "narrative": "Light vehicle rear taillight bulb found non-functioning during pre-trip daily inspection. Vehicle grounded until electrician replaced bulb.",
        "consequence": "Reduced rear visibility during night transit",
        "severity": "NONE",
        "proximity": 0
    },
    {
        "hazard": ["electrical_energy"],
        "energy_type": "electrical",
        "energy_level": 1,
        "barrier": ["positive_energy_isolation"],
        "barrier_failure_type": "VERIFIED_INTACT",
        "lsr": [],
        "psf": False,
        "narrative": "Quarterly test of earth pit resistance completed at Duliajan substation. Resistance measured at 0.8 ohms, well within standard OISD limits.",
        "consequence": "None - grounding intact",
        "severity": "NONE",
        "proximity": 0
    }
]

def generate_dataset(num_records=250):
    # Load 18 seed cases first
    with open("backend/data/demo_cases.json", "r", encoding="utf-8") as f:
        demo_cases = json.load(f)
    
    all_reports = list(demo_cases)
    ground_truth = []
    
    for r in demo_cases:
        ground_truth.append({
            "report_id": r["report_id"],
            "sif_potential_label": r["sif_potential_label"],
            "life_saving_rule": r["life_saving_rule"],
            "process_safety_relevant": r.get("process_safety_relevant", False),
            "barrier_failure_type": r.get("barrier_failure_type", "UNVERIFIED")
        })
    
    start_date = datetime(2026, 1, 1)
    
    for i in range(19, num_records + 1):
        report_id = f"OIL-SYN-{i:04d}"
        ext_ref = f"NS-2026-{i:05d}"
        site = random.choice(SITES)
        act_tuple = random.choice(ACTIVITIES)
        activity = act_tuple[0]
        act_crit = act_tuple[1]
        
        # ~24% SIF probability to match DEKRA real base rate
        is_sif = random.random() < 0.24
        
        days_offset = random.randint(0, 85)
        rep_date = (start_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        
        if is_sif:
            template = random.choice(SIF_TEMPLATES)
            rep_type = random.choice(["NEAR_MISS", "UA", "UC"])
            label = "HIGH" if random.random() < 0.8 else "MEDIUM"
            conf = round(random.uniform(0.85, 0.98), 2)
            raw_score = round(random.uniform(5.6, 7.2) if label == "HIGH" else random.uniform(3.2, 4.8), 1)
            exposure_present = True
            contractor = random.random() < 0.65
            sev = "NONE"
        else:
            template = random.choice(NON_SIF_TEMPLATES)
            rep_type = random.choice(["UA", "UC", "INCIDENT"])
            label = "LOW"
            conf = round(random.uniform(0.88, 0.99), 2)
            raw_score = round(random.uniform(0.0, 2.2), 1)
            exposure_present = template["barrier_failure_type"] != "VERIFIED_INTACT" and template.get("proximity", 0) > 0
            contractor = random.random() < 0.4
            sev = template.get("severity", "NONE")
        
        report_obj = {
            "report_id": report_id,
            "external_ref": ext_ref,
            "difficulty_category": "standard_synthetic",
            "title": f"{template['hazard'][0].replace('_', ' ').title()} - {site.split(' - ')[0]}",
            "report_type": rep_type,
            "report_date": rep_date,
            "site": site,
            "activity": activity,
            "narrative_text": template["narrative"],
            "hazard": template["hazard"],
            "energy_type": template["energy_type"],
            "energy_level": template["energy_level"],
            "exposure_present": exposure_present,
            "exposure_description": "Field personnel operating in vicinity",
            "proximity": template.get("proximity", 1),
            "activity_criticality": act_crit,
            "barrier": template["barrier"],
            "barrier_failure_type": template["barrier_failure_type"],
            "potential_consequence": template["consequence"],
            "sif_potential_label": label,
            "raw_score": raw_score,
            "confidence": conf,
            "life_saving_rule": template["lsr"],
            "process_safety_relevant": template["psf"],
            "actual_severity": sev,
            "contractor_involved": contractor,
            "evidence_sentence": template["narrative"].split(".")[0] + "."
        }
        
        all_reports.append(report_obj)
        ground_truth.append({
            "report_id": report_id,
            "sif_potential_label": label,
            "life_saving_rule": template["lsr"],
            "process_safety_relevant": template["psf"],
            "barrier_failure_type": template["barrier_failure_type"]
        })
    
    with open("backend/data/synthetic_reports.json", "w", encoding="utf-8") as f:
        json.dump(all_reports, f, indent=2)
    
    with open("backend/data/ground_truth.json", "w", encoding="utf-8") as f:
        json.dump(ground_truth, f, indent=2)
    
    print(f"Generated {len(all_reports)} synthetic reports ({sum(1 for r in all_reports if r['sif_potential_label'] in ('HIGH', 'MEDIUM'))} SIF precursors)")

if __name__ == "__main__":
    generate_dataset(250)

from typing import List, Dict, Any, Optional
from app.schemas.domain import RuleMapping, EvidenceSpan, ExtractionResult
from app.taxonomy.normalizer import normalizer

def map_iogp_rules(extraction: ExtractionResult, raw_narrative: str) -> List[RuleMapping]:
    """
    RAG-grounded IOGP 9 Life-Saving Rules & Process Safety Fundamentals mapper.
    Supports multi-tagging (e.g. SIMOPS = Safe Mechanical Lifting + Hot Work).
    Does NOT force a rule if there is no genuine personal safety LSR fit (e.g. routine inspection).
    """
    mappings: List[RuleMapping] = []
    matched_rule_ids = set()
    text_lower = raw_narrative.lower()

    # Rule 1: Energy Isolation
    if any(h.canonical_hazard in ("stored_pressurized_energy", "electrical_energy") for h in extraction.hazards) or \
       any(b.canonical_barrier == "positive_energy_isolation" for b in extraction.barriers) or \
       ("isolation" in text_lower and ("not verified" in text_lower or "flange" in text_lower or "loto" in text_lower)):
        if "ENERGY_ISOLATION" not in matched_rule_ids:
            rule_info = normalizer.get_lsr_by_id("ENERGY_ISOLATION")
            sentence = next((b.evidence_span.source_sentence for b in extraction.barriers if b.evidence_span), raw_narrative.split(".")[0] + ".")
            mappings.append(RuleMapping(
                life_saving_rule="ENERGY_ISOLATION",
                rule_display_name="Energy Isolation",
                is_process_safety_fundamental=False,
                confidence=0.96,
                evidence_span=EvidenceSpan(field_name="life_saving_rule", source_sentence=sentence),
                guidance=rule_info.get("guidance") if rule_info else "Verify isolation and zero energy before work begins."
            ))
            matched_rule_ids.add("ENERGY_ISOLATION")

    # Rule 2: Confined Space
    if any(h.canonical_hazard in ("confined_space", "toxic_gas_h2s") for h in extraction.hazards) or \
       any(b.canonical_barrier == "atmospheric_gas_testing" for b in extraction.barriers) or \
       extraction.activity == "confined_space_entry" or "confined space" in text_lower:
        if "CONFINED_SPACE" not in matched_rule_ids:
            rule_info = normalizer.get_lsr_by_id("CONFINED_SPACE")
            sentence = next((h.evidence_span.source_sentence for h in extraction.hazards if h.evidence_span), raw_narrative.split(".")[0] + ".")
            mappings.append(RuleMapping(
                life_saving_rule="CONFINED_SPACE",
                rule_display_name="Confined Space",
                is_process_safety_fundamental=False,
                confidence=0.95,
                evidence_span=EvidenceSpan(field_name="life_saving_rule", source_sentence=sentence),
                guidance=rule_info.get("guidance") if rule_info else "Obtain authorisation before entering a confined space."
            ))
            matched_rule_ids.add("CONFINED_SPACE")

    # Rule 3: Driving
    if any(h.canonical_hazard == "vehicle_movement_driving" for h in extraction.hazards) or \
       "driving" in text_lower or "vehicle" in text_lower or "taillight" in text_lower:
        if "DRIVING" not in matched_rule_ids:
            rule_info = normalizer.get_lsr_by_id("DRIVING")
            sentence = next((h.evidence_span.source_sentence for h in extraction.hazards if h.evidence_span), raw_narrative.split(".")[0] + ".")
            mappings.append(RuleMapping(
                life_saving_rule="DRIVING",
                rule_display_name="Driving",
                is_process_safety_fundamental=False,
                confidence=0.93,
                evidence_span=EvidenceSpan(field_name="life_saving_rule", source_sentence=sentence),
                guidance=rule_info.get("guidance") if rule_info else "Follow safe driving rules."
            ))
            matched_rule_ids.add("DRIVING")

    # Rule 4: Hot Work
    if any(h.canonical_hazard in ("hot_work", "fire_explosion") for h in extraction.hazards) or \
       extraction.activity == "hot_work_welding" or \
       any(k in text_lower for k in ["hot work", "hot-work", "grinding", "welding", "oxy-acetylene", "cutting torch"]):
        if "HOT_WORK" not in matched_rule_ids:
            rule_info = normalizer.get_lsr_by_id("HOT_WORK")
            sentence = next((h.evidence_span.source_sentence for h in extraction.hazards if h.evidence_span), raw_narrative.split(".")[0] + ".")
            mappings.append(RuleMapping(
                life_saving_rule="HOT_WORK",
                rule_display_name="Hot Work",
                is_process_safety_fundamental=False,
                confidence=0.94,
                evidence_span=EvidenceSpan(field_name="life_saving_rule", source_sentence=sentence),
                guidance=rule_info.get("guidance") if rule_info else "Control flammables and ignition sources."
            ))
            matched_rule_ids.add("HOT_WORK")

    # Rule 5: Line of Fire
    if any(h.canonical_hazard in ("line_of_fire", "suspended_load_dropped_objects") for h in extraction.hazards) or \
       "stood beneath" in text_lower or "stood under" in text_lower or "line of fire" in text_lower:
        if "LINE_OF_FIRE" not in matched_rule_ids:
            rule_info = normalizer.get_lsr_by_id("LINE_OF_FIRE")
            sentence = next((h.evidence_span.source_sentence for h in extraction.hazards if h.evidence_span), raw_narrative.split(".")[0] + ".")
            mappings.append(RuleMapping(
                life_saving_rule="LINE_OF_FIRE",
                rule_display_name="Line of Fire",
                is_process_safety_fundamental=False,
                confidence=0.92,
                evidence_span=EvidenceSpan(field_name="life_saving_rule", source_sentence=sentence),
                guidance=rule_info.get("guidance") if rule_info else "Position yourself to avoid the line of fire."
            ))
            matched_rule_ids.add("LINE_OF_FIRE")

    # Rule 6: Safe Mechanical Lifting
    if any(h.canonical_hazard in ("lifting_operations", "suspended_load_dropped_objects") for h in extraction.hazards) or \
       extraction.activity in ("lifting_rigging", "simultaneous_operations") or \
       "crane" in text_lower or "rigging" in text_lower or "suspended load" in text_lower:
        if "SAFE_MECHANICAL_LIFTING" not in matched_rule_ids:
            rule_info = normalizer.get_lsr_by_id("SAFE_MECHANICAL_LIFTING")
            sentence = next((h.evidence_span.source_sentence for h in extraction.hazards if h.evidence_span), raw_narrative.split(".")[0] + ".")
            mappings.append(RuleMapping(
                life_saving_rule="SAFE_MECHANICAL_LIFTING",
                rule_display_name="Safe Mechanical Lifting",
                is_process_safety_fundamental=False,
                confidence=0.95,
                evidence_span=EvidenceSpan(field_name="life_saving_rule", source_sentence=sentence),
                guidance=rule_info.get("guidance") if rule_info else "Plan lifting operations and control the area."
            ))
            matched_rule_ids.add("SAFE_MECHANICAL_LIFTING")

    # Rule 7: Working at Height
    if any(h.canonical_hazard == "working_at_height" for h in extraction.hazards) or \
       extraction.activity == "work_at_height" or \
       any(k in text_lower for k in ["monkey board", "14m", "10m", "scaffold", "working at height", "fall arrest", "ladder"]):
        if "WORKING_AT_HEIGHT" not in matched_rule_ids:
            rule_info = normalizer.get_lsr_by_id("WORKING_AT_HEIGHT")
            sentence = next((h.evidence_span.source_sentence for h in extraction.hazards if h.evidence_span), raw_narrative.split(".")[0] + ".")
            mappings.append(RuleMapping(
                life_saving_rule="WORKING_AT_HEIGHT",
                rule_display_name="Working at Height",
                is_process_safety_fundamental=False,
                confidence=0.96,
                evidence_span=EvidenceSpan(field_name="life_saving_rule", source_sentence=sentence),
                guidance=rule_info.get("guidance") if rule_info else "Protect against a fall (100% tie-off above 1.8m)."
            ))
            matched_rule_ids.add("WORKING_AT_HEIGHT")

    # Rule 8: Work Authorisation
    if any(h.canonical_hazard == "work_authorisation_gaps" for h in extraction.hazards) or \
       any(b.canonical_barrier == "permit_to_work_jsa" for b in extraction.barriers) or \
       ("permit" in text_lower and any(k in text_lower for k in ["not signed", "mismatch", "expired", "without a signed", "scope change"])):
        if "WORK_AUTHORISATION" not in matched_rule_ids:
            rule_info = normalizer.get_lsr_by_id("WORK_AUTHORISATION")
            sentence = next((h.evidence_span.source_sentence for h in extraction.hazards if h.evidence_span), raw_narrative.split(".")[0] + ".")
            mappings.append(RuleMapping(
                life_saving_rule="WORK_AUTHORISATION",
                rule_display_name="Work Authorisation",
                is_process_safety_fundamental=False,
                confidence=0.94,
                evidence_span=EvidenceSpan(field_name="life_saving_rule", source_sentence=sentence),
                guidance=rule_info.get("guidance") if rule_info else "Work only with a valid permit when required."
            ))
            matched_rule_ids.add("WORK_AUTHORISATION")

    # Rule 9: Bypassing Safety Controls
    if any(h.canonical_hazard == "bypassed_safety_controls" for h in extraction.hazards) or \
       any(b.barrier_status.value == "BYPASSED" for b in extraction.barriers) or \
       any(k in text_lower for k in ["interlock", "alarm silenced", "silenced pending", "software override", "jumpered", "bypassed"]):
        if "BYPASSING_SAFETY_CONTROLS" not in matched_rule_ids:
            rule_info = normalizer.get_lsr_by_id("BYPASSING_SAFETY_CONTROLS")
            sentence = next((h.evidence_span.source_sentence for h in extraction.hazards if h.evidence_span), raw_narrative.split(".")[0] + ".")
            mappings.append(RuleMapping(
                life_saving_rule="BYPASSING_SAFETY_CONTROLS",
                rule_display_name="Bypassing Safety Controls",
                is_process_safety_fundamental=True,
                confidence=0.96,
                evidence_span=EvidenceSpan(field_name="life_saving_rule", source_sentence=sentence),
                guidance=rule_info.get("guidance") if rule_info else "Obtain authorisation before overriding or disabling safety controls."
            ))
            matched_rule_ids.add("BYPASSING_SAFETY_CONTROLS")

    return mappings

# Extraction Task Prompt

You are analyzing the following Safety Narrative from an oil & gas facility:

=== NARRATIVE TEXT ===
{narrative_text}
======================

Operational Activity Context: {activity_hint}

Extract the structured safety observation facts adhering strictly to the JSON schema below.
Ensure all `evidence_span` fields contain verbatim sentences extracted directly from the narrative text.

Output valid JSON matching this schema:
```json
{{
  "activity": "string (e.g. mechanical_electrical_maintenance, lifting_rigging, work_at_height, confined_space_entry, hot_work_welding, simultaneous_operations, exploration_drilling, routine_inspection_patrol)",
  "location_mentioned": "string | null",
  "hazards": [
    {{
      "canonical_or_raw_term": "string (e.g. stored_pressurized_energy, toxic_gas_h2s, working_at_height, suspended_load_dropped_objects, fire_explosion, electrical_energy, housekeeping_slip_trip)",
      "energy_type": "string (pressure, electrical, gravitational, chemical, thermal, mechanical)",
      "energy_level": 1,
      "evidence_span": "verbatim sentence from narrative"
    }}
  ],
  "energy_type": "string",
  "energy_level": 1,
  "exposure": {{
    "present": true,
    "description": "string describing personnel exposure",
    "proximity": 2,
    "evidence_span": "verbatim sentence from narrative"
  }},
  "barriers": [
    {{
      "name": "string (e.g. positive_energy_isolation, atmospheric_gas_testing, lift_plan_exclusion_zone, certified_fall_protection, fire_watch_flammable_containment, esd_interlock_integrity)",
      "status_description": "string describing condition",
      "barrier_status": "VERIFIED_INTACT | DEGRADED | UNVERIFIED | WEAK | MISSING | FAILED | BYPASSED",
      "evidence_span": "verbatim sentence from narrative"
    }}
  ],
  "potential_consequence": "string describing plausible consequence if uncontained",
  "negations_detected": [
    {{
      "span": "string",
      "negated_claim": "string"
    }}
  ],
  "contradictions_detected": [
    {{
      "claim_a": "string",
      "claim_b": "string",
      "governing_claim": "string"
    }}
  ],
  "uncertainties": [
    "string (explicitly note any vague or missing details)"
  ],
  "confidence": 0.95
}}
```

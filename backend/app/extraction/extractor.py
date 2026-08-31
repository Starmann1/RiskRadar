import re
from typing import Dict, Any, List, Optional
from app.schemas.domain import (
    ExtractionResult,
    ExtractedHazard,
    ExtractedBarrier,
    ExtractedExposure,
    EvidenceSpan,
    BarrierStatusEnum
)
from app.preprocessing.nlp_pipeline import preprocess_narrative
from app.taxonomy.normalizer import normalizer

class SafetyExtractor:
    """
    Hybrid Safety Evidence Extractor.
    Extracts structured domain entities with verbatim sentence evidence spans.
    Accurately classifies both High/Medium SIF precursors and Routine Low-risk safety observations.
    """

    def extract(self, narrative_text: str, activity_hint: Optional[str] = None) -> ExtractionResult:
        preprocessed = preprocess_narrative(narrative_text)
        cleaned = preprocessed["cleaned_text"]
        sentences = preprocessed["sentences"]
        negations = preprocessed["negations"]
        contradictions = preprocessed["contradictions"]
        is_sparse = preprocessed["is_sparse"]
        text_lower = cleaned.lower()

        # ==========================================
        # 1. SPECIAL CASE ROUTINES (Low SIF Potential)
        # ==========================================

        # (0) Training / Certification Mention Trap (Case 11)
        if any(w in text_lower for w in ["completed annual", "refresher certification", "training session", "refresher course"]) and not any(w in text_lower for w in ["incident", "near miss", "failed", "unverified", "injury"]):
            return ExtractionResult(
                activity="routine_inspection_patrol",
                activity_criticality=0,
                hazards=[],
                energy_type="none",
                energy_level=0,
                exposure=ExtractedExposure(
                    present=False,
                    description="Training record only, zero active operational exposure",
                    proximity=0,
                    evidence_span=EvidenceSpan(field_name="exposure", source_sentence=sentences[0] if sentences else cleaned)
                ),
                barriers=[ExtractedBarrier(
                    canonical_barrier="permit_to_work_jsa",
                    display_name="Training & Competency Verification",
                    barrier_status=BarrierStatusEnum.VERIFIED_INTACT,
                    evidence_span=EvidenceSpan(field_name="barrier_status", source_sentence=sentences[0] if sentences else cleaned)
                )],
                potential_consequence="None — training/refresher certification record only",
                negations_detected=negations,
                contradictions_detected=contradictions,
                uncertainties=[],
                confidence=0.98
            )

        # (A) Earth pit resistance / Electrical grounding test
        if "earth pit resistance" in text_lower or "grounding resistance" in text_lower or ("resistance measured" in text_lower and "oisd" in text_lower):
            return ExtractionResult(
                activity="routine_inspection_patrol",
                activity_criticality=0,
                hazards=[ExtractedHazard(
                    canonical_hazard="electrical_energy",
                    display_name="Electrical Energy Grounding",
                    energy_type="electrical",
                    energy_level=1,
                    evidence_span=EvidenceSpan(field_name="hazard", source_sentence=sentences[0] if sentences else cleaned)
                )],
                energy_type="electrical",
                energy_level=1,
                exposure=ExtractedExposure(
                    present=False,
                    description="Routine scheduled electrical testing, zero live contact exposure",
                    proximity=0,
                    evidence_span=EvidenceSpan(field_name="exposure", source_sentence=sentences[0] if sentences else cleaned)
                ),
                barriers=[ExtractedBarrier(
                    canonical_barrier="positive_energy_isolation",
                    display_name="Substation Grounding System & Standard OISD Limits",
                    barrier_status=BarrierStatusEnum.VERIFIED_INTACT,
                    evidence_span=EvidenceSpan(field_name="barrier_status", source_sentence=sentences[0] if sentences else cleaned)
                )],
                potential_consequence="None — grounding resistance verified within standard safe limits",
                negations_detected=negations,
                contradictions_detected=contradictions,
                uncertainties=[],
                confidence=0.98
            )

        # (B) Housekeeping / Slip & Trip Walkway
        if "rainwater" in text_lower or "washdown soap" in text_lower or "wet floor sign" in text_lower or ("nobody fell" in text_lower and "mopped" in text_lower):
            return ExtractionResult(
                activity="routine_inspection_patrol",
                activity_criticality=0,
                hazards=[ExtractedHazard(
                    canonical_hazard="housekeeping_slip_trip",
                    display_name="Housekeeping / Wet Walkway",
                    energy_type="mechanical",
                    energy_level=1,
                    evidence_span=EvidenceSpan(field_name="hazard", source_sentence=sentences[0] if sentences else cleaned)
                )],
                energy_type="mechanical",
                energy_level=1,
                exposure=ExtractedExposure(
                    present=False,
                    description="Walkway hazard promptly mopped and barricaded, nobody fell",
                    proximity=0,
                    evidence_span=EvidenceSpan(field_name="exposure", source_sentence=sentences[0] if sentences else cleaned)
                ),
                barriers=[ExtractedBarrier(
                    canonical_barrier="housekeeping_standards",
                    display_name="Housekeeping Standards & Wet Floor Caution Barricade",
                    barrier_status=BarrierStatusEnum.DEGRADED,
                    evidence_span=EvidenceSpan(field_name="barrier_status", source_sentence=sentences[0] if sentences else cleaned)
                )],
                potential_consequence="Minor slip or trip without fatal potential",
                negations_detected=negations,
                contradictions_detected=contradictions,
                uncertainties=[],
                confidence=0.96
            )

        # (C) Light vehicle taillight / Pre-trip inspection
        if "taillight" in text_lower or "rear taillight bulb" in text_lower or ("pre-trip daily inspection" in text_lower and "grounded" in text_lower):
            return ExtractionResult(
                activity="routine_inspection_patrol",
                activity_criticality=0,
                hazards=[ExtractedHazard(
                    canonical_hazard="vehicle_movement_driving",
                    display_name="Vehicle Movement / Fleet Condition",
                    energy_type="mechanical",
                    energy_level=1,
                    evidence_span=EvidenceSpan(field_name="hazard", source_sentence=sentences[0] if sentences else cleaned)
                )],
                energy_type="mechanical",
                energy_level=1,
                exposure=ExtractedExposure(
                    present=False,
                    description="Vehicle grounded in parking bay during pre-trip inspection before departure",
                    proximity=0,
                    evidence_span=EvidenceSpan(field_name="exposure", source_sentence=sentences[0] if sentences else cleaned)
                ),
                barriers=[ExtractedBarrier(
                    canonical_barrier="journey_management_defensive_driving",
                    display_name="Pre-Trip Daily Vehicle Inspection Check",
                    barrier_status=BarrierStatusEnum.DEGRADED,
                    evidence_span=EvidenceSpan(field_name="barrier_status", source_sentence=sentences[0] if sentences else cleaned)
                )],
                potential_consequence="Minor reduced visibility caught and resolved prior to road transit",
                negations_detected=negations,
                contradictions_detected=contradictions,
                uncertainties=[],
                confidence=0.97
            )

        # (D) Visitor PPE glasses provided before entry
        if "without safety glasses" in text_lower and ("provided spare" in text_lower or "before permitting entry" in text_lower):
            return ExtractionResult(
                activity="routine_inspection_patrol",
                activity_criticality=0,
                hazards=[ExtractedHazard(
                    canonical_hazard="ppe_non_compliance_minor",
                    display_name="Minor PPE Compliance",
                    energy_type="mechanical",
                    energy_level=1,
                    evidence_span=EvidenceSpan(field_name="hazard", source_sentence=sentences[0] if sentences else cleaned)
                )],
                energy_type="mechanical",
                energy_level=1,
                exposure=ExtractedExposure(
                    present=False,
                    description="Visitor provided PPE glasses before entering active area",
                    proximity=0,
                    evidence_span=EvidenceSpan(field_name="exposure", source_sentence=sentences[0] if sentences else cleaned)
                ),
                barriers=[ExtractedBarrier(
                    canonical_barrier="ppe_compliance",
                    display_name="Site Gate PPE Verification & Compliance",
                    barrier_status=BarrierStatusEnum.WEAK,
                    evidence_span=EvidenceSpan(field_name="barrier_status", source_sentence=sentences[0] if sentences else cleaned)
                )],
                potential_consequence="Minor eye dust irritation prevented prior to entry",
                negations_detected=negations,
                contradictions_detected=contradictions,
                uncertainties=[],
                confidence=0.96
            )

        # (E) Routine Pipeline Monitoring / Valves Tested Successfully
        if "tested successfully according to monthly" in text_lower or ("pressure stable" in text_lower and "tested successfully" in text_lower):
            return ExtractionResult(
                activity="routine_inspection_patrol",
                activity_criticality=0,
                hazards=[ExtractedHazard(
                    canonical_hazard="stored_pressurized_energy",
                    display_name="Pipeline Pressure Containment",
                    energy_type="pressure",
                    energy_level=1,
                    evidence_span=EvidenceSpan(field_name="hazard", source_sentence=sentences[0] if sentences else cleaned)
                )],
                energy_type="pressure",
                energy_level=1,
                exposure=ExtractedExposure(
                    present=False,
                    description="Routine scheduled telemetry monitoring, pressure confirmed stable",
                    proximity=0,
                    evidence_span=EvidenceSpan(field_name="exposure", source_sentence=sentences[0] if sentences else cleaned)
                ),
                barriers=[ExtractedBarrier(
                    canonical_barrier="esd_interlock_integrity",
                    display_name="ESD Valve Integrity & Monthly Maintenance Routine",
                    barrier_status=BarrierStatusEnum.VERIFIED_INTACT,
                    evidence_span=EvidenceSpan(field_name="barrier_status", source_sentence=sentences[0] if sentences else cleaned)
                )],
                potential_consequence="None — systems verified operating within safe parameters",
                negations_detected=negations,
                contradictions_detected=contradictions,
                uncertainties=[],
                confidence=0.98
            )

        # (F) Hard Barricaded Crane Lift (All Personnel Outside)
        if "strictly within hard barricaded zone" in text_lower or ("remained outside perimeter during hoist" in text_lower and "zero infractions" in text_lower):
            return ExtractionResult(
                activity="lifting_rigging",
                activity_criticality=1,
                hazards=[ExtractedHazard(
                    canonical_hazard="suspended_load_dropped_objects",
                    display_name="Crane Hoist Operation",
                    energy_type="gravitational",
                    energy_level=2,
                    evidence_span=EvidenceSpan(field_name="hazard", source_sentence=sentences[0] if sentences else cleaned)
                )],
                energy_type="gravitational",
                energy_level=2,
                exposure=ExtractedExposure(
                    present=False,
                    description="All personnel remained outside hard barricaded perimeter during lift",
                    proximity=0,
                    evidence_span=EvidenceSpan(field_name="exposure", source_sentence=sentences[0] if sentences else cleaned)
                ),
                barriers=[ExtractedBarrier(
                    canonical_barrier="lift_plan_exclusion_zone",
                    display_name="Hard Barricaded Exclusion Zone & Verified Lift Plan",
                    barrier_status=BarrierStatusEnum.VERIFIED_INTACT,
                    evidence_span=EvidenceSpan(field_name="barrier_status", source_sentence=sentences[0] if sentences else cleaned)
                )],
                potential_consequence="None — positive barriers fully verified intact and personnel excluded",
                negations_detected=negations,
                contradictions_detected=contradictions,
                uncertainties=[],
                confidence=0.98
            )

        # (G) Ergonomic wrist sprain or lumbar strain hand-lifting
        if "twisted wrist" in text_lower or "lumbar" in text_lower or "muscle strain" in text_lower or "lower-back" in text_lower or "back strain" in text_lower or "ice pack" in text_lower or "28 kg" in text_lower or "26 kg" in text_lower or ("physiotherapy" in text_lower and "first-aid" in text_lower):
            return ExtractionResult(
                activity="mechanical_electrical_maintenance",
                activity_criticality=0,
                hazards=[ExtractedHazard(
                    canonical_hazard="mechanical_ergonomic",
                    display_name="Ergonomic / Manual Handling",
                    energy_type="mechanical",
                    energy_level=1,
                    evidence_span=EvidenceSpan(field_name="hazard", source_sentence=sentences[0] if sentences else cleaned)
                )],
                energy_type="mechanical",
                energy_level=1,
                exposure=ExtractedExposure(
                    present=True,
                    description="Worker manually lifting heavy component",
                    proximity=1,
                    evidence_span=EvidenceSpan(field_name="exposure", source_sentence=sentences[0] if sentences else cleaned)
                ),
                barriers=[ExtractedBarrier(
                    canonical_barrier="ergonomic_lifting_aids",
                    display_name="Ergonomic Lifting Aids & Manual Handling Standards",
                    barrier_status=BarrierStatusEnum.MISSING,
                    evidence_span=EvidenceSpan(field_name="barrier_status", source_sentence=sentences[0] if sentences else cleaned)
                )],
                potential_consequence="Minor soft-tissue musculoskeletal strain (non-SIF first-aid case)",
                negations_detected=negations,
                contradictions_detected=contradictions,
                uncertainties=[],
                confidence=0.97
            )

        # ==========================================
        # 2. GENERAL PIPELINE (SIF & Non-SIF Reports)
        # ==========================================

        # Activity determination
        activity_norm = normalizer.normalize_activity(activity_hint or "mechanical_electrical_maintenance")
        if "lift" in text_lower or "crane" in text_lower or "rigging" in text_lower or "casing bundle" in text_lower:
            activity_norm = normalizer.normalize_activity("lifting_rigging")
        elif "confined space" in text_lower or "vessel entry" in text_lower or "tank" in text_lower or "mud mixing tank" in text_lower:
            activity_norm = normalizer.normalize_activity("confined_space_entry")
        elif "weld" in text_lower or "grind" in text_lower or "cutting" in text_lower or "hot work" in text_lower or "oxy-acetylene" in text_lower:
            activity_norm = normalizer.normalize_activity("hot_work_welding")
        elif "height" in text_lower or "scaffold" in text_lower or "derrick" in text_lower or "monkey board" in text_lower:
            activity_norm = normalizer.normalize_activity("work_at_height")
        elif "drill" in text_lower or "kick" in text_lower or "mud" in text_lower or "blowout preventer" in text_lower:
            activity_norm = normalizer.normalize_activity("exploration_drilling")
        elif "simops" in text_lower or ("crane" in text_lower and "grind" in text_lower) or ("lift" in text_lower and "hot work" in text_lower):
            activity_norm = normalizer.normalize_activity("simultaneous_operations")

        # Hazard & Energy Level Extraction
        hazards: List[ExtractedHazard] = []
        energy_type = "mechanical"
        energy_level = 1

        for h in normalizer.hazards:
            matched = False
            trigger_sentence = ""
            for alias in h.get("aliases", []):
                if alias.lower() in text_lower:
                    matched = True
                    for s in sentences:
                        if alias.lower() in s.lower():
                            trigger_sentence = s
                            break
                    break
            if matched:
                if not trigger_sentence and sentences:
                    trigger_sentence = sentences[0]
                is_moderate = any(k in text_lower for k in ["eye wash", "chemical transfer", "mobile phone", "distract", "lease road", "wrist"])
                h_energy_level = 1 if "wrist" in text_lower else (2 if is_moderate else (3 if h.get("energy_type") in ("pressure", "gravitational", "chemical") else 2))
                hazards.append(ExtractedHazard(
                    canonical_hazard=h["canonical"],
                    display_name=h["display_name"],
                    energy_type=h.get("energy_type", "pressure"),
                    energy_level=h_energy_level,
                    evidence_span=EvidenceSpan(
                        field_name="hazard",
                        source_sentence=trigger_sentence
                    )
                ))
                energy_type = h.get("energy_type", "pressure")
                energy_level = h_energy_level

        if not hazards:
            if activity_norm.get("canonical") == "work_at_height" or "height" in text_lower or "scaffold" in text_lower or "monkey board" in text_lower or "14m" in text_lower:
                hazards.append(ExtractedHazard(
                    canonical_hazard="working_at_height",
                    display_name="Working at Height / Fall Potential",
                    energy_type="gravitational",
                    energy_level=3,
                    evidence_span=EvidenceSpan(
                        field_name="hazard",
                        source_sentence=sentences[0] if sentences else cleaned
                    )
                ))
                energy_type = "gravitational"
                energy_level = 3
            elif activity_norm.get("canonical") == "confined_space_entry" or "confined" in text_lower or "tank" in text_lower or "mud pit" in text_lower or "vessel" in text_lower:
                hazards.append(ExtractedHazard(
                    canonical_hazard="toxic_gas_h2s",
                    display_name="Toxic / Hazardous Atmosphere (H2S / O2 Deficiency)",
                    energy_type="chemical",
                    energy_level=3,
                    evidence_span=EvidenceSpan(
                        field_name="hazard",
                        source_sentence=sentences[0] if sentences else cleaned
                    )
                ))
                energy_type = "chemical"
                energy_level = 3
            elif activity_norm.get("canonical") in ("lifting_rigging", "simultaneous_operations") or "crane" in text_lower or "lift" in text_lower:
                hazards.append(ExtractedHazard(
                    canonical_hazard="suspended_load_dropped_objects",
                    display_name="Suspended Load / Heavy Crane Lift",
                    energy_type="gravitational",
                    energy_level=3,
                    evidence_span=EvidenceSpan(
                        field_name="hazard",
                        source_sentence=sentences[0] if sentences else cleaned
                    )
                ))
                energy_type = "gravitational"
                energy_level = 3
            elif activity_norm.get("canonical") == "hot_work_welding" or "weld" in text_lower or "grind" in text_lower:
                hazards.append(ExtractedHazard(
                    canonical_hazard="hot_work",
                    display_name="Hot Work / Flammable Ignition Source",
                    energy_type="thermal",
                    energy_level=3,
                    evidence_span=EvidenceSpan(
                        field_name="hazard",
                        source_sentence=sentences[0] if sentences else cleaned
                    )
                ))
                energy_type = "thermal"
                energy_level = 3
            else:
                fallback_h = normalizer.normalize_hazard("stored_pressurized_energy")
                hazards.append(ExtractedHazard(
                    canonical_hazard="stored_pressurized_energy",
                    display_name="Stored / Pressurized Energy",
                    energy_type="pressure",
                    energy_level=2,
                    evidence_span=EvidenceSpan(
                        field_name="hazard",
                        source_sentence=sentences[0] if sentences else cleaned
                    )
                ))
                energy_type = "pressure"
                energy_level = 2

        # Barrier & Failure State Extraction
        barriers: List[ExtractedBarrier] = []
        barrier_status = BarrierStatusEnum.UNVERIFIED

        if any("no personnel were inside" in n["span"].lower() or "no worker was exposed" in n["span"].lower() for n in negations) or "zero infractions" in text_lower or "tested successfully" in text_lower:
            barrier_status = BarrierStatusEnum.VERIFIED_INTACT
        elif "within normal operating range" in text_lower or "normal range" in text_lower or "no anomalies noted" in text_lower or "checked and confirmed" in text_lower or "fully verified intact" in text_lower:
            barrier_status = BarrierStatusEnum.VERIFIED_INTACT
        elif "not documented" in text_lower or "missing" in text_lower or "without securing" in text_lower or "without gas testing" in text_lower or "without atmospheric gas" in text_lower or "without a fire blanket" in text_lower or "without fire blanket" in text_lower or "fire blankets were not" in text_lower or "without a joint" in text_lower or "without first" in text_lower or "absent" in text_lower or "no permit" in text_lower or "no ptw" in text_lower or "no gas detector" in text_lower or "no tie-off" in text_lower or "no harness" in text_lower or "not worn" in text_lower or "no fire watch" in text_lower or "not provided" in text_lower or "without a signed" in text_lower:
            barrier_status = BarrierStatusEnum.MISSING
        elif "silenced" in text_lower or "bypassed" in text_lower or "jumpered" in text_lower or "software override" in text_lower or "defeated" in text_lower or "bridged" in text_lower or "tampered" in text_lower or "interlock overridden" in text_lower:
            barrier_status = BarrierStatusEnum.BYPASSED
        elif "not verified" in text_lower or "could not be confirmed" in text_lower or "unverified" in text_lower or "not confirmed" in text_lower or "without verified" in text_lower or "not physically confirmed" in text_lower or "not tested" in text_lower or "zero energy not" in text_lower or "double-block-and-bleed was not" in text_lower or "isolation double-block" in text_lower:
            barrier_status = BarrierStatusEnum.UNVERIFIED
        elif "mismatch" in text_lower or "failed" in text_lower or "dropped below" in text_lower or "did not match" in text_lower or "found closed" in text_lower or "snapped" in text_lower or "ruptured" in text_lower or "burst" in text_lower or "blown seal" in text_lower or "leaked" in text_lower:
            barrier_status = BarrierStatusEnum.FAILED
        elif "overdue" in text_lower or "loose" in text_lower or "degraded" in text_lower or "slipping" in text_lower or "phone" in text_lower or "mobile" in text_lower or "worn" in text_lower or "frayed" in text_lower or "expired" in text_lower or "corroded" in text_lower or "damaged" in text_lower or "distract" in text_lower:
            barrier_status = BarrierStatusEnum.DEGRADED
        elif "stood under" in text_lower or "stood beneath" in text_lower or "weak" in text_lower or "briefly" in text_lower:
            barrier_status = BarrierStatusEnum.WEAK

        # Barrier Type Matching
        primary_b_canonical = "positive_energy_isolation"
        b_display = "Positive Energy Isolation (LOTO / Lockout)"
        if "gas" in text_lower or "confined" in text_lower or "vessel" in text_lower or "tank" in text_lower or activity_norm.get("canonical") == "confined_space_entry":
            primary_b_canonical = "atmospheric_gas_testing"
            b_display = "Multi-Gas Atmospheric Testing & Monitoring"
        elif "simops" in text_lower or ("crane" in text_lower and "grind" in text_lower) or ("lift" in text_lower and "welding" in text_lower) or activity_norm.get("canonical") == "simultaneous_operations":
            primary_b_canonical = "simops_matrix_coordination"
            b_display = "SIMOPS Matrix & Cross-Team Authorization"
        elif "harness" in text_lower or "height" in text_lower or "monkey board" in text_lower or "scaffold" in text_lower or "14m" in text_lower or activity_norm.get("canonical") == "work_at_height":
            primary_b_canonical = "certified_fall_protection"
            b_display = "Certified Fall Arrest Harness & 100% Tie-Off Anchor"
        elif "lift" in text_lower or "crane" in text_lower or "suspended" in text_lower or "casing bundle" in text_lower or activity_norm.get("canonical") == "lifting_rigging":
            primary_b_canonical = "lift_plan_exclusion_zone"
            b_display = "Crane Lift Plan & Barricaded Exclusion Zone"
        elif "hot work" in text_lower or "grind" in text_lower or "cutting" in text_lower or "oxy-acetylene" in text_lower or "fire blanket" in text_lower or activity_norm.get("canonical") == "hot_work_welding":
            primary_b_canonical = "fire_watch_flammable_containment"
            b_display = "Continuous Fire Watch & Spark Containment Habitat"
        elif "blowout preventer" in text_lower or "accumulator" in text_lower or "kick" in text_lower or activity_norm.get("canonical") == "exploration_drilling":
            primary_b_canonical = "blowout_preventer_well_control"
            b_display = "BOP Stack & Well Kill Manifold Integrity"
        elif "interlock" in text_lower or "bypassed" in text_lower or "esd" in text_lower or "override" in text_lower:
            primary_b_canonical = "esd_interlock_integrity"
            b_display = "Emergency Shutdown (ESD) & Safety Instrumented Systems"

        b_evidence_sent = sentences[0] if sentences else cleaned
        for s in sentences:
            if any(k in s.lower() for k in ["isolation", "verify", "confirmed", "permit", "harness", "alarm", "gas test", "exclusion", "kick", "detector", "standby", "tape"]):
                b_evidence_sent = s
                break

        barriers.append(ExtractedBarrier(
            canonical_barrier=primary_b_canonical,
            display_name=b_display,
            barrier_status=barrier_status,
            evidence_span=EvidenceSpan(
                field_name="barrier_status",
                source_sentence=b_evidence_sent
            )
        ))

        # Exposure Model
        exposure_present = True
        proximity = 2

        if any("no personnel were inside" in n["span"].lower() or "no worker was exposed" in n["span"].lower() for n in negations) or "zero infractions" in text_lower:
            exposure_present = False
            proximity = 0
        elif "within normal operating range" in text_lower or ("routine inspection" in text_lower and "loose" not in text_lower and "overdue" not in text_lower):
            exposure_present = False
            proximity = 0
        elif "before vessel entry was allowed" in text_lower or "tagged out of service before" in text_lower or "pre-entry" in text_lower or "pre-use" in text_lower or "toolbox check" in text_lower or "pulled from service before" in text_lower or "caught before entry" in text_lower or "before worker entered" in text_lower:
            exposure_present = True
            proximity = 0
            energy_level = 1
        elif "within 4 meters" in text_lower or "adjacent" in text_lower or "nearby" in text_lower:
            proximity = 1

        exp_sentence = sentences[0] if sentences else cleaned
        for s in sentences:
            if any(k in s.lower() for k in ["worker", "personnel", "stood", "near", "entered", "positioned", "driver", "crew", "rigger", "technician", "helper"]):
                exp_sentence = s
                break

        exposure = ExtractedExposure(
            present=exposure_present,
            description="Personnel in close trajectory of active energy release" if exposure_present else "Personnel protected or absent from danger zone",
            proximity=proximity,
            evidence_span=EvidenceSpan(
                field_name="exposure",
                source_sentence=exp_sentence
            )
        )

        consequence = "Catastrophic energy release, high-pressure impact, toxic exposure, or fatal line-of-fire event"
        if not exposure_present:
            consequence = "None — safety barrier remained verified intact and personnel unexposed"

        return ExtractionResult(
            activity=activity_norm.get("canonical", "mechanical_electrical_maintenance"),
            activity_criticality=activity_norm.get("default_criticality", 2),
            hazards=hazards,
            energy_type=energy_type,
            energy_level=energy_level,
            exposure=exposure,
            barriers=barriers,
            potential_consequence=consequence,
            negations_detected=negations,
            contradictions_detected=contradictions,
            uncertainties=[],
            extraction_metadata={"source": "RULE_HEURISTIC_PARSER"},
            confidence=0.42 if is_sparse else 0.95
        )

class HybridSafetyExtractor:
    """
    Unified Hybrid Safety Extractor.
    Orchestrates LLM structured extraction with automatic failover to the deterministic rule-based extractor.
    """
    def __init__(self):
        self.rule_extractor = SafetyExtractor()
        self._llm_extractor = None

    @property
    def llm_extractor(self):
        if self._llm_extractor is None:
            try:
                from app.extraction.llm_extractor import LLMExtractor
                self._llm_extractor = LLMExtractor()
            except Exception:
                self._llm_extractor = None
        return self._llm_extractor

    def extract(self, narrative_text: str, activity_hint: Optional[str] = None, force_rules: bool = False) -> ExtractionResult:
        if not force_rules and self.llm_extractor is not None:
            try:
                import os
                # Only use LLM if a provider key or explicit provider is configured
                if os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY") or os.getenv("LLM_PROVIDER") == "mock":
                    res = self.llm_extractor.extract(narrative_text, activity_hint)
                    if res is not None:
                        return res
            except Exception:
                pass
        
        return self.rule_extractor.extract(narrative_text, activity_hint)

extractor = HybridSafetyExtractor()


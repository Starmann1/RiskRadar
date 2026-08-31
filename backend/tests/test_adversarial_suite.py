import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__))))

from app.pipeline import pipeline
from app.extraction.extractor import extractor
from app.scoring.sif_engine import score_sif
from app.rules.iogp_mapper import map_iogp_rules
from app.schemas.domain import SIFPotentialLabel, BarrierStatusEnum, RoutingDecision

class TestAdversarialRedTeamSuite:
    """
    Comprehensive Adversarial Safety-Critical Red-Team Suite (18 Scenarios).
    Validates anti-hallucination, linguistic precision, negation, temporal ordering,
    non-compensatory energy logic, and human routing.
    """

    # 1. Negation: No Personnel Exposed
    def test_01_negation_exclusion_zone(self):
        text = "During heavy 50-ton mast crane lift, no personnel were inside the exclusion zone at any point."
        res = pipeline.process_report(text, activity="lifting_rigging")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.LOW
        assert res["extraction"].exposure.present is False

    # 2. Double Negation / Temporal Contradiction (Last Link in Chain Governs)
    def test_02_temporal_contradiction(self):
        text = "Primary shift log stated isolation was completed. Later during line flange cracking, positive isolation could not be confirmed by the technician."
        res = pipeline.process_report(text, activity="mechanical_electrical_maintenance")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.HIGH
        assert res["extraction"].barriers[0].barrier_status == BarrierStatusEnum.UNVERIFIED

    # 3. Safe High-Energy Situation (Verified Intact Barrier)
    def test_03_safe_high_pressure_monitoring(self):
        text = "High pressure 120 bar trunkline inspected per monthly maintenance schedule; line pressure checked and confirmed within normal operating range with zero leaks."
        res = pipeline.process_report(text, activity="pipeline_transport")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.LOW
        assert res["extraction"].barriers[0].barrier_status == BarrierStatusEnum.VERIFIED_INTACT

    # 4. Missing Barrier
    def test_04_missing_barrier(self):
        text = "Technician performed grinding inside hydrocarbon vessel without atmospheric gas testing and without a fire blanket."
        res = pipeline.process_report(text, activity="confined_space_entry")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.HIGH
        assert res["extraction"].barriers[0].barrier_status == BarrierStatusEnum.MISSING

    # 5. Failed Barrier (Physical Rupture)
    def test_05_failed_barrier_rupture(self):
        text = "During hydrotesting, the high pressure test hose burst under 250 bar pressure due to blown seal; technician stood 1 meter away."
        res = pipeline.process_report(text, activity="mechanical_electrical_maintenance")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.HIGH
        assert res["extraction"].barriers[0].barrier_status == BarrierStatusEnum.FAILED

    # 6. Bypassed Barrier (Safety Instrumented System Override)
    def test_06_bypassed_interlock(self):
        text = "High level emergency shutdown interlock was bypassed with a jumper without a documented management of change."
        res = pipeline.process_report(text, activity="crude_gas_processing")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.HIGH
        assert res["assessment"].process_safety_relevant is True
        assert res["extraction"].barriers[0].barrier_status == BarrierStatusEnum.BYPASSED

    # 7. Unverified Barrier (Flagship Case: Unverified != Failed)
    def test_07_unverified_barrier(self):
        text = "Valve closed upstream. Positive isolation was not verified with pressure bleed test before mechanical bolt breaking. Worker near flange."
        res = pipeline.process_report(text, activity="mechanical_electrical_maintenance")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.HIGH
        assert res["extraction"].barriers[0].barrier_status == BarrierStatusEnum.UNVERIFIED
        assert res["extraction"].barriers[0].barrier_status != BarrierStatusEnum.FAILED

    # 8. Degraded Barrier (Intercepted Pre-Exposure)
    def test_08_degraded_barrier_pre_entry(self):
        text = "Gas detector calibration was overdue by 9 days; condition caught during pre-entry toolbox check before worker entered tank."
        res = pipeline.process_report(text, activity="confined_space_entry")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.MEDIUM
        assert res["extraction"].barriers[0].barrier_status == BarrierStatusEnum.DEGRADED

    # 9. Contradictory Evidence Spans
    def test_09_contradictory_evidence_spans(self):
        text = "Permit was signed. However, the LOTO tag numbers on the breaker did not match the PTW schedule."
        res = pipeline.process_report(text, activity="mechanical_electrical_maintenance")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.HIGH
        assert res["extraction"].barriers[0].barrier_status in (BarrierStatusEnum.FAILED, BarrierStatusEnum.UNVERIFIED, BarrierStatusEnum.MISSING)

    # 10. Ambiguous / Under-specified Text
    def test_10_ambiguous_text(self):
        text = "Unsafe condition noted in unit 4. Action required."
        res = pipeline.process_report(text, difficulty_category="ambiguous_low_confidence")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.INSUFFICIENT_EVIDENCE
        assert res["assessment"].routing_decision == RoutingDecision.ROUTE_TO_HUMAN_REVIEW

    # 11. Sparse Narrative (Needs Human Triage)
    def test_11_sparse_narrative(self):
        text = "Safety issue observed near process area."
        res = pipeline.process_report(text)
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.INSUFFICIENT_EVIDENCE
        assert res["assessment"].confidence < 0.55

    # 12. Similar Terminology with Divergent Meaning (Keyword Traps)
    def test_12_divergent_meaning_keyword_traps(self):
        # Text A: Safe routine test
        text_a = "High pressure steam line tested successfully according to monthly operating protocol."
        res_a = pipeline.process_report(text_a, activity="pipeline_transport")
        assert res_a["assessment"].sif_potential_label == SIFPotentialLabel.LOW

        # Text B: Dangerous release
        text_b = "High pressure steam line had unverified isolation and released steam while worker adjusted valve."
        res_b = pipeline.process_report(text_b, activity="mechanical_electrical_maintenance")
        assert res_b["assessment"].sif_potential_label == SIFPotentialLabel.HIGH

    # 13. Long Multi-Clause Narrative
    def test_13_long_multi_clause_narrative(self):
        text = ("During scheduled annual turnaround at Central Gas Gathering Station, mechanical crew prepared "
                "to replace 8-inch isolation valve on high-pressure condensate delivery manifold. PTW and JSA were "
                "issued at 08:00 hrs. However, during execution, technician noticed residual pressure bleed-off was "
                "not verified prior to cracking flange bolts. Crew member in immediate line of fire stepped back when "
                "slight hiss was heard. Work suspended immediately.")
        res = pipeline.process_report(text, activity="mechanical_electrical_maintenance")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.HIGH
        assert res["extraction"].barriers[0].barrier_status == BarrierStatusEnum.UNVERIFIED

    # 14. Multiple Hazards (SIMOPS: Crane Lift over Hot Work)
    def test_14_multi_hazard_simops(self):
        text = "Crane hoist was lifting 3-ton pipe spool directly above hot-work grinding without a SIMOPS permit."
        res = pipeline.process_report(text, activity="simultaneous_operations")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.HIGH
        rules = [r.life_saving_rule for r in res["rule_mappings"]]
        assert "SAFE_MECHANICAL_LIFTING" in rules
        assert "HOT_WORK" in rules

    # 15. Multiple Barriers (Secondary Guarding Degradation)
    def test_15_multiple_barriers(self):
        text = "Scaffold handrail loose and safety harness lanyard frayed while working at 12m height on flare stack."
        res = pipeline.process_report(text, activity="work_at_height")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.HIGH

    # 16. Multiple Activities
    def test_16_multiple_activities(self):
        text = "While conducting exploration drilling, simultaneous electrical maintenance on mud pump proceeded with unverified breaker lockout."
        res = pipeline.process_report(text, activity="exploration_drilling")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.HIGH

    # 17. False Keyword Triggers (Training / Certification)
    def test_17_training_certification_trigger(self):
        text = "Technician completed annual working at height and confined space safety refresher certification."
        res = pipeline.process_report(text, activity="routine_inspection_patrol")
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.LOW
        assert res["extraction"].exposure.present is False

    # 18. Hard-Negative (Actual Minor Injury != SIF Potential)
    def test_18_actual_injury_without_sif(self):
        text = "Worker experienced lower-back lumbar muscle strain while manually lifting 26 kg spare motor; first-aid ice pack administered."
        res = pipeline.process_report(text, activity="mechanical_electrical_maintenance")
        # Under Martin & Black / EEI SCL, manual handling musculoskeletal strain is non-SIF
        assert res["assessment"].sif_potential_label == SIFPotentialLabel.LOW

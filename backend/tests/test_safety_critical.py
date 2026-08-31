import pytest
import sys
import os

# Add backend to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__))))

from app.extraction.extractor import extractor
from app.scoring.sif_engine import score_sif
from app.rules.iogp_mapper import map_iogp_rules
from app.schemas.domain import SIFPotentialLabel, BarrierStatusEnum, RoutingDecision

class TestSafetyCriticalSuite:
    """
    Validation against the 12 deliberate safety-critical test cases
    specified in Chapter 50 of the Technical Specification.
    """

    def test_case_01_obvious_sif(self):
        """Case 1: DEMO-02 (Worker under suspended load during crane lift)"""
        narrative = "Worker briefly stood beneath a suspended 2.5-ton manifold spool while repositioning rigging slings during a crane lift on the drilling pad."
        ext = extractor.extract(narrative, "lifting_rigging")
        assessment = score_sif(ext)
        rules = map_iogp_rules(ext, narrative)
        
        assert assessment.sif_potential_label == SIFPotentialLabel.HIGH
        assert ext.exposure.present is True
        rule_ids = [r.life_saving_rule for r in rules]
        assert "LINE_OF_FIRE" in rule_ids or "SAFE_MECHANICAL_LIFTING" in rule_ids

    def test_case_02_hidden_sif(self):
        """Case 2: DEMO-01 (Flagship: Positive isolation not verified before flange breaking)"""
        narrative = "Work began after upstream valve closed. Positive isolation was not verified with a pressure test before flange breaking. Residual pressure was present. Worker near flange noticed a slight release and stepped back. No injury."
        ext = extractor.extract(narrative, "mechanical_electrical_maintenance")
        assessment = score_sif(ext)
        rules = map_iogp_rules(ext, narrative)
        
        assert assessment.sif_potential_label == SIFPotentialLabel.HIGH
        assert ext.barriers[0].barrier_status == BarrierStatusEnum.UNVERIFIED
        # UNVERIFIED must never be upgraded to FAILED
        assert ext.barriers[0].barrier_status != BarrierStatusEnum.FAILED
        rule_ids = [r.life_saving_rule for r in rules]
        assert "ENERGY_ISOLATION" in rule_ids

    def test_case_03_safe_control_keyword_trap(self):
        """Case 3: DEMO-15 (Line pressure checked and confirmed normal)"""
        narrative = "Line pressure checked and confirmed within normal operating range per schedule; no anomalies noted across gauges."
        ext = extractor.extract(narrative, "pipeline_transport")
        assessment = score_sif(ext)
        
        assert assessment.sif_potential_label == SIFPotentialLabel.LOW
        assert ext.exposure.present is False
        assert ext.barriers[0].barrier_status == BarrierStatusEnum.VERIFIED_INTACT

    def test_case_04_ambiguous_report(self):
        """Case 4: DEMO-14 (Sparse/vague narrative routed to human review)"""
        narrative = "Safety issue observed near the process area. Reported for awareness."
        ext = extractor.extract(narrative)
        assessment = score_sif(ext, is_sparse=True)
        
        assert assessment.sif_potential_label == SIFPotentialLabel.INSUFFICIENT_EVIDENCE
        assert assessment.confidence < 0.55
        assert assessment.routing_decision == RoutingDecision.ROUTE_TO_HUMAN_REVIEW

    def test_case_05_multi_hazard_simops(self):
        """Case 5: DEMO-09 (SIMOPS: Crane lift over hot-work grinding)"""
        narrative = "During a shutdown, a crane lift and hot-work grinding proceeded in adjoining areas without a documented SIMOPS review."
        ext = extractor.extract(narrative, "simultaneous_operations")
        assessment = score_sif(ext)
        rules = map_iogp_rules(ext, narrative)
        
        assert assessment.sif_potential_label == SIFPotentialLabel.HIGH
        rule_ids = [r.life_saving_rule for r in rules]
        assert "SAFE_MECHANICAL_LIFTING" in rule_ids
        assert "HOT_WORK" in rule_ids

    def test_case_06_contradictory_narrative(self):
        """Case 6: DEMO-12 (Isolation completed ... later isolation could not be confirmed)"""
        narrative = "Primary log stated isolation completed. Later during line flange cracking, isolation could not be confirmed by the second technician before work proceeded."
        ext = extractor.extract(narrative)
        assessment = score_sif(ext)
        
        assert assessment.sif_potential_label == SIFPotentialLabel.HIGH
        assert ext.barriers[0].barrier_status == BarrierStatusEnum.UNVERIFIED

    def test_case_07_negation(self):
        """Case 7: DEMO-13 (No personnel were inside exclusion zone)"""
        narrative = "During heavy 60-ton mast hoist, no personnel were inside the exclusion zone at any point during the lift."
        ext = extractor.extract(narrative, "lifting_rigging")
        assessment = score_sif(ext)
        
        assert ext.exposure.present is False
        assert assessment.sif_potential_label == SIFPotentialLabel.LOW

    def test_case_08_barrier_degradation(self):
        """Case 8: DEMO-16 (Gas detector overdue, caught before entry)"""
        narrative = "Gas detector calibration was found overdue by 11 days during a pre-use check; unit was pulled from service before entry."
        ext = extractor.extract(narrative, "confined_space_entry")
        assessment = score_sif(ext)
        
        assert ext.barriers[0].barrier_status == BarrierStatusEnum.DEGRADED
        assert assessment.sif_potential_label == SIFPotentialLabel.MEDIUM

    def test_case_09_barrier_bypass_process_safety(self):
        """Case 9: DEMO-08 (Pressure alarm silenced without MOC)"""
        narrative = "Pressure alarm on a vessel was silenced pending a spare part, without a documented risk assessment for the interim period."
        ext = extractor.extract(narrative, "crude_gas_processing")
        assessment = score_sif(ext)
        rules = map_iogp_rules(ext, narrative)
        
        assert assessment.sif_potential_label == SIFPotentialLabel.HIGH
        assert ext.barriers[0].barrier_status == BarrierStatusEnum.BYPASSED
        assert assessment.process_safety_relevant is True
        rule_ids = [r.life_saving_rule for r in rules]
        assert "BYPASSING_SAFETY_CONTROLS" in rule_ids

    def test_case_10_missing_evidence(self):
        """Case 10: Missing evidence text"""
        narrative = "Observation made at site."
        ext = extractor.extract(narrative)
        assessment = score_sif(ext, is_sparse=True)
        
        assert assessment.sif_potential_label == SIFPotentialLabel.INSUFFICIENT_EVIDENCE

    def test_case_11_training_topic_keyword_trap(self):
        """Case 11: Training mention is not hazard exposure"""
        narrative = "Technician completed annual confined space entry and working at height safety refresher certification."
        ext = extractor.extract(narrative, "routine_inspection_patrol")
        assessment = score_sif(ext)
        
        assert assessment.sif_potential_label == SIFPotentialLabel.LOW

    def test_case_12_non_sif_despite_actual_injury(self):
        """Case 12: DEMO-11 (Manual handling lumbar strain with actual first aid injury)"""
        narrative = "Worker experienced lower-back strain while manually lifting a 28 kg steel pump component; first-aid treatment given."
        ext = extractor.extract(narrative, "mechanical_electrical_maintenance")
        assessment = score_sif(ext)
        
        # Must be LOW SIF potential despite actual injury — actual severity != potential severity
        assert assessment.sif_potential_label == SIFPotentialLabel.LOW

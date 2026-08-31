import pytest
from app.pipeline import pipeline
from app.schemas.domain import SIFPotentialLabel, BarrierStatusEnum

def test_pipeline_end_to_end_flagship_case():
    narrative = "During turnaround, positive isolation was not verified with a pressure test before flange breaking. Residual pressure released suddenly. Worker stepped back. No injury."
    record = pipeline.process_report(
        narrative_text=narrative,
        site="Field Site 4 - Duliajan Central",
        activity="mechanical_electrical_maintenance"
    )

    assert record["report_id"].startswith("OIL-LIVE-")
    assert record["assessment"].sif_potential_label == SIFPotentialLabel.HIGH
    assert record["assessment"].raw_score >= 5.8
    assert record["extraction"].barriers[0].barrier_status == BarrierStatusEnum.UNVERIFIED
    assert len(record["rule_mappings"]) > 0
    assert record["rule_mappings"][0].life_saving_rule == "ENERGY_ISOLATION"
    assert len(record["precursor_chain"].nodes) == 9
    assert len(record["embedding"]) == 384
    assert "version_tags" in record

def test_pipeline_end_to_end_routine_case():
    narrative = "Workshop walkway floor mopped after small rainwater puddle noted. Caution sign posted. Nobody slipped."
    record = pipeline.process_report(
        narrative_text=narrative,
        site="Naharkatiya OCS-3",
        activity="routine_inspection_patrol"
    )

    assert record["assessment"].sif_potential_label == SIFPotentialLabel.LOW
    assert record["assessment"].raw_score == 0.0

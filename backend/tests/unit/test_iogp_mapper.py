import pytest
from app.rules.iogp_mapper import map_iogp_rules
from app.extraction.extractor import extractor

def test_iogp_multi_rule_simops():
    narrative = "During shutdown, a crane lift and hot-work grinding proceeded in adjoining areas without documented SIMOPS review."
    ext = extractor.extract(narrative, "simultaneous_operations")
    rules = map_iogp_rules(ext, narrative)
    
    rule_ids = {r.life_saving_rule for r in rules}
    assert "SAFE_MECHANICAL_LIFTING" in rule_ids
    assert "HOT_WORK" in rule_ids
    assert all(r.guidance is not None for r in rules)

def test_iogp_process_safety_fundamental_flag():
    narrative = "Pressure alarm on vessel was silenced pending spare part without documented risk assessment."
    ext = extractor.extract(narrative, "crude_gas_processing")
    rules = map_iogp_rules(ext, narrative)
    
    rule_ids = {r.life_saving_rule for r in rules}
    assert "BYPASSING_SAFETY_CONTROLS" in rule_ids
    bypass_rule = next(r for r in rules if r.life_saving_rule == "BYPASSING_SAFETY_CONTROLS")
    assert bypass_rule.is_process_safety_fundamental is True

def test_iogp_no_rule_for_routine_housekeeping():
    narrative = "Small patch of rainwater on workshop walkway was mopped up."
    ext = extractor.extract(narrative, "routine_inspection_patrol")
    rules = map_iogp_rules(ext, narrative)
    # Routine non-hazard should not force personal safety LSRs
    assert len(rules) == 0

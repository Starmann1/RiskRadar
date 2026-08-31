import pytest
from app.taxonomy.normalizer import normalizer

def test_normalize_hazard_aliases():
    # Test alias lookup
    h1 = normalizer.normalize_hazard("residual pressure in line")
    assert h1["canonical"] == "stored_pressurized_energy"

    h2 = normalizer.normalize_hazard("un-isolated power switchgear")
    assert h2["canonical"] == "electrical_energy"

    h3 = normalizer.normalize_hazard("h2s alarm activated in sump")
    assert h3["canonical"] == "toxic_gas_h2s"

def test_normalize_barrier_state_integrity():
    # Strict barrier state preservation
    assert normalizer.normalize_barrier_state("not verified") == "UNVERIFIED"
    assert normalizer.normalize_barrier_state("could not be confirmed") == "UNVERIFIED"
    assert normalizer.normalize_barrier_state("UNVERIFIED") != "FAILED"
    assert normalizer.normalize_barrier_state("ruptured seal") == "FAILED"
    assert normalizer.normalize_barrier_state("software override") == "BYPASSED"
    assert normalizer.normalize_barrier_state("overdue calibration") == "DEGRADED"

def test_normalize_activity():
    act = normalizer.normalize_activity("crane rigging operations")
    assert act["canonical"] == "lifting_rigging"

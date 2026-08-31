import pytest
from app.patterns.pattern_engine import pattern_engine

def test_pattern_engine_similarity_search():
    target_narrative = "Positive isolation was not verified with pressure test before unbolting flange."
    similar = pattern_engine.get_similar_reports(target_narrative, top_k=3)
    assert len(similar) > 0
    assert similar[0]["similarity_score"] > 0.40
    assert "site" in similar[0]

def test_pattern_engine_density_calculations():
    # Test with reports dataset
    site_densities = pattern_engine.calculate_site_precursor_densities(pattern_engine.reports)
    assert len(site_densities) > 0
    assert "sif_precursor_density" in site_densities[0]

    act_densities = pattern_engine.calculate_activity_precursor_densities(pattern_engine.reports)
    assert len(act_densities) > 0
    assert "sif_precursor_density" in act_densities[0]

    # Test empty handling
    empty_densities = pattern_engine.calculate_site_precursor_densities([])
    assert empty_densities == []

def test_dynamic_anomalies_detection():
    # Test with reports dataset
    anomalies = pattern_engine.detect_emerging_anomalies(pattern_engine.reports)
    assert len(anomalies) > 0
    assert anomalies[0]["pattern_type"] in ("CROSS_SITE_CLUSTER", "SITE_SPIKE")
    assert "affected_sites" in anomalies[0]

    # Test empty handling
    empty_anomalies = pattern_engine.detect_emerging_anomalies([])
    assert empty_anomalies == []

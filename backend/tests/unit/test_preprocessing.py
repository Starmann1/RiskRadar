import pytest
from app.preprocessing.nlp_pipeline import preprocess_narrative, clean_text, expand_abbreviations, detect_temporal_contradictions, detect_negations

def test_clean_text():
    raw = "  During  flange  breaking   work…  “positive isolation” was not verified. "
    cleaned = clean_text(raw)
    assert "  " not in cleaned
    assert '"positive isolation"' in cleaned

def test_expand_abbreviations():
    text = "Worker entered tank without PTW or LOTO applied."
    expanded = expand_abbreviations(text)
    assert "Permit to Work" in expanded
    assert "Lockout Tagout" in expanded

def test_detect_negations():
    text = "Work began after valve closed. Positive isolation was not verified before flange breaking."
    negations = detect_negations(text)
    assert len(negations) > 0
    assert any("not verified" in n["pattern"].lower() for n in negations)
    assert all("char_start" in n and "char_end" in n for n in negations)

def test_temporal_contradictions():
    sentences = [
        "Primary log stated isolation completed.",
        "Later during line flange cracking, isolation could not be confirmed by the second technician before work proceeded."
    ]
    contradictions = detect_temporal_contradictions(sentences)
    assert len(contradictions) == 1
    assert "could not be confirmed" in contradictions[0]["governing_claim"]

def test_sparse_narrative_detection():
    sparse_text = "Safety observation recorded for awareness."
    res = preprocess_narrative(sparse_text)
    assert res["is_sparse"] is True
    assert len(res["missing_elements"]) > 0

    detailed_text = "Positive isolation on hydrocarbon manifold valve was not verified before flange unbolting."
    res2 = preprocess_narrative(detailed_text)
    assert res2["is_sparse"] is False

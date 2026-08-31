import pytest
from app.extraction.llm_extractor import LLMExtractor
from app.extraction.llm_client import MockLLMProvider
from app.schemas.domain import BarrierStatusEnum

def test_llm_extractor_with_mock_provider():
    mock_data = {
        "activity": "mechanical_electrical_maintenance",
        "location_mentioned": "Moran Oilfield Well #84",
        "hazards": [
            {
                "canonical_or_raw_term": "stored_pressurized_energy",
                "energy_type": "pressure",
                "energy_level": 3,
                "evidence_span": "Residual pressure of 14 bar caused sudden emulsion ejection."
            }
        ],
        "energy_type": "pressure",
        "energy_level": 3,
        "exposure": {
            "present": True,
            "description": "Technician in line of fire during flange cracking",
            "proximity": 2,
            "evidence_span": "Crew unbolted wellhead flange."
        },
        "barriers": [
            {
                "name": "positive_energy_isolation",
                "status_description": "not verified before work started",
                "barrier_status": "UNVERIFIED",
                "evidence_span": "Positive isolation was not verified before crew unbolted wellhead flange."
            }
        ],
        "potential_consequence": "Hydrocarbon blowout or pressure ejection injury",
        "negations_detected": [],
        "contradictions_detected": [],
        "uncertainties": [],
        "confidence": 0.96
    }
    provider = MockLLMProvider(mock_response=mock_data)
    extractor = LLMExtractor(provider=provider)
    narrative = "During scheduled turnaround maintenance on hydrocarbon line, positive isolation was not verified before crew unbolted wellhead flange. Residual pressure of 14 bar caused sudden emulsion ejection."
    
    result = extractor.extract(narrative, activity_hint="mechanical_electrical_maintenance")
    assert result is not None
    assert result.activity == "mechanical_electrical_maintenance"
    assert len(result.hazards) == 1
    assert result.hazards[0].canonical_hazard == "stored_pressurized_energy"
    assert result.barriers[0].barrier_status == BarrierStatusEnum.UNVERIFIED
    assert result.exposure.present is True

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.domain import BarrierStatusEnum

class LLMHazardItem(BaseModel):
    canonical_or_raw_term: str = Field(description="Name or description of the hazard identified in text")
    energy_type: str = Field(default="mechanical", description="Type of energy: pressure, electrical, gravitational, chemical, thermal, mechanical")
    energy_level: int = Field(default=1, ge=0, le=3, description="0=none, 1=low, 2=moderate, 3=high/catastrophic")
    evidence_span: str = Field(description="Exact verbatim sentence from the narrative proving this hazard")

class LLMBarrierItem(BaseModel):
    name: str = Field(description="Name or description of the safety barrier or control")
    status_description: str = Field(description="Plain text description of the barrier condition (e.g. unverified, missing, degraded, verified intact)")
    barrier_status: BarrierStatusEnum = Field(default=BarrierStatusEnum.UNVERIFIED, description="Status enum: VERIFIED_INTACT, DEGRADED, UNVERIFIED, WEAK, MISSING, FAILED, BYPASSED")
    evidence_span: str = Field(description="Exact verbatim sentence from the narrative proving this barrier status")

class LLMExposureItem(BaseModel):
    present: bool = Field(default=True, description="Whether any personnel were in the danger zone/line of fire")
    description: Optional[str] = Field(default=None, description="Description of personnel positioning relative to release point")
    proximity: int = Field(default=1, ge=0, le=2, description="0=distant/shielded, 1=nearby, 2=direct line of fire")
    evidence_span: Optional[str] = Field(default=None, description="Exact verbatim sentence proving exposure or lack thereof")

class LLMNegationItem(BaseModel):
    span: str = Field(description="Text span containing negation")
    negated_claim: str = Field(description="The specific action or barrier that was negated")

class LLMContradictionItem(BaseModel):
    claim_a: str = Field(description="First claim")
    claim_b: str = Field(description="Contradicting claim")
    governing_claim: str = Field(description="The operative claim that governs per domain rules")

class LLMExtractionPayload(BaseModel):
    """
    Strict structured JSON output contract for LLM Structured Extraction.
    Enforces anti-hallucination, mandatory verbatim evidence spans, and explicit uncertainty channels.
    """
    activity: str = Field(description="Operational activity being performed")
    location_mentioned: Optional[str] = Field(default=None, description="Site or facility mentioned in text")
    hazards: List[LLMHazardItem] = Field(default_factory=list, description="All hazards identified in the narrative")
    energy_type: str = Field(default="mechanical", description="Primary dominant energy type")
    energy_level: int = Field(default=1, ge=0, le=3, description="Primary dominant energy level (0-3)")
    exposure: LLMExposureItem = Field(description="Personnel exposure assessment")
    barriers: List[LLMBarrierItem] = Field(default_factory=list, description="All safety barriers mentioned and their states")
    potential_consequence: Optional[str] = Field(default=None, description="Plausible consequence if barrier failed uncontrolled")
    negations_detected: List[LLMNegationItem] = Field(default_factory=list, description="Negations identified in text")
    contradictions_detected: List[LLMContradictionItem] = Field(default_factory=list, description="Contradictory claims in text")
    uncertainties: List[str] = Field(default_factory=list, description="Explicit uncertainties or missing information")
    confidence: float = Field(default=0.90, ge=0.0, le=1.0, description="Extraction certainty score")

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class ReportType(str, Enum):
    UA = "UA"
    UC = "UC"
    NEAR_MISS = "NEAR_MISS"
    INCIDENT = "INCIDENT"

class ActualSeverity(str, Enum):
    NONE = "NONE"
    FIRST_AID = "FIRST_AID"
    MEDICAL_TREATMENT = "MEDICAL_TREATMENT"
    LOST_TIME = "LOST_TIME"
    FATALITY = "FATALITY"

class BarrierStatusEnum(str, Enum):
    VERIFIED_INTACT = "VERIFIED_INTACT"
    DEGRADED = "DEGRADED"
    UNVERIFIED = "UNVERIFIED"
    WEAK = "WEAK"
    MISSING = "MISSING"
    FAILED = "FAILED"
    BYPASSED = "BYPASSED"

class SIFPotentialLabel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"

class RoutingDecision(str, Enum):
    PRIORITY_QUEUE = "PRIORITY_QUEUE"
    ROUTE_TO_HUMAN_REVIEW = "ROUTE_TO_HUMAN_REVIEW"
    LOG_ONLY = "LOG_ONLY"

class ReviewDecision(str, Enum):
    ACCEPT = "ACCEPT"
    EDIT = "EDIT"
    REJECT = "REJECT"

class ReportCreateRequest(BaseModel):
    external_ref: Optional[str] = None
    report_type: ReportType
    report_date: str
    site: str
    activity: str
    narrative_text: str
    actual_severity: Optional[ActualSeverity] = ActualSeverity.NONE
    contractor_involved: Optional[bool] = False
    extracted_images: List[str] = []

class EvidenceSpan(BaseModel):
    field_name: str
    source_sentence: str
    char_start: Optional[int] = None
    char_end: Optional[int] = None
    matched_text: Optional[str] = None
    confidence: float = 0.95

class ExtractedHazard(BaseModel):
    canonical_hazard: str
    display_name: str
    energy_type: str
    energy_level: int
    evidence_span: Optional[EvidenceSpan] = None

class ExtractedBarrier(BaseModel):
    canonical_barrier: str
    display_name: str
    barrier_status: BarrierStatusEnum
    evidence_span: Optional[EvidenceSpan] = None

class ExtractedExposure(BaseModel):
    present: bool
    description: Optional[str] = None
    proximity: int = Field(default=0, ge=0, le=2) # 0=distant, 1=nearby, 2=direct
    evidence_span: Optional[EvidenceSpan] = None

class ExtractionResult(BaseModel):
    activity: str
    activity_criticality: int = 1
    location_mentioned: Optional[str] = None
    hazards: List[ExtractedHazard] = []
    energy_type: str = "mechanical"
    energy_level: int = 1
    exposure: ExtractedExposure
    barriers: List[ExtractedBarrier] = []
    potential_consequence: Optional[str] = None
    negations_detected: List[Dict[str, Any]] = []
    contradictions_detected: List[Dict[str, Any]] = []
    uncertainties: List[str] = []
    raw_llm_response: Optional[str] = None
    extraction_metadata: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 0.90

class ComponentScores(BaseModel):
    exposure: int
    energy: int
    barrier: int
    proximity: int
    activity: int

class SIFAssessment(BaseModel):
    raw_score: float
    sif_potential_label: SIFPotentialLabel
    confidence: float
    routing_decision: RoutingDecision
    component_scores: ComponentScores
    process_safety_relevant: bool
    reasons: List[str] = []

class RuleMapping(BaseModel):
    life_saving_rule: str
    rule_display_name: str
    is_process_safety_fundamental: bool = False
    confidence: float
    evidence_span: Optional[EvidenceSpan] = None
    guidance: Optional[str] = None

class ChainNode(BaseModel):
    node_id: str
    node_type: str
    title: str
    value: str
    subtext: Optional[str] = None
    evidence_sentence: Optional[str] = None
    confidence: float = 0.95
    sequence_order: int
    status_color: Optional[str] = None

class ChainEdge(BaseModel):
    from_node_id: str
    to_node_id: str
    relationship_type: str

class PrecursorChain(BaseModel):
    report_id: str
    nodes: List[ChainNode]
    edges: List[ChainEdge]

class ReportReviewRequest(BaseModel):
    reviewer_id: str
    decision: ReviewDecision
    corrected_label: Optional[SIFPotentialLabel] = None
    reason: Optional[str] = None

class ReportResponse(BaseModel):
    report_id: str
    external_ref: str
    title: Optional[str] = None
    report_type: ReportType
    report_date: str
    site: str
    activity: str
    narrative_text: str
    actual_severity: ActualSeverity
    contractor_involved: bool
    difficulty_category: Optional[str] = None
    extraction: Optional[ExtractionResult] = None
    assessment: Optional[SIFAssessment] = None
    rule_mappings: List[RuleMapping] = []
    precursor_chain: Optional[PrecursorChain] = None
    review_status: str = "PENDING"
    reviewed_by: Optional[str] = None
    review_decision: Optional[ReviewDecision] = None
    review_comment: Optional[str] = None
    created_at: Optional[str] = None
    extracted_images: List[str] = []

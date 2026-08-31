export type ReportType = "UA" | "UC" | "NEAR_MISS" | "INCIDENT";
export type ActualSeverity = "NONE" | "FIRST_AID" | "MEDICAL_TREATMENT" | "LOST_TIME" | "FATALITY";
export type BarrierStatusEnum = "VERIFIED_INTACT" | "DEGRADED" | "UNVERIFIED" | "WEAK" | "MISSING" | "FAILED" | "BYPASSED";
export type SIFPotentialLabel = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_EVIDENCE";
export type RoutingDecision = "PRIORITY_QUEUE" | "ROUTE_TO_HUMAN_REVIEW" | "LOG_ONLY";
export type ReviewDecision = "ACCEPT" | "EDIT" | "REJECT";

export interface EvidenceSpan {
  field_name: string;
  source_sentence: string;
  char_start?: number;
  char_end?: number;
  confidence: number;
}

export interface ExtractedHazard {
  canonical_hazard: string;
  display_name: string;
  energy_type: string;
  energy_level: number;
  evidence_span?: EvidenceSpan;
}

export interface ExtractedBarrier {
  canonical_barrier: string;
  display_name: string;
  barrier_status: BarrierStatusEnum;
  evidence_span?: EvidenceSpan;
}

export interface ExtractedExposure {
  present: boolean;
  description?: string;
  proximity: number; // 0=distant, 1=nearby, 2=direct
  evidence_span?: EvidenceSpan;
}

export interface ExtractionResult {
  activity: string;
  activity_criticality: number;
  location_mentioned?: string | null;
  hazards: ExtractedHazard[];
  energy_type: string;
  energy_level: number;
  exposure: ExtractedExposure;
  barriers: ExtractedBarrier[];
  potential_consequence?: string | null;
  negations_detected: any[];
  contradictions_detected: any[];
  uncertainties: string[];
  confidence: number;
}

export interface ComponentScores {
  exposure: number;
  energy: number;
  barrier: number;
  proximity: number;
  activity: number;
}

export interface SIFAssessment {
  raw_score: number;
  sif_potential_label: SIFPotentialLabel;
  confidence: number;
  routing_decision: RoutingDecision;
  component_scores: ComponentScores;
  process_safety_relevant: boolean;
  reasons: string[];
}

export interface RuleMapping {
  life_saving_rule: string;
  rule_display_name: string;
  is_process_safety_fundamental: boolean;
  confidence: number;
  evidence_span?: EvidenceSpan;
  guidance?: string;
}

export interface ChainNode {
  node_id: string;
  node_type: string;
  title: string;
  value: string;
  subtext?: string;
  evidence_sentence?: string;
  confidence: number;
  sequence_order: number;
  status_color?: string;
}

export interface ChainEdge {
  from_node_id: string;
  to_node_id: string;
  relationship_type: string;
}

export interface PrecursorChain {
  report_id: string;
  nodes: ChainNode[];
  edges: ChainEdge[];
}

export interface ReportItem {
  report_id: string;
  external_ref: string;
  title?: string;
  report_type: ReportType;
  report_date: string;
  site: string;
  activity: string;
  narrative_text: string;
  actual_severity: ActualSeverity;
  contractor_involved: boolean;
  difficulty_category?: string;
  extraction?: ExtractionResult;
  assessment: SIFAssessment;
  rule_mappings: RuleMapping[];
  precursor_chain?: PrecursorChain;
  review_status: string;
  reviewed_by?: string | null;
  review_decision?: ReviewDecision | null;
  review_comment?: string | null;
  created_at?: string;
  extracted_images?: string[];
}

export interface SiteDensityItem {
  site: string;
  total_reports: number;
  high_sif_count: number;
  medium_sif_count: number;
  low_count: number;
  sif_precursor_density: number;
  risk_tier: "CRITICAL" | "ELEVATED" | "NORMAL";
}

export interface ActivityDensityItem {
  activity: string;
  display_name: string;
  total_reports: number;
  high_sif_count: number;
  medium_sif_count: number;
  low_count: number;
  sif_precursor_density: number;
}

export interface BarrierFailureItem {
  barrier_state: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AnomalyAlert {
  pattern_id: string;
  pattern_type: string;
  hazard: string;
  barrier_state: string;
  activity: string;
  headline: string;
  description: string;
  affected_sites: string[];
  count_in_window: number;
  severity_tier: "CRITICAL" | "HIGH" | "MEDIUM";
  recommended_action: string;
}

export interface ExecutiveOverviewData {
  total_reports: number;
  high_sif_precursors: number;
  medium_sif_precursors: number;
  low_potential_reports: number;
  insufficient_evidence_count: number;
  enterprise_sif_density: number;
  top_sites_by_density: SiteDensityItem[];
  top_activities_by_density: ActivityDensityItem[];
  active_anomaly_alerts: AnomalyAlert[];
}

// SIF Telemetry Engine Types
export interface SafetyStateVectorData {
  energy_intensity: number;
  exposure_level: number;
  barrier_health: number;
  activity_criticality: number;
  sif_potential: number;
  evidence_confidence: number;
  composite_risk_index: number;
}

export interface StateDeltaData {
  delta_energy: number;
  delta_exposure: number;
  delta_barrier_health: number;
  delta_sif_potential: number;
  delta_composite: number;
  risk_drift_score: number;
  drift_level: "CRITICAL" | "HIGH" | "MODERATE" | "STABLE" | "IMPROVING" | "BASELINE";
}

export interface TelemetryTimelinePoint {
  point_id: string;
  time_label: string;
  date: string;
  report_id: string;
  external_ref: string;
  activity: string;
  hazard: string;
  barrier: string;
  barrier_status: string;
  sif_score: number;
  sif_label: string;
  confidence: number;
  narrative_excerpt: string;
  state_vector: SafetyStateVectorData;
  delta: StateDeltaData;
  composite_risk: number;
}

export interface TrajectoryExplanation {
  primary_driver: string;
  contributing_factors: string[];
  what_is_changing: {
    barrier_health: "UP" | "DOWN" | "STABLE";
    exposure: "UP" | "DOWN" | "STABLE";
    sif_potential: "UP" | "DOWN" | "STABLE";
    energy: "UP" | "DOWN" | "STABLE";
  };
  hse_recommendation: string;
}

export interface SiteTelemetryResponse {
  site: string;
  activity?: string;
  trajectory_status: "STABLE" | "EMERGING" | "DETERIORATING" | "CRITICAL";
  trajectory_badge: string;
  risk_drift_label: string;
  color: string;
  total_points: number;
  timeline: TelemetryTimelinePoint[];
  explanation: TrajectoryExplanation;
  is_synthetic_demo?: boolean;
  scenario_name?: string;
  badge_label?: string;
}

export interface SiteTelemetrySummaryItem {
  site: string;
  trajectory_status: "STABLE" | "EMERGING" | "DETERIORATING" | "CRITICAL";
  trajectory_badge: string;
  risk_drift_label: string;
  color: string;
  total_points: number;
  primary_driver: string;
  hse_recommendation: string;
  is_synthetic?: boolean;
}

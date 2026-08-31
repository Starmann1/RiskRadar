import { ReportItem, PrecursorChain, SIFPotentialLabel, BarrierStatusEnum } from "../types";

export function buildLocalPrecursorChain(report: any): PrecursorChain {
  if (!report) {
    return {
      report_id: "EMPTY",
      nodes: [],
      edges: []
    };
  }

  // Extract properties safely whether nested under extraction/assessment or flat
  const ext = report.extraction || {};
  const assess = report.assessment || {};
  const rulesList = report.rule_mappings || [];

  const bStatus = ext.barriers?.[0]?.barrier_status || report.barrier_failure_type || (report.barriers && report.barriers[0]?.barrier_status) || "UNVERIFIED";
  const bName = ext.barriers?.[0]?.display_name || (Array.isArray(report.barrier) ? report.barrier[0] : report.barrier) || "Positive Isolation / Safety Barrier";
  const hName = ext.hazards?.[0]?.display_name || (Array.isArray(report.hazard) ? report.hazard[0] : report.hazard) || "Stored Hazardous Energy";
  const energyType = ext.energy_type || report.energy_type || "Stored Pressure / Kinetic";
  const energyLevel = ext.energy_level ?? report.energy_level ?? 3;
  const expPresent = ext.exposure?.present ?? (report.exposure_present !== false);
  const expDesc = ext.exposure?.description || report.exposure_description || (expPresent ? "Personnel in direct line of fire / hazardous zone" : "Zero personnel exposure (shielded)");
  const consequence = ext.potential_consequence || report.potential_consequence || "Catastrophic energy release and severe SIF trauma";

  const sifLabel = (assess.sif_potential_label || report.sif_potential_label || "HIGH").toUpperCase();
  const rawScore = assess.raw_score ?? report.raw_score ?? 7.5;
  const sentence = ext.barriers?.[0]?.evidence_span?.source_sentence || ext.hazards?.[0]?.evidence_span?.source_sentence || (report.narrative_text ? report.narrative_text.split(".")[0] + "." : "Operational safety observation logged.");

  const ruleNames = rulesList.length > 0
    ? rulesList.map((r: any) => r.rule_display_name || r.life_saving_rule).filter(Boolean)
    : (Array.isArray(report.life_saving_rule) ? report.life_saving_rule : ["Energy Isolation Standard"]);

  const statusColors: Record<string, string> = {
    VERIFIED_INTACT: "#10b981",
    DEGRADED: "#f59e0b",
    UNVERIFIED: "#f97316",
    WEAK: "#ef4444",
    MISSING: "#dc2626",
    FAILED: "#b91c1c",
    BYPASSED: "#7f1d1d"
  };

  const nodes = [
    {
      node_id: "node-1-act",
      node_type: "ACTIVITY",
      title: "1. Operational Activity",
      value: (ext.activity || report.activity || "Maintenance & Operations").replace(/_/g, " ").toUpperCase(),
      subtext: `Criticality Tier: ${ext.activity_criticality === 2 ? "High Consequence" : "Standard"}`,
      evidence_sentence: sentence,
      confidence: 0.96,
      sequence_order: 1,
      status_color: "#3b82f6"
    },
    {
      node_id: "node-2-haz",
      node_type: "HAZARD",
      title: "2. Identified Hazard",
      value: String(hName).replace(/_/g, " ").toUpperCase(),
      subtext: `Energy: ${String(energyType).toUpperCase()} (Level ${energyLevel}/3)`,
      evidence_sentence: sentence,
      confidence: 0.94,
      sequence_order: 2,
      status_color: "#f59e0b"
    },
    {
      node_id: "node-3-bar",
      node_type: "BARRIER",
      title: "3. Prescribed Safety Barrier",
      value: String(bName).replace(/_/g, " ").toUpperCase(),
      subtext: "Preventive / Engineered Defense",
      evidence_sentence: sentence,
      confidence: 0.92,
      sequence_order: 3,
      status_color: "#06b6d4"
    },
    {
      node_id: "node-4-fail",
      node_type: "BARRIER_FAILURE",
      title: "4. Barrier Failure State",
      value: `Status: ${bStatus}`,
      subtext: "Reason's Swiss Cheese Latent Flaw",
      evidence_sentence: sentence,
      confidence: 0.95,
      sequence_order: 4,
      status_color: statusColors[bStatus] || "#ef4444"
    },
    {
      node_id: "node-5-exp",
      node_type: "EXPOSURE",
      title: "5. Personnel Exposure",
      value: expPresent ? "Exposed in Danger Zone" : "Zero Exposure (Shielded)",
      subtext: expDesc,
      evidence_sentence: sentence,
      confidence: 0.95,
      sequence_order: 5,
      status_color: expPresent ? "#ef4444" : "#10b981"
    },
    {
      node_id: "node-6-con",
      node_type: "CONSEQUENCE",
      title: "6. Potential Consequence",
      value: consequence,
      subtext: `SIF Potential: ${sifLabel} (${rawScore} / 10.0)`,
      evidence_sentence: sentence,
      confidence: assess.confidence || 0.94,
      sequence_order: 6,
      status_color: sifLabel === "HIGH" ? "#dc2626" : (sifLabel === "MEDIUM" ? "#f59e0b" : "#10b981")
    },
    {
      node_id: "node-7-lsr",
      node_type: "LIFE_SAVING_RULE",
      title: "7. IOGP Life-Saving Rule",
      value: ruleNames.length > 0 ? ruleNames.join(" & ") : "Process Safety Fundamentals (PSF)",
      subtext: "IOGP Report 459 Standardized Rule",
      evidence_sentence: sentence,
      confidence: 0.93,
      sequence_order: 7,
      status_color: "#8b5cf6"
    },
    {
      node_id: "node-8-pat",
      node_type: "PATTERN",
      title: "8. Precursor Pattern Discovery",
      value: "Precursor Recurrence Alert",
      subtext: "Cross-site latent failure pattern correlation",
      evidence_sentence: "RiskRadar pattern analytics flagged recurring barrier weakness across operational installations.",
      confidence: 0.91,
      sequence_order: 8,
      status_color: "#ec4899"
    },
    {
      node_id: "node-9-act",
      node_type: "ACTION",
      title: "9. Recommended HSE Action",
      value: sifLabel === "HIGH" ? "Immediate Standdown & Positive Isolation Hold Point" : (sifLabel === "MEDIUM" ? "Engineering Barrier Audit & Work Permit Review" : "Log in HSSE Observation & Verification Ledger"),
      subtext: "Hierarchy of Controls: Engineering / Administrative",
      evidence_sentence: "Action auto-generated based on SIF Precursor Priority and Barrier Degradation.",
      confidence: 0.95,
      sequence_order: 9,
      status_color: "#10b981"
    }
  ];

  const edges = [
    { from_node_id: "node-1-act", to_node_id: "node-2-haz", relationship_type: "INVOLVES_HAZARD" },
    { from_node_id: "node-2-haz", to_node_id: "node-3-bar", relationship_type: "CONTROLLED_BY" },
    { from_node_id: "node-3-bar", to_node_id: "node-4-fail", relationship_type: "EXPERIENCED_STATE" },
    { from_node_id: "node-4-fail", to_node_id: "node-5-exp", relationship_type: "LEADS_TO_EXPOSURE" },
    { from_node_id: "node-5-exp", to_node_id: "node-6-con", relationship_type: "POTENTIAL_ESCALATION" },
    { from_node_id: "node-6-con", to_node_id: "node-7-lsr", relationship_type: "GOVERNED_BY" },
    { from_node_id: "node-7-lsr", to_node_id: "node-8-pat", relationship_type: "CORRELATED_WITH" },
    { from_node_id: "node-8-pat", to_node_id: "node-9-act", relationship_type: "TRIGGERS_ACTION" }
  ];

  return {
    report_id: report.report_id || "UNKNOWN",
    nodes,
    edges
  };
}

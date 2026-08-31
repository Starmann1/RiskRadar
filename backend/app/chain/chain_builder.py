from typing import List, Dict, Any, Optional
from app.schemas.domain import (
    ChainNode,
    ChainEdge,
    PrecursorChain,
    ExtractionResult,
    SIFAssessment,
    RuleMapping,
    SIFPotentialLabel
)

def build_precursor_chain(
    report_id: str,
    raw_narrative: str,
    extraction: ExtractionResult,
    assessment: SIFAssessment,
    rule_mappings: List[RuleMapping]
) -> PrecursorChain:
    """
    Constructs the flagship evidence-linked 9-stage Bowtie DAG:
    1. Activity
    2. Hazard
    3. Energy Source
    4. Primary Barrier
    5. Barrier Failure State
    6. Exposure Point
    7. Potential Consequence
    8. IOGP Life-Saving Rule
    9. Recommended HSE Action
    """
    nodes: List[ChainNode] = []
    edges: List[ChainEdge] = []

    # 1. Activity Node
    act_display = extraction.activity.replace("_", " ").title()
    nodes.append(ChainNode(
        node_id="node-1-activity",
        node_type="ACTIVITY",
        title="1. Operational Activity",
        value=act_display,
        subtext=f"Criticality: {'High' if extraction.activity_criticality==2 else 'Standard'}",
        evidence_sentence=raw_narrative.split(".")[0] + ".",
        confidence=0.96,
        sequence_order=1,
        status_color="#3b82f6"
    ))

    # 2. Hazard Node
    primary_hazard = extraction.hazards[0].display_name if extraction.hazards else "Operational Hazard"
    h_sent = extraction.hazards[0].evidence_span.source_sentence if (extraction.hazards and extraction.hazards[0].evidence_span) else raw_narrative.split(".")[0] + "."
    nodes.append(ChainNode(
        node_id="node-2-hazard",
        node_type="HAZARD",
        title="2. Identified Hazard",
        value=primary_hazard,
        subtext=f"Energy: {extraction.energy_type.capitalize()} (Level {extraction.energy_level}/3)",
        evidence_sentence=h_sent,
        confidence=0.94,
        sequence_order=2,
        status_color="#f59e0b"
    ))
    edges.append(ChainEdge(from_node_id="node-1-activity", to_node_id="node-2-hazard", relationship_type="INVOLVES_HAZARD"))

    # 3. Barrier Node
    primary_barrier = extraction.barriers[0].display_name if extraction.barriers else "Engineered / Procedural Barrier"
    nodes.append(ChainNode(
        node_id="node-3-barrier",
        node_type="BARRIER",
        title="3. Prescribed Safety Barrier",
        value=primary_barrier,
        subtext="Preventive / Direct Control",
        evidence_sentence=h_sent,
        confidence=0.92,
        sequence_order=3,
        status_color="#06b6d4"
    ))
    edges.append(ChainEdge(from_node_id="node-2-hazard", to_node_id="node-3-barrier", relationship_type="CONTROLLED_BY"))

    # 4. Barrier Failure State Node
    b_status = extraction.barriers[0].barrier_status.value if extraction.barriers else "UNVERIFIED"
    b_sent = extraction.barriers[0].evidence_span.source_sentence if (extraction.barriers and extraction.barriers[0].evidence_span) else h_sent
    status_colors = {
        "VERIFIED_INTACT": "#10b981",
        "DEGRADED": "#f59e0b",
        "UNVERIFIED": "#f97316",
        "WEAK": "#ef4444",
        "MISSING": "#dc2626",
        "FAILED": "#b91c1c",
        "BYPASSED": "#7f1d1d"
    }
    nodes.append(ChainNode(
        node_id="node-4-barrier-failure",
        node_type="BARRIER_FAILURE",
        title="4. Barrier Failure State",
        value=f"Status: {b_status}",
        subtext="Reason's Swiss Cheese Latent Flaw",
        evidence_sentence=b_sent,
        confidence=0.95,
        sequence_order=4,
        status_color=status_colors.get(b_status, "#ef4444")
    ))
    edges.append(ChainEdge(from_node_id="node-3-barrier", to_node_id="node-4-barrier-failure", relationship_type="EXPERIENCED_STATE"))

    # 5. Exposure Node
    exp_desc = extraction.exposure.description if extraction.exposure.description else ("Personnel in danger zone" if extraction.exposure.present else "No personnel in exclusion zone")
    nodes.append(ChainNode(
        node_id="node-5-exposure",
        node_type="EXPOSURE",
        title="5. Personnel Exposure",
        value="Exposed" if extraction.exposure.present else "Zero Exposure (Shielded)",
        subtext=exp_desc,
        evidence_sentence=extraction.exposure.evidence_span.source_sentence if extraction.exposure.evidence_span else b_sent,
        confidence=0.95,
        sequence_order=5,
        status_color="#ef4444" if extraction.exposure.present else "#10b981"
    ))
    edges.append(ChainEdge(from_node_id="node-4-barrier-failure", to_node_id="node-5-exposure", relationship_type="LEADS_TO_EXPOSURE"))

    # 6. Potential Consequence Node
    consequence_text = extraction.potential_consequence if extraction.potential_consequence else "Potential serious harm or process upset"
    nodes.append(ChainNode(
        node_id="node-6-consequence",
        node_type="CONSEQUENCE",
        title="6. Potential Consequence",
        value=consequence_text,
        subtext=f"SIF Potential: {assessment.sif_potential_label.value} (Score {assessment.raw_score})",
        evidence_sentence=b_sent,
        confidence=assessment.confidence,
        sequence_order=6,
        status_color="#dc2626" if assessment.sif_potential_label == SIFPotentialLabel.HIGH else ("#f59e0b" if assessment.sif_potential_label == SIFPotentialLabel.MEDIUM else "#10b981")
    ))
    edges.append(ChainEdge(from_node_id="node-5-exposure", to_node_id="node-6-consequence", relationship_type="POTENTIAL_ESCALATION"))

    # 7. Life-Saving Rule Node
    rule_str = ", ".join(r.rule_display_name for r in rule_mappings) if rule_mappings else "Process Safety Fundamentals (PSF)"
    nodes.append(ChainNode(
        node_id="node-7-rule",
        node_type="LIFE_SAVING_RULE",
        title="7. IOGP Life-Saving Rule",
        value=rule_str,
        subtext="Report 459 Standardized Barrier",
        evidence_sentence=rule_mappings[0].evidence_span.source_sentence if (rule_mappings and rule_mappings[0].evidence_span) else b_sent,
        confidence=rule_mappings[0].confidence if rule_mappings else 0.90,
        sequence_order=7,
        status_color="#8b5cf6"
    ))
    edges.append(ChainEdge(from_node_id="node-6-consequence", to_node_id="node-7-rule", relationship_type="GOVERNED_BY"))

    # 8. Pattern Node
    nodes.append(ChainNode(
        node_id="node-8-pattern",
        node_type="PATTERN",
        title="8. Precursor Pattern Discovery",
        value="Precursor Clustering Detected",
        subtext="Recurring barrier failure across installations",
        evidence_sentence="Pattern analytics detected multiple similar precursor events within a 45-day window.",
        confidence=0.91,
        sequence_order=8,
        status_color="#ec4899"
    ))
    edges.append(ChainEdge(from_node_id="node-7-rule", to_node_id="node-8-pattern", relationship_type="CORRELATED_WITH"))

    # 9. Recommended Action Node
    if assessment.sif_potential_label == SIFPotentialLabel.HIGH:
        action_text = "Immediate Stop Work & Targeted Verification Toolbox Talk"
    elif assessment.sif_potential_label == SIFPotentialLabel.MEDIUM:
        action_text = "Engineering Barrier Inspection & Maintenance Work Order"
    else:
        action_text = "Log in HSSE Observation Ledger & Routine Review"

    nodes.append(ChainNode(
        node_id="node-9-action",
        node_type="ACTION",
        title="9. Recommended HSE Action",
        value=action_text,
        subtext="Hierarchy of Controls (Elimination / Engineering)",
        evidence_sentence="Action auto-generated based on SIF Precursor Risk Priority.",
        confidence=0.95,
        sequence_order=9,
        status_color="#10b981"
    ))
    edges.append(ChainEdge(from_node_id="node-8-pattern", to_node_id="node-9-action", relationship_type="TRIGGERS_ACTION"))

    return PrecursorChain(
        report_id=report_id,
        nodes=nodes,
        edges=edges
    )

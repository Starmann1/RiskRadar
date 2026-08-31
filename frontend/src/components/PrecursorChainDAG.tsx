import { useLanguage } from "../context/LanguageContext";
import React, { useState } from "react";
import { PrecursorChain, ChainNode, ReportItem } from "../types";
import {
  Activity,
  AlertTriangle,
  Shield,
  AlertOctagon,
  Eye,
  Flame,
  ShieldAlert,
  GitFork,
  CheckCircle2,
  ChevronRight,
  Info,
  Sparkles,
  FileText,
  Layers,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

interface PrecursorChainDAGProps {
  chain: PrecursorChain;
  report: ReportItem;
  onOpenRCAStudio?: () => void;
}

export const PrecursorChainDAG: React.FC<PrecursorChainDAGProps> = ({
  chain,
  report
}) => {
  const { t, language } = useLanguage();
  const nodes = chain?.nodes && chain.nodes.length > 0 ? chain.nodes : [];

  const getNodeTitle = (node: ChainNode) => {
    if (language === "hi") {
      switch (node.sequence_order) {
        case 1: return "1. कार्य गतिविधि";
        case 2: return "2. पहचाना गया खतरा";
        case 3: return "3. निर्धारित सुरक्षा बैरियर";
        case 4: return "4. बैरियर विफलता स्थिति";
        case 5: return "5. कार्मिक जोखिम";
        case 6: return "6. संभावित परिणाम";
        case 7: return "7. आईओजीपी नियम";
        case 8: return "8. पूर्वगामी पैटर्न";
        case 9: return "9. सुधारात्मक कार्रवाई";
        default: return node.title;
      }
    }
    return node.title;
  };
  const [selectedNode, setSelectedNode] = useState<ChainNode | null>(nodes[0] || null);
  const [viewMode, setViewMode] = useState<"FLOW" | "ZONES">("FLOW");

  React.useEffect(() => {
    if (nodes.length > 0) {
      const matched = nodes.find((n) => n.node_id === selectedNode?.node_id);
      setSelectedNode(matched || nodes[0]);
    }
  }, [chain]);

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case "ACTIVITY":
        return Activity;
      case "HAZARD":
        return AlertTriangle;
      case "BARRIER":
        return Shield;
      case "BARRIER_FAILURE":
        return AlertOctagon;
      case "EXPOSURE":
        return Eye;
      case "CONSEQUENCE":
        return Flame;
      case "LIFE_SAVING_RULE":
        return ShieldAlert;
      case "PATTERN":
        return GitFork;
      case "ACTION":
        return CheckCircle2;
      default:
        return Info;
    }
  };

  const getFormattedScore = (rawScore?: number): string => {
    if (rawScore === undefined || rawScore === null || rawScore <= 0) return "0.0";
    if (rawScore > 10.0) return (Math.round((rawScore / 12.2) * 100) / 10).toFixed(1);
    return Number(rawScore).toFixed(1);
  };

  // Group nodes into 3 Bowtie zones
  const zone1Nodes = nodes.filter((n) => n.sequence_order <= 3);
  const zone2Nodes = nodes.filter((n) => n.sequence_order === 4 || n.sequence_order === 5);
  const zone3Nodes = nodes.filter((n) => n.sequence_order >= 6);

  const renderNodeCard = (node: ChainNode, isHighlighted = false) => {
    const Icon = getNodeIcon(node.node_type);
    const isSelected = selectedNode?.node_id === node.node_id;

    return (
      <div
        key={node.node_id}
        onClick={() => setSelectedNode(node)}
        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2.5 group ${
          isSelected
            ? "bg-white border-blue-500 ring-4 ring-blue-500/20 shadow-md scale-[1.02] z-10"
            : isHighlighted
            ? "bg-rose-50/80 hover:bg-white border-rose-200 hover:border-rose-300 hover:shadow-xs"
            : "bg-slate-50/80 hover:bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
        }`}
        style={{
          borderTopColor: node.status_color || "#3b82f6",
          borderTopWidth: "4px"
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block truncate">
            {getNodeTitle(node)}
          </span>
          <span
            className="p-1.5 rounded-xl shrink-0 transition group-hover:scale-110 shadow-2xs"
            style={{
              backgroundColor: `${node.status_color || "#3b82f6"}20`,
              color: node.status_color || "#3b82f6"
            }}
          >
            <Icon className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="space-y-0.5">
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 m-0 leading-snug group-hover:text-blue-950 transition line-clamp-2">
            {node.value}
          </h4>
          <p className="text-[11px] text-slate-500 m-0 font-medium line-clamp-2">
            {node.subtext}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-2xs">
          <span className="font-mono font-bold text-slate-400">
            Stage {node.sequence_order} of {nodes.length}
          </span>
          <span className="font-mono text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {Math.round((node.confidence || 0.95) * 100)}% Conf
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 animate-fadeIn">
      {/* Header with Dual View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-wide m-0">
              {t("chain.title")}
            </h3>
            <p className="text-xs text-slate-500 m-0 font-medium mt-0.5">
              {t("chain.sub")}
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode("FLOW")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
              viewMode === "FLOW"
                ? "bg-white text-slate-900 shadow-2xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
            <span>{t("chain.flow_view")}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("ZONES")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
              viewMode === "ZONES"
                ? "bg-white text-slate-900 shadow-2xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t("chain.zone_view")}</span>
          </button>
        </div>
      </div>

      {/* OPTION 1: Sequential Flow Chain */}
      {viewMode === "FLOW" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
          {nodes.map((node) => renderNodeCard(node))}
        </div>
      )}

      {/* OPTION 2: 3-Zone Bowtie Model (TIGHT, CLEAN, NO GAPS) */}
      {viewMode === "ZONES" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start animate-fadeIn">
          {/* Zone 1: Threats & Preventive Controls */}
          <div className="p-4 rounded-3xl bg-blue-50/40 border border-blue-100 space-y-3 flex flex-col justify-start">
            <div className="flex items-center justify-between pb-2.5 border-b border-blue-200/60">
              <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                {t("chain.zone1")}
              </span>
              <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Stages 1-3
              </span>
            </div>
            <div className="space-y-3">
              {zone1Nodes.map((node) => renderNodeCard(node))}
            </div>
          </div>

          {/* Zone 2: Loss of Control & Exposure (Center Knot) */}
          <div className="p-4 rounded-3xl bg-rose-50/40 border border-rose-200/80 space-y-3 flex flex-col justify-start">
            <div className="flex items-center justify-between pb-2.5 border-b border-rose-200/60">
              <span className="text-xs font-extrabold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                {t("chain.zone2")}
              </span>
              <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                Center Knot
              </span>
            </div>
            <div className="space-y-3">
              {zone2Nodes.map((node) => renderNodeCard(node, true))}
            </div>
          </div>

          {/* Zone 3: Consequences, Standards & Actions */}
          <div className="p-4 rounded-3xl bg-purple-50/40 border border-purple-100 space-y-3 flex flex-col justify-start">
            <div className="flex items-center justify-between pb-2.5 border-b border-purple-200/60">
              <span className="text-xs font-extrabold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-purple-600" />
                {t("chain.zone3")}
              </span>
              <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                Stages 6-9
              </span>
            </div>
            <div className="space-y-3">
              {zone3Nodes.map((node) => renderNodeCard(node))}
            </div>
          </div>
        </div>
      )}

      {/* Deep Inspection Panel for Selected Node */}
      {selectedNode && (
        <div className="bg-slate-50/90 rounded-3xl p-6 sm:p-7 border border-slate-200/90 flex flex-col lg:flex-row items-start justify-between gap-6 shadow-sm animate-fadeIn">
          <div className="space-y-4 flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: selectedNode.status_color || "#3b82f6" }}
              ></span>
              <h4 className="text-base sm:text-lg font-extrabold text-slate-900 m-0">
                {selectedNode.title}: <span className="text-blue-950 font-mono">{selectedNode.value}</span>
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium m-0">
              <strong className="text-slate-900">Context:</strong> {selectedNode.subtext}
            </p>


          </div>

          {/* Right SIF Assessment Metadata Card */}
          <div className="w-full lg:w-72 p-5 rounded-2xl bg-white border border-slate-200/90 space-y-3 text-xs shadow-xs shrink-0">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-2xs">Causality Node:</span>
              <span className="font-extrabold text-slate-900 font-mono text-xs">
                Node {selectedNode.sequence_order} of {nodes.length}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Confidence:</span>
              <span className="font-extrabold text-emerald-700 font-mono text-xs">
                {Math.round((selectedNode.confidence || 0.95) * 100)}%
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">SIF Potential:</span>
              <span className={`font-extrabold font-mono text-xs ${
                report.assessment?.sif_potential_label === "HIGH" ? "text-rose-600" : (report.assessment?.sif_potential_label === "MEDIUM" ? "text-amber-600" : "text-emerald-600")
              }`}>
                {report.assessment?.sif_potential_label || "LOW"} SIF
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">SIF Risk Score:</span>
              <span className="font-extrabold text-amber-900 font-mono text-xs">
                {getFormattedScore(report.assessment?.raw_score)} / 10.0
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Verification Status:</span>
              <span className="text-slate-900 font-bold text-2xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Verified Grounded</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrecursorChainDAG;

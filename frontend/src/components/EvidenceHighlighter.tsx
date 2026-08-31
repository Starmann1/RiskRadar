import React, { useState } from "react";
import { ReportItem } from "../types";
import {
  Quote,
  Sparkles,
  Tag,
  ShieldCheck,
  Zap,
  AlertCircle,
  Maximize2,
  Minimize2,
  X,
  FileText,
  CheckCircle2,
  Search
} from "lucide-react";

interface EvidenceHighlighterProps {
  report: ReportItem;
  activeHighlightedSentence?: string;
  onSelectSentence?: (sentence: string) => void;
}

export const EvidenceHighlighter: React.FC<EvidenceHighlighterProps> = ({
  report,
  activeHighlightedSentence,
  onSelectSentence
}) => {
  const [isFullDocumentModalOpen, setIsFullDocumentModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");

  // Split narrative into sentences for bidirectional interaction
  const sentences = report.narrative_text.split(/(?<=[.!?])\s+/).filter(Boolean);

  const getSentenceHighlightClass = (sentence: string) => {
    const sLower = sentence.toLowerCase();
    const isTarget = activeHighlightedSentence && sentence.includes(activeHighlightedSentence);

    if (isTarget) {
      return "bg-amber-100 text-amber-950 border-l-4 border-amber-500 pl-2 font-bold shadow-xs";
    }

    if (sLower.includes("not verified") || sLower.includes("could not be confirmed") || sLower.includes("mismatch") || sLower.includes("silenced") || sLower.includes("stood beneath")) {
      return "bg-rose-50 text-rose-900 border-l-2 border-rose-500 pl-1.5";
    }
    if (sLower.includes("residual pressure") || sLower.includes("suspended") || sLower.includes("gas") || sLower.includes("height") || sLower.includes("kick")) {
      return "bg-orange-50 text-orange-900";
    }
    if (sLower.includes("no personnel") || sLower.includes("normal operating range") || sLower.includes("verified intact")) {
      return "bg-emerald-50 text-emerald-900";
    }

    return "text-slate-700 hover:bg-slate-100";
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <Quote className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight m-0">
              Source Safety Narrative & Evidence Spans
            </h3>
            <p className="text-xs text-slate-500 m-0 font-medium mt-0.5">
              Click any sentence to inspect character offsets and safety rationale
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFullDocumentModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
            title="Read Full Uncut Case Study Document"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Read Full Document</span>
          </button>
        </div>
      </div>

      {/* Sized & Compact Scrollable Interactive Narrative Container */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-2xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Key Narrative Preview ({sentences.length} Sentences):</span>
          <span className="font-mono text-slate-400">{report.narrative_text.split(/\s+/).filter(Boolean).length} Words</span>
        </div>

        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/90 text-xs sm:text-sm leading-relaxed space-y-2 max-h-72 overflow-y-auto pr-2 font-medium custom-scrollbar">
          {sentences.map((sent, idx) => (
            <p
              key={idx}
              onClick={() => onSelectSentence && onSelectSentence(sent)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${getSentenceHighlightClass(sent)}`}
            >
              {sent}
            </p>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-2xs text-slate-500 italic">
            * Highlighted spans indicate grounded evidence
          </span>
          <button
            type="button"
            onClick={() => setIsFullDocumentModalOpen(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition"
          >
            <span>Expand Full Document View ({sentences.length} sentences)</span>
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Extracted Domain Entities Linked to Sentences */}
      <div className="pt-3 border-t border-slate-200 space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider m-0 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Extracted Domain Attributes Linked to Verbatim Sentences:</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Barrier Failure State Tag */}
          <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider block">Barrier Failure State</span>
              <p className="text-xs font-black text-rose-950 font-mono m-0 truncate">
                {report.extraction?.barriers?.[0]?.barrier_status || "UNVERIFIED"}
              </p>
              <span className="text-xs text-slate-700 font-medium block truncate">
                {report.extraction?.barriers?.[0]?.display_name || "Positive Isolation"}
              </span>
            </div>
          </div>

          {/* Exposure State Tag */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${report.extraction?.exposure?.present !== false ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Personnel Exposure</span>
              <p className="text-xs font-black text-amber-950 m-0 truncate">
                {report.extraction?.exposure?.present !== false ? "Exposed in Line of Fire" : "Zero Exposure (Shielded)"}
              </p>
              <span className="text-xs text-slate-700 font-medium block">
                Proximity: {report.extraction?.exposure?.proximity ?? 2}/2
              </span>
            </div>
          </div>

          {/* Energy Type Tag */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-indigo-700" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-indigo-800 font-bold uppercase tracking-wider block">Primary Energy Hazard</span>
              <p className="text-xs font-black text-indigo-950 m-0 truncate">
                {(report.extraction?.energy_type || "Stored Pressure").toUpperCase()}
              </p>
              <span className="text-xs text-slate-700 font-medium block">
                Level: {report.extraction?.energy_level ?? 3}/3
              </span>
            </div>
          </div>

          {/* Life-Saving Rule Tag */}
          <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0 mt-0.5">
              <Tag className="w-4 h-4 text-purple-700" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-purple-800 font-bold uppercase tracking-wider block">IOGP Life-Saving Rule</span>
              <p className="text-xs font-black text-purple-950 m-0 truncate">
                {report.rule_mappings?.length > 0 ? report.rule_mappings.map(r => r.rule_display_name).join(", ") : "Process Safety Fundamentals"}
              </p>
              <span className="text-xs text-slate-700 font-medium block">
                Report 459 Standard
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FULL DOCUMENT MODAL / EXPANDED READER LIGHTBOX */}
      {isFullDocumentModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
          onClick={() => setIsFullDocumentModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 m-0">
                    {report.title || "Full Incident Case Study Document"}
                  </h3>
                  <p className="text-xs text-slate-500 m-0 font-medium">
                    Ref: <strong className="text-slate-900 font-mono">{report.external_ref}</strong> · Site: <strong className="text-slate-900">{report.site}</strong> · Activity: <strong className="text-slate-900">{report.activity ? report.activity.replace(/_/g, " ").toUpperCase() : "GENERAL"}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {sentences.length} Sentences ({report.narrative_text.split(/\s+/).filter(Boolean).length} Words)
                </span>
                <button
                  onClick={() => setIsFullDocumentModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  title="Close Reader"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* In-Modal Search Bar */}
            <div className="p-4 bg-white border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  placeholder="Search within this case study document (e.g., isolation, pressure, valve, hazard)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Scrollable Full Text Document Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-sm sm:text-base leading-relaxed text-slate-800 font-serif bg-slate-50/40 flex-1">
              {sentences
                .filter((s) => !modalSearchTerm.trim() || s.toLowerCase().includes(modalSearchTerm.toLowerCase()))
                .map((sent, idx) => {
                  const isMatch = modalSearchTerm.trim() && sent.toLowerCase().includes(modalSearchTerm.toLowerCase());
                  return (
                    <p
                      key={idx}
                      onClick={() => {
                        if (onSelectSentence) onSelectSentence(sent);
                      }}
                      className={`p-3 rounded-2xl transition cursor-pointer font-sans ${
                        isMatch
                          ? "bg-yellow-100 text-yellow-950 font-bold border-l-4 border-yellow-500 pl-3 shadow-xs"
                          : getSentenceHighlightClass(sent)
                      }`}
                    >
                      <span className="font-mono text-2xs text-slate-400 mr-2 select-none">[{idx + 1}]</span>
                      {sent}
                    </p>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Click any sentence above to inspect its extracted safety entities
              </span>
              <button
                onClick={() => setIsFullDocumentModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceHighlighter;

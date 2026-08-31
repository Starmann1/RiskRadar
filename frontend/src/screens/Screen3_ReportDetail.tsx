import React, { useState } from "react";
import { ReportItem } from "../types";
import { EvidenceHighlighter } from "../components/EvidenceHighlighter";
import {
  ShieldAlert,
  UserCheck,
  Network,
  FileCheck2,
  ArrowLeft,
  X,
  AlertCircle,
  ShieldCheck,
  Zap,
  Tag
} from "lucide-react";

interface Screen3Props {
  report: ReportItem;
  onBack?: () => void;
  onOpenChain: (report: ReportItem) => void;
  onOpenReview: (report: ReportItem) => void;
  onOpenRCA: (report: ReportItem) => void;
  onSelectSimilarReport?: (reportId: string) => void;
}

export const Screen3_ReportDetail: React.FC<Screen3Props> = ({
  report,
  onBack,
  onOpenChain,
  onOpenReview,
  onOpenRCA
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<string>(
    report.extraction?.barriers?.[0]?.evidence_span?.source_sentence || report.narrative_text.split(".")[0] + "."
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
              title="Return to Previous Screen"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white font-mono shadow-2xs">
                {report.external_ref}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {report.report_type}
              </span>
              {report.assessment.process_safety_relevant && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  PROCESS SAFETY
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight m-0">
              {report.title || `${report.site} - Safety Observation Analysis`}
            </h2>
            <p className="text-xs text-slate-500 m-0 font-medium">
              Site: <strong className="text-slate-900">{report.site}</strong> · Date: <strong className="text-slate-900">{report.report_date}</strong> · Activity: <strong className="text-slate-900">{report.activity ? report.activity.replace(/_/g, " ").toUpperCase() : "GENERAL"}</strong>
            </p>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenChain(report)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <Network className="w-3.5 h-3.5 text-amber-700" />
            <span>Precursor Chain</span>
          </button>

          <button
            onClick={() => onOpenReview(report)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer ${
              report.review_status === "PENDING"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-100 text-emerald-900 border border-emerald-300"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{report.review_status === "PENDING" ? "Triage / Review" : `Reviewed: ${report.review_status}`}</span>
          </button>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Narrative & Evidence Spans (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <EvidenceHighlighter
            report={report}
            activeHighlightedSentence={selectedSentence}
            onSelectSentence={(s) => setSelectedSentence(s)}
          />

          {/* Explainable AI Decision Reasoning Card */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 tracking-wide flex items-center gap-2.5 m-0">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>Explainable Safety Reasoning & Audit Trail</span>
            </h3>

            <div className="space-y-2.5 text-sm">
              {report.assessment.reasons.map((reason, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                  <p className="text-slate-800 leading-relaxed m-0 font-medium">{reason}</p>
                </div>
              ))}
            </div>

            {report.review_comment && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Logged HSE Reviewer Finding ({report.reviewed_by || "OIL Officer"}):
                </span>
                <p className="text-sm text-emerald-950 italic m-0 font-medium">
                  "{report.review_comment}"
                </p>
              </div>
            )}

            {/* Extracted Document Images & Incident Photos (If Present in Report) */}
            {report.extracted_images && report.extracted_images.length > 0 && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Attached Incident Photos & Evidence Images ({report.extracted_images.length})
                  </span>
                  <span className="text-2xs font-semibold text-slate-500">Click photo to zoom</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {report.extracted_images.map((imgSrc, imgIdx) => (
                    <div
                      key={imgIdx}
                      onClick={() => setPreviewImage(imgSrc)}
                      className="group relative aspect-video bg-white rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-2xs hover:shadow-md transition"
                    >
                      <img
                        src={imgSrc}
                        alt={`Evidence Photo ${imgIdx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                        Enlarge
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-2xs font-bold">
                        Photo #{imgIdx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 5-Factor SIF Scoring & Taxonomy Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* SIF Assessment Card */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
              <h3 className="text-base font-bold text-slate-900 tracking-wide m-0">
                Deterministic SIF Assessment
              </h3>
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-slate-100 text-slate-700 font-mono border border-slate-200">
                Formula v1.0
              </span>
            </div>

            {/* Main Score Banner */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                  SIF Potential Classification
                </span>
                <span className={`text-2xl font-black font-mono ${
                  report.assessment.sif_potential_label === "HIGH" ? "text-rose-600" : (report.assessment.sif_potential_label === "MEDIUM" ? "text-amber-600" : "text-emerald-600")
                }`}>
                  {report.assessment.sif_potential_label} SIF POTENTIAL
                </span>
                <p className="text-xs text-slate-600 m-0 mt-1 font-medium">
                  Routing: <strong className="text-slate-900">{report.assessment.routing_decision}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Raw Score</span>
                <span className="text-3xl font-black text-amber-700 font-mono">
                  {report.assessment.raw_score} <span className="text-sm text-slate-400 font-normal">/ 10.0</span>
                </span>
                <span className="text-xs text-emerald-700 font-bold block mt-1">
                  {Math.round(report.assessment.confidence * 100)}% Confidence
                </span>
              </div>
            </div>
          </div>

          {/* Extracted Operational Risk Factors (Ontology Layer) */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 tracking-wide m-0">
              Extracted Operational Risk Factors (Ontology Layer)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider block">
                    Safety Barrier State
                  </span>
                  <span className="text-xs font-black text-rose-950 font-mono block truncate">
                    {report.extraction?.barriers?.[0]?.barrier_status || "UNVERIFIED"}
                  </span>
                  <span className="text-[11px] text-slate-700 block font-medium truncate">
                    {report.extraction?.barriers?.[0]?.display_name || "Physical Isolation Barrier"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
                    Worker Exposure
                  </span>
                  <span className="text-xs font-black text-amber-950 block truncate">
                    {report.extraction?.exposure?.present !== false
                      ? "In Line of Fire"
                      : "Zero Exposure"}
                  </span>
                  <span className="text-[11px] text-slate-700 block font-medium">
                    Proximity: {report.extraction?.exposure?.proximity ?? 2} / 2
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] text-indigo-800 font-bold uppercase tracking-wider block">
                    Hazardous Energy
                  </span>
                  <span className="text-xs font-black text-indigo-950 block truncate">
                    {(report.extraction?.energy_type || "Stored Pressure").toUpperCase()}
                  </span>
                  <span className="text-[11px] text-slate-700 block font-medium">
                    Level: {report.extraction?.energy_level ?? 3} / 3
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-start gap-2.5">
                <Tag className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] text-purple-800 font-bold uppercase tracking-wider block">
                    IOGP Rule Standard
                  </span>
                  <span className="text-xs font-black text-purple-950 block truncate">
                    {report.rule_mappings?.[0]?.rule_display_name || "Energy Isolation"}
                  </span>
                  <span className="text-[11px] text-slate-700 block font-medium">
                    Report 459
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Image Zoom Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Enlarged Incident Photo"
              className="max-h-[80vh] w-auto mx-auto rounded-xl object-contain"
            />
            <div className="text-center py-2 text-xs font-semibold text-slate-300">
              Attached Incident Photo & Visual Evidence
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

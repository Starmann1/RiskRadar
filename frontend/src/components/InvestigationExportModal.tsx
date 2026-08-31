import React from "react";
import { X, FileText, Printer } from "lucide-react";
import { ReportItem } from "../types";

interface InvestigationExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportItem;
}

export const InvestigationExportModal: React.FC<InvestigationExportModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 px-7 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <FileText className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 m-0">
                OIL Precursor Investigation Pack & 5-Whys RCA Studio
              </h3>
              <p className="text-xs text-slate-500 m-0 font-medium">
                Official HSE Root Cause Analysis & Hierarchy of Controls Action Plan (Ref: {report.external_ref})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Report Content */}
        <div id="printable-investigation-report" className="p-7 space-y-7 overflow-y-auto text-sm text-slate-700">
          {/* Executive Header Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Target Entity & Installation</span>
              <h4 className="text-base font-extrabold text-slate-900 m-0">{report.site}</h4>
              <p className="text-xs text-slate-500 m-0 font-medium">Date: {report.report_date} · Activity: {report.activity.replace(/_/g, " ").toUpperCase()}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">SIF Assessment Rating</span>
              <span className="text-base font-extrabold text-rose-700 font-mono block">
                {report.assessment.sif_potential_label} SIF POTENTIAL (Score: {report.assessment.raw_score})
              </span>
              <p className="text-xs text-indigo-900 m-0 font-bold">
                IOGP Rule: {report.rule_mappings[0]?.rule_display_name || "Process Safety Fundamentals"}
              </p>
            </div>
          </div>

          {/* 1. Incident Narrative */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              1. Verbatim Safety Observation Narrative
            </h4>
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-sm italic leading-relaxed text-amber-950 font-medium">
              "{report.narrative_text}"
            </div>
          </div>

          {/* 2. Automated 5-Whys Root Cause Analysis */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              2. Structured 5-Whys Root Cause Analysis
            </h4>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-mono font-extrabold text-xs shrink-0">Why 1</span>
                <p className="m-0 text-slate-800 font-medium">Why was there potential for serious injury? → <em>Hazardous energy remained uncontrolled during active task intervention.</em></p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-mono font-extrabold text-xs shrink-0">Why 2</span>
                <p className="m-0 text-slate-800 font-medium">Why was energy uncontrolled? → <em>Safety barrier '{report.extraction?.barriers[0]?.display_name || "Positive Isolation"}' was in a <strong>{report.extraction?.barriers[0]?.barrier_status || "UNVERIFIED"}</strong> state.</em></p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-mono font-extrabold text-xs shrink-0">Why 3</span>
                <p className="m-0 text-slate-800 font-medium">Why was the barrier in this state? → <em>Verification protocol or pre-task check was assumed complete rather than physically tested.</em></p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-mono font-extrabold text-xs shrink-0">Why 4</span>
                <p className="m-0 text-slate-800 font-medium">Why was verification skipped? → <em>Time pressure during turnaround or absence of standardized pre-task verification hold-point.</em></p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 font-mono font-extrabold text-xs shrink-0">Why 5</span>
                <p className="m-0 text-slate-900 font-bold">Root Organizational Cause → <em>Need for mandatory IOGP Start-Work Checks and independent dual-signoff on energy barriers.</em></p>
              </div>
            </div>
          </div>

          {/* 3. Hierarchy of Controls Action Plan */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              3. Corrective Action Plan (Hierarchy of Controls)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                <span className="text-xs text-emerald-900 font-extrabold uppercase tracking-wider block">Engineering Barrier</span>
                <p className="text-xs text-slate-800 mt-1.5 m-0 font-medium leading-relaxed">Install positive mechanical lockouts and verified bleed-off gauge valves at isolation headers.</p>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200">
                <span className="text-xs text-indigo-900 font-extrabold uppercase tracking-wider block">Administrative Control</span>
                <p className="text-xs text-slate-800 mt-1.5 m-0 font-medium leading-relaxed">Conduct targeted Tool-Box Talk across all shift crews on IOGP {report.rule_mappings[0]?.rule_display_name || "Energy Isolation"} standards.</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                <span className="text-xs text-amber-900 font-extrabold uppercase tracking-wider block">Supervisory Hold-Point</span>
                <p className="text-xs text-slate-800 mt-1.5 m-0 font-medium leading-relaxed">Mandate permit-to-work physical cross-check signoff before breaking flange bolts or entering zone.</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200">
                <span className="text-xs text-purple-900 font-extrabold uppercase tracking-wider block">Precursor Monitoring</span>
                <p className="text-xs text-slate-800 mt-1.5 m-0 font-medium leading-relaxed">Flag site for 30-day precursor density monitoring on RiskRadar executive dashboard.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-7 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono font-medium">
            Generated by NorthStar RiskRadar AI Engine · Maharatna OIL HSSE Compliance
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

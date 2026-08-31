import React, { useState } from "react";
import { X, CheckCircle, Edit3, XCircle, UserCheck } from "lucide-react";
import { ReportItem, ReviewDecision, SIFPotentialLabel } from "../types";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportItem;
  onSubmitReview: (reportId: string, reviewerId: string, decision: ReviewDecision, reason?: string, correctedLabel?: SIFPotentialLabel) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  report,
  onSubmitReview
}) => {
  const [decision, setDecision] = useState<ReviewDecision>("ACCEPT");
  const [reviewerId, setReviewerId] = useState("hse.officer.duliajan");
  const [correctedLabel, setCorrectedLabel] = useState<SIFPotentialLabel>(report.assessment.sif_potential_label);
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReview(report.report_id, reviewerId, decision, reason, decision === "EDIT" ? correctedLabel : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-slate-50 px-7 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <UserCheck className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 m-0">
                Human HSE Triage Decision & Governance
              </h3>
              <p className="text-xs text-slate-500 m-0 font-medium">
                Official review decision logged to immutable audit trail (Ref: {report.external_ref})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-7 space-y-5 text-sm">
          {/* Current AI Output Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block font-semibold">AI Recommended Classification:</span>
              <span className="text-base font-extrabold text-rose-700 font-mono">
                {report.assessment.sif_potential_label} SIF Potential
              </span>
              <span className="text-xs text-slate-500 ml-2 font-medium">
                (Confidence: {Math.round(report.assessment.confidence * 100)}%)
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block font-semibold">Primary IOGP Rule:</span>
              <span className="text-xs font-bold text-indigo-950">
                {report.rule_mappings[0]?.rule_display_name || "Process Safety Fundamentals"}
              </span>
            </div>
          </div>

          {/* Decision Selection Tabs */}
          <div>
            <label className="block text-slate-800 font-bold mb-2.5 text-xs uppercase tracking-wider">HSE Reviewer Verdict:</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDecision("ACCEPT")}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition duration-200 cursor-pointer ${
                  decision === "ACCEPT"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-4 ring-emerald-400/25 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                }`}
              >
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <span className="font-extrabold text-xs">Accept AI Finding</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision("EDIT")}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition duration-200 cursor-pointer ${
                  decision === "EDIT"
                    ? "bg-amber-50 border-amber-500 text-amber-950 ring-4 ring-amber-400/25 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                }`}
              >
                <Edit3 className="w-6 h-6 text-amber-600" />
                <span className="font-extrabold text-xs">Modify / Override</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision("REJECT")}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition duration-200 cursor-pointer ${
                  decision === "REJECT"
                    ? "bg-rose-50 border-rose-500 text-rose-950 ring-4 ring-rose-400/25 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                }`}
              >
                <XCircle className="w-6 h-6 text-rose-600" />
                <span className="font-extrabold text-xs">Reject Assessment</span>
              </button>
            </div>
          </div>

          {/* If EDIT selected */}
          {decision === "EDIT" && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2">
              <label className="block text-amber-950 font-bold text-xs uppercase tracking-wider">Override SIF Potential Label:</label>
              <select
                value={correctedLabel}
                onChange={(e) => setCorrectedLabel(e.target.value as SIFPotentialLabel)}
                className="w-full bg-white border border-amber-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-semibold shadow-xs"
              >
                <option value="HIGH">High SIF Potential</option>
                <option value="MEDIUM">Medium SIF Potential</option>
                <option value="LOW">Low SIF Potential</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5">Reviewer Identity (OIL SSO ID)</label>
              <input
                type="text"
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-mono shadow-2xs"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5">Date of Review</label>
              <input
                type="text"
                value={new Date().toISOString().split("T")[0]}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 text-sm font-mono font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5">
              Official Review Justification & Investigation Notes:
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Verified with site supervisor that positive double-block isolation was indeed missing before flange bolts were cracked..."
              className="w-full bg-white border border-slate-300 rounded-xl p-4 text-slate-900 text-sm shadow-2xs leading-relaxed"
              required
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              Confirm & Seal Audit Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

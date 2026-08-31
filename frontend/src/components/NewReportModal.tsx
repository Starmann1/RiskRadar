import React, { useState } from "react";
import { X, Sparkles, Send } from "lucide-react";
import { ReportType, ActualSeverity } from "../types";

interface NewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  sites: string[];
  activities: { id: string; name: string }[];
}

export const NewReportModal: React.FC<NewReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sites,
  activities
}) => {
  const [site, setSite] = useState(sites[0] || "Field Site 4 - Duliajan Central");
  const [activity, setActivity] = useState(activities[0]?.id || "mechanical_electrical_maintenance");
  const [reportType, setReportType] = useState<ReportType>("NEAR_MISS");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [narrativeText, setNarrativeText] = useState("");
  const [contractorInvolved, setContractorInvolved] = useState(false);
  const [actualSeverity, setActualSeverity] = useState<ActualSeverity>("NONE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrativeText.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        site,
        activity,
        report_type: reportType,
        report_date: reportDate,
        narrative_text: narrativeText,
        contractor_involved: contractorInvolved,
        actual_severity: actualSeverity
      });
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  const loadExample = (type: string) => {
    if (type === "isolation") {
      setNarrativeText("During scheduled maintenance on a hydrocarbon transfer line, work began after the upstream valve was closed. Positive isolation was not verified with a pressure test before flange breaking commenced. Residual pressure was present in the line. The worker positioned near the flange noticed a slight release and immediately stepped back. Work was stopped and the line was re-isolated. No injury occurred.");
      setActivity("mechanical_electrical_maintenance");
      setReportType("NEAR_MISS");
    } else if (type === "crane") {
      setNarrativeText("Worker briefly stood beneath a suspended 2.5-ton manifold spool while repositioning rigging slings during a crane lift on the drilling pad. Rigging supervisor sounded the air horn and halted the lift immediately. Exclusion zone was not demarcated with physical barrier tape.");
      setActivity("lifting_rigging");
      setReportType("UA");
    } else if (type === "simops") {
      setNarrativeText("During a turnaround shutdown, a 40-ton mobile crane swung a heavy drill collar package directly over a structural grinding crew in the adjoining bay without a documented SIMOPS review or pre-lift coordination horn.");
      setActivity("simultaneous_operations");
      setReportType("NEAR_MISS");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">
                Single Safety Observation Intake & AI Triage
              </h3>
              <p className="text-xs text-slate-500 m-0">
                AI/NLP model will extract evidence, compute SIF potential, and map IOGP rules
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Quick Examples */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-600 font-semibold">Load Sample Scenario:</span>
            <button
              type="button"
              onClick={() => loadExample("isolation")}
              className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 font-medium cursor-pointer"
            >
              Unverified Isolation
            </button>
            <button
              type="button"
              onClick={() => loadExample("crane")}
              className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border border-indigo-300 font-medium cursor-pointer"
            >
              Suspended Crane Load
            </button>
            <button
              type="button"
              onClick={() => loadExample("simops")}
              className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300 font-medium cursor-pointer"
            >
              SIMOPS Lift + Hot Work
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">OIL Operational Installation / Site</label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                {sites.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Operational Lifecycle Activity</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Observation Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 shadow-sm"
              >
                <option value="NEAR_MISS">Near Miss</option>
                <option value="UA">Unsafe Act (UA)</option>
                <option value="UC">Unsafe Condition (UC)</option>
                <option value="INCIDENT">Incident / Event</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Report Date</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Actual Injury Severity</label>
              <select
                value={actualSeverity}
                onChange={(e) => setActualSeverity(e.target.value as ActualSeverity)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 shadow-sm"
              >
                <option value="NONE">None (Zero Harm)</option>
                <option value="FIRST_AID">First Aid Treatment</option>
                <option value="MEDICAL_TREATMENT">Medical Treatment</option>
                <option value="LOST_TIME">Lost Time Injury</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Free-Text Safety Narrative (Verbatim Observation):
            </label>
            <textarea
              rows={5}
              value={narrativeText}
              onChange={(e) => setNarrativeText(e.target.value)}
              placeholder="Describe the task, hazard, energy sources, barrier state (e.g. positive isolation not verified), exposure, and immediate actions..."
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans text-xs shadow-inner"
              required
            ></textarea>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="contractor"
              checked={contractorInvolved}
              onChange={(e) => setContractorInvolved(e.target.checked)}
              className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="contractor" className="text-slate-700 cursor-pointer">
              Contractor Personnel Involved (Oil & Gas 80% Workforce Exposure Standard)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !narrativeText.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Running NLP Extraction..." : "Run AI SIF Assessment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

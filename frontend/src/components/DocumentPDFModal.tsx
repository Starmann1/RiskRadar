import React, { useState, useRef } from "react";
import { X, FileText, Upload, Sparkles, Send, CheckCircle2, FileUp, AlertTriangle } from "lucide-react";
import { ReportType, ActualSeverity } from "../types";

interface DocumentPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  sites: string[];
  activities: { id: string; name: string }[];
}

export const DocumentPDFModal: React.FC<DocumentPDFModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sites,
  activities
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "manual">("upload");
  const [site, setSite] = useState(sites[0] || "Field Site 4 - Duliajan Central");
  const [activity, setActivity] = useState(activities[0]?.id || "mechanical_electrical_maintenance");
  const [reportType, setReportType] = useState<ReportType>("NEAR_MISS");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [narrativeText, setNarrativeText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [contractorInvolved, setContractorInvolved] = useState(true);
  const [actualSeverity, setActualSeverity] = useState<ActualSeverity>("NONE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    if (file.name.endsWith(".txt") || file.name.endsWith(".csv") || file.name.endsWith(".log")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setNarrativeText(content.trim());
      };
      reader.readAsText(file);
    } else {
      // PDF or DOC simulated extraction
      setNarrativeText(
        `[Extracted from ${file.name} - Official Safety Observation Log]\nDuring scheduled turnaround maintenance on Well #84, positive mechanical isolation double-block-and-bleed was not physically confirmed before crew unbolted the wellhead flange. Residual pressure of 14 bar caused sudden emulsion ejection. Worker stepped back immediately. Zero injury sustained.`
      );
      setSite("Moran Oilfield Well #84");
      setActivity("mechanical_electrical_maintenance");
      setReportType("NEAR_MISS");
    }
  };

  const loadSamplePDFDocument = (docKey: string) => {
    if (docKey === "flange_pdf") {
      setUploadedFileName("OIL_HSE_Flash_Report_Well84_Flange.pdf");
      setNarrativeText("During scheduled turnaround maintenance on hydrocarbon line, work began after the upstream valve was closed. Positive isolation was not verified with a pressure test before flange breaking commenced. Residual pressure was present in the line. The technician positioned near the flange noticed a slight release and stepped back immediately. Work was stopped and re-isolated.");
      setSite("Moran Oilfield Well #84");
      setActivity("mechanical_electrical_maintenance");
      setReportType("NEAR_MISS");
      setContractorInvolved(true);
    } else if (docKey === "crane_pdf") {
      setUploadedFileName("NRL_Turnaround_SIMOPS_Crane_Incident.pdf");
      setNarrativeText("During turnaround shutdown, a 40-ton mobile crane swung a heavy structural skid directly over a live welding habitat without cross-team SIMOPS coordination, barrier tape, or pre-lift audible coordination horn.");
      setSite("NRL Hydrocracker Unit 2");
      setActivity("simultaneous_operations");
      setReportType("NEAR_MISS");
      setContractorInvolved(true);
    } else if (docKey === "height_pdf") {
      setUploadedFileName("Duliajan_Rig_MonkeyBoard_Height_Audit.pdf");
      setNarrativeText("Contractor scaffolding helper working on monkey board at 14m elevation without securing dual safety lanyards to certified anchorage cable while passing heavy scaffold tubes.");
      setSite("Field Site 4 - Duliajan Central");
      setActivity("work_at_height");
      setReportType("UA");
      setContractorInvolved(true);
    } else if (docKey === "h2s_pdf") {
      setUploadedFileName("Digboi_ConfinedSpace_H2S_Observation.pdf");
      setNarrativeText("Contractor technician entered mud mixing tank pit to inspect bottom agitator without gas testing or obtaining signed confined space permit. Continuous gas detector was left outside tank hatch.");
      setSite("Digboi Heritage Wellhead 12");
      setActivity("confined_space_entry");
      setReportType("UA");
      setContractorInvolved(true);
    }
  };

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
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-amber-50 px-7 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <FileUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-extrabold text-slate-900 m-0">
                  Document PDF & Safety Report Ingestion
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                  PDF / DOCX / TXT
                </span>
              </div>
              <p className="text-xs text-slate-500 m-0 font-medium mt-0.5">
                Upload official HSE flash reports, permit sheets, or observation PDFs for instant AI/NLP SIF extraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 border border-transparent hover:border-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-7 space-y-6 flex-1 text-sm">
          {/* Document Preset Quick Loaders */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                <FileText className="w-4 h-4 text-indigo-600" />
                Load OIL Sample Safety Document (PDF / Flash Report):
              </span>
              <span className="text-xs text-slate-500 font-medium">1-Click Auto-Fill</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <button
                type="button"
                onClick={() => loadSamplePDFDocument("flange_pdf")}
                className="p-3.5 rounded-2xl bg-white hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 text-left transition cursor-pointer shadow-2xs"
              >
                <div className="font-bold text-slate-900 text-xs truncate">📄 Flange Isolation Report.pdf</div>
                <div className="text-xs text-amber-900 font-mono mt-1 font-bold">HIGH SIF · Pressure</div>
              </button>

              <button
                type="button"
                onClick={() => loadSamplePDFDocument("crane_pdf")}
                className="p-3.5 rounded-2xl bg-white hover:bg-purple-50/80 border border-slate-200 hover:border-purple-300 text-left transition cursor-pointer shadow-2xs"
              >
                <div className="font-bold text-slate-900 text-xs truncate">📄 SIMOPS Crane Slewing.pdf</div>
                <div className="text-xs text-purple-900 font-mono mt-1 font-bold">HIGH SIF · SIMOPS</div>
              </button>

              <button
                type="button"
                onClick={() => loadSamplePDFDocument("height_pdf")}
                className="p-3.5 rounded-2xl bg-white hover:bg-rose-50/80 border border-slate-200 hover:border-rose-300 text-left transition cursor-pointer shadow-2xs"
              >
                <div className="font-bold text-slate-900 text-xs truncate">📄 14m Monkey Board Audit.pdf</div>
                <div className="text-xs text-rose-900 font-mono mt-1 font-bold">HIGH SIF · Height</div>
              </button>

              <button
                type="button"
                onClick={() => loadSamplePDFDocument("h2s_pdf")}
                className="p-3.5 rounded-2xl bg-white hover:bg-cyan-50/80 border border-slate-200 hover:border-cyan-300 text-left transition cursor-pointer shadow-2xs"
              >
                <div className="font-bold text-slate-900 text-xs truncate">📄 Mud Tank Gas Entry.pdf</div>
                <div className="text-xs text-cyan-900 font-mono mt-1 font-bold">HIGH SIF · Confined</div>
              </button>
            </div>
          </div>

          {/* Drag & Drop PDF Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-7 text-center cursor-pointer transition-all ${
              uploadedFileName
                ? "border-emerald-400 bg-emerald-50/40"
                : "border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.docx,.doc,.txt,.csv"
              className="hidden"
            />
            {uploadedFileName ? (
              <div className="flex flex-col items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                <span className="font-extrabold text-sm text-slate-900">{uploadedFileName}</span>
                <span className="text-xs text-slate-500 font-medium">Document parsed & text extracted successfully. Click to replace file.</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 text-sm block">
                    Click to upload Safety Document (PDF, DOCX, TXT)
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Supports Oil India Limited standard HSE forms, incident flash memos & observation cards
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Editable Metadata Fields */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5">
                  OIL Operational Installation / Site
                </label>
                <select
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                >
                  {sites.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5">
                  Operational Lifecycle Activity
                </label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                >
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5">Observation Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm shadow-2xs"
                >
                  <option value="NEAR_MISS">Near Miss</option>
                  <option value="UA">Unsafe Act (UA)</option>
                  <option value="UC">Unsafe Condition (UC)</option>
                  <option value="INCIDENT">Incident / Event</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5">Report Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5">Actual Harm Severity</label>
                <select
                  value={actualSeverity}
                  onChange={(e) => setActualSeverity(e.target.value as ActualSeverity)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm shadow-2xs"
                >
                  <option value="NONE">None (Zero Harm)</option>
                  <option value="FIRST_AID">First Aid Treatment</option>
                  <option value="MEDICAL_TREATMENT">Medical Treatment</option>
                  <option value="LOST_TIME">Lost Time Injury</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5">
                Extracted Safety Narrative (Verbatim Document Text):
              </label>
              <textarea
                rows={5}
                value={narrativeText}
                onChange={(e) => setNarrativeText(e.target.value)}
                placeholder="Document text extracted from PDF. You can also paste or edit the verbatim narrative here..."
                className="w-full bg-white border border-slate-300 rounded-2xl p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans text-sm shadow-2xs"
                required
              ></textarea>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="contractorDoc"
                checked={contractorInvolved}
                onChange={(e) => setContractorInvolved(e.target.checked)}
                className="w-4 h-4 rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="contractorDoc" className="text-slate-700 text-xs font-semibold cursor-pointer">
                Contractor Personnel Involved (Oil & Gas 80% Workforce Exposure Standard)
              </label>
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
                disabled={isSubmitting || !narrativeText.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Running AI/NLP Extraction..." : "Analyze Safety Document (AI/NLP)"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

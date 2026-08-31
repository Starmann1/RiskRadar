import React, { useState } from "react";
import { ReportItem } from "../types";
import {
  FileCheck2,
  Printer,
  Layers,
  Wrench,
  Users,
  Wind
} from "lucide-react";

interface Screen11Props {
  report: ReportItem;
  onOpenExportModal: () => void;
}

export const Screen11_InvestigationRCA: React.FC<Screen11Props> = ({
  report,
  onOpenExportModal
}) => {
  const [why1, setWhy1] = useState("Hazardous energy remained uncontrolled during active task intervention.");
  const [why2, setWhy2] = useState(`Safety barrier '${report.extraction?.barriers[0]?.display_name || "Positive Isolation"}' was in an '${report.extraction?.barriers[0]?.barrier_status || "UNVERIFIED"}' state.`);
  const [why3, setWhy3] = useState("Pre-task positive verification test or physical pressure gauge verification was skipped.");
  const [why4, setWhy4] = useState("Crew was behind turnaround schedule or lacked clear independent verification checklist hold-points.");
  const [why5, setWhy5] = useState("Procedural drift and absence of mandatory dual-signoff on energy barrier certificates.");

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-white via-purple-50/50 to-indigo-50/50 rounded-3xl p-7 border border-slate-200/90 flex flex-wrap items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-100 text-purple-700">
            <FileCheck2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 m-0 tracking-tight">
              Investigation Studio & Root Cause Analysis (RCA) Assistant
            </h2>
            <p className="text-sm text-slate-500 m-0 font-medium">
              Accelerating human investigations with pre-populated 5-Whys, Ishikawa Fishbone diagrams, and Hierarchy of Controls
            </p>
          </div>
        </div>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Export Official PDF Investigation Pack</span>
        </button>
      </div>

      {/* Target Report Context */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 flex flex-wrap items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5 max-w-3xl">
          <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">Target Observation Under Investigation:</span>
          <h4 className="text-sm font-extrabold text-slate-900 m-0">{report.title || report.site} (Ref: {report.external_ref})</h4>
          <p className="text-sm text-slate-800 italic mt-1 m-0 font-medium leading-relaxed">"{report.narrative_text}"</p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <span className="text-sm font-extrabold text-rose-700 font-mono block">{report.assessment.sif_potential_label} SIF POTENTIAL</span>
          <span className="text-xs text-indigo-800 font-bold bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 block">IOGP: {report.rule_mappings[0]?.rule_display_name || "PSF"}</span>
        </div>
      </div>

      {/* 5-Whys Interactive Studio */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-mono font-extrabold text-xs">
              5-Whys
            </span>
            <h3 className="text-base font-bold text-slate-900 m-0">
              Interactive 5-Whys Causal Drill-Down
            </h3>
          </div>
          <span className="text-xs text-slate-500 italic font-medium">Editable starting point for HSE lead investigator</span>
        </div>

        <div className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <label className="text-slate-800 font-bold block text-xs uppercase tracking-wider">1. Why was there potential for serious injury?</label>
            <input
              type="text"
              value={why1}
              onChange={(e) => setWhy1(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-800 font-bold block text-xs uppercase tracking-wider">2. Why was energy uncontrolled?</label>
            <input
              type="text"
              value={why2}
              onChange={(e) => setWhy2(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-800 font-bold block text-xs uppercase tracking-wider">3. Why was the barrier in this failure state?</label>
            <input
              type="text"
              value={why3}
              onChange={(e) => setWhy3(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-800 font-bold block text-xs uppercase tracking-wider">4. Why was verification skipped or not documented?</label>
            <input
              type="text"
              value={why4}
              onChange={(e) => setWhy4(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-purple-950 font-bold block text-xs uppercase tracking-wider">5. Root Latent Organizational Cause:</label>
            <input
              type="text"
              value={why5}
              onChange={(e) => setWhy5(e.target.value)}
              className="w-full bg-purple-50/80 border border-purple-300 rounded-xl px-4 py-2.5 text-purple-950 font-extrabold text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white transition shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Ishikawa Fishbone Diagram Cards */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-slate-900 tracking-wide m-0">
          Ishikawa Fishbone Dimension Analysis
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          {/* People */}
          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2.5">
            <div className="flex items-center gap-2.5 text-indigo-900 font-extrabold">
              <Users className="w-5 h-5" />
              <span>People & Competency</span>
            </div>
            <ul className="space-y-2 text-slate-700 pl-4 list-disc m-0 text-xs font-medium">
              <li>Turnaround time pressure</li>
              <li>Contractor orientation gap</li>
              <li>Assumed isolation complete</li>
            </ul>
          </div>

          {/* Equipment */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
            <div className="flex items-center gap-2.5 text-amber-900 font-extrabold">
              <Wrench className="w-5 h-5" />
              <span>Equipment & Hardware</span>
            </div>
            <ul className="space-y-2 text-slate-700 pl-4 list-disc m-0 text-xs font-medium">
              <li>Bleed-off valve needle stuck</li>
              <li>Pressure gauge calibration</li>
              <li>LOTO hardware lockout fit</li>
            </ul>
          </div>

          {/* Process */}
          <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2.5">
            <div className="flex items-center gap-2.5 text-purple-900 font-extrabold">
              <Layers className="w-5 h-5" />
              <span>Process & Procedures</span>
            </div>
            <ul className="space-y-2 text-slate-700 pl-4 list-disc m-0 text-xs font-medium">
              <li>PTW isolation cert mismatch</li>
              <li>Pre-task hold point absent</li>
              <li>JSA line-of-fire review</li>
            </ul>
          </div>

          {/* Environment */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
            <div className="flex items-center gap-2.5 text-emerald-900 font-extrabold">
              <Wind className="w-5 h-5" />
              <span>Work Environment</span>
            </div>
            <ul className="space-y-2 text-slate-700 pl-4 list-disc m-0 text-xs font-medium">
              <li>Night shift lighting</li>
              <li>Hydrocarbon vapor dispersion</li>
              <li>SIMOPS noise distraction</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

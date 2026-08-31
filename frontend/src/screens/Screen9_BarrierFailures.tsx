import { useLanguage } from "../context/LanguageContext";
import React, { useState } from "react";
import { ReportItem } from "../types";
import { Layers, Sparkles, ChevronRight } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts";

interface Screen9Props {
  reports: ReportItem[];
  onSelectReport: (report: ReportItem) => void;
}

export const Screen9_BarrierFailures: React.FC<Screen9Props> = ({
  reports,
  onSelectReport
}) => {
  const { t } = useLanguage();
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const stateCounts = new Map<string, number>();
  reports.forEach((r) => {
    const st = r.extraction?.barriers[0]?.barrier_status || "UNVERIFIED";
    stateCounts.set(st, (stateCounts.get(st) || 0) + 1);
  });

  const BARRIER_STATES_INFO = [
    {
      code: "UNVERIFIED",
      name: "Unverified Barrier",
      desc: "Assumed complete or expected, but positive verification step was skipped or not recorded (the single most common maintenance SIF pattern)",
      color: "#ea580c",
      score: 2
    },
    {
      code: "MISSING",
      name: "Missing Barrier",
      desc: "Required physical or procedural barrier was never installed, planned, or deployed prior to exposure",
      color: "#dc2626",
      score: 3
    },
    {
      code: "BYPASSED",
      name: "Bypassed / Overridden",
      desc: "Barrier was intentionally bypassed, disabled, jumpered, or overridden without approved Management of Change",
      color: "#991b1b",
      score: 3
    },
    {
      code: "WEAK",
      name: "Weak / Substandard",
      desc: "Barrier was present but inadequately sized or designed to withstand full potential energy release",
      color: "#ef4444",
      score: 3
    },
    {
      code: "FAILED",
      name: "Failed Under Load",
      desc: "Barrier was physically installed but ruptured, tripped, or failed under operational conditions",
      color: "#b91c1c",
      score: 3
    },
    {
      code: "DEGRADED",
      name: "Degraded / Wear",
      desc: "Barrier exists but has lost partial effectiveness (calibration overdue, loose handwheel, seal drift)",
      color: "#d97706",
      score: 1
    },
    {
      code: "VERIFIED_INTACT",
      name: "Verified Intact",
      desc: "Barrier physically confirmed active, tested, and operational prior to task commencement",
      color: "#059669",
      score: 0
    }
  ];

  const pieData = BARRIER_STATES_INFO.map((st) => ({
    name: st.name,
    code: st.code,
    value: stateCounts.get(st.code) || 0,
    color: st.color
  })).filter((item) => item.value > 0);

  const filteredReports = selectedState
    ? reports.filter((r) => (r.extraction?.barriers[0]?.barrier_status || "UNVERIFIED") === selectedState)
    : reports;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/90 flex flex-wrap items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-100 text-orange-700">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-orange-100 text-orange-900 border border-orange-200">
                {t("bar.badge")}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 m-0 tracking-tight">
              {t("bar.title")}
            </h2>
            <p className="text-sm text-slate-500 m-0 font-medium">
              {t("bar.sub")}
            </p>
          </div>
        </div>

        {selectedState && (
          <button
            onClick={() => setSelectedState(null)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer transition shadow-xs"
          >
            Show All Failure Modes
          </button>
        )}
      </div>

      {/* Distribution Chart & Insight Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 tracking-wide m-0">
            {t("bar.chart_dist")}
          </h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "14px", color: "#0f172a", fontSize: "13px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-wide m-0">
              {t("bar.distinction_title")}
            </h3>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-sm leading-relaxed text-slate-800 font-medium">
            <p className="m-0">
              <strong className="text-amber-900">"Isolation completed"</strong> describes an <em>intended</em> state. <strong className="text-emerald-800">"Isolation verified"</strong> describes a <em>confirmed</em> state.
            </p>
            <p className="m-0">
              When a report states that isolation was "assumed complete but not pressure tested", it represents an <strong className="text-orange-700 font-mono">UNVERIFIED</strong> barrier. Upgrading it to "FAILED" in an AI system overstates what the evidence supports.
            </p>
            <p className="m-0 text-slate-600 text-xs">
              Our deterministic scoring engine specifically gives UNVERIFIED barriers a score of <strong>2</strong> (vs FAILED = 3), accurately capturing that the barrier may still hold, yet human exposure remains uncontrolled.
            </p>
          </div>
        </div>
      </div>

      {/* Cards for all 7 Barrier States */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BARRIER_STATES_INFO.map((st) => {
          const count = stateCounts.get(st.code) || 0;
          const isSelected = selectedState === st.code;

          return (
            <div
              key={st.code}
              onClick={() => setSelectedState(isSelected ? null : st.code)}
              className={`bg-white rounded-3xl p-6 border transition-all duration-200 cursor-pointer space-y-3 relative shadow-xs hover:shadow-md ${
                isSelected
                  ? "border-orange-500 ring-4 ring-orange-300/30 bg-orange-50/30"
                  : "border-slate-200/90 hover:border-slate-300"
              }`}
              style={{ borderLeftColor: st.color, borderLeftWidth: "5px" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 font-mono">{st.code}</span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 font-mono">
                  {count} Reports
                </span>
              </div>

              <h4 className="text-sm font-extrabold text-slate-900 m-0">{st.name}</h4>
              <p className="text-xs text-slate-600 leading-relaxed m-0 font-medium">{st.desc}</p>

              <div className="flex items-center justify-between text-xs pt-1.5 text-indigo-700 font-bold">
                <span>{isSelected ? "Showing Active Filter" : "Filter Reports"}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtered Reports Section */}
      {selectedState && (
        <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 tracking-wide m-0">
            Reports with Barrier State: <span className="text-orange-800 font-mono">{selectedState}</span> ({filteredReports.length} Reports)
          </h3>

          <div className="space-y-3">
            {filteredReports.map((r) => (
              <div
                key={r.report_id}
                onClick={() => onSelectReport(r)}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-300 hover:bg-white transition cursor-pointer flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1 truncate">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-900">{r.external_ref}</span>
                    <span className="text-xs text-slate-500 font-medium">({r.site})</span>
                    <span className="text-xs text-indigo-800 font-bold">
                      Rule: {r.rule_mappings[0]?.rule_display_name || "PSF"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 truncate m-0 font-medium">{r.narrative_text}</p>
                </div>
                <div className="text-right whitespace-nowrap shrink-0">
                  <span className="text-xs font-mono font-extrabold text-amber-900 block">Score: {r.assessment.raw_score}</span>
                  <span className="text-xs text-slate-500">{r.report_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

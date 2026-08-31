import { useLanguage } from "../context/LanguageContext";
import React, { useState } from "react";
import { ReportItem } from "../types";
import {
  Activity,
  ChevronRight,
  ShieldAlert,
  Flame,
  Wrench,
  DoorOpen,
  ArrowUpRight,
  Compass,
  Eye,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  ShieldCheck,
  Search,
  ExternalLink
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from "recharts";

interface Screen8Props {
  reports: ReportItem[];
  onSelectActivityFilter: (activityId: string) => void;
}

export const Screen8_ActivityAnalysis: React.FC<Screen8Props> = ({
  reports,
  onSelectActivityFilter
}) => {
  const { t } = useLanguage();
  const [chartMode, setChartMode] = useState<"VOLUME" | "SEVERITY">("VOLUME");
  const [layoutMode, setLayoutMode] = useState<"TABLE" | "CARDS">("TABLE");
  const [searchTerm, setSearchTerm] = useState("");

  // Aggregate stats per activity
  const actMap = new Map<
    string,
    {
      total: number;
      high: number;
      med: number;
      low: number;
      scores: number[];
      hazards: Set<string>;
      rules: Set<string>;
    }
  >();

  (reports || []).forEach((r) => {
    const a = r.activity || "OTHER_OPERATIONS";
    if (!actMap.has(a)) {
      actMap.set(a, {
        total: 0,
        high: 0,
        med: 0,
        low: 0,
        scores: [],
        hazards: new Set(),
        rules: new Set()
      });
    }
    const stat = actMap.get(a)!;
    stat.total += 1;
    const sif = (r.assessment?.sif_potential_label || "LOW").toUpperCase();
    if (sif === "HIGH") stat.high += 1;
    else if (sif === "MEDIUM") stat.med += 1;
    else stat.low += 1;

    const rawScore = r.assessment?.raw_score ?? 0;
    const normalizedScore = rawScore > 10 ? Math.round((rawScore / 12.2) * 100) / 10 : Number(rawScore);
    stat.scores.push(normalizedScore);

    (r.extraction?.hazards || []).forEach((h) => {
      if (h.display_name) stat.hazards.add(h.display_name);
    });
    (r.rule_mappings || []).forEach((m) => {
      if (m.rule_display_name) stat.rules.add(m.rule_display_name);
    });
  });

  const activityIcons: Record<string, any> = {
    mechanical_electrical_maintenance: Wrench,
    confined_space_entry: DoorOpen,
    lifting_rigging: Sliders,
    hot_work_welding: Flame,
    exploration_drilling: Compass,
    work_at_height: ArrowUpRight,
    simultaneous_operations: Layers,
    routine_inspection_patrol: Eye
  };

  const actList = Array.from(actMap.entries())
    .map(([act, stat]) => {
      const avgScore = stat.scores.length > 0 ? stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length : 0;
      const formattedAvg = Math.round(avgScore * 10) / 10;
      const topHazard = Array.from(stat.hazards)[0] || "Hazardous Energy Source";
      const topRule = Array.from(stat.rules)[0] || "Process Safety Fundamentals";

      return {
        activity: act,
        displayName: act.replace(/_/g, " ").toUpperCase(),
        total: stat.total,
        high: stat.high,
        med: stat.med,
        low: stat.low,
        avgScore: formattedAvg,
        topHazard,
        topRule,
        Icon: activityIcons[act] || Activity
      };
    })
    .sort((a, b) => b.total - a.total || b.avgScore - a.avgScore);

  const filteredActList = actList.filter((a) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      a.displayName.toLowerCase().includes(q) ||
      a.topHazard.toLowerCase().includes(q) ||
      a.topRule.toLowerCase().includes(q)
    );
  });

  const totalReports = (reports || []).length;
  const overallAvgScore = actList.length > 0
    ? (actList.reduce((sum, a) => sum + (a.avgScore * a.total), 0) / (totalReports || 1)).toFixed(1)
    : "8.8";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-700" />
              <span>{t("act.badge")}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {actList.length} {t("act.tasks_tracked")}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight m-0">
            {t("act.title")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 m-0 font-medium leading-relaxed">
            {t("act.sub")}
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[120px]">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">{t("act.total_reports")}</span>
            <span className="text-xl font-black text-slate-900 font-mono">{totalReports}</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[120px]">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">{t("act.avg_severity")}</span>
            <span className="text-xl font-black text-rose-600 font-mono">{overallAvgScore}<span className="text-2xs font-semibold text-slate-400">/10</span></span>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 m-0">
              {chartMode === "VOLUME"
                ? t("act.chart_title")
                : "Empirical Mean SIF Risk Score (Scale: 0.0 - 10.0)"}
            </h3>
            <p className="text-2xs sm:text-xs text-slate-500 m-0 font-medium">
              {chartMode === "VOLUME"
                ? t("act.chart_sub")
                : "Mean deterministic 5-factor risk score computed across all historical case studies"}
            </p>
          </div>

          {/* Chart Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setChartMode("VOLUME")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                chartMode === "VOLUME" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{t("act.btn_vol")}</span>
            </button>

            <button
              onClick={() => setChartMode("SEVERITY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                chartMode === "SEVERITY" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>{t("act.btn_sev")}</span>
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === "VOLUME" ? (
              <BarChart data={actList} layout="vertical" margin={{ left: 10, right: 25, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="displayName" type="category" stroke="#334155" fontSize={10.5} width={200} tick={{ fontWeight: 600 }} />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "14px",
                    color: "#0f172a",
                    fontSize: "12px",
                    boxShadow: "0 10px 20px -5px rgba(0,0,0,0.1)"
                  }}
                  formatter={(val: any, name: any) => [
                    `${val} Reports`,
                    name === "high" ? "High SIF" : name === "med" ? "Medium SIF" : "Controlled"
                  ]}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "8px", fontSize: "11px" }}
                  formatter={(value) => (
                    <span className="font-semibold text-slate-700">
                      {value === "high" ? "🔴 High SIF" : value === "med" ? "🟡 Medium SIF" : "🟢 Controlled / Low"}
                    </span>
                  )}
                />
                <Bar dataKey="high" name="high" stackId="a" fill="#dc2626" />
                <Bar dataKey="med" name="med" stackId="a" fill="#d97706" />
                <Bar dataKey="low" name="low" stackId="a" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            ) : (
              <BarChart data={actList} layout="vertical" margin={{ left: 10, right: 25, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 10]} unit="/10" />
                <YAxis dataKey="displayName" type="category" stroke="#334155" fontSize={10.5} width={200} tick={{ fontWeight: 600 }} />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "14px",
                    color: "#0f172a",
                    fontSize: "12px",
                    boxShadow: "0 10px 20px -5px rgba(0,0,0,0.1)"
                  }}
                  formatter={(val: any) => [`${val} / 10.0 SIF Score`, "Empirical Severity"]}
                />
                <Bar dataKey="avgScore" radius={[0, 6, 6, 0]}>
                  {actList.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.avgScore >= 8.5 ? "#dc2626" : entry.avgScore >= 5.0 ? "#d97706" : "#059669"}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modern High-Density Table / Card Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter tasks by activity, hazard, or rule..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Layout:
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setLayoutMode("TABLE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === "TABLE" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Executive Table</span>
              </button>
              <button
                onClick={() => setLayoutMode("CARDS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === "CARDS" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards View</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Mode 1: Executive Table (Clean, Compact, Professional) */}
        {layoutMode === "TABLE" && (
          <div className="overflow-x-auto border border-slate-200/90 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Operational Activity / Task</th>
                  <th className="py-3.5 px-4 text-center">Incident Volume</th>
                  <th className="py-3.5 px-4 text-center">SIF Severity Score</th>
                  <th className="py-3.5 px-4">SIF Tier Distribution</th>
                  <th className="py-3.5 px-4">Primary Hazard</th>
                  <th className="py-3.5 px-4">Governing IOGP Rule</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActList.map((a) => {
                  const Icon = a.Icon;
                  const isHigh = a.avgScore >= 8.0;

                  return (
                    <tr
                      key={a.activity}
                      onClick={() => onSelectActivityFilter(a.activity)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Activity Title */}
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition">
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="group-hover:text-blue-600 transition">{a.displayName}</span>
                        </div>
                      </td>

                      {/* Incident Volume */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {a.total} {a.total === 1 ? "Case" : "Cases"}
                        </span>
                      </td>

                      {/* SIF Score */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs ${
                            isHigh
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : a.avgScore >= 4.0
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {a.avgScore.toFixed(1)} / 10.0
                        </span>
                      </td>

                      {/* SIF Distribution */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-2xs">
                          {a.high > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                              🔴 {a.high} High
                            </span>
                          )}
                          {a.med > 0 && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                              🟡 {a.med} Med
                            </span>
                          )}
                          {a.low > 0 && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              🟢 {a.low} Low
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hazard */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium max-w-xs truncate">
                        {a.topHazard}
                      </td>

                      {/* Rule */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 truncate inline-block max-w-[180px]">
                          {a.topRule}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectActivityFilter(a.activity);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-900 text-slate-700 hover:text-white border border-slate-200 hover:border-slate-900 font-bold text-2xs transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* View Mode 2: Clean Modern Cards */}
        {layoutMode === "CARDS" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActList.map((a) => {
              const Icon = a.Icon;
              const isHigh = a.avgScore >= 8.0;

              return (
                <div
                  key={a.activity}
                  onClick={() => onSelectActivityFilter(a.activity)}
                  className="bg-slate-50/70 hover:bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-blue-400 hover:shadow-sm transition cursor-pointer flex flex-col justify-between space-y-3.5 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2.5 rounded-xl bg-white text-blue-700 group-hover:bg-blue-600 group-hover:text-white border border-slate-200 group-hover:border-blue-600 transition shadow-2xs">
                        <Icon className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition m-0">
                          {a.displayName}
                        </h4>
                        <span className="text-2xs text-slate-500 font-medium block mt-0.5">
                          {a.total} Total Case Studies
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs shrink-0 ${
                        isHigh
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : a.avgScore >= 4.0
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {a.avgScore.toFixed(1)} / 10.0
                    </span>
                  </div>

                  <div className="space-y-1 text-2xs text-slate-600 font-medium">
                    <div className="truncate">
                      <strong className="text-slate-800">Hazard:</strong> {a.topHazard}
                    </div>
                    <div className="truncate">
                      <strong className="text-slate-800">Rule:</strong> {a.topRule}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-2xs font-bold">
                      <span className="text-rose-700">🔴 {a.high}</span>
                      <span className="text-amber-700">🟡 {a.med}</span>
                      <span className="text-emerald-700">🟢 {a.low}</span>
                    </div>

                    <span className="text-xs text-blue-600 group-hover:text-blue-700 font-bold flex items-center gap-1">
                      <span>View Reports</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Screen8_ActivityAnalysis;

import { useLanguage } from "../context/LanguageContext";
import React from "react";
import { ReportItem, ExecutiveOverviewData } from "../types";
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  Flame,
  AlertOctagon,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  FileText,
  Radio
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";

interface Screen1Props {
  overviewData: ExecutiveOverviewData | null;
  reports: ReportItem[];
  onSelectReport: (report: ReportItem) => void;
  onNavigateToScreen: (screenId: number) => void;
}

export const Screen1_ExecutiveOverview: React.FC<Screen1Props> = ({
  overviewData,
  reports,
  onSelectReport,
  onNavigateToScreen
}) => {
  const { t } = useLanguage();
  const total = (reports || []).length;
  const highCount = (reports || []).filter((r) => r.assessment?.sif_potential_label === "HIGH").length;
  const medCount = (reports || []).filter((r) => r.assessment?.sif_potential_label === "MEDIUM").length;
  const lowCount = (reports || []).filter((r) => r.assessment?.sif_potential_label === "LOW").length;
  const insufficientCount = (reports || []).filter((r) => r.assessment?.sif_potential_label === "INSUFFICIENT_EVIDENCE").length;
  const sifDensity = total > 0 ? Math.round(((highCount + medCount) / total) * 1000) / 10 : 0;

  const pieData = [
    { name: "High SIF Precursor", value: highCount, color: "#dc2626" },
    { name: "Medium SIF Potential", value: medCount, color: "#d97706" },
    { name: "Low SIF Potential", value: lowCount, color: "#059669" },
    { name: "Needs Human Review", value: insufficientCount, color: "#64748b" }
  ];

  // Dynamically aggregate top installation sites from active reports
  const siteMap = new Map<string, { total: number; high: number; med: number }>();
  (reports || []).forEach((r) => {
    const s = r.site ? r.site.split(" - ")[0] : "Field Operations";
    if (!siteMap.has(s)) {
      siteMap.set(s, { total: 0, high: 0, med: 0 });
    }
    const stat = siteMap.get(s)!;
    stat.total += 1;
    if (r.assessment?.sif_potential_label === "HIGH") stat.high += 1;
    else if (r.assessment?.sif_potential_label === "MEDIUM") stat.med += 1;
  });

  const siteComparisonData = Array.from(siteMap.entries())
    .map(([site, stat]) => {
      const density = stat.total > 0 ? Math.round(((stat.high + stat.med) / stat.total) * 1000) / 10 : 0;
      return {
        site: site.length > 20 ? site.slice(0, 18) + "..." : site,
        fullSite: site,
        density,
        high: stat.high,
        total: stat.total
      };
    })
    .sort((a, b) => b.high - a.high || b.density - a.density)
    .slice(0, 6);

  const topSiteName = siteComparisonData[0]?.fullSite || "Duliajan Central";
  const secondSiteName = siteComparisonData[1]?.fullSite || "Moran Oilfield";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with Maharatna Context */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs">
                OIL INDIA LIMITED
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 m-0">
              {t("dash.title")}
            </h2>
          </div>

          {/* Quick Stat Pill */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center gap-5 shadow-2xs">
            <div className="text-center px-2">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">{t("dash.density")}</span>
              <span className="text-3xl font-black text-rose-600 font-mono">
                {sifDensity}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">{t("dash.total_obs")}</span>
            </div>
            <div className="h-10 w-[1px] bg-slate-200"></div>
            <div className="text-center px-2">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">{t("dash.baseline")}</span>
              <span className="text-3xl font-black text-emerald-600 font-mono">
                &lt; 20.0%
              </span>
              <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                {sifDensity > 20 ? `+${(sifDensity - 20).toFixed(1)}% Elevated` : "Controlled Baseline"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: High SIF */}
        <div
          onClick={() => onNavigateToScreen(2)}
          className="bg-white hover:bg-rose-50/30 rounded-2xl p-5 border border-slate-200/90 hover:border-rose-300 cursor-pointer space-y-2.5 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">{t("dash.high_sif")}</span>
            <span className="p-2 rounded-xl bg-rose-100 text-rose-600 shadow-2xs">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 font-mono">{highCount}</span>
            <span className="text-[10px] text-rose-800 font-bold px-2 py-0.5 bg-rose-50 rounded-lg border border-rose-200">{t("dash.critical_priority")}</span>
          </div>
          <p className="text-[11px] text-slate-500 m-0 font-medium">{t("dash.high_sif_sub")}</p>
        </div>

        {/* Card 2: Medium SIF */}
        <div
          onClick={() => onNavigateToScreen(2)}
          className="bg-white hover:bg-amber-50/30 rounded-2xl p-5 border border-slate-200/90 hover:border-amber-300 cursor-pointer space-y-2.5 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">{t("dash.med_sif")}</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700 font-mono">{medCount}</span>
            <span className="text-[10px] text-amber-900 font-bold px-2 py-0.5 bg-amber-50 rounded-lg border border-amber-200">{t("dash.degradation")}</span>
          </div>
          <p className="text-[11px] text-slate-500 m-0 font-medium">{t("dash.med_sif_sub")}</p>
        </div>

        {/* Card 3: Low SIF */}
        <div
          onClick={() => onNavigateToScreen(2)}
          className="bg-white hover:bg-emerald-50/30 rounded-2xl p-5 border border-slate-200/90 hover:border-emerald-300 cursor-pointer space-y-2.5 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">{t("dash.low_sif")}</span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700 font-mono">{lowCount}</span>
            <span className="text-[10px] text-emerald-800 font-bold px-2 py-0.5 bg-emerald-50 rounded-lg border border-emerald-200">{t("dash.controlled")}</span>
          </div>
          <p className="text-[11px] text-slate-500 m-0 font-medium">{t("dash.low_sif_sub")}</p>
        </div>

        {/* Card 4: Needs Review */}
        <div
          onClick={() => onNavigateToScreen(2)}
          className="bg-white hover:bg-slate-50 rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 cursor-pointer space-y-2.5 shadow-2xs hover:shadow-sm transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">{t("dash.pending")}</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700 shadow-2xs">
              <HelpCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 font-mono">{insufficientCount}</span>
            <span className="text-[10px] text-slate-700 font-bold px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200">Pending Triage</span>
          </div>
          <p className="text-[11px] text-slate-500 m-0 font-medium">{t("dash.pending_sub")}</p>
        </div>
      </div>

      {/* Site Precursor Density Benchmark (Full Width) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight m-0">
              {t("dash.site_comparison")}
            </h3>
            <p className="text-xs text-slate-500 m-0 font-medium">
              {t("dash.site_comparison_sub")}
            </p>
          </div>
          <button
            onClick={() => onNavigateToScreen(7)}
            className="text-xs text-slate-700 hover:text-slate-900 flex items-center gap-1 font-bold cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
          >
            <span>{t("dash.full_benchmark")}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={siteComparisonData}
              margin={{ left: 0, right: 15, top: 15, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="site"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                dy={10}
                tick={{ fontWeight: 600, fill: "#334155" }}
              />
              <YAxis
                type="number"
                domain={[0, 100]}
                unit="%"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                width={45}
                tick={{ fontWeight: 500 }}
              />
              <Tooltip
                cursor={false}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "14px",
                  color: "#0f172a",
                  fontSize: "12px",
                  fontWeight: "600",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                }}
                formatter={(val: any, name: any, item: any) => [
                  `${val}% SIF Density (${item.payload.high} High SIF / ${item.payload.total} Logs)`,
                  "Precursor Density"
                ]}
                labelStyle={{ fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}
              />
              <Bar dataKey="density" radius={[8, 8, 0, 0]} barSize={42}>
                {siteComparisonData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.density >= 35 ? "#dc2626" : entry.density >= 25 ? "#d97706" : "#2563eb"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-800">
          <span className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Highest SIF Concentration: <strong>{topSiteName} & {secondSiteName}</strong>
            </span>
          </span>
          <button
            onClick={() => onNavigateToScreen(7)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer font-bold text-xs shadow-2xs transition"
          >
            Analyze Site Delta
          </button>
        </div>
      </div>

            {/* Top Priority Reports Preview */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 m-0">{t("dash.top_reports")}</h3>
            </div>
            <button
              onClick={() => onNavigateToScreen(2)}
              className="text-xs text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
            >
              {t("dash.go_queue")} →
            </button>
          </div>

          <div className="space-y-2">
            {(reports || []).length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <FileText className="w-7 h-7 text-slate-300 mx-auto" />
                <div className="text-xs font-bold text-slate-700">No safety reports in database</div>
                <p className="text-2xs text-slate-500 max-w-xs mx-auto">Upload or ingest your safety PDF reports to start real-time intelligence scoring.</p>
                <button
                  onClick={() => onNavigateToScreen(3)}
                  className="mt-1 px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  + Ingest Safety Report
                </button>
              </div>
            ) : (
              (reports || []).slice(0, 3).map((r) => (
                <div
                  key={r.report_id}
                  onClick={() => onSelectReport(r)}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-white transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.assessment?.sif_potential_label === "HIGH"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {r.assessment?.sif_potential_label}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">{r.title || r.site}</span>
                    </div>
                    <p className="text-xs text-slate-600 truncate m-0 font-medium">{r.narrative_text}</p>
                  </div>
                  <div className="text-right whitespace-nowrap shrink-0">
                    <span className="text-xs text-amber-900 font-mono font-extrabold block">
                      Score: {r.assessment?.raw_score ?? 0}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{r.report_date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
    </div>
  );
};

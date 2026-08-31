import React, { useState, useEffect, useMemo } from "react";
import { ReportItem } from "../types";
import {
  SafetyStateVectorData,
  StateDeltaData,
  TelemetryTimelinePoint,
  SiteTelemetryResponse,
  SiteTelemetrySummaryItem
} from "../types";
import { fetchSiteTelemetry, fetchTelemetrySitesSummary, fetchSyntheticDemoTelemetry } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import {
  Radio,
  Activity,
  AlertTriangle,
  Flame,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ChevronRight,
  Eye,
  Building2,
  Calendar,
  Layers,
  Zap,
  Info,
  Clock,
  CheckCircle2,
  AlertOctagon,
  FileText,
  Sliders,
  Filter
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from "recharts";

interface Screen10Props {
  reports: ReportItem[];
  onSelectReport: (report: ReportItem) => void;
  onNavigateToScreen: (screenId: number) => void;
}

export const Screen10_SafetyTelemetry: React.FC<Screen10Props> = ({
  reports,
  onSelectReport,
  onNavigateToScreen
}) => {
  const { t, language } = useLanguage();

  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [selectedSite, setSelectedSite] = useState<string>("Moran Drilling Rig 7 (Demo Scenario)");
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("6M");
  const [telemetryData, setTelemetryData] = useState<SiteTelemetryResponse | null>(null);
  const [sitesSummary, setSitesSummary] = useState<SiteTelemetrySummaryItem[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<TelemetryTimelinePoint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Available Sites for dropdown
  const availableSites = useMemo(() => {
    const s = new Set<string>();
    s.add("Moran Drilling Rig 7 (Demo Scenario)");
    s.add("Crude Oil Terminal");
    s.add("Refinery");
    s.add("NRL Hydrocracker Unit 2");
    s.add("Duliajan Central");
    s.add("Moran Oilfield");
    s.add("Digboi Refinery");
    reports.forEach((r) => {
      if (r.site) s.add(r.site.split(" - ")[0]);
    });
    return Array.from(s);
  }, [reports]);

  // Load telemetry data on site change or toggle
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        let data: SiteTelemetryResponse | null = null;
        if (isDemoMode || selectedSite.includes("Demo") || selectedSite.includes("Rig 7")) {
          data = await fetchSyntheticDemoTelemetry();
        } else {
          data = await fetchSiteTelemetry(selectedSite, selectedActivity);
        }

        if (isMounted && data) {
          setTelemetryData(data);
          if (data.timeline && data.timeline.length > 0) {
            setSelectedPoint(data.timeline[data.timeline.length - 1]);
          }
        }

        const summaryRes = await fetchTelemetrySitesSummary();
        if (isMounted && summaryRes?.summaries) {
          setSitesSummary(summaryRes.summaries);
        }
      } catch (err) {
        console.warn("Telemetry loading error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedSite, selectedActivity, isDemoMode]);

  const handleSelectSite = (siteName: string) => {
    setSelectedSite(siteName);
    if (siteName.includes("Demo") || siteName.includes("Rig 7")) {
      setIsDemoMode(true);
    } else {
      setIsDemoMode(false);
    }
  };

  const currentVector = selectedPoint?.state_vector || telemetryData?.timeline?.[telemetryData.timeline.length - 1]?.state_vector;

  return (
    <div className="space-y-7 pb-12 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900 text-white shadow-xs flex items-center gap-1.5 font-mono">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>SIF TELEMETRY ENGINE</span>
            </span>
            {telemetryData?.is_synthetic_demo && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                Prototype / Synthetic Demonstration Scenario
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
            {t("telem.title", "Asset Safety Telemetry & Risk Trajectory")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 m-0 font-medium leading-relaxed">
            {t("telem.sub", "Continuous temporal tracking of barrier integrity, personnel exposure, and early warning precursor drift across operational shifts.")}
          </p>
        </div>

        {/* Demo Toggle Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setIsDemoMode(true);
              setSelectedSite("Moran Drilling Rig 7 (Demo Scenario)");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              isDemoMode
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>6-Week Deterioration Demo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsDemoMode(false);
              setSelectedSite("Crude Oil Terminal");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
              !isDemoMode
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Live Asset Telemetry</span>
          </button>
        </div>
      </div>

      {/* Selector Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
        <div className="flex flex-wrap items-center gap-3">
          {/* Site Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              {t("telem.site_selector", "Installation Site")}:
            </span>
            <select
              value={selectedSite}
              onChange={(e) => handleSelectSite(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-2xs"
            >
              {availableSites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              {t("telem.activity_selector", "Operational Activity")}:
            </span>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-2xs"
            >
              <option value="">All Operational Activities</option>
              <option value="mechanical_electrical_maintenance">Mechanical Electrical Maintenance</option>
              <option value="confined_space_entry">Confined Space Entry</option>
              <option value="lifting_rigging">Lifting & Rigging</option>
              <option value="hot_work_welding">Hot Work & Welding</option>
              <option value="exploration_drilling">Exploration Drilling</option>
            </select>
          </div>
        </div>

        {/* Time Window Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          {(["3M", "6M", "1Y"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                timeRange === range
                  ? "bg-white text-slate-900 shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {range === "3M" ? "3 Months" : range === "6M" ? "6 Months" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* CURRENT SAFETY STATE & TRAJECTORY BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Safety Trajectory & Drift Status */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
              {t("telem.current_state", "CURRENT SAFETY STATE")}
            </span>
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-2xl text-sm font-black tracking-wide border shadow-2xs ${
                  telemetryData?.trajectory_status === "CRITICAL"
                    ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
                    : telemetryData?.trajectory_status === "DETERIORATING"
                    ? "bg-orange-50 text-orange-800 border-orange-300"
                    : telemetryData?.trajectory_status === "EMERGING"
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-emerald-50 text-emerald-800 border-emerald-300"
                }`}
              >
                {telemetryData?.trajectory_badge || "🟢 STABLE"}
              </span>
            </div>
            <p className="text-xs text-slate-600 m-0 font-medium leading-relaxed">
              Temporal analysis of safety state vectors across {telemetryData?.total_points || 6} consecutive observation shifts.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">{t("telem.risk_drift", "Risk Drift")}:</span>
              <span
                className={`px-3 py-1 rounded-xl text-xs font-mono font-black border ${
                  telemetryData?.risk_drift_label === "CRITICAL"
                    ? "bg-rose-100 text-rose-900 border-rose-300"
                    : telemetryData?.risk_drift_label === "HIGH"
                    ? "bg-orange-100 text-orange-900 border-orange-300"
                    : telemetryData?.risk_drift_label === "MODERATE"
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-emerald-100 text-emerald-900 border-emerald-300"
                }`}
              >
                {telemetryData?.risk_drift_label || "CONTROLLED"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Site Asset:</span>
              <strong className="text-slate-800 truncate max-w-[200px]">{telemetryData?.site}</strong>
            </div>
          </div>
        </div>

        {/* Right 8 Cols: 6-Dimensional Safety State Vector Matrix */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-900 m-0">
                Current Safety State Vector: <span className="font-mono text-blue-700">State(t)</span>
              </h3>
            </div>
            <span className="text-2xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              Normalized 0 – 100 Scale
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {/* 1. Energy Intensity */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Energy Intensity
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {currentVector?.energy_intensity ?? 85}%
                </span>
                <span className="text-[10px] font-bold text-rose-700 font-mono">
                  {currentVector && currentVector.energy_intensity >= 75 ? "High Energy" : "Moderate"}
                </span>
              </div>
            </div>

            {/* 2. Exposure Level */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Exposure Level
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-rose-600">
                  {currentVector?.exposure_level ?? 80}%
                </span>
                <span className="text-[10px] font-bold text-rose-700 font-mono">
                  {currentVector && currentVector.exposure_level >= 75 ? "Danger Zone" : "Separated"}
                </span>
              </div>
            </div>

            {/* 3. Barrier Health */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Barrier Health
              </span>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black font-mono ${
                  (currentVector?.barrier_health ?? 20) <= 25 ? "text-rose-600" : "text-emerald-700"
                }`}>
                  {currentVector?.barrier_health ?? 20}%
                </span>
                <span className="text-[10px] font-bold text-amber-800 font-mono">
                  {selectedPoint?.barrier_status || "UNVERIFIED"}
                </span>
              </div>
            </div>

            {/* 4. Activity Criticality */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Activity Criticality
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {currentVector?.activity_criticality ?? 85}%
                </span>
                <span className="text-[10px] font-bold text-indigo-700 font-mono">
                  {currentVector && currentVector.activity_criticality >= 80 ? "Critical Task" : "Standard"}
                </span>
              </div>
            </div>

            {/* 5. SIF Potential */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                SIF Potential
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-rose-600">
                  {currentVector?.sif_potential ?? 82}%
                </span>
                <span className="text-[10px] font-bold text-rose-700 font-mono">
                  {selectedPoint?.sif_label || "HIGH"} SIF
                </span>
              </div>
            </div>

            {/* 6. Evidence Confidence */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Evidence Confidence
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-emerald-700">
                  {currentVector?.evidence_confidence ?? 94}%
                </span>
                <span className="text-[10px] font-bold text-emerald-800 font-mono">
                  Verified NLP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE TIMELINE TREND CHART */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight m-0">
              {t("telem.safety_trajectory", "Safety Trajectory Sequence")}
            </h3>
            <p className="text-xs text-slate-500 m-0 font-medium mt-0.5">
              Click any point on the trajectory curve to inspect that shift's underlying safety observation.
            </p>
          </div>

          {/* Interactive Milestone Point Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(telemetryData?.timeline || []).map((pt, i) => {
              const isSelected = selectedPoint?.point_id === pt.point_id;
              return (
                <button
                  key={pt.point_id}
                  onClick={() => setSelectedPoint(pt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs scale-105"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <span>{pt.time_label}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    pt.sif_label === "HIGH" ? "bg-rose-500" : pt.sif_label === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"
                  }`}></span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recharts Trajectory Line Chart */}
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={telemetryData?.timeline || []}
              margin={{ top: 15, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time_label" stroke="#64748b" fontSize={11} tick={{ fontWeight: 600 }} />
              <YAxis domain={[0, 100]} unit="%" stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "14px",
                  color: "#0f172a",
                  fontSize: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <ReferenceLine y={70} stroke="#dc2626" strokeDasharray="3 3" label={{ value: "Critical SIF Zone", fill: "#dc2626", fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="composite_risk"
                name="Composite SIF Trajectory"
                stroke="#dc2626"
                strokeWidth={3.5}
                dot={{ r: 6, fill: "#dc2626" }}
                activeDot={{ r: 8, stroke: "#ffffff", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="state_vector.barrier_health"
                name="Barrier Health"
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: "#059669" }}
              />
              <Line
                type="monotone"
                dataKey="state_vector.exposure_level"
                name="Personnel Exposure"
                stroke="#ea580c"
                strokeWidth={2}
                dot={{ r: 4, fill: "#ea580c" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* WHAT IS CHANGING & WHY IS IT CHANGING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WHAT IS CHANGING (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight m-0">
              {t("telem.what_changing", "WHAT IS CHANGING?")}
            </h3>
          </div>

          <div className="space-y-2.5">
            {/* Barrier Health */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-700">Barrier Health</span>
              <span className="flex items-center gap-1 text-xs font-extrabold text-rose-600 font-mono">
                <TrendingDown className="w-4 h-4" />
                <span>Declining (↓)</span>
              </span>
            </div>

            {/* Personnel Exposure */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-700">Personnel Exposure</span>
              <span className="flex items-center gap-1 text-xs font-extrabold text-rose-600 font-mono">
                <TrendingUp className="w-4 h-4" />
                <span>Increasing (↑)</span>
              </span>
            </div>

            {/* SIF Potential */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-700">SIF Potential Score</span>
              <span className="flex items-center gap-1 text-xs font-extrabold text-rose-600 font-mono">
                <TrendingUp className="w-4 h-4" />
                <span>Increasing (↑)</span>
              </span>
            </div>

            {/* Hazardous Energy */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-700">Hazardous Energy Level</span>
              <span className="flex items-center gap-1 text-xs font-extrabold text-amber-700 font-mono">
                <TrendingUp className="w-4 h-4" />
                <span>Elevating (↑)</span>
              </span>
            </div>
          </div>
        </div>

        {/* WHY IS IT CHANGING? (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight m-0">
              {t("telem.why_changing", "WHY IS IT CHANGING?")}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Primary Driver */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
              <span className="text-2xs font-extrabold text-purple-900 uppercase tracking-wider block">
                {t("telem.primary_driver", "PRIMARY DRIVER")}
              </span>
              <p className="text-sm font-extrabold text-purple-950 m-0 leading-snug">
                {telemetryData?.explanation?.primary_driver || "Progressive barrier degradation and repeated isolation verification omissions"}
              </p>
            </div>

            {/* Contributing Factors List */}
            <div className="space-y-2">
              <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider block">
                {t("telem.contributing_factors", "CONTRIBUTING FACTORS")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(telemetryData?.explanation?.contributing_factors || []).map((factor, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HSE DECISION SUPPORT BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-950 text-white border border-blue-500/30 shadow-md space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-300">
            {t("telem.hse_attention", "HSE DECISION SUPPORT")}
          </span>
        </div>
        <p className="text-base sm:text-lg font-extrabold text-white m-0 leading-relaxed max-w-4xl">
          "{telemetryData?.explanation?.hse_recommendation || "Safety deterioration detected. HSE review recommended before commencement of high-energy tasks."}"
        </p>
        <p className="text-xs text-slate-400 m-0 font-medium">
          Note: This telemetry provides probabilistic precursor trajectory intelligence. Final operational safety sign-offs remain under HSE authority.
        </p>
      </div>

      {/* POINT INSPECTOR (WHEN USER CLICKS A TIMELINE POINT) */}
      {selectedPoint && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-500/40 shadow-sm space-y-5 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-mono font-black">
                {selectedPoint.time_label} ({selectedPoint.date})
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                {selectedPoint.external_ref} • {selectedPoint.activity}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              Confidence: {Math.round(selectedPoint.confidence * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Hazard</span>
              <span className="font-bold text-slate-900 mt-0.5 block truncate">{selectedPoint.hazard}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Barrier Type</span>
              <span className="font-bold text-slate-900 mt-0.5 block truncate">{selectedPoint.barrier}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Barrier State</span>
              <span className={`font-mono font-black mt-0.5 block ${
                selectedPoint.barrier_status === "FAILED" || selectedPoint.barrier_status === "BYPASSED" ? "text-rose-600" :
                selectedPoint.barrier_status === "UNVERIFIED" ? "text-orange-700" : "text-emerald-700"
              }`}>
                {selectedPoint.barrier_status}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-bold block text-[10px] uppercase">Calculated SIF</span>
              <span className="font-mono font-black text-rose-600 mt-0.5 block">
                {selectedPoint.sif_score.toFixed(1)} / 10.0 ({selectedPoint.sif_label})
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5">
            <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-wider block">
              Source Incident Narrative Excerpt
            </span>
            <p className="text-xs font-medium text-slate-800 italic leading-relaxed m-0">
              "{selectedPoint.narrative_excerpt}"
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs font-semibold text-amber-950 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-0.5">{t("telem.why_matters", "WHY THIS MATTERS")}:</strong>
              This observation contributed to the site's deteriorating safety trajectory due to barrier verification omission under pressurized energy.
            </div>
          </div>
        </div>
      )}

      {/* CROSS-SITE TRAJECTORY RADAR COMPARISON */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight m-0">
              {t("telem.cross_site_title", "Cross-Site Trajectory Intelligence")}
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
            {sitesSummary.length} Operational Assets Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sitesSummary.map((site) => (
            <div
              key={site.site}
              onClick={() => handleSelectSite(site.site)}
              className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer space-y-3 ${
                selectedSite === site.site
                  ? "bg-blue-50/40 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                  : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-900 truncate">
                  {site.site}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-2xs font-black tracking-wide shrink-0 border ${
                    site.trajectory_status === "CRITICAL"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : site.trajectory_status === "DETERIORATING"
                      ? "bg-orange-50 text-orange-800 border-orange-200"
                      : site.trajectory_status === "EMERGING"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}
                >
                  {site.trajectory_badge}
                </span>
              </div>

              <p className="text-2xs text-slate-500 m-0 font-medium line-clamp-2">
                {site.primary_driver}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs font-mono">
                <span className="text-slate-500 font-bold">{site.total_points} Observation Logs</span>
                <span className="text-blue-700 font-extrabold flex items-center gap-0.5">
                  <span>Inspect</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Screen10_SafetyTelemetry;

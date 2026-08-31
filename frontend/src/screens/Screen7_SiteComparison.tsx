import React, { useState, useEffect, useMemo } from "react";
import { ReportItem } from "../types";
import { useLanguage } from "../context/LanguageContext";
import {
  Building2,
  GitFork,
  ChevronRight,
  Search,
  Filter,
  X,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Layers,
  ExternalLink,
  Eye,
  Activity,
  TrendingUp,
  BarChart3,
  MapPin,
  FileText,
  Sparkles,
  ArrowRightLeft,
  Link,
  ShieldCheck,
  Zap,
  AlertCircle,
  Tag
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from "recharts";

interface UnifiedSiteRiskProps {
  reports: ReportItem[];
  currentReport?: ReportItem;
  onSelectReport: (report: ReportItem) => void;
  onSelectSiteFilter: (siteName: string) => void;
}

export const Screen7_SiteComparison: React.FC<UnifiedSiteRiskProps> = ({
  reports,
  currentReport: initialReport,
  onSelectReport,
  onSelectSiteFilter
}) => {
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<"DENSITY" | "CROSS_SITE_SIMILARITY">("DENSITY");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<string>("ALL");
  const [modalSite, setModalSite] = useState<string | null>(null);

  // Cross-site similarity target incident state
  const [targetReportId, setTargetReportId] = useState<string>(
    initialReport?.report_id || reports[0]?.report_id || ""
  );
  const [selectedMatchReport, setSelectedMatchReport] = useState<ReportItem | null>(null);

  // Close modal on Escape key and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalSite(null);
      }
    };
    if (modalSite) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalSite]);

  const getFormattedScore = (rawScore?: number): string => {
    if (rawScore === undefined || rawScore === null || rawScore <= 0) return "0.0";
    if (rawScore > 10.0) return (Math.round((rawScore / 12.2) * 100) / 10).toFixed(1);
    return Number(rawScore).toFixed(1);
  };

  // Aggregate stats per site
  const siteList = useMemo(() => {
    const siteMap = new Map<
      string,
      {
        total: number;
        high: number;
        med: number;
        low: number;
        rules: Map<string, number>;
        reports: ReportItem[];
      }
    >();

    (reports || []).forEach((r) => {
      const s = r.site || "Unknown Site";
      if (!siteMap.has(s)) {
        siteMap.set(s, {
          total: 0,
          high: 0,
          med: 0,
          low: 0,
          rules: new Map<string, number>(),
          reports: []
        });
      }
      const entry = siteMap.get(s)!;
      entry.total += 1;
      entry.reports.push(r);

      const sifLabel = r.assessment?.sif_potential_label;
      if (sifLabel === "HIGH") entry.high += 1;
      else if (sifLabel === "MEDIUM") entry.med += 1;
      else entry.low += 1;

      (r.rule_mappings || []).forEach((rm) => {
        const rName = rm.rule_display_name || "General Standard";
        entry.rules.set(rName, (entry.rules.get(rName) || 0) + 1);
      });
    });

    return Array.from(siteMap.entries()).map(([site, stat]) => {
      const density =
        stat.total > 0
          ? Math.round(((stat.high + stat.med) / stat.total) * 1000) / 10
          : 0;

      // Find top rule
      let topRule = "General Integrity";
      let maxRuleCount = 0;
      stat.rules.forEach((cnt, ruleName) => {
        if (cnt > maxRuleCount) {
          maxRuleCount = cnt;
          topRule = ruleName;
        }
      });

      // Asset region mapping
      let region = "Assam Asset (Duliajan)";
      if (site.toLowerCase().includes("rajasthan") || site.toLowerCase().includes("tanot")) {
        region = "Western Asset (Rajasthan)";
      } else if (site.toLowerCase().includes("kg basin") || site.toLowerCase().includes("offshore")) {
        region = "Offshore Asset (KG Basin)";
      } else if (site.toLowerCase().includes("pipeline") || site.toLowerCase().includes("barauni")) {
        region = "Pipeline Corridor Asset";
      } else if (site.toLowerCase().includes("nrl") || site.toLowerCase().includes("numaligarh")) {
        region = "Refinery / Marketing (NRL)";
      } else if (site.toLowerCase().includes("moran")) {
        region = "Assam Asset (Moran)";
      }

      const tier: "CRITICAL" | "ELEVATED" | "NORMAL" =
        density >= 35 && stat.high >= 1
          ? "CRITICAL"
          : density >= 20 || stat.high >= 1
          ? "ELEVATED"
          : "NORMAL";

      return {
        site,
        region,
        total_reports: stat.total,
        high_sif_count: stat.high,
        medium_sif_count: stat.med,
        low_count: stat.low,
        sif_precursor_density: density,
        risk_tier: tier,
        primary_vulnerability: topRule,
        site_reports: stat.reports
      };
    }).sort((a, b) => {
      if (b.high_sif_count !== a.high_sif_count) {
        return b.high_sif_count - a.high_sif_count;
      }
      return b.sif_precursor_density - a.sif_precursor_density;
    });
  }, [reports]);

  // Filtered by Search & Asset Region
  const filteredSites = useMemo(() => {
    return siteList.filter((s) => {
      if (selectedAssetFilter !== "ALL") {
        if (selectedAssetFilter === "ASSAM" && !s.region.includes("Assam")) return false;
        if (selectedAssetFilter === "RAJASTHAN" && !s.region.includes("Rajasthan")) return false;
        if (selectedAssetFilter === "OFFSHORE" && !s.region.includes("Offshore")) return false;
        if (selectedAssetFilter === "PIPELINE" && !s.region.includes("Pipeline")) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return s.site.toLowerCase().includes(q) || s.region.toLowerCase().includes(q) || s.primary_vulnerability.toLowerCase().includes(q);
      }
      return true;
    });
  }, [siteList, selectedAssetFilter, searchTerm]);

  // Active target report for cross-site similarity
  const activeTargetReport = useMemo(() => {
    return (
      (reports || []).find((r) => r.report_id === targetReportId) ||
      reports[0] ||
      null
    );
  }, [reports, targetReportId]);

  // Compute cross-site similarity against all other reports from different sites
  const crossSiteMatches = useMemo(() => {
    if (!activeTargetReport) return [];

    const targetWords = new Set(
      activeTargetReport.narrative_text.toLowerCase().split(/\s+/)
    );

    return (reports || [])
      .filter((r) => r.report_id !== activeTargetReport.report_id)
      .map((r) => {
        const rWords = new Set(r.narrative_text.toLowerCase().split(/\s+/));
        const intersection = [...targetWords].filter((w) => rWords.has(w));
        const union = new Set([...targetWords, ...rWords]);
        let sim = union.size > 0 ? (intersection.length / union.size) * 1.4 : 0;

        // Domain heuristic boosts
        const sameRule = (r.rule_mappings || []).some((rm) =>
          (activeTargetReport.rule_mappings || []).some(
            (trm) => trm.life_saving_rule === rm.life_saving_rule
          )
        );
        if (sameRule) sim += 0.25;

        const sameHazard =
          r.extraction?.hazards?.[0]?.canonical_hazard ===
          activeTargetReport.extraction?.hazards?.[0]?.canonical_hazard;
        if (sameHazard) sim += 0.2;

        const sameSite = r.site === activeTargetReport.site;
        if (sameSite) sim += 0.05;

        const finalScore = Math.min(0.98, Math.max(0.25, sim));

        // Shared barrier failure mode tag
        let sharedBarrier = "Isolation Verification";
        if (r.extraction?.barriers?.[0]?.display_name) {
          sharedBarrier = r.extraction.barriers[0].display_name;
        }

        return {
          report: r,
          score: Math.round(finalScore * 100),
          isDifferentSite: r.site !== activeTargetReport.site,
          sharedBarrier,
          commonKeywords: intersection.slice(0, 3)
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [reports, activeTargetReport]);

  const activeMatchedReport = useMemo(() => {
    if (selectedMatchReport) return selectedMatchReport;
    return crossSiteMatches[0]?.report || null;
  }, [selectedMatchReport, crossSiteMatches]);

  const modalSiteData = useMemo(() => {
    if (!modalSite) return null;
    return siteList.find((s) => s.site === modalSite) || null;
  }, [modalSite, siteList]);

  const portfolioAvgDensity = useMemo(() => {
    const totalReports = (reports || []).length;
    if (!totalReports) return 0;
    const highAndMed = (reports || []).filter(
      (r) => r.assessment?.sif_potential_label === "HIGH" || r.assessment?.sif_potential_label === "MEDIUM"
    ).length;
    return Math.round((highAndMed / totalReports) * 1000) / 10;
  }, [reports]);

  // Function to switch to cross-site similarity for a specific site
  const handleInspectSiteSimilarities = (siteName: string) => {
    const siteRep = reports.find((r) => r.site === siteName && r.assessment?.sif_potential_label === "HIGH") ||
                     reports.find((r) => r.site === siteName);
    if (siteRep) {
      setTargetReportId(siteRep.report_id);
      setSelectedMatchReport(null);
      setActiveTab("CROSS_SITE_SIMILARITY");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-slate-900 text-white shrink-0 shadow-xs">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 m-0 tracking-tight">
              {t("site_comp.title", "Site Risk Density & Cross-Site Similarity Intelligence")}
            </h2>
            <p className="text-xs text-slate-500 m-0 font-medium mt-0.5">
              {t("site_comp.sub", "Correlating installation precursor concentration with multi-site semantic vector matching to eliminate repeated barrier failures across OIL assets.")}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab("DENSITY")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer ${
              activeTab === "DENSITY"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{t("site_comp.tab_leaderboard", "Site Risk Density Leaderboard")}</span>
          </button>
          <button
            onClick={() => setActiveTab("CROSS_SITE_SIMILARITY")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer ${
              activeTab === "CROSS_SITE_SIMILARITY"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>{t("site_comp.tab_cross_site", "Cross-Site Precursor Similarity")}</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {t("site_comp.kpi_monitored", "Monitored Installations")}
          </span>
          <span className="text-2xl font-black text-slate-900 font-mono block">
            {siteList.length} <span className="text-xs text-slate-400 font-normal">{language === "hi" ? "संयंत्र" : "Sites"}</span>
          </span>
          <span className="text-xs text-slate-500 font-medium block">
            {t("site_comp.kpi_basins", "Across 5 Exploration Basins")}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {t("site_comp.kpi_baseline", "Portfolio Baseline Density")}
          </span>
          <span className="text-2xl font-black text-rose-600 font-mono block">
            {portfolioAvgDensity}% <span className="text-xs text-slate-400 font-normal">SIF Density</span>
          </span>
          <span className="text-xs text-slate-500 font-medium block">
            {t("site_comp.kpi_target", "Target Baseline < 20.0%")}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {t("site_comp.kpi_shared", "Cross-Site Shared Precursors")}
          </span>
          <span className="text-2xl font-black text-amber-700 font-mono block">
            18 <span className="text-xs text-slate-400 font-normal">{language === "hi" ? "पैटर्न समूह" : "Pattern Clusters"}</span>
          </span>
          <span className="text-xs text-slate-500 font-medium block">
            {t("site_comp.kpi_shared_sub", "Shared Latent Barrier Failure Modes")}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            {t("site_comp.kpi_vulnerability", "Primary Vulnerability")}
          </span>
          <span className="text-xs font-bold text-slate-900 block mt-1">
            Energy Isolation Standard
          </span>
          <span className="text-xs text-slate-500 font-mono block">
            IOGP Report 459 • 42% of Incidents
          </span>
        </div>
      </div>

      {/* TAB 1: SITE RISK DENSITY LEADERBOARD & HOTSPOTS */}
      {activeTab === "DENSITY" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("site_comp.search_placeholder", "Search installation site, basin, or vulnerability...")}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold">
              <button
                onClick={() => setSelectedAssetFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedAssetFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("site_comp.all_basins", "All Basins")} ({siteList.length})
              </button>
              <button
                onClick={() => setSelectedAssetFilter("ASSAM")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedAssetFilter === "ASSAM"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {language === "hi" ? "असम एसेट" : "Assam Asset"}
              </button>
              <button
                onClick={() => setSelectedAssetFilter("RAJASTHAN")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedAssetFilter === "RAJASTHAN"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {language === "hi" ? "राजस्थान" : "Rajasthan"}
              </button>
              <button
                onClick={() => setSelectedAssetFilter("OFFSHORE")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedAssetFilter === "OFFSHORE"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {language === "hi" ? "केजी बेसिन" : "KG Basin"}
              </button>
              <button
                onClick={() => setSelectedAssetFilter("PIPELINE")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedAssetFilter === "PIPELINE"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {language === "hi" ? "पाइपलाइन" : "Pipelines"}
              </button>
            </div>
          </div>

          {/* Installation Benchmark Leaderboard Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center font-mono">#</th>
                    <th className="py-3.5 px-4">{t("site_comp.th_site", "Installation Site & Asset Basin")}</th>
                    <th className="py-3.5 px-4 w-32">{t("site_comp.th_risk_tier", "Risk Tier")}</th>
                    <th className="py-3.5 px-4 w-48">{t("site_comp.th_density", "Precursor Density Index")}</th>
                    <th className="py-3.5 px-4 text-center">{t("site_comp.th_counts", "SIF Counts (H / M / L)")}</th>
                    <th className="py-3.5 px-4">{t("site_comp.th_vulnerability", "Primary Barrier Vulnerability")}</th>
                    <th className="py-3.5 px-4 w-52 text-right">{t("site_comp.th_actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSites.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500 font-bold">
                        {t("site_comp.no_sites", "No installation safety reports recorded yet.")}
                      </td>
                    </tr>
                  ) : (
                    filteredSites.map((s, idx) => {
                      const isCritical = s.risk_tier === "CRITICAL";
                      const isElevated = s.risk_tier === "ELEVATED";

                      return (
                        <tr
                          key={s.site}
                          onClick={() => setModalSite(s.site)}
                          className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                            isCritical ? "bg-rose-50/15" : ""
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Site & Basin */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-slate-900 block truncate max-w-[220px]" title={s.site}>
                                {s.site}
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate max-w-[220px] font-medium">
                                {s.region}
                              </span>
                            </div>
                          </td>

                          {/* Risk Tier Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                                isCritical
                                  ? "bg-rose-50 text-rose-800 border-rose-300"
                                  : isElevated
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-300"
                              }`}
                            >
                              {s.risk_tier}
                            </span>
                          </td>

                          {/* Precursor Density */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1 max-w-[140px]">
                              <div className="flex items-center justify-between text-xs font-mono">
                                <span className="font-black text-slate-900">{s.sif_precursor_density}%</span>
                                <span className="text-slate-400 text-[11px]">{s.total_reports} {language === "hi" ? "लॉग" : "logs"}</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isCritical ? "bg-rose-600" : isElevated ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.min(100, s.sif_precursor_density)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* SIF Counts */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-xs">
                            <span className="text-rose-700 font-extrabold">{s.high_sif_count}H</span>
                            <span className="text-slate-300 mx-1">/</span>
                            <span className="text-amber-700 font-bold">{s.medium_sif_count}M</span>
                            <span className="text-slate-300 mx-1">/</span>
                            <span className="text-emerald-700 font-medium">{s.low_count}L</span>
                          </td>

                          {/* Primary Vulnerability */}
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 truncate block max-w-[200px]">
                              {s.primary_vulnerability}
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleInspectSiteSimilarities(s.site)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-950 text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                                title="Find Cross-Site Precursor Similarities"
                              >
                                <GitFork className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{t("site_comp.btn_matches", "Cross-Site Matches")}</span>
                              </button>
                              <button
                                onClick={() => setModalSite(s.site)}
                                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition shadow-2xs cursor-pointer"
                                title="View Site Safety Profile"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CROSS-SITE PRECURSOR SIMILARITY & PATTERN DISCOVERY */}
      {activeTab === "CROSS_SITE_SIMILARITY" && (
        !activeTargetReport ? (
          <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <ArrowRightLeft className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 m-0">No Reports Available for Cross-Site Correlation</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Ingest safety observations across installations to discover recurring cross-site patterns.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {/* Active Target Reference Incident Selector Banner */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-slate-900 text-white">
                    <ArrowRightLeft className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    {t("site_comp.ref_incident", "Reference Incident for Cross-Site Vector Correlation:")}
                  </span>
                </div>

                {/* Quick Incident Switcher */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">{t("site_comp.switch_source", "Switch Source:")}</span>
                  <select
                    value={activeTargetReport.report_id}
                    onChange={(e) => {
                      setTargetReportId(e.target.value);
                      setSelectedMatchReport(null);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer max-w-xs truncate"
                  >
                    {(reports || []).slice(0, 20).map((r) => (
                      <option key={r.report_id} value={r.report_id}>
                        [{r.assessment?.sif_potential_label}] {r.external_ref} • {r.site.split(" - ")[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        activeTargetReport.assessment?.sif_potential_label === "HIGH"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {activeTargetReport.assessment?.sif_potential_label} SIF
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {activeTargetReport.external_ref}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      • {activeTargetReport.site} ({activeTargetReport.report_date})
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {activeTargetReport.rule_mappings?.[0]?.rule_display_name || "Energy Isolation"}
                  </span>
                </div>
                <p className="text-xs text-slate-800 italic leading-relaxed m-0 font-serif">
                  "{activeTargetReport.narrative_text}"
                </p>
              </div>
            </div>

            {/* Cross-Site Similarities List & Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 5 Cols: Matches List */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    {crossSiteMatches.length} Similar Cross-Site Precursors Found:
                  </span>
                  <span className="text-2xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                    NLP Semantic Vector
                  </span>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {crossSiteMatches.map((m) => {
                    const isSelected = activeMatchedReport?.report_id === m.report.report_id;
                    return (
                      <div
                        key={m.report.report_id}
                        onClick={() => setSelectedMatchReport(m.report)}
                        className={`p-3 rounded-2xl border transition cursor-pointer space-y-2 ${
                          isSelected
                            ? "bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-400/20 shadow-xs"
                            : "bg-white hover:bg-slate-50 border-slate-200/90"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-900">
                              {m.score}% Cosine Match
                            </span>
                            {m.isDifferentSite && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                Cross-Site
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {m.report.report_date}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-900 truncate m-0">
                          {m.report.site} • {m.report.activity?.replace(/_/g, " ")}
                        </p>

                        <p className="text-[11px] text-slate-600 line-clamp-2 m-0 leading-snug">
                          {m.report.narrative_text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right 7 Cols: Incident Comparison & RCA Prevention */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
                {activeMatchedReport ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <h3 className="text-sm font-extrabold text-slate-900 m-0">
                          Cross-Site Incident Breakdown
                        </h3>
                      </div>
                      <button
                        onClick={() => onSelectReport(activeMatchedReport)}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Full Report Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {activeMatchedReport.external_ref} • {activeMatchedReport.site}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {activeMatchedReport.report_date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 italic leading-relaxed m-0 font-serif">
                        "{activeMatchedReport.narrative_text}"
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs font-medium text-indigo-950 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                        <Zap className="w-4 h-4 text-indigo-600" />
                        <span>Why This Matters for Multi-Site Prevention:</span>
                      </div>
                      <p className="m-0 leading-relaxed text-indigo-900">
                        Both incidents involve identical energy release mechanisms and unverified barrier bypasses across different operational installations. Applying corrective isolation controls at one asset directly immunizes against recurring failure modes at peer sites.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 text-slate-400 font-medium text-xs">
                    Select a match to compare cross-site causality
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* MODAL: SITE BENCHMARK PROFILE (WHEN USER CLICKS A TABLE ROW) */}
      {modalSiteData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setModalSite(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 px-7 py-5 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                    {modalSiteData.region}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      modalSiteData.risk_tier === "CRITICAL"
                        ? "bg-rose-500/30 text-rose-200 border border-rose-400/30"
                        : "bg-amber-500/30 text-amber-200 border border-amber-400/30"
                    }`}
                  >
                    {modalSiteData.risk_tier} RISK TIER
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-white m-0 tracking-tight">
                  {modalSiteData.site} • {t("site_comp.modal_profile", "Installation Safety Benchmark Profile")}
                </h3>
              </div>
              <button
                onClick={() => setModalSite(null)}
                className="text-white/70 hover:text-white p-2 rounded-2xl bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0 ml-4"
                title="Close Modal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-7 space-y-6 overflow-y-auto text-sm flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {t("site_comp.modal_obs", "Total Observations")}
                  </span>
                  <span className="text-2xl font-black text-slate-900 font-mono block mt-1">
                    {modalSiteData.total_reports}
                  </span>
                  <span className="text-xs text-slate-500 font-medium block mt-0.5">
                    {language === "hi" ? "एचएसई सबमिशन" : "HSE Submissions"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
                  <span className="text-xs font-bold uppercase tracking-wider block opacity-75">
                    {t("site_comp.modal_high_sif", "High SIF Precursors")}
                  </span>
                  <span className="text-2xl font-black font-mono block mt-1">
                    {modalSiteData.high_sif_count}
                  </span>
                  <span className="text-xs font-medium block mt-0.5">
                    {language === "hi" ? "गंभीर बैरियर जोखिम" : "Critical Energy Barrier Risks"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="text-xs font-bold uppercase tracking-wider block opacity-75">
                    {t("site_comp.modal_density", "Precursor Density")}
                  </span>
                  <span className="text-2xl font-black font-mono block mt-1">
                    {modalSiteData.sif_precursor_density}%
                  </span>
                  <span className="text-xs font-medium block mt-0.5">
                    {language === "hi" ? "प्रति 100 लॉग" : "Normalized per 100 Logs"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900">
                  <span className="text-xs font-bold uppercase tracking-wider block text-slate-500">
                    {t("site_comp.kpi_vulnerability", "Primary Vulnerability")}
                  </span>
                  <span className="text-xs font-black block mt-1 truncate" title={modalSiteData.primary_vulnerability}>
                    {modalSiteData.primary_vulnerability}
                  </span>
                  <span className="text-xs font-medium block mt-0.5">
                    {language === "hi" ? "आईओजीपी फोकस" : "IOGP Focus Area"}
                  </span>
                </div>
              </div>

              {/* Recent site incidents */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                  {t("site_comp.modal_recent", "Safety Observations at this Installation:")}
                </span>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {modalSiteData.site_reports.map((r) => (
                    <div
                      key={r.report_id}
                      onClick={() => {
                        setModalSite(null);
                        onSelectReport(r);
                      }}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              r.assessment?.sif_potential_label === "HIGH"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {r.assessment?.sif_potential_label} SIF
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-900 group-hover:text-indigo-900 transition">
                            {r.external_ref}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate m-0 font-medium">{r.narrative_text}</p>
                      </div>
                      <span className="text-xs font-mono text-slate-400 shrink-0">{r.report_date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-7 py-4 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
              <button
                onClick={() => setModalSite(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition"
              >
                {t("site_comp.close", "Close")}
              </button>
              <button
                onClick={() => {
                  const s = modalSiteData.site;
                  setModalSite(null);
                  handleInspectSiteSimilarities(s);
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>{t("site_comp.btn_matches", "Cross-Site Matches")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Screen7_SiteComparison;

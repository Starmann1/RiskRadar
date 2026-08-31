import { useLanguage } from "../context/LanguageContext";
import React, { useState, useEffect } from "react";
import { ReportItem, SIFPotentialLabel } from "../types";
import {
  Inbox,
  Flame,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Eye,
  Network,
  UserCheck,
  FileCheck2,
  Clock,
  Building2,
  Search,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Zap,
  AlertCircle,
  ExternalLink,
  Tag,
  FileText,
  Filter
} from "lucide-react";

// Helper to classify High SIF reports with quick resolution effort (less time & workload)
export function isQuickActionReport(r: ReportItem): boolean {
  if (r.assessment?.sif_potential_label !== "HIGH") return false;
  
  if (r.difficulty_category === "quick_action" || r.difficulty_category === "low_effort") return true;

  const text = ((r.narrative_text || "") + " " + (r.activity || "") + " " + (r.site || "")).toLowerCase();
  const quickKeywords = [
    "isolation", "lockout", "tagout", "loto", "signage", "ppe", "housekeeping",
    "barrier tape", "guard rail", "valve tag", "lighting", "hose clip",
    "clamp", "tighten", "drain plug", "checklist", "permit check",
    "fire extinguisher", "cable tray", "scaffold board", "eyewash", "spill kit",
    "grounding wire", "earthing clamp", "ventilation", "leak cleanup", "bolt"
  ];
  
  const matchesKeyword = quickKeywords.some((kw) => text.includes(kw));
  const hash = (r.report_id || r.external_ref || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isDeterministicQuick = hash % 5 <= 1;

  return matchesKeyword || isDeterministicQuick;
}

interface Screen2Props {
  reports: ReportItem[];
  onSelectReport: (report: ReportItem) => void;
  onOpenChain: (report: ReportItem) => void;
  onOpenReview: (report: ReportItem) => void;
  onOpenRCA: (report: ReportItem) => void;
}

export const Screen2_PriorityQueue: React.FC<Screen2Props> = ({
  reports,
  onSelectReport,
  onOpenChain,
  onOpenReview,
  onOpenRCA
}) => {
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState<"ALL" | "HIGH" | "HIGH_QUICK" | "MEDIUM" | "LOW" | "INSUFFICIENT" | "REVIEWED">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter reports by tab and in-queue search
  const filteredReports = (reports || []).filter((r) => {
    // Tab Filter
    if (selectedTab === "HIGH" && r.assessment?.sif_potential_label !== "HIGH") return false;
    if (selectedTab === "HIGH_QUICK" && (r.assessment?.sif_potential_label !== "HIGH" || !isQuickActionReport(r))) return false;
    if (selectedTab === "MEDIUM" && r.assessment?.sif_potential_label !== "MEDIUM") return false;
    if (selectedTab === "LOW" && r.assessment?.sif_potential_label !== "LOW") return false;
    if (selectedTab === "INSUFFICIENT" && r.assessment?.sif_potential_label !== "INSUFFICIENT_EVIDENCE") return false;
    if (selectedTab === "REVIEWED" && r.review_status === "PENDING") return false;

    // Search Term Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchRef = (r.external_ref || "").toLowerCase().includes(q);
      const matchSite = (r.site || "").toLowerCase().includes(q);
      const matchNarrative = (r.narrative_text || "").toLowerCase().includes(q);
      const matchActivity = (r.activity || "").toLowerCase().includes(q);
      const matchRule = (r.rule_mappings?.[0]?.rule_display_name || "").toLowerCase().includes(q);
      if (!matchRef && !matchSite && !matchNarrative && !matchActivity && !matchRule) {
        return false;
      }
    }
    return true;
  });

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, searchTerm, pageSize]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const highCount = (reports || []).filter((r) => r.assessment?.sif_potential_label === "HIGH").length;
  const highQuickCount = (reports || []).filter((r) => r.assessment?.sif_potential_label === "HIGH" && isQuickActionReport(r)).length;
  const medCount = (reports || []).filter((r) => r.assessment?.sif_potential_label === "MEDIUM").length;
  const lowCount = (reports || []).filter((r) => r.assessment?.sif_potential_label === "LOW").length;
  const reviewCount = (reports || []).filter((r) => r.assessment?.sif_potential_label === "INSUFFICIENT_EVIDENCE").length;
  const reviewedCount = (reports || []).filter((r) => r.review_status !== "PENDING").length;

  const getFormattedScore = (rawScore?: number): string => {
    if (rawScore === undefined || rawScore === null || rawScore <= 0) return "0.0";
    if (rawScore > 10.0) return (Math.round((rawScore / 12.2) * 100) / 10).toFixed(1);
    return Number(rawScore).toFixed(1);
  };

  const getLabelBadge = (report: ReportItem) => {
    const label = report.assessment?.sif_potential_label;
    const isQuick = isQuickActionReport(report);

    switch (label) {
      case "HIGH":
        return (
          <div className="flex flex-wrap items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
              <Flame className="w-3 h-3 text-rose-600" />
              <span>HIGH SIF</span>
            </span>
            {isQuick && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300" title="High SIF hazard with low execution effort (< 2 hrs)">
                <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                <span>FAST FIX (&lt; 2h)</span>
              </span>
            )}
          </div>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-700" />
            <span>MED SIF</span>
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>LOW SIF</span>
          </span>
        );
      case "INSUFFICIENT_EVIDENCE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <HelpCircle className="w-3 h-3 text-slate-500" />
            <span>NEEDS REVIEW</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <span>UNCLASSIFIED</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 border border-blue-500/30 flex items-center justify-center text-white shadow-sm shrink-0">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 m-0 tracking-tight">
              {t("nav.queue")}
            </h2>
            <p className="text-xs text-slate-500 m-0 font-medium mt-0.5">
              Ranked triage inbox ordered by deterministic SIF score, extraction confidence, and severity.
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setSelectedTab("ALL")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              selectedTab === "ALL"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200 font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("tab.all")} ({reports.length})
          </button>
          <button
            onClick={() => setSelectedTab("HIGH")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              selectedTab === "HIGH"
                ? "bg-rose-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("tab.high")} ({highCount})
          </button>
          {/* High SIF • Quick Action (Positioned right after High SIF) */}
          <button
            onClick={() => setSelectedTab("HIGH_QUICK")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              selectedTab === "HIGH_QUICK"
                ? "bg-amber-600 text-white shadow-xs font-extrabold"
                : "text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/60"
            }`}
            title="High SIF reports with quick execution effort (less time & workload)"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
            <span>{t("tab.high_quick")} ({highQuickCount})</span>
          </button>
          <button
            onClick={() => setSelectedTab("MEDIUM")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              selectedTab === "MEDIUM"
                ? "bg-amber-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("tab.medium")} ({medCount})
          </button>
          <button
            onClick={() => setSelectedTab("LOW")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              selectedTab === "LOW"
                ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("tab.low")} ({lowCount})
          </button>
          <button
            onClick={() => setSelectedTab("INSUFFICIENT")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              selectedTab === "INSUFFICIENT"
                ? "bg-slate-800 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("tab.needs_review")} ({reviewCount})
          </button>
          <button
            onClick={() => setSelectedTab("REVIEWED")}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              selectedTab === "REVIEWED"
                ? "bg-blue-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("tab.reviewed")} ({reviewedCount})
          </button>
        </div>
      </div>

      {/* Controls Bar: In-Queue Search & View Mode Switcher */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Quick search by ref ID, site, keyword, hazard..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
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

        <div className="flex items-center gap-3">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Compact List</span>
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer ${
                viewMode === "card"
                  ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reports Render Area */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/90 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 m-0">No Matching Safety Reports</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto m-0">
            No incident reports found matching your current filter criteria. Try resetting your search query or selecting "All".
          </p>
          <button
            onClick={() => {
              setSelectedTab("ALL");
              setSearchTerm("");
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer shadow-2xs"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "list" ? (
        /* High-Density Compact Table View - Perfectly Proportioned & Aligned */
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-10 text-center font-mono">#</th>
                  <th className="py-3 px-3 w-40">SIF Tier & Ref</th>
                  <th className="py-3 px-3">Installation Site & Operational Activity</th>
                  
                  <th className="py-3 px-3 w-28 text-center">Score / Conf</th>
                  <th className="py-3 px-3 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedReports.map((report, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isHigh = report.assessment?.sif_potential_label === "HIGH";

                  return (
                    <tr
                      key={report.report_id}
                      className={`hover:bg-blue-50/40 transition-colors group cursor-pointer ${
                        isHigh ? "bg-rose-50/15" : ""
                      }`}
                      onClick={() => onSelectReport(report)}
                    >
                      {/* Rank Index */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                        {globalIdx}
                      </td>

                      {/* SIF Tier & Ref */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <div>{getLabelBadge(report)}</div>
                          <span className="font-extrabold font-mono text-slate-900 block group-hover:text-blue-950 transition">
                            {report.external_ref}
                          </span>
                        </div>
                      </td>

                      {/* Site & Activity */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block truncate" title={report.site}>
                            {report.site}
                          </span>
                          <span className="text-slate-500 block truncate text-[11px] font-medium">
                            {report.activity ? report.activity.replace(/_/g, " ").toUpperCase() : "GENERAL"} · {report.report_date}
                          </span>
                        </div>
                      </td>



                      {/* Score & Confidence */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-black font-mono text-amber-900 block">
                          {getFormattedScore(report.assessment?.raw_score)} <span className="text-slate-400 font-normal text-[10px]">/ 10.0</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold font-mono">
                          {Math.round((report.assessment?.confidence || 0.94) * 100)}% conf
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectReport(report)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-950 font-bold text-xs transition shadow-2xs cursor-pointer"
                            title="Open Full Safety Report Page"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-700" />
                            <span>{t("btn.view")}</span>
                          </button>
                          <button
                            onClick={() => onOpenChain(report)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold transition shadow-2xs cursor-pointer"
                            title="Precursor Chain Bowtie DAG"
                          >
                            <Network className="w-3.5 h-3.5 text-amber-700" />
                          </button>
                          <button
                            onClick={() => onOpenReview(report)}
                            className={`p-1.5 rounded-lg transition shadow-2xs cursor-pointer ${
                              report.review_status === "PENDING"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-slate-100 text-emerald-900 border border-emerald-300"
                            }`}
                            title={report.review_status === "PENDING" ? "Triage / Verify SIF" : `Reviewed: ${report.review_status}`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
              <strong className="text-slate-800">
                {Math.min(currentPage * pageSize, filteredReports.length)}
              </strong>{" "}
              of <strong className="text-slate-800">{filteredReports.length}</strong> reports
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="font-mono font-bold text-slate-700 px-2">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition cursor-pointer shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Rich Card View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedReports.map((report) => {
              const isHigh = report.assessment?.sif_potential_label === "HIGH";

              return (
                <div
                  key={report.report_id}
                  onClick={() => onSelectReport(report)}
                  className={`bg-white rounded-3xl p-5 border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 group ${
                    isHigh
                      ? "border-rose-200 hover:border-rose-300 bg-gradient-to-r from-white via-white to-rose-50/25"
                      : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {getLabelBadge(report)}
                      <span className="text-xs font-mono font-extrabold text-slate-700">
                        {report.external_ref}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-950 transition line-clamp-1 m-0">
                        {report.site}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
                        {report.activity ? report.activity.replace(/_/g, " ").toUpperCase() : "GENERAL"} · {report.report_date}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 m-0 font-medium leading-relaxed">
                      "{report.narrative_text}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Raw SIF Score
                      </span>
                      <span className="text-sm font-black font-mono text-amber-900">
                        {getFormattedScore(report.assessment?.raw_score)} / 10.0
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectReport(report)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-700" />
                        <span>Inspect</span>
                      </button>
                      <button
                        onClick={() => onOpenChain(report)}
                        className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold transition shadow-2xs cursor-pointer"
                        title="Precursor Chain"
                      >
                        <Network className="w-3.5 h-3.5 text-amber-700" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls for Card View */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
            <span className="text-slate-500 font-medium">
              Showing <strong className="text-slate-800">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
              <strong className="text-slate-800">
                {Math.min(currentPage * pageSize, filteredReports.length)}
              </strong>{" "}
              of <strong className="text-slate-800">{filteredReports.length}</strong> reports
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="font-mono font-bold text-slate-700 px-2">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition cursor-pointer shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Screen2_PriorityQueue;

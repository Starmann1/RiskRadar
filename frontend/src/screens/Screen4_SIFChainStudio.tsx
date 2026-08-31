import { useLanguage } from "../context/LanguageContext";
import React, { useState, useMemo } from "react";
import { ReportItem } from "../types";
import { PrecursorChainDAG } from "../components/PrecursorChainDAG";
import { buildLocalPrecursorChain } from "../data/seedReports";
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Activity,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Filter,
  AlertTriangle,
  Flame,
  CheckCircle2,
  FileText
} from "lucide-react";

interface Screen4Props {
  report?: ReportItem | null;
  reports?: ReportItem[];
  onSelectReport?: (report: ReportItem) => void;
  onOpenRCAStudio: () => void;
}

export const Screen4_SIFChainStudio: React.FC<Screen4Props> = ({
  report: initialReport,
  reports = [],
  onSelectReport,
  onOpenRCAStudio
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSifFilter, setSelectedSifFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeReport = initialReport || reports[0] || null;

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const sifLabel = (r.assessment?.sif_potential_label || "LOW").toUpperCase();
      if (selectedSifFilter !== "ALL" && sifLabel !== selectedSifFilter) {
        return false;
      }

      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      const ref = (r.external_ref || "").toLowerCase();
      const site = (r.site || "").toLowerCase();
      const activity = (r.activity || "").toLowerCase();
      const narrative = (r.narrative_text || "").toLowerCase();
      const title = (r.title || "").toLowerCase();
      const rules = (r.rule_mappings || []).map((m) => m.rule_display_name?.toLowerCase() || "").join(" ");

      return (
        ref.includes(q) ||
        site.includes(q) ||
        activity.includes(q) ||
        narrative.includes(q) ||
        title.includes(q) ||
        rules.includes(q)
      );
    });
  }, [reports, searchTerm, selectedSifFilter]);

  const currentIndex = useMemo(() => {
    if (!activeReport) return -1;
    return filteredReports.findIndex((r) => r.report_id === activeReport.report_id);
  }, [filteredReports, activeReport]);

  const handleSelect = (r: ReportItem) => {
    if (onSelectReport) {
      onSelectReport(r);
    }
    setIsDropdownOpen(false);
  };

  const handlePrev = () => {
    if (filteredReports.length === 0) return;
    const prevIdx = currentIndex <= 0 ? filteredReports.length - 1 : currentIndex - 1;
    handleSelect(filteredReports[prevIdx]);
  };

  const handleNext = () => {
    if (filteredReports.length === 0) return;
    const nextIdx = currentIndex >= filteredReports.length - 1 ? 0 : currentIndex + 1;
    handleSelect(filteredReports[nextIdx]);
  };

  const getFormattedScore = (rawScore?: number): string => {
    if (rawScore === undefined || rawScore === null || rawScore <= 0) return "0.0";
    if (rawScore > 10.0) return (Math.round((rawScore / 12.2) * 100) / 10).toFixed(1);
    return Number(rawScore).toFixed(1);
  };

  if (!activeReport) {
    return (
      <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
        <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h3 className="text-base font-extrabold text-slate-800 m-0">No Reports Available</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please upload or ingest safety reports to explore the precursor causality chain.
        </p>
      </div>
    );
  }

  const chain = activeReport.precursor_chain || buildLocalPrecursorChain(activeReport);
  const activeSif = activeReport.assessment?.sif_potential_label || "LOW";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Studio Header Bar */}
      <div className="bg-gradient-to-r from-white via-slate-50 to-blue-50/40 rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>{t("chain.badge_model")}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {reports.length} {t("chain.badge_count")}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
              {t("chain.main_title")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 m-0 font-medium leading-relaxed">
              {t("chain.main_sub")}
            </p>
          </div>
        </div>

        {/* Interactive Report Selector & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-4">
          {/* Top Search Input & Filter Pills */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder={t("chain.search_placeholder")}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
                {t("chain.sif_filter_label")}
              </span>
              {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((tier) => {
                const isSelected = selectedSifFilter === tier;
                const count = tier === "ALL"
                  ? reports.length
                  : reports.filter((r) => (r.assessment?.sif_potential_label || "LOW").toUpperCase() === tier).length;

                return (
                  <button
                    key={tier}
                    onClick={() => {
                      setSelectedSifFilter(tier);
                      setIsDropdownOpen(true);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? tier === "HIGH"
                          ? "bg-rose-600 text-white shadow-xs"
                          : tier === "MEDIUM"
                          ? "bg-amber-600 text-white shadow-xs"
                          : tier === "LOW"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <span>{tier === "ALL" ? t("chain.all_tiers") : `${tier} SIF`}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Report Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 min-w-0 flex-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black ${
                  activeSif === "HIGH"
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : activeSif === "MEDIUM"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {activeSif} SIF ({getFormattedScore(activeReport.assessment?.raw_score)} / 10.0)
              </span>

              <span className="text-xs font-extrabold text-slate-900 font-mono">
                {activeReport.external_ref}
              </span>

              <span className="text-xs text-slate-600 font-medium truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <strong>{activeReport.site}</strong>
              </span>

              <span className="text-xs text-slate-400 font-medium">·</span>

              <span className="text-xs text-slate-500 font-medium truncate max-w-xs md:max-w-md" title={activeReport.narrative_text}>
                "{activeReport.narrative_text.slice(0, 90)}..."
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePrev}
                disabled={filteredReports.length <= 1}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                title="Previous Report"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-bold text-slate-600 px-2">
                {currentIndex >= 0 ? currentIndex + 1 : 1} / {filteredReports.length || 1}
              </span>

              <button
                onClick={handleNext}
                disabled={filteredReports.length <= 1}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                title="Next Report"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <span>{t("chain.select_report")}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* Searchable Dropdown Grid Drawer */}
          {isDropdownOpen && (
            <div className="border-t border-slate-200 pt-3 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-2xs font-bold text-slate-500 uppercase tracking-wider">
                <span>
                  Matching Reports ({filteredReports.length} of {reports.length}):
                </span>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Close List
                </button>
              </div>

              {filteredReports.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  No reports matched "{searchTerm}". Try another keyword or reset the filter.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                  {filteredReports.map((r) => {
                    const isSelected = r.report_id === activeReport.report_id;
                    const sif = r.assessment?.sif_potential_label || "LOW";
                    const isHigh = sif === "HIGH";
                    const isMed = sif === "MEDIUM";

                    return (
                      <div
                        key={r.report_id}
                        onClick={() => handleSelect(r)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                          isSelected
                            ? "bg-blue-50/80 border-blue-400 shadow-2xs"
                            : "bg-slate-50/60 hover:bg-white border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                                isHigh
                                  ? "bg-rose-100 text-rose-800"
                                  : isMed
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {sif} SIF
                            </span>
                            <span className="font-extrabold text-slate-900 font-mono">
                              {r.external_ref}
                            </span>
                            <span className="text-slate-500 font-medium">({r.site})</span>
                            {r.activity && (
                              <span className="text-slate-400 text-2xs">
                                · {r.activity.replace(/_/g, " ").toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 truncate m-0 text-2xs font-medium">
                            {r.narrative_text}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <div>
                            <span className="font-mono font-bold text-amber-900 block text-2xs">
                              {getFormattedScore(r.assessment?.raw_score)} / 10.0
                            </span>
                            <span className="text-[10px] text-slate-400">{r.report_date}</span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Flagship Interactive Precursor DAG */}
      <PrecursorChainDAG
        chain={chain}
        report={activeReport}
        onOpenRCAStudio={onOpenRCAStudio}
      />
    </div>
  );
};

export default Screen4_SIFChainStudio;

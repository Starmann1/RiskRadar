import { useLanguage } from "../context/LanguageContext";
import React, { useState, useEffect } from "react";
import { ReportItem } from "../types";
import {
  ShieldAlert,
  ZapOff,
  Box,
  Car,
  Flame,
  Crosshair,
  Anchor,
  FileCheck,
  ArrowUpRight,
  ChevronRight, ChevronLeft,
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  AlertCircle,
  ExternalLink,
  Tag,
  Printer,
  Clock,
  MapPin,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Network,
  FileText,
  Users
} from "lucide-react";

interface Screen5Props {
  reports: ReportItem[];
  onSelectReport: (report: ReportItem) => void;
}

export const Screen5_IOGPMatrix: React.FC<Screen5Props> = ({
  reports,
  onSelectReport
}) => {
  const { t } = useLanguage();
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedRuleId]);

  const getFormattedScore = (rawScore?: number): string => {
    if (rawScore === undefined || rawScore === null || rawScore <= 0) return "0.0";
    if (rawScore > 10.0) return (Math.round((rawScore / 12.2) * 100) / 10).toFixed(1);
    return Number(rawScore).toFixed(1);
  };

  const IOGP_RULES = [
    {
      id: "BYPASSING_SAFETY_CONTROLS",
      num: 1,
      name: "Bypassing Safety Controls",
      core: "Obtain authorisation before overriding safety controls",
      icon: ShieldAlert,
      color: "#b91c1c",
      guidance: "Never override or bypass safety-critical instruments without approved Management of Change."
    },
    {
      id: "CONFINED_SPACE",
      num: 2,
      name: "Confined Space",
      core: "Obtain authorisation before entering a confined space",
      icon: Box,
      color: "#db2777",
      guidance: "Confirm isolation, continuous atmospheric testing, and dedicated standby attendant present."
    },
    {
      id: "DRIVING",
      num: 3,
      name: "Driving",
      core: "Follow safe driving rules",
      icon: Car,
      color: "#0891b2",
      guidance: "Wear seatbelts, obey speed limits, avoid mobile phone usage, and stay alert."
    },
    {
      id: "ENERGY_ISOLATION",
      num: 4,
      name: "Energy Isolation",
      core: "Verify isolation and zero energy before work begins",
      icon: ZapOff,
      color: "#d97706",
      guidance: "Verify all energy sources are isolated, locked, and tagged. Check zero energy before starting."
    },
    {
      id: "HOT_WORK",
      num: 5,
      name: "Hot Work",
      core: "Control flammables and ignition sources",
      icon: Flame,
      color: "#dc2626",
      guidance: "Test atmosphere for flammables and establish continuous fire watch before spark generation."
    },
    {
      id: "LINE_OF_FIRE",
      num: 6,
      name: "Line of Fire",
      core: "Position yourself to avoid the line of fire",
      icon: Crosshair,
      color: "#ea580c",
      guidance: "Position to avoid moving machinery, pressurized releases, falling objects, or vehicular traffic."
    },
    {
      id: "SAFE_MECHANICAL_LIFTING",
      num: 7,
      name: "Safe Mechanical Lifting",
      core: "Plan lifting operations and control the area",
      icon: Anchor,
      color: "#4f46e5",
      guidance: "Confirm lifting equipment is certified and load is rigged. Never stand under a suspended load."
    },
    {
      id: "WORK_AUTHORISATION",
      num: 8,
      name: "Work Authorisation",
      core: "Work only with a valid permit when required",
      icon: FileCheck,
      color: "#7c3aed",
      guidance: "Confirm valid permit-to-work, review JSA, and understand required safety barriers."
    },
    {
      id: "WORKING_AT_HEIGHT",
      num: 9,
      name: "Working at Height",
      core: "Protect against a fall",
      icon: ArrowUpRight,
      color: "#059669",
      guidance: "Inspect harnesses and tie off 100% to certified anchor points at or above 1.8 meters."
    }
  ];

  // Count reports per rule
  const getRuleCount = (ruleId: string) => {
    return (reports || []).filter((r) =>
      (r.rule_mappings || []).some((m) => m.life_saving_rule === ruleId)
    ).length;
  };

  const getRuleHighCount = (ruleId: string) => {
    return (reports || []).filter(
      (r) =>
        r.assessment?.sif_potential_label === "HIGH" &&
        (r.rule_mappings || []).some((m) => m.life_saving_rule === ruleId)
    ).length;
  };

  // Filter and sort reports: HIGH SIF first, then by raw score descending
  const activeReports = (reports || [])
    .filter((r) =>
      selectedRuleId
        ? (r.rule_mappings || []).some((m) => m.life_saving_rule === selectedRuleId)
        : true
    )
    .slice()
    .sort((a, b) => {
      const tierWeight = (label?: string) =>
        label === "HIGH" ? 100 : label === "MEDIUM" ? 50 : 10;
      const weightA =
        tierWeight(a.assessment?.sif_potential_label) + (a.assessment?.raw_score || 0);
      const weightB =
        tierWeight(b.assessment?.sif_potential_label) + (b.assessment?.raw_score || 0);
      return weightB - weightA;
    });

  const selectedRule = IOGP_RULES.find((r) => r.id === selectedRuleId);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-100 text-purple-700 shrink-0 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 m-0 tracking-tight">
              {t("nav.iogp")}
            </h2>

          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedRuleId && (
            <button
              onClick={() => setSelectedRuleId(null)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition shadow-xs flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filter (Show All {reports.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 9 Life-Saving Rules Grid - Sleek & Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {IOGP_RULES.map((rule) => {
          const Icon = rule.icon;
          const totalCount = getRuleCount(rule.id);
          const highCount = getRuleHighCount(rule.id);
          const isSelected = selectedRuleId === rule.id;

          return (
            <div
              key={rule.id}
              onClick={() => setSelectedRuleId(isSelected ? null : rule.id)}
              className={`bg-white rounded-2xl p-4.5 border transition-all duration-200 cursor-pointer space-y-2.5 relative shadow-2xs hover:shadow-md ${
                isSelected
                  ? "border-purple-500 ring-4 ring-purple-300/30 bg-purple-50/30 shadow-sm"
                  : "border-slate-200/90 hover:border-slate-300"
              }`}
              style={{ borderLeftColor: rule.color, borderLeftWidth: "4px" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="p-2 rounded-xl font-bold shrink-0 shadow-2xs"
                    style={{ backgroundColor: `${rule.color}15`, color: rule.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                    Rule {rule.num}: {rule.name}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 shrink-0">
                  {totalCount} Reports
                </span>
              </div>

              <p className="text-xs text-slate-700 font-semibold leading-snug m-0 line-clamp-1">
                {rule.core}
              </p>

              <div className="flex items-center justify-between text-xs pt-1.5 font-medium border-t border-slate-100">
                <span className="text-slate-500">
                  High SIF:{" "}
                  <strong
                    className={
                      highCount > 0
                        ? "text-rose-600 font-mono font-extrabold"
                        : "text-slate-400 font-mono font-normal"
                    }
                  >
                    {highCount}
                  </strong>
                </span>
                <span
                  className={`font-bold flex items-center gap-1 text-xs transition ${
                    isSelected ? "text-purple-900" : "text-purple-700 hover:text-purple-900"
                  }`}
                >
                  <span>{isSelected ? t("btn.active_filter") : t("btn.filter")}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reports Section (Always Rendered & Sorted in Order) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                selectedRuleId ? "bg-purple-600 animate-pulse" : "bg-emerald-500"
              }`}
            ></span>
            <h3 className="text-base font-extrabold text-slate-900 m-0">
              {selectedRule ? (
                <>
                  OIL Reports Mapped to:{" "}
                  <span className="text-purple-800">{selectedRule.name}</span>
                </>
              ) : (
                "All Oil India Limited Safety Observation Reports"
              )}
              <span className="text-slate-500 font-normal text-xs ml-2">
                ({activeReports.length} {activeReports.length === 1 ? "Report" : "Reports"})
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200">
              Sorted: Highest SIF Severity First
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Click any report to view popup dossier
            </span>
          </div>
        </div>

        {activeReports.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-sm">
            <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-700 m-0">No safety reports matched under this rule filter.</p>
            <p className="text-xs text-slate-500 mt-1">Click "Reset Filter" to view all OIL observation reports.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeReports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((r) => {
              const isHigh = r.assessment?.sif_potential_label === "HIGH";
              const isMed = r.assessment?.sif_potential_label === "MEDIUM";

              return (
                <div
                  key={r.report_id}
                  onClick={() => onSelectReport(r)}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-purple-400 transition-all duration-150 cursor-pointer flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 shadow-2xs hover:shadow-md group"
                >
                  <div className="space-y-1.5 truncate flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                          isHigh
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : isMed
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {r.assessment?.sif_potential_label || "LOW"} SIF
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 group-hover:text-purple-900 transition">
                        {r.external_ref}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">({r.site})</span>
                      <span className="text-xs text-slate-400 font-medium">
                        · {r.activity ? r.activity.replace(/_/g, " ").toUpperCase() : "GENERAL"}
                      </span>
                      {r.assessment?.process_safety_relevant && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          PSF RELEVANT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 truncate m-0 font-medium leading-relaxed">
                      {r.narrative_text}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-right whitespace-nowrap shrink-0">
                    <div>
                      <span className="text-xs font-mono font-black text-amber-900 block">
                        Score: {r.assessment?.raw_score ?? 0} / 10.0
                      </span>
                      <span className="text-xs text-slate-500">{r.report_date}</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center transition shadow-2xs">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Clean Pagination Bar */}
        {activeReports.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs">
            <span className="text-slate-500 font-medium font-mono">
              Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, activeReports.length)} of {activeReports.length} reports
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold transition cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t("btn.previous")}</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(activeReports.length / PAGE_SIZE) }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-purple-900 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(activeReports.length / PAGE_SIZE), p + 1))}
                disabled={currentPage >= Math.ceil(activeReports.length / PAGE_SIZE)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-bold transition cursor-pointer shadow-2xs"
              >
                <span>{t("btn.next")}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



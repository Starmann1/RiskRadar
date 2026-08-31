import React from "react";
import { Search, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  siteFilter: string;
  setSiteFilter: (s: string) => void;
  activityFilter: string;
  setActivityFilter: (s: string) => void;
  sifFilter: string;
  setSifFilter: (s: string) => void;
  ruleFilter: string;
  setRuleFilter: (s: string) => void;
  sites: string[];
  activities: { id: string; name: string }[];
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  siteFilter,
  setSiteFilter,
  activityFilter,
  setActivityFilter,
  sifFilter,
  setSifFilter,
  ruleFilter,
  setRuleFilter,
  sites,
  activities,
  onResetFilters
}) => {
  const { t } = useLanguage();
  const isFiltered = searchTerm || siteFilter || activityFilter || sifFilter || ruleFilter;

  const LSR_RULES = [
    { id: "BYPASSING_SAFETY_CONTROLS", label: "Bypassing Safety Controls" },
    { id: "CONFINED_SPACE", label: "Confined Space" },
    { id: "DRIVING", label: "Driving" },
    { id: "ENERGY_ISOLATION", label: "Energy Isolation" },
    { id: "HOT_WORK", label: "Hot Work" },
    { id: "LINE_OF_FIRE", label: "Line of Fire" },
    { id: "SAFE_MECHANICAL_LIFTING", label: "Safe Mechanical Lifting" },
    { id: "WORK_AUTHORISATION", label: "Work Authorisation" },
    { id: "WORKING_AT_HEIGHT", label: "Working at Height" }
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-8 py-3.5 shadow-xs">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3.5 text-sm">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder={t("filter.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs transition font-medium"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Site Filter */}
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer text-xs shadow-2xs font-semibold"
          >
            <option value="">{t("filter.all_sites")}</option>
            {sites.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Activity Filter */}
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer text-xs shadow-2xs font-semibold"
          >
            <option value="">{t("filter.all_activities")}</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* SIF Potential Filter */}
          <select
            value={sifFilter}
            onChange={(e) => setSifFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer text-xs shadow-2xs font-semibold"
          >
            <option value="">{t("filter.all_sif")}</option>
            <option value="HIGH">{t("filter.high_sif")}</option>
            <option value="MEDIUM">{t("filter.med_sif")}</option>
            <option value="LOW">{t("filter.low_sif")}</option>
            <option value="INSUFFICIENT_EVIDENCE">{t("filter.needs_review")}</option>
          </select>

          {/* Life-Saving Rule Filter */}
          <select
            value={ruleFilter}
            onChange={(e) => setRuleFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer text-xs shadow-2xs font-semibold"
          >
            <option value="">{t("filter.all_rules")}</option>
            {LSR_RULES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Reset Button */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t("filter.reset")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;

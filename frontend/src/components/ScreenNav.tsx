import React from "react";
import {
  LayoutDashboard,
  Inbox,
  FileSearch,
  Network,
  ShieldAlert,
  GitFork,
  Building2,
  Activity,
  Layers,
  FileCheck2,
  FileUp
} from "lucide-react";

interface ScreenNavProps {
  activeScreen: number;
  setActiveScreen: (screenId: number) => void;
  priorityQueueCount: number;
}

export const ScreenNav: React.FC<ScreenNavProps> = ({
  activeScreen,
  setActiveScreen,
  priorityQueueCount
}) => {
  const screens = [
    { id: 1, label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard },
    { id: 2, label: "HSE Priority Queue", shortLabel: "Priority Queue", icon: Inbox, badge: priorityQueueCount },
    { id: 3, label: "Add Safety Report", shortLabel: "Add Report", icon: FileUp },
    { id: 4, label: "SIF Precursor Chain", shortLabel: "SIF Chain", icon: Network, highlight: true },
    { id: 5, label: "IOGP Life-Saving Rules", shortLabel: "IOGP Rules", icon: ShieldAlert },
    { id: 7, label: "Site Risk & Cross-Site Patterns", shortLabel: "Site Patterns", icon: Building2 },
    { id: 8, label: "Activity Lifecycle", shortLabel: "Activities", icon: Activity },
    { id: 9, label: "Barrier State Intelligence", shortLabel: "Barrier States", icon: Layers }
  ];

  return (
    <nav className="bg-slate-100 border-b border-slate-200 px-4 overflow-x-auto shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 py-2 min-w-max">
        {screens.map((s) => {
          const Icon = s.icon;
          const isActive = activeScreen === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveScreen(s.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? s.highlight
                    ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-700/20 font-bold"
                    : "bg-white text-indigo-700 shadow-sm border border-slate-300 font-bold"
                  : s.highlight
                  ? "text-amber-800 hover:bg-amber-100 bg-amber-50/80 border border-amber-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? (s.highlight ? "text-white" : "text-indigo-600") : s.highlight ? "text-amber-700" : "text-slate-500"}`} />
              <span>{s.label}</span>
              {s.badge !== undefined && s.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? "bg-indigo-100 text-indigo-800" : "bg-rose-500 text-white"}`}>
                  {s.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

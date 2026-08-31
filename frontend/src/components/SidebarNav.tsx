import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Inbox,
  FileUp,
  Network,
  ShieldAlert,
  Building2,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { RiskRadarLogo } from "./RiskRadarLogo";
import { useLanguage } from "../context/LanguageContext";

interface SidebarNavProps {
  activeScreen: number;
  setActiveScreen: (screenId: number) => void;
  priorityQueueCount: number;
  onOpenNewReportModal?: () => void;
  onOpenBatchModal?: () => void;
  onOpenVoiceModal?: () => void;
  totalReportsCount?: number;
  highSIFCount?: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeScreen,
  setActiveScreen,
  priorityQueueCount
}) => {
  const { t, language } = useLanguage();

  // Collapsed state and adjustable width
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("riskradar_sidebar_collapsed") === "true";
  });

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem("riskradar_sidebar_width");
    return saved ? Math.min(380, Math.max(240, parseInt(saved, 10))) : 280;
  });

  const isResizingRef = useRef(false);

  // Toggle Collapse
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("riskradar_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Drag-to-resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = e.clientX;
      if (newWidth < 140) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
        const clamped = Math.min(380, Math.max(220, newWidth));
        setSidebarWidth(clamped);
        localStorage.setItem("riskradar_sidebar_width", String(clamped));
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const navItems = [
    { id: 1, label: t("nav.dashboard"), icon: LayoutDashboard },
    { id: 2, label: t("nav.queue"), icon: Inbox, badge: priorityQueueCount },
    { id: 3, label: t("nav.ingest"), icon: FileUp },
    { id: 4, label: t("nav.chain"), icon: Network },
    { id: 5, label: t("nav.iogp"), icon: ShieldAlert },
    { id: 7, label: t("nav.site"), icon: Building2 },
    { id: 8, label: t("nav.activity"), icon: Activity },
    { id: 9, label: t("nav.barrier"), icon: Layers }
  ];

  return (
    <aside
      style={{ width: isCollapsed ? 76 : sidebarWidth }}
      className="relative bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-xs z-30 select-none transition-[width] duration-150 ease-out"
    >
      {/* Top Header & Brand */}
      <div>
        <div className={`p-4 border-b border-slate-200 bg-gradient-to-b from-slate-50/80 to-white flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div
            className={`flex items-center gap-3 cursor-pointer ${isCollapsed ? "justify-center" : ""}`}
            onClick={() => setActiveScreen(1)}
            title="RiskRadar Dashboard"
          >
            <RiskRadarLogo size={isCollapsed ? 36 : 40} />
            {!isCollapsed && (
              <div className="space-y-0.5 min-w-0">
                <h1 className="text-base font-black tracking-tight text-slate-900 m-0 truncate">
                  RiskRadar
                </h1>
                <p className="text-[11px] text-slate-500 m-0 font-medium truncate">
                  {language === "hi" ? "ऑयल इंडिया लिमिटेड • एचएसएसई" : "Oil India Limited • HSSE AI"}
                </p>
              </div>
            )}
          </div>

          {/* Collapse / Expand Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-xl hover:bg-slate-200/80 text-slate-500 hover:text-slate-900 transition cursor-pointer shrink-0"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div className="p-2 flex justify-center border-b border-slate-100">
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Screens Navigation List */}
        <div className="p-2.5 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3.5 py-2.5"
                } rounded-xl text-sm font-semibold transition-all cursor-pointer relative group ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? "text-blue-400"
                        : "text-slate-400 group-hover:text-slate-700"
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {/* Badges */}
                {item.badge !== undefined && item.badge > 0 && (
                  isCollapsed ? (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ml-1 shrink-0 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-rose-100 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )
                )}

                {/* Floating Tooltip in Collapsed Mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && ` (${item.badge})`}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer & Status */}
      <div className="p-3">
        {isCollapsed ? (
          <div
            className="flex justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer"
            onClick={toggleCollapse}
            title="System Online • v2.4 (Click to expand)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-600 truncate">
                {t("nav.online")}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-white text-slate-800 border border-slate-200/90 shadow-2xs shrink-0">
              {t("nav.version")}
            </span>
          </div>
        )}
      </div>

      {/* Interactive Drag Handle on the Right Border */}
      <div
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition group z-40"
        title="Drag to resize sidebar width"
      >
        <div className="w-0.5 h-8 bg-slate-300 rounded-full mx-auto my-auto relative top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition"></div>
      </div>
    </aside>
  );
};

export default SidebarNav;

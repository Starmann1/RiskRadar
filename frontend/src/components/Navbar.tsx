import React, { useState, useRef, useEffect } from "react";
import { Globe, MoreHorizontal, Check } from "lucide-react";
import { useLanguage, DROPDOWN_LANGUAGES, Language } from "../context/LanguageContext";

interface NavbarProps {
  activeScreen: number;
  setActiveScreen?: (s: number) => void;
  onOpenNewReportModal?: () => void;
  onOpenBatchModal?: () => void;
  onOpenVoiceModal?: () => void;
  totalReportsCount?: number;
  highSIFCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeScreen
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDropdownActive = language !== "en" && language !== "hi";

  const getScreenTitle = (screenId: number): string => {
    switch (screenId) {
      case 1:
        return t("nav.dashboard");
      case 2:
        return t("nav.queue");
      case 3:
        return t("nav.ingest");
      case 4:
        return t("nav.chain");
      case 5:
        return t("nav.iogp");
      case 7:
        return t("nav.site");
      case 8:
        return t("nav.activity");
      case 9:
        return t("nav.barrier");
      case 12:
        return t("nav.detail");
      default:
        return t("nav.dashboard");
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-8 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Active Screen Breadcrumb */}
        <div className="flex items-center gap-3.5">
          <h2 className="text-lg font-extrabold text-slate-900 m-0 tracking-tight">
            {getScreenTitle(activeScreen)}
          </h2>
        </div>

        {/* Right Panel: Enterprise OIL Edition & Top Rightmost Language Switcher */}
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white shadow-2xs font-mono">
            {t("nav.oil")}
          </span>

          {/* Language Switcher Container: English, Hindi, and 3-Dot More Languages Dropdown */}
          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs relative">
            <button
              type="button"
              onClick={() => {
                setLanguage("en");
                setIsMenuOpen(false);
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                language === "en"
                  ? "bg-white text-slate-900 shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Switch to English"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>EN</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLanguage("hi");
                setIsMenuOpen(false);
              }}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                language === "hi"
                  ? "bg-white text-purple-900 shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="हिन्दी में बदलें"
            >
              <span>हिन्दी</span>
            </button>

            {/* 3-dot (⋯) Menu Button for Additional Indian Languages */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                  isDropdownActive
                    ? "bg-slate-900 text-white shadow-2xs font-black"
                    : isMenuOpen
                    ? "bg-slate-200 text-slate-900"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
                title="More Indian Languages (अधिक भाषाएं)"
                aria-expanded={isMenuOpen}
                aria-label="More languages"
              >
                <MoreHorizontal className="w-4 h-4" />
                {isDropdownActive && (
                  <span className="text-[9px] uppercase font-mono px-1 bg-blue-500 text-white rounded">
                    {language}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      14 Indian Languages
                    </span>
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                  </div>

                  <div className="space-y-0.5 px-1 max-h-[380px] overflow-y-auto">
                    {DROPDOWN_LANGUAGES.map((lang) => {
                      const isSelected = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLanguage(lang.code as Language);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 text-white font-extrabold shadow-xs"
                              : "text-slate-700 hover:bg-slate-100 font-medium"
                          }`}
                        >
                          {/* Native script + English name with explicit flex gap & spacing */}
                          <div className="flex items-center gap-2.5">
                            <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                              {lang.nativeScript}
                            </span>
                            <span className={`text-[11px] font-medium ${isSelected ? "text-blue-200" : "text-slate-500"}`}>
                              ({lang.englishName})
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;


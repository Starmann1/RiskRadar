import React from "react";

interface RiskRadarLogoProps {
  size?: number;
  className?: string;
}

export const RiskRadarLogo: React.FC<RiskRadarLogoProps> = ({
  size = 40,
  className = ""
}) => {
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden shrink-0 group transition-all duration-200 hover:shadow-sm hover:border-slate-300 p-1 ${className}`}
      style={{ width: size, height: size }}
      title="Oil India Limited (OIL)"
    >
      {/* Official Oil India Limited (OIL) Vector Emblem */}
      <svg
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[85%] h-[85%] transition-transform duration-300 group-hover:scale-105"
      >
        {/* Top Dark Charcoal / Black Ring (O) */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M100 10 C144.183 10 180 45.817 180 90 C180 134.183 144.183 170 100 170 C55.817 170 20 134.183 20 90 C20 45.817 55.817 10 100 10 Z M100 50 C122.091 50 140 67.909 140 90 C140 112.091 122.091 130 100 130 C77.909 130 60 112.091 60 90 C60 67.909 77.909 50 100 50 Z"
          fill="#231F20"
        />
        {/* Bottom Bright Red Vertical Stem / Base (I) */}
        <rect x="60" y="170" width="80" height="60" fill="#E31E24" />
      </svg>
    </div>
  );
};

export default RiskRadarLogo;

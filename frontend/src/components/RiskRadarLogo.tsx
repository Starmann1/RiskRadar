import React from "react";

interface RiskRadarLogoProps {
  size?: number;
  className?: string;
}

export const RiskRadarLogo: React.FC<RiskRadarLogoProps> = ({
  size = 42,
  className = ""
}) => {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 shadow-md border border-blue-500/30 overflow-hidden shrink-0 group ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-cyan-400/20 pointer-events-none" />

      {/* High-Precision Industrial Radar SVG */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[72%] h-[72%] relative z-10 transition-transform duration-300 group-hover:scale-105"
      >
        {/* Outer Shield Shield Outline */}
        <path
          d="M24 4L40 10V22C40 32.5 33.2 41.5 24 44C14.8 41.5 8 32.5 8 22V10L24 4Z"
          stroke="url(#shieldGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Radar Concentric Arcs */}
        <path
          d="M15 22C15 17 19 13 24 13C29 13 33 17 33 22"
          stroke="#60A5FA"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="2 2"
          opacity="0.85"
        />

        <path
          d="M18.5 22C18.5 19 21 16.5 24 16.5C27 16.5 29.5 19 29.5 22"
          stroke="#38BDF8"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Dynamic Radar Sweep Needle */}
        <line
          x1="24"
          y1="22"
          x2="33"
          y2="13"
          stroke="url(#sweepGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Central Safety Core Node */}
        <circle cx="24" cy="22" r="3.5" fill="#38BDF8" />
        <circle cx="24" cy="22" r="1.5" fill="#FFFFFF" />

        {/* Threat Detection Beacon */}
        <circle cx="31" cy="15" r="2" fill="#F43F5E" />
        <circle cx="31" cy="15" r="1.2" fill="#FFFFFF" />

        {/* Gradients */}
        <defs>
          <linearGradient id="shieldGrad" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60A5FA" />
            <stop offset="0.5" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#1E40AF" />
          </linearGradient>

          <linearGradient id="sweepGrad" x1="24" y1="22" x2="33" y2="13" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#F43F5E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default RiskRadarLogo;

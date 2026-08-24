import React from "react";

export const StatRing = ({ value, label, color, pct }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  return (
    <div className="db-ring-item">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (pct / 100) * circ}
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="db-ring-center">
        <span className="db-ring-val">{value}</span>
        <span className="db-ring-lbl">{label}</span>
      </div>
    </div>
  );
};

export default StatRing;

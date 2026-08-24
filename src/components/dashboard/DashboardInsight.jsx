import React from "react";
import { useNavigate } from "react-router-dom";

export const DashboardInsight = ({ scoreBar }) => {
  const navigate = useNavigate();

  return (
    <section className="db-insight scroll-reveal-3d">
      <div className="db-insight-scan" />
      <div className="db-insight-shimmer" />
      <div className="db-insight-particles">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="db-insight-particle"
            style={{
              left: `${15 + i * 14}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          />
        ))}
      </div>
      <div className="db-insight-left">
        <div className="db-insight-tag">
          <span className="db-insight-dot" />
          <span className="db-insight-tag-text">AI Insight</span>
          <span className="db-insight-sep">·</span>
          <span className="db-live-badge">
            <span className="db-live-pulse" />LIVE
          </span>
        </div>
        <p className="db-insight-text">
          Tailoring your resume for <strong className="db-insight-highlight">Front-End Developer at TradeLab</strong> could improve your ATS score by
        </p>
      </div>
      <div className="db-insight-score">
        <div className="db-score-ring" />
        <span className="db-score-num">{scoreBar}</span>
        <span className="db-score-pct">%</span>
      </div>
      <div className="db-insight-bar-wrap">
        <div className="db-insight-bar">
          <div className="db-insight-bar-fill" style={{ width: `${scoreBar}%` }} />
          <div className="db-insight-bar-glow" style={{ left: `${scoreBar}%` }} />
        </div>
        <div className="db-insight-bar-labels">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
      <button className="db-insight-btn" onClick={() => navigate("/resume-optimizer")}>
        <span className="db-insight-btn-text">Optimize Now</span>
        <span className="db-insight-btn-arrow">→</span>
      </button>
    </section>
  );
};

export default DashboardInsight;

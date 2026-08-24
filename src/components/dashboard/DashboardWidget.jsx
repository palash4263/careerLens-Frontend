import React from "react";
import { useNavigate } from "react-router-dom";

export const DashboardWidget = ({ time }) => {
  const navigate = useNavigate();

  const actions = [
    { label: "Upload", icon: "↑", action: "/resumes" },
    { label: "Builder", icon: "✨", action: "/resume-builder" },
    { label: "Find Jobs", icon: "◈", action: "/jobs" },
    { label: "Roadmap", icon: "🗺️", action: "/skill-roadmap" },
  ];

  return (
    <section className="db-widget scroll-reveal-right">
      <div className="db-wgt-clock">
        <span className="db-wgt-time">{time.current}</span>
        <span className="db-wgt-date">{time.date}</span>
      </div>
      <div className="db-wgt-sep" />
      <div className="db-wgt-weather">
        <div className="db-wgt-weather-icon">☀️</div>
        <div className="db-wgt-weather-info">
          <span className="db-wgt-temp">30°C</span>
          <span className="db-wgt-loc">Mostly Clear · India</span>
        </div>
        <div className="db-wgt-weather-badge">Good</div>
      </div>
      <div className="db-wgt-sep" />
      <div className="db-wgt-actions">
        <span className="db-wgt-section-label">Quick Actions</span>
        <div className="db-wgt-btns">
          {actions.map((a) => (
            <button key={a.label} className="db-wgt-btn" onClick={() => navigate(a.action)}>
              <span className="db-wgt-btn-icon">{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="db-wgt-sep" />
      <div className="db-wgt-tip">
        <span className="db-wgt-tip-badge">✦ AI Tip</span>
        <p className="db-wgt-tip-text">
          Add measurable achievements to your resume bullets — numbers increase interview callbacks by <strong>40%</strong>.
        </p>
      </div>
    </section>
  );
};

export default DashboardWidget;

// src/components/common/SubNavTabs.jsx
import { Link, useLocation } from "react-router-dom";
import "./SubNavTabs.css";

/**
 * SubNavTabs — In-App Page-to-Page Sub-Navigation Bar
 * ----------------------------------------------------
 * Allows seamless 1-click switching between all tools
 * (Resumes, Optimizer, Templates, ATS Calculator, Jobs, Editor)
 * while keeping the top Navbar ultra-clean.
 */
export default function SubNavTabs() {
  const location = useLocation();

  const tabs = [
    { path: "/resumes",          label: "My Resumes",    icon: "📄" },
    { path: "/resume-optimizer", label: "AI Optimizer",   icon: "⚡" },
    { path: "/templates",        label: "Templates",     icon: "🎨" },
    { path: "/ats-calculator",   label: "ATS Calculator",icon: "📊" },
    { path: "/jobs",             label: "Jobs & Prep",   icon: "🎯" },
    { path: "/resume-editor",    label: "Live Editor",   icon: "✏️" },
  ];

  return (
    <div className="snt-container">
      <div className="snt-wrapper">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path === "/resume-optimizer" && location.pathname === "/optimizer");
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`snt-tab ${isActive ? "active" : ""}`}
            >
              <span className="snt-icon">{tab.icon}</span>
              <span className="snt-label">{tab.label}</span>
              {isActive && <span className="snt-active-indicator" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

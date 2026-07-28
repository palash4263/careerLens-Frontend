// src/components/common/FloatingDock.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./FloatingDock.css";

const DOCK_ITEMS = [
  { path: "/dashboard",        label: "Dashboard",      icon: "⊞",  color: "#38bdf8" },
  { path: "/resumes",          label: "My Resumes",     icon: "📄", color: "#a78bfa" },
  { path: "/resume-optimizer", label: "AI Optimizer",   icon: "⚡", color: "#f59e0b" },
  { path: "/templates",        label: "Templates",      icon: "🎨", color: "#34d399" },
  { path: "/ats-calculator",   label: "ATS Calculator", icon: "📊", color: "#f472b6" },
  { path: "/jobs",             label: "Jobs & Prep",    icon: "🎯", color: "#fb923c" },
  { path: "/resume-editor",    label: "Live Editor",    icon: "✏️", color: "#60a5fa" },
];

const HINT_KEY = "cl_dock_hint_seen";

export default function FloatingDock() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [expanded,    setExpanded]    = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const dockRef = useRef(null);

  // ── First-visit auto-hint: briefly open the dock for 2s ──
  useEffect(() => {
    const seen = sessionStorage.getItem(HINT_KEY);
    if (!seen) {
      const openTimer  = setTimeout(() => setExpanded(true),  800);
      const closeTimer = setTimeout(() => {
        setExpanded(false);
        setHintVisible(true);           // keep the "tap to navigate" label
        sessionStorage.setItem(HINT_KEY, "1");
      }, 3000);
      return () => { clearTimeout(openTimer); clearTimeout(closeTimer); };
    } else {
      setHintVisible(true);             // always show the label after first visit
    }
  }, []);

  // ── Close on outside click ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dockRef.current && !dockRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentItem = DOCK_ITEMS.find((d) => d.path === location.pathname);

  const handleNavigate = (path) => {
    navigate(path);
    setExpanded(false);
  };

  return (
    <div className="fd-root" ref={dockRef}>

      {/* ── Stacked item list ── */}
      <div className={`fd-items ${expanded ? "fd-items--open" : ""}`}>
        {DOCK_ITEMS.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`fd-item ${isActive ? "fd-item--active" : ""}`}
              style={{ "--item-color": item.color, "--delay": `${idx * 40}ms` }}
              onClick={() => handleNavigate(item.path)}
              title={item.label}
            >
              <span className="fd-item-icon">{item.icon}</span>
              <span className="fd-item-tooltip">{item.label}</span>
              {isActive && <span className="fd-item-active-ring" />}
            </button>
          );
        })}
      </div>

      {/* ── Trigger row (label + button) ── */}
      <div className="fd-trigger-row">

        {/* Always-visible label pill */}
        <div className={`fd-label-pill ${expanded ? "fd-label-pill--open" : ""}`}>
          {expanded ? (
            <span>Close</span>
          ) : (
            <>
              <span className="fd-label-dot" />
              <span>Navigate</span>
              <span className="fd-label-arrow">↑</span>
            </>
          )}
        </div>

        {/* Main trigger button */}
        <button
          className={`fd-trigger ${expanded ? "fd-trigger--open" : ""}`}
          onClick={() => setExpanded((prev) => !prev)}
          aria-label="Open navigation dock"
        >
          <span className="fd-trigger-icon">
            {expanded ? "✕" : (currentItem?.icon ?? "◈")}
          </span>
          <span className="fd-trigger-ring" />
          <span className="fd-trigger-glow" />
        </button>
      </div>

      {/* ── First-visit bounce hint arrow ── */}
      {!expanded && hintVisible && (
        <div className="fd-hint-arrow">↑ Tap to navigate</div>
      )}
    </div>
  );
}

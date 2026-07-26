// src/components/common/AnimeHeroAnimation.jsx
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { useNavigate } from "react-router-dom";
import "./AnimeHeroAnimation.css";

/**
 * AnimeHeroAnimation (Parsability Index Command Center)
 * ----------------------------------------------------
 * Powers kinetic Anime.js animations:
 * 1. Central glowing 98% Parsability Index gauge with Anime.js count-up.
 * 2. Flanking sub-metric cards (Structure 100%, Keyword Indexing 96%).
 * 3. Anime.js staggered particle matrix grid.
 * 4. Action bar to jump straight to AI Optimization.
 */
export default function AnimeHeroAnimation({ score = 98, label = "Parsability Index" }) {
  const containerRef = useRef(null);
  const scoreNumberRef = useRef(null);
  const gridRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Anime.js Numerical Counter Animation
    const counterObj = { val: 0 };
    animate(counterObj, {
      val: score,
      round: 1,
      ease: "outExpo",
      duration: 2200,
      onUpdate: () => {
        if (scoreNumberRef.current) {
          scoreNumberRef.current.innerHTML = `${counterObj.val}%`;
        }
      },
    });

    // 2. Anime.js Staggered Grid Particle Wave
    const dots = gridRef.current ? gridRef.current.querySelectorAll(".anime-dot") : [];
    if (dots.length > 0) {
      animate(dots, {
        scale: [
          { to: 1.4, ease: "inOutQuad", duration: 1200 },
          { to: 1.0, ease: "inOutQuad", duration: 800 },
        ],
        opacity: [
          { to: 0.95, duration: 1200 },
          { to: 0.4, duration: 800 },
        ],
        delay: stagger(75, { grid: [8, 4], from: "center" }),
        loop: true,
        alternate: true,
      });
    }

    // 3. Anime.js Glowing Ring Sweep
    animate(".anime-ring-glow", {
      rotate: "360deg",
      duration: 8000,
      ease: "linear",
      loop: true,
    });
  }, [score]);

  return (
    <div className="anime-hero-container" ref={containerRef}>
      {/* Background Staggered Particle Grid Matrix */}
      <div className="anime-grid-matrix" ref={gridRef}>
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} className="anime-dot" />
        ))}
      </div>

      {/* Header Badge */}
      <div className="aha-top-header">
        <span className="aha-header-icon">🛡️</span>
        <span className="aha-header-text">AI ATS COMPLIANCE HUB</span>
        <span className="aha-header-pulse" />
      </div>

      {/* Main 3-Column Command Dashboard */}
      <div className="aha-dashboard-grid">
        {/* Left Sub-Metric: Structure & Margins */}
        <div className="aha-metric-card left">
          <div className="aha-metric-icon">🟢</div>
          <div className="aha-metric-info">
            <span className="aha-metric-title">Structure & Margins</span>
            <span className="aha-metric-val">100% Compliant</span>
            <div className="aha-progress-bar"><div className="aha-progress-fill green" /></div>
          </div>
        </div>

        {/* Center Main Gauge */}
        <div className="anime-score-badge">
          <div className="anime-ring-glow" />
          <div className="anime-score-content">
            <span className="anime-score-label">⚡ {label}</span>
            <h2 className="anime-score-val" ref={scoreNumberRef}>
              0%
            </h2>
            <span className="anime-score-status">PASSING ALL ATS FILTERS</span>
          </div>
        </div>

        {/* Right Sub-Metric: Keyword Indexing */}
        <div className="aha-metric-card right">
          <div className="aha-metric-icon">⚡</div>
          <div className="aha-metric-info">
            <span className="aha-metric-title">Keyword Indexing</span>
            <span className="aha-metric-val">96% Indexed</span>
            <div className="aha-progress-bar"><div className="aha-progress-fill cyan" /></div>
          </div>
        </div>
      </div>

      {/* Bottom Insights & Quick Action Bar */}
      <div className="aha-bottom-bar">
        <span className="aha-bar-text">
          🚀 Your resume ranks in the <strong>Top 2%</strong> of ATS Parsability. Ready to optimize for target roles.
        </span>
        <button
          className="aha-action-btn"
          onClick={() => navigate("/resume-optimizer")}
        >
          <span>⚡</span> Optimize Resume
        </button>
      </div>
    </div>
  );
}

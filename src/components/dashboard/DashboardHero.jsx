import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import StatRing from "./StatRing";
import MockupCard from "./MockupCard";
import { useGsapEntrance } from "../../hooks/useGsap";

export const DashboardHero = ({ user, greeting, stats }) => {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  // GSAP Hero entrance animation
  useGsapEntrance(heroRef, { delay: 0.15 });

  const statRings = [
    { value: stats.resumes, label: "Resumes", color: "#7C3AED", pct: Math.min((stats.resumes / 5) * 100, 100) },
    { value: stats.jobs, label: "Jobs", color: "#0EA5E9", pct: Math.min((stats.jobs / 5) * 100, 100) },
    { value: `${stats.ats}%`, label: "ATS Match", color: "#F59E0B", pct: stats.ats || 0 },
    { value: `${stats.strength}%`, label: "Strength", color: "#10B981", pct: stats.strength || 0 },
  ];

  return (
    <section className="db-hero" ref={heroRef}>
      <div className="db-hero-badge" data-gsap="badge">
        <span className="db-badge-pulse" />AI-Powered Career Intelligence
      </div>
      <div className="db-hero-body">
        <div className="db-hero-left">
          <h1 className="db-hero-title" data-gsap="heading">
            Supercharge Your Career Search with <span className="db-gradient-name">CareerLens AI</span>
          </h1>
          <p className="db-hero-sub" data-gsap="sub">
            Welcome back, {user}. {greeting}. Our intelligent career engine is ready to analyze your resume. Here is your current overview.
          </p>
          <div className="db-rings">
            {statRings.map((s) => (
              <StatRing key={s.label} {...s} data-gsap="stat" />
            ))}
          </div>
          <div className="db-hero-cta">
            <button className="db-btn-primary" data-gsap="cta" onClick={() => navigate("/resumes")}>
              ↑ Upload Resume
            </button>
            <button className="db-btn-secondary" data-gsap="cta" onClick={() => navigate("/resume-builder")}>
              ✨ Build Resume
            </button>
          </div>
        </div>
        <div className="db-hero-right">
          <div className="db-mockup-container" data-gsap="mockup">
            <MockupCard
              icon="📄"
              badge="ATS OPTIMIZED"
              badgeColor="purple"
              title="Resume_PM_2026.pdf"
              subtitle="98% Match Potential"
              extra={
                <div className="db-mockup-score-bar">
                  <div className="db-mockup-score-fill purple" style={{ width: "98%" }} />
                </div>
              }
            />
            <MockupCard
              icon="🎤"
              badge="COACH READY"
              badgeColor="green"
              title="Mock Interview AI"
              subtitle="A+ Technical Rating"
              extra={
                <div className="db-mockup-dots">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className={`db-mockup-dot-item${i <= 3 ? " active" : ""}`} />
                  ))}
                </div>
              }
            />
            <MockupCard
              icon="💼"
              badge="JOB MATCHED"
              badgeColor="blue"
              title="Product Lead"
              subtitle="Vercel · Remote"
              extra={<div className="db-mockup-match-pill">94% Fit</div>}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardHero;

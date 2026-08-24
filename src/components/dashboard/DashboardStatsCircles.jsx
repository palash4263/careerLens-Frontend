import React, { useEffect } from "react";
import { gsap } from "../../hooks/useGsap";

export const DashboardStatsCircles = ({ stats }) => {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".stat-circle",
        { opacity: 0, scale: 0.5, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.7,
          ease: "elastic.out(1, 0.55)",
          stagger: 0.1,
          scrollTrigger: { trigger: ".db-stats-circles", start: "top 88%" },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  const items = [
    { emoji: "📄", value: stats.resumes, label: "Resumes", color: "#a78bfa" },
    { emoji: "💼", value: stats.jobs, label: "Jobs Analyzed", color: "#60a5fa" },
    { emoji: "🎯", value: `${stats.ats}%`, label: "ATS Match", color: "#fbbf24" },
    { emoji: "💪", value: `${stats.strength}%`, label: "Strength", color: "#34d399" },
  ];

  return (
    <div className="db-stats-circles">
      {items.map((s, i) => (
        <div
          key={s.label}
          className="stat-circle scroll-reveal"
          style={{ "--circle-color": s.color, zIndex: 4 - i, transitionDelay: `${i * 0.1}s` }}
        >
          <div className="stat-circle-inner">
            <span className="stat-circle-emoji">{s.emoji}</span>
            <span className="stat-circle-value">{s.value}</span>
            <span className="stat-circle-label">{s.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStatsCircles;

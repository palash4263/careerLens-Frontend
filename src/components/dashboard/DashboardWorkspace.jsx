import React from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceItem from "./WorkspaceItem";
import { useGsapCards } from "../../hooks/useGsap";

export const DashboardWorkspace = () => {
  const navigate = useNavigate();

  // GSAP ScrollTrigger: workspace items animation
  useGsapCards(".db-workspace-item", { stagger: 0.1, duration: 0.65 });

  const workspaceItems = [
    { icon: "◧", color: "#a78bfa", bg: "rgba(124,58,237,0.12)", title: "Recent Resumes", desc: "3 resumes · last edited 2h ago", badge: "31", progress: 62, path: "/resumes" },
    { icon: "◈", color: "#60a5fa", bg: "rgba(14,165,233,0.12)", title: "Saved Jobs", desc: "14 jobs · 4 deadlines this week", badge: "14", progress: 45, path: "/jobs" },
    { icon: "⚡", color: "#34d399", bg: "rgba(16,185,129,0.12)", title: "Resume Builder", desc: "Build & customize ATS resumes", badge: "New", progress: 85, path: "/resume-builder" },
    { icon: "🗺️", color: "#f472b6", bg: "rgba(236,72,153,0.12)", title: "Skill Roadmap", desc: "Generate a custom learning path", badge: "Hot", progress: 10, path: "/skill-roadmap", highlight: true },
  ];

  return (
    <section className="db-workspace scroll-reveal-left">
      <div className="db-workspace-head">
        <div>
          <span className="db-ws-eyebrow">Quick Access</span>
          <h2 className="db-ws-title">Your Workspace</h2>
        </div>
        <button className="db-link-btn" onClick={() => navigate("/resumes")}>
          View All →
        </button>
      </div>
      <div className="db-workspace-list">
        {workspaceItems.map((item) => (
          <WorkspaceItem key={item.title} {...item} />
        ))}
      </div>
      <div className="db-ws-activity">
        <span className="db-ws-activity-label">Recent Activity</span>
        <div className="db-ws-activity-dots">
          {["#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa"].map((c, i) => (
            <div key={i} className="db-ws-dot" style={{ background: c, animationDelay: `${i * 0.2}s` }} />
          ))}
          <span className="db-ws-activity-text">5 actions today</span>
        </div>
      </div>
    </section>
  );
};

export default DashboardWorkspace;

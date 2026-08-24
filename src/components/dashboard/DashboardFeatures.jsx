import React from "react";
import { useNavigate } from "react-router-dom";
import FeatureCard from "../FeatureCard";
import { useGsapCards } from "../../hooks/useGsap";

export const DashboardFeatures = () => {
  const navigate = useNavigate();

  // GSAP ScrollTrigger: feature cards animation
  useGsapCards(".db-feature-card", { stagger: 0.13 });

  const features = [
    {
      id: 1,
      title: "AI Resume Analysis",
      description: "Our AI scans your resume against job descriptions to identify gaps and suggest improvements.",
      icon: "📄",
      gradient: "linear-gradient(137deg, #7C3AED 0%, #A78BFA 45%, #6D28D9 100%)",
      delay: 0.1,
      path: "/resumes",
    },
    {
      id: 2,
      title: "AI Resume Builder",
      description: "Build a high-impact, ATS-optimized CV from scratch with Groq AI suggestions and target JD skill matching.",
      icon: "✨",
      gradient: "linear-gradient(137deg, #EC4899 0%, #F472B6 45%, #BE185D 100%)",
      delay: 0.2,
      path: "/resume-builder",
    },
    {
      id: 3,
      title: "ATS Score Predictor",
      description: "Get real-time ATS compatibility scores and actionable insights.",
      icon: "🎯",
      gradient: "linear-gradient(137deg, #10B981 0%, #34D399 45%, #059669 100%)",
      delay: 0.3,
      path: "/ats-calculator",
    },
  ];

  return (
    <section className="db-features scroll-reveal-3d">
      <div className="db-features-head">
        <div className="db-features-head-left">
          <div className="db-feat-eyebrow">
            <span className="db-feat-eyebrow-dot" />Premium Features
          </div>
          <h2 className="db-features-title">
            Everything you need to<br />
            <span className="db-feat-title-accent">land your dream job</span>
          </h2>
          <p className="db-feat-subtitle">
            AI-powered tools that give you an unfair advantage in today's competitive job market.
          </p>
        </div>
        <div className="db-features-head-right">
          <div className="db-feat-stats">
            {[
              { val: "10K+", lbl: "Resumes Optimized" },
              { val: "94%", lbl: "Interview Rate" },
              { val: "3×", lbl: "Faster Placement" },
            ].map((s) => (
              <div key={s.lbl} className="db-feat-stat">
                <span className="db-feat-stat-val">{s.val}</span>
                <span className="db-feat-stat-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>
          <button className="db-view-all-btn" onClick={() => navigate("/resume-optimizer")}>
            Explore All →
          </button>
        </div>
      </div>
      <div className="db-features-grid">
        {features.map((c, i) => (
          <FeatureCard key={c.id} {...c} index={i} />
        ))}
      </div>
    </section>
  );
};

export default DashboardFeatures;

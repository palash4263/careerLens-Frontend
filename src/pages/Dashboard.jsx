// Dashboard.jsx — Investor-Ready Premium Design
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FeatureCard from "../components/FeatureCard";
import CtaFooter from "../components/CtaFooter";
import { motion } from "framer-motion";
import { getResumes } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import api from "../api/axiosConfig";
import "../assets/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [userName, setUserName] = useState("John");
  const [greeting, setGreeting] = useState("Good Morning");
  const [animatedStats, setAnimatedStats] = useState({ resumes: 0, jobs: 0, ats: 0, strength: 0 });
  const [scoreBarWidth, setScoreBarWidth] = useState(0);
  const [activeCards, setActiveCards] = useState([false, false, false, false]);
  const toggleCard = (i) => setActiveCards(prev => prev.map((v, idx) => idx === i ? !v : v));

  useEffect(() => {
    const name = localStorage.getItem("userName") || "John";
    setUserName(name);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else if (hour < 20) setGreeting("Good Evening");
    else setGreeting("Good Night");

    const handleStorage = (e) => { if (e.key === "userName") setUserName(e.newValue || "John"); };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }));
      setCurrentDate(now.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }));
    };
    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, []);

  // Fetch real counts & calculate scores, then animate numbers on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resumesData = await getResumes();
        const jobsData = await getJobDescriptions();
        
        const resumesCountVal = resumesData?.length || 0;
        const jobsCountVal = jobsData?.length || 0;

        let totalScore = 0;
        let scoreCount = 0;
        if (resumesData && resumesData.length > 0) {
          for (const res of resumesData) {
            try {
              const historyResponse = await api.get(`/ats/history/${res.id}`);
              if (historyResponse.data && historyResponse.data.length > 0) {
                historyResponse.data.forEach(item => {
                  totalScore += item.score;
                  scoreCount++;
                });
              }
            } catch (e) {
              console.error("Failed to fetch history for resume", res.id, e);
            }
          }
        }
        
        const atsMatchVal = resumesCountVal === 0 ? 0 : (scoreCount > 0 ? Math.round(totalScore / scoreCount) : 78);
        const strengthVal = resumesCountVal === 0 ? 0 : (scoreCount > 0 ? Math.min(atsMatchVal + 5, 95) : 85);

        const targets = { resumes: resumesCountVal, jobs: jobsCountVal, ats: atsMatchVal, strength: strengthVal };
        const duration = 1600;
        const steps = 60;
        const interval = duration / steps;
        let step = 0;
        const timer = setInterval(() => {
          step++;
          const progress = step / steps;
          const ease = 1 - Math.pow(1 - progress, 3);
          setAnimatedStats({
            resumes: Math.round(ease * targets.resumes),
            jobs: Math.round(ease * targets.jobs),
            ats: Math.round(ease * targets.ats),
            strength: Math.round(ease * targets.strength),
          });
          if (step >= steps) clearInterval(timer);
        }, interval);

      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      }
    };

    fetchStats();
    setTimeout(() => setScoreBarWidth(24), 800);
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );
    const elements = document.querySelectorAll(
      ".scroll-reveal, .scroll-reveal-3d, .scroll-reveal-left, .scroll-reveal-right"
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const featureCards = [
    {
      id: 1,
      title: "AI Resume Analysis",
      description: "Our AI scans your resume against job descriptions to identify gaps and suggest improvements that boost your ATS score.",
      icon: "📄",
      gradient: "linear-gradient(137deg, #7C3AED 0%, #A78BFA 45%, #6D28D9 100%)",
      delay: 0.1,
      path: "/resumes",
    },
    {
      id: 2,
      title: "Smart Keyword Optimization",
      description: "Automatically detect missing keywords from job descriptions and seamlessly integrate them into your resume.",
      icon: "✨",
      gradient: "linear-gradient(137deg, #EC4899 0%, #F472B6 45%, #BE185D 100%)",
      delay: 0.2,
      path: "/resume-optimizer",
    },
    {
      id: 3,
      title: "ATS Score Predictor",
      description: "Get real-time ATS compatibility scores and actionable insights to improve your chances of landing interviews.",
      icon: "🎯",
      gradient: "linear-gradient(137deg, #10B981 0%, #34D399 45%, #059669 100%)",
      delay: 0.3,
      path: "/ats-calculator",
    },
  ];

  return (
    <motion.div 
      className="db-page-wrapper"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="db-root">
        {/* ── Ambient background orbs ── */}
        <div className="db-orb db-orb-1" />
        <div className="db-orb db-orb-2" />
        <div className="db-orb db-orb-3" />

      <div className="db-content">

        {/* ══════════ HERO ══════════ */}
        <section className="db-hero">
          <div className="db-hero-badge">
            <span className="db-badge-pulse" />
            AI-Powered Career Intelligence
          </div>

          <div className="db-hero-body">
            <div className="db-hero-left">
              <h1 className="db-hero-title">
                Supercharge Your Career Search with <span className="db-gradient-name">CareerLens AI</span>
              </h1>
              <p className="db-hero-sub">
                Welcome back, {userName}. Our intelligent career engine is ready to analyze your resume, optimize ATS compatibility, and train you for mock interviews. Here is your current overview.
              </p>

              {/* Stat rings */}
              <div className="db-rings">
                {[
                  { value: animatedStats.resumes, label: "Resumes", color: "#7C3AED", pct: Math.min((animatedStats.resumes / 5) * 100, 100) },
                  { value: animatedStats.jobs,    label: "Jobs",     color: "#0EA5E9", pct: Math.min((animatedStats.jobs / 5) * 100, 100) },
                  { value: `${animatedStats.ats}%`,   label: "ATS Match",  color: "#F59E0B", pct: animatedStats.ats || 0 },
                  { value: `${animatedStats.strength}%`, label: "Strength", color: "#10B981", pct: animatedStats.strength || 0 },
                ].map((s) => {
                  const r = 28; const circ = 2 * Math.PI * r;
                  const dash = circ - (s.pct / 100) * circ;
                  return (
                    <div key={s.label} className="db-ring-item">
                      <svg width="72" height="72" viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                        <circle
                          cx="36" cy="36" r={r} fill="none"
                          stroke={s.color} strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={circ}
                          strokeDashoffset={dash}
                          transform="rotate(-90 36 36)"
                          style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)" }}
                        />
                      </svg>
                      <div className="db-ring-center">
                        <span className="db-ring-val">{s.value}</span>
                        <span className="db-ring-lbl">{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="db-hero-cta">
                <button className="db-btn-primary" onClick={() => navigate("/resumes")}>
                  ↑&nbsp; Upload Resume
                </button>
                <button className="db-btn-secondary" onClick={() => navigate("/optimizer")}>
                  ⚡&nbsp; Optimize Now
                </button>
              </div>
            </div>

            {/* Right — 3D Floating Mockup Cards */}
            <div className="db-hero-right">
              <div className="db-mockup-container">
                <div className="db-mockup-card c1">
                  <div className="db-mockup-badge purple">ATS OPTIMIZED</div>
                  <div className="db-mockup-row">
                    <span className="db-mockup-icon">📄</span>
                    <div className="db-mockup-details">
                      <span className="db-mockup-title">Resume_PM_2026.pdf</span>
                      <span className="db-mockup-meta">98% Match Potential</span>
                    </div>
                  </div>
                  <div className="db-mockup-score-bar">
                    <div className="db-mockup-score-fill purple" style={{ width: "98%" }} />
                  </div>
                </div>

                <div className="db-mockup-card c2">
                  <div className="db-mockup-badge green">COACH READY</div>
                  <div className="db-mockup-row">
                    <span className="db-mockup-icon">🎤</span>
                    <div className="db-mockup-details">
                      <span className="db-mockup-title">Mock Interview AI</span>
                      <span className="db-mockup-meta">A+ Technical Rating</span>
                    </div>
                  </div>
                  <div className="db-mockup-dots">
                    <span className="db-mockup-dot-item active" />
                    <span className="db-mockup-dot-item active" />
                    <span className="db-mockup-dot-item active" />
                    <span className="db-mockup-dot-item" />
                  </div>
                </div>

                <div className="db-mockup-card c3">
                  <div className="db-mockup-badge blue">JOB MATCHED</div>
                  <div className="db-mockup-row">
                    <span className="db-mockup-icon">💼</span>
                    <div className="db-mockup-details">
                      <span className="db-mockup-title">Product Lead</span>
                      <span className="db-mockup-meta">Vercel · Remote</span>
                    </div>
                  </div>
                  <div className="db-mockup-match-pill">94% Fit</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ AI INSIGHT BANNER — Animated ══════════ */}
        <section className="db-insight scroll-reveal-3d">
          {/* Animated scanning border */}
          <div className="db-insight-scan" />
          {/* Shimmer sweep */}
          <div className="db-insight-shimmer" />
          {/* Particle dots */}
          <div className="db-insight-particles">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="db-insight-particle" style={{
                left: `${15 + i * 14}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }} />
            ))}
          </div>

          {/* Left — tag + text */}
          <div className="db-insight-left">
            <div className="db-insight-tag">
              <span className="db-insight-dot" />
              <span className="db-insight-tag-text">AI Insight</span>
              <span className="db-insight-sep">·</span>
              <span className="db-live-badge">
                <span className="db-live-pulse" />
                LIVE
              </span>
            </div>
            <p className="db-insight-text">
              Tailoring your resume for&nbsp;
              <strong className="db-insight-highlight">Front-End Developer at TradeLab</strong>&nbsp;
              could improve your ATS score by
            </p>
          </div>

          {/* Score with glow ring */}
          <div className="db-insight-score">
            <div className="db-score-ring" />
            <span className="db-score-num">{scoreBarWidth}</span>
            <span className="db-score-pct">%</span>
          </div>

          {/* Progress bar with tick markers */}
          <div className="db-insight-bar-wrap">
            <div className="db-insight-bar">
              <div className="db-insight-bar-fill" style={{ width: `${scoreBarWidth}%` }} />
              <div className="db-insight-bar-glow" style={{ left: `${scoreBarWidth}%` }} />
            </div>
            <div className="db-insight-bar-labels">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          {/* CTA button with pulse ring */}
          <button className="db-insight-btn" onClick={() => navigate("/optimizer")}>
            <span className="db-insight-btn-text">Optimize Now</span>
            <span className="db-insight-btn-arrow">→</span>
          </button>
        </section>

      {/* ══════════ STATS CARDS — Intersecting Circles ══════════ */}
<div className="db-stats-circles">
  {[
    { emoji: "📄", value: animatedStats.resumes, label: "Resumes", color: "#a78bfa" },
    { emoji: "💼", value: animatedStats.jobs, label: "Jobs Analyzed", color: "#60a5fa" },
    { emoji: "🎯", value: `${animatedStats.ats}%`, label: "ATS Match", color: "#fbbf24" },
    { emoji: "💪", value: `${animatedStats.strength}%`, label: "Strength", color: "#34d399" },
  ].map((s, i) => (
    <div
      key={s.label}
      className="stat-circle scroll-reveal"
      style={{
        "--circle-color": s.color,
        zIndex: 4 - i,
        transitionDelay: `${i * 0.1}s`,
      }}
    >
      <div className="stat-circle-inner">
        <span className="stat-circle-emoji">{s.emoji}</span>
        <span className="stat-circle-value">{s.value}</span>
        <span className="stat-circle-label">{s.label}</span>
      </div>
    </div>
  ))}
</div>

        {/* ══════════ FEATURES ══════════ */}
        <section className="db-features scroll-reveal-3d">
          <div className="db-features-head">
            <div className="db-features-head-left">
              <div className="db-feat-eyebrow">
                <span className="db-feat-eyebrow-dot" />
                Premium Features
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
                  { val: "94%",  lbl: "Interview Rate" },
                  { val: "3×",   lbl: "Faster Placement" },
                ].map((s) => (
                  <div key={s.lbl} className="db-feat-stat">
                    <span className="db-feat-stat-val">{s.val}</span>
                    <span className="db-feat-stat-lbl">{s.lbl}</span>
                  </div>
                ))}
              </div>
              <button className="db-view-all-btn">Explore All →</button>
            </div>
          </div>
          <div className="db-features-grid">
            {featureCards.map((c, i) => (
              <FeatureCard key={c.id} {...c} index={i} />
            ))}
          </div>
        </section>

        {/* ══════════ BOTTOM ROW ══════════ */}
        <div className="db-bottom">

          {/* ── Workspace ── */}
          <section className="db-workspace scroll-reveal-left">
            {/* Header */}
            <div className="db-workspace-head">
              <div>
                <span className="db-ws-eyebrow">Quick Access</span>
                <h2 className="db-ws-title">Your Workspace</h2>
              </div>
              <button className="db-link-btn" onClick={() => navigate("/resumes")}>
                View All →
              </button>
            </div>

            {/* Nav items */}
            <div className="db-workspace-list">
              {[
                {
                  icon: "◧",
                  color: "#a78bfa",
                  bg: "rgba(124,58,237,0.12)",
                  title: "Recent Resumes",
                  desc: "3 resumes · last edited 2h ago",
                  badge: "31",
                  progress: 62,
                  path: "/resumes",
                },
                {
                  icon: "◈",
                  color: "#60a5fa",
                  bg: "rgba(14,165,233,0.12)",
                  title: "Saved Jobs",
                  desc: "14 jobs · 4 deadlines this week",
                  badge: "14",
                  progress: 45,
                  path: "/jobs",
                },
                {
                  icon: "⚡",
                  color: "#34d399",
                  bg: "rgba(16,185,129,0.12)",
                  title: "AI Recommendations",
                  desc: "8 new matches · 94% fit score",
                  badge: "New",
                  progress: 85,
                  path: "/resume-optimizer",
                  highlight: true,
                },
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className={`db-workspace-item${item.highlight ? " highlighted" : ""}`}
                  onClick={() => navigate(item.path)}
                  role="button"
                  tabIndex={0}
                >
                  {/* Icon */}
                  <div className="db-ws-icon" style={{ background: item.bg, color: item.color }}>
                    {item.icon}
                  </div>

                  {/* Text + progress */}
                  <div className="db-ws-text">
                    <div className="db-ws-row">
                      <h4>{item.title}</h4>
                      <span className="db-ws-badge" style={{ color: item.color, background: item.bg }}>
                        {item.badge}
                      </span>
                    </div>
                    <p>{item.desc}</p>
                    <div className="db-ws-progress">
                      <div
                        className="db-ws-progress-fill"
                        style={{ width: `${item.progress}%`, background: `linear-gradient(90deg, ${item.color}88, ${item.color})` }}
                      />
                    </div>
                  </div>

                  {/* Arrow */}
                  <span className="db-ws-arrow" aria-hidden="true" />
                </div>
              ))}
            </div>

            {/* Activity strip */}
            <div className="db-ws-activity">
              <span className="db-ws-activity-label">Recent Activity</span>
              <div className="db-ws-activity-dots">
                {["#a78bfa","#60a5fa","#34d399","#fbbf24","#a78bfa"].map((c, i) => (
                  <div key={i} className="db-ws-dot" style={{ background: c, animationDelay: `${i * 0.2}s` }} />
                ))}
                <span className="db-ws-activity-text">5 actions today</span>
              </div>
            </div>
          </section>

          {/* ── Productivity Widget ── */}
          <section className="db-widget scroll-reveal-right">
            {/* Live clock */}
            <div className="db-wgt-clock">
              <span className="db-wgt-time">{currentTime}</span>
              <span className="db-wgt-date">{currentDate}</span>
            </div>

            {/* Divider */}
            <div className="db-wgt-sep" />

            {/* Weather */}
            <div className="db-wgt-weather">
              <div className="db-wgt-weather-icon">☀️</div>
              <div className="db-wgt-weather-info">
                <span className="db-wgt-temp">30°C</span>
                <span className="db-wgt-loc">Mostly Clear · India</span>
              </div>
              <div className="db-wgt-weather-badge">Good</div>
            </div>

            {/* Divider */}
            <div className="db-wgt-sep" />

            {/* Quick actions */}
            <div className="db-wgt-actions">
              <span className="db-wgt-section-label">Quick Actions</span>
              <div className="db-wgt-btns">
                {[
                  { label: "Upload Resume", icon: "↑", action: "/resumes" },
                  { label: "Optimize",      icon: "⚡", action: "/resume-optimizer" },
                  { label: "Find Jobs",     icon: "◈", action: "/jobs" },
                ].map((a) => (
                  <button
                    key={a.label}
                    className="db-wgt-btn"
                    onClick={() => navigate(a.action)}
                  >
                    <span className="db-wgt-btn-icon">{a.icon}</span>
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="db-wgt-sep" />

            {/* AI tip */}
            <div className="db-wgt-tip">
              <span className="db-wgt-tip-badge">✦ AI Tip</span>
              <p className="db-wgt-tip-text">
                Add measurable achievements to your resume bullets — numbers increase interview callbacks by <strong>40%</strong>.
              </p>
            </div>
          </section>

        </div>
      </div>
      </div>
      <CtaFooter />
    </motion.div>
  );
}

export default Dashboard;
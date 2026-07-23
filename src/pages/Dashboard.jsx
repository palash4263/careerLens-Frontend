// Dashboard.jsx — Refactored for brevity
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import FeatureCard from "../components/FeatureCard";
import CtaFooter from "../components/CtaFooter";
import { getResumes } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import api from "../api/axiosConfig";
import "../assets/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ resumes: 0, jobs: 0, ats: 0, strength: 0 });
  const [time, setTime] = useState({ current: "", date: "" });
  const [user, setUser] = useState("John");
  const [scoreBar, setScoreBar] = useState(0);
  const [greeting, setGreeting] = useState("Good Morning");

  // Initialize user & greeting
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : hour < 20 ? "Good Evening" : "Good Night"
    );
    const userName = localStorage.getItem("userName") || "John";
    setUser(userName);
    window.addEventListener("storage", (e) => e.key === "userName" && setUser(e.newValue || "John"));
  }, []);

  // Update clock every second
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime({
        current: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
        date: now.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }),
      });
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  // Fetch stats & animate
  useEffect(() => {
    (async () => {
      try {
        const [resumes, jobs] = await Promise.all([getResumes(), getJobDescriptions()]);
        const resumeCount = resumes?.length || 0;
        const jobCount = jobs?.length || 0;

        let totalScore = 0, scoreCount = 0;
        for (const res of resumes || []) {
          try {
            const hist = await api.get(`/ats/history/${res.id}`);
            if (hist.data?.length) {
              totalScore += hist.data.reduce((sum, item) => sum + item.score, 0);
              scoreCount += hist.data.length;
            }
          } catch (e) {
            console.error(`Failed to fetch history for resume ${res.id}`, e);
          }
        }

        const atsMatch = resumeCount === 0 ? 0 : scoreCount > 0 ? Math.round(totalScore / scoreCount) : 78;
        const strength = resumeCount === 0 ? 0 : scoreCount > 0 ? Math.min(atsMatch + 5, 95) : 85;

        // Animate numbers
        animateValue("resumes", resumeCount);
        animateValue("jobs", jobCount);
        animateValue("ats", atsMatch);
        animateValue("strength", strength);
        setTimeout(() => setScoreBar(24), 800);
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      }
    })();
  }, []);

  const animateValue = (key, target) => {
    const duration = 1600, steps = 60;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setStats((prev) => ({ ...prev, [key]: Math.round(ease * target) }));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
  };

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("revealed")),
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".scroll-reveal, .scroll-reveal-3d, .scroll-reveal-left, .scroll-reveal-right").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const StatRing = ({ value, label, color, pct }) => {
    const r = 28, circ = 2 * Math.PI * r;
    return (
      <div className="db-ring-item">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <circle
            cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
            transform="rotate(-90 36 36)"
            style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="db-ring-center">
          <span className="db-ring-val">{value}</span>
          <span className="db-ring-lbl">{label}</span>
        </div>
      </div>
    );
  };

  const MockupCard = ({ icon, badge, badgeColor, title, subtitle, extra }) => (
    <div className={`db-mockup-card ${badgeColor}`}>
      <div className={`db-mockup-badge ${badgeColor}`}>{badge}</div>
      <div className="db-mockup-row">
        <span className="db-mockup-icon">{icon}</span>
        <div className="db-mockup-details">
          <span className="db-mockup-title">{title}</span>
          <span className="db-mockup-meta">{subtitle}</span>
        </div>
      </div>
      {extra}
    </div>
  );

  const WorkspaceItem = ({ icon, color, bg, title, desc, badge, progress, path, highlight }) => (
    <div className={`db-workspace-item${highlight ? " highlighted" : ""}`} onClick={() => navigate(path)} role="button" tabIndex={0}>
      <div className="db-ws-icon" style={{ background: bg, color }}>
        {icon}
      </div>
      <div className="db-ws-text">
        <div className="db-ws-row">
          <h4>{title}</h4>
          <span className="db-ws-badge" style={{ color, background: bg }}>
            {badge}
          </span>
        </div>
        <p>{desc}</p>
        <div className="db-ws-progress">
          <div className="db-ws-progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
        </div>
      </div>
      <span className="db-ws-arrow" aria-hidden="true" />
    </div>
  );

  const statRings = [
    { value: stats.resumes, label: "Resumes", color: "#7C3AED", pct: Math.min((stats.resumes / 5) * 100, 100) },
    { value: stats.jobs, label: "Jobs", color: "#0EA5E9", pct: Math.min((stats.jobs / 5) * 100, 100) },
    { value: `${stats.ats}%`, label: "ATS Match", color: "#F59E0B", pct: stats.ats || 0 },
    { value: `${stats.strength}%`, label: "Strength", color: "#10B981", pct: stats.strength || 0 },
  ];

  const features = [
    { id: 1, title: "AI Resume Analysis", description: "Our AI scans your resume against job descriptions to identify gaps and suggest improvements.", icon: "📄", gradient: "linear-gradient(137deg, #7C3AED 0%, #A78BFA 45%, #6D28D9 100%)", delay: 0.1, path: "/resumes" },
    { id: 2, title: "Smart Keyword Optimization", description: "Automatically detect missing keywords from job descriptions and integrate them into your resume.", icon: "✨", gradient: "linear-gradient(137deg, #EC4899 0%, #F472B6 45%, #BE185D 100%)", delay: 0.2, path: "/resume-optimizer" },
    { id: 3, title: "ATS Score Predictor", description: "Get real-time ATS compatibility scores and actionable insights.", icon: "🎯", gradient: "linear-gradient(137deg, #10B981 0%, #34D399 45%, #059669 100%)", delay: 0.3, path: "/ats-calculator" },
  ];

  const workspaceItems = [
    { icon: "◧", color: "#a78bfa", bg: "rgba(124,58,237,0.12)", title: "Recent Resumes", desc: "3 resumes · last edited 2h ago", badge: "31", progress: 62, path: "/resumes" },
    { icon: "◈", color: "#60a5fa", bg: "rgba(14,165,233,0.12)", title: "Saved Jobs", desc: "14 jobs · 4 deadlines this week", badge: "14", progress: 45, path: "/jobs" },
    { icon: "⚡", color: "#34d399", bg: "rgba(16,185,129,0.12)", title: "AI Recommendations", desc: "8 new matches · 94% fit score", badge: "New", progress: 85, path: "/resume-optimizer", highlight: true },
  ];

  return (
    <motion.div className="db-page-wrapper" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <div className="db-root">
        {[1, 2, 3].map((i) => <div key={i} className={`db-orb db-orb-${i}`} />)}
        <div className="db-content">
          {/* Hero */}
          <section className="db-hero">
            <div className="db-hero-badge"><span className="db-badge-pulse" />AI-Powered Career Intelligence</div>
            <div className="db-hero-body">
              <div className="db-hero-left">
                <h1 className="db-hero-title">Supercharge Your Career Search with <span className="db-gradient-name">CareerLens AI</span></h1>
                <p className="db-hero-sub">Welcome back, {user}. {greeting}. Our intelligent career engine is ready to analyze your resume. Here is your current overview.</p>
                <div className="db-rings">{statRings.map((s) => <StatRing key={s.label} {...s} />)}</div>
                <div className="db-hero-cta">
                  <button className="db-btn-primary" onClick={() => navigate("/resumes")}>↑ Upload Resume</button>
                  <button className="db-btn-secondary" onClick={() => navigate("/optimizer")}>⚡ Optimize Now</button>
                </div>
              </div>
              <div className="db-hero-right">
                <div className="db-mockup-container">
                  <MockupCard icon="📄" badge="ATS OPTIMIZED" badgeColor="purple" title="Resume_PM_2026.pdf" subtitle="98% Match Potential" extra={<div className="db-mockup-score-bar"><div className="db-mockup-score-fill purple" style={{ width: "98%" }} /></div>} />
                  <MockupCard icon="🎤" badge="COACH READY" badgeColor="green" title="Mock Interview AI" subtitle="A+ Technical Rating" extra={<div className="db-mockup-dots">{[1,2,3,4].map((i) => <span key={i} className={`db-mockup-dot-item${i <= 3 ? " active" : ""}`} />)}</div>} />
                  <MockupCard icon="💼" badge="JOB MATCHED" badgeColor="blue" title="Product Lead" subtitle="Vercel · Remote" extra={<div className="db-mockup-match-pill">94% Fit</div>} />
                </div>
              </div>
            </div>
          </section>

          {/* AI Insight Banner */}
          <section className="db-insight scroll-reveal-3d">
            <div className="db-insight-scan" />
            <div className="db-insight-shimmer" />
            <div className="db-insight-particles">{[...Array(6)].map((_, i) => <div key={i} className="db-insight-particle" style={{ left: `${15 + i * 14}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${3 + (i % 3)}s` }} />)}</div>
            <div className="db-insight-left">
              <div className="db-insight-tag">
                <span className="db-insight-dot" />
                <span className="db-insight-tag-text">AI Insight</span>
                <span className="db-insight-sep">·</span>
                <span className="db-live-badge"><span className="db-live-pulse" />LIVE</span>
              </div>
              <p className="db-insight-text">Tailoring your resume for <strong className="db-insight-highlight">Front-End Developer at TradeLab</strong> could improve your ATS score by</p>
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
              <div className="db-insight-bar-labels"><span>0%</span><span>50%</span><span>100%</span></div>
            </div>
            <button className="db-insight-btn" onClick={() => navigate("/optimizer")}>
              <span className="db-insight-btn-text">Optimize Now</span>
              <span className="db-insight-btn-arrow">→</span>
            </button>
          </section>

          {/* Stats Circles */}
          <div className="db-stats-circles">
            {[
              { emoji: "📄", value: stats.resumes, label: "Resumes", color: "#a78bfa" },
              { emoji: "💼", value: stats.jobs, label: "Jobs Analyzed", color: "#60a5fa" },
              { emoji: "🎯", value: `${stats.ats}%`, label: "ATS Match", color: "#fbbf24" },
              { emoji: "💪", value: `${stats.strength}%`, label: "Strength", color: "#34d399" },
            ].map((s, i) => (
              <div key={s.label} className="stat-circle scroll-reveal" style={{ "--circle-color": s.color, zIndex: 4 - i, transitionDelay: `${i * 0.1}s` }}>
                <div className="stat-circle-inner">
                  <span className="stat-circle-emoji">{s.emoji}</span>
                  <span className="stat-circle-value">{s.value}</span>
                  <span className="stat-circle-label">{s.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <section className="db-features scroll-reveal-3d">
            <div className="db-features-head">
              <div className="db-features-head-left">
                <div className="db-feat-eyebrow"><span className="db-feat-eyebrow-dot" />Premium Features</div>
                <h2 className="db-features-title">Everything you need to<br /><span className="db-feat-title-accent">land your dream job</span></h2>
                <p className="db-feat-subtitle">AI-powered tools that give you an unfair advantage in today's competitive job market.</p>
              </div>
              <div className="db-features-head-right">
                <div className="db-feat-stats">
                  {[{ val: "10K+", lbl: "Resumes Optimized" }, { val: "94%", lbl: "Interview Rate" }, { val: "3×", lbl: "Faster Placement" }].map((s) => (
                    <div key={s.lbl} className="db-feat-stat">
                      <span className="db-feat-stat-val">{s.val}</span>
                      <span className="db-feat-stat-lbl">{s.lbl}</span>
                    </div>
                  ))}
                </div>
                <button className="db-view-all-btn">Explore All →</button>
              </div>
            </div>
            <div className="db-features-grid">{features.map((c, i) => <FeatureCard key={c.id} {...c} index={i} />)}</div>
          </section>

          {/* Bottom Row */}
          <div className="db-bottom">
            <section className="db-workspace scroll-reveal-left">
              <div className="db-workspace-head">
                <div><span className="db-ws-eyebrow">Quick Access</span><h2 className="db-ws-title">Your Workspace</h2></div>
                <button className="db-link-btn" onClick={() => navigate("/resumes")}>View All →</button>
              </div>
              <div className="db-workspace-list">{workspaceItems.map((item) => <WorkspaceItem key={item.title} {...item} />)}</div>
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

            <section className="db-widget scroll-reveal-right">
              <div className="db-wgt-clock"><span className="db-wgt-time">{time.current}</span><span className="db-wgt-date">{time.date}</span></div>
              <div className="db-wgt-sep" />
              <div className="db-wgt-weather">
                <div className="db-wgt-weather-icon">☀️</div>
                <div className="db-wgt-weather-info"><span className="db-wgt-temp">30°C</span><span className="db-wgt-loc">Mostly Clear · India</span></div>
                <div className="db-wgt-weather-badge">Good</div>
              </div>
              <div className="db-wgt-sep" />
              <div className="db-wgt-actions">
                <span className="db-wgt-section-label">Quick Actions</span>
                <div className="db-wgt-btns">
                  {[{ label: "Upload Resume", icon: "↑", action: "/resumes" }, { label: "Optimize", icon: "⚡", action: "/resume-optimizer" }, { label: "Find Jobs", icon: "◈", action: "/jobs" }].map((a) => (
                    <button key={a.label} className="db-wgt-btn" onClick={() => navigate(a.action)}>
                      <span className="db-wgt-btn-icon">{a.icon}</span>
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="db-wgt-sep" />
              <div className="db-wgt-tip"><span className="db-wgt-tip-badge">✦ AI Tip</span><p className="db-wgt-tip-text">Add measurable achievements to your resume bullets — numbers increase interview callbacks by <strong>40%</strong>.</p></div>
            </section>
          </div>
        </div>
      </div>
      <CtaFooter />
    </motion.div>
  );
}

export default Dashboard;
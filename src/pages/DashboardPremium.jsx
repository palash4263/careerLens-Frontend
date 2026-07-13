// Reading this as: asymmetric portfolio/dashboard layout for high-end candidates, with a luxury/dark tech language, leaning toward custom SVG wireframe accents and physics transitions.
// DESIGN_VARIANCE: 9 | MOTION_INTENSITY: 8 | VISUAL_DENSITY: 3

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  FileText, 
  Cpu, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  Briefcase, 
  Award, 
  ShieldCheck 
} from "lucide-react";
import "../assets/DashboardPremium.css";

export default function DashboardPremium() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Professional");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  
  // Simulated stats
  const [stats, setStats] = useState({ Resumes: 0, MatchScore: 0, JobsApplied: 0, QualityRating: 0 });

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "Professional");
    
    // Timer
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Stats counting animation with spring-like increments
  useEffect(() => {
    const targets = { Resumes: 8, MatchScore: 88, JobsApplied: 14, QualityRating: 92 };
    const duration = 1200;
    const steps = 40;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const ease = 1 - Math.pow(1 - progress, 4); // Quartic ease out
      
      setStats({
        Resumes: Math.round(ease * targets.Resumes),
        MatchScore: Math.round(ease * targets.MatchScore),
        JobsApplied: Math.round(ease * targets.JobsApplied),
        QualityRating: Math.round(ease * targets.QualityRating)
      });

      if (currentStep >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      title: "AI Resume Optimization",
      desc: "Instantly tailor resume text, correct line breaks, and match key concepts to target job descriptions.",
      icon: <Cpu size={20} />,
      path: "/optimizer",
      badge: "Highly Popular",
      color: "#7c3aed"
    },
    {
      title: "Quality Compliance Audit",
      desc: "Audit contact completeness, keyword density, and layout compliance against corporate applicant tracking filters.",
      icon: <ShieldCheck size={20} />,
      path: "/ats",
      badge: "Core Filter",
      color: "#3b82f6"
    },
    {
      title: "Resume Summary Generator",
      desc: "Create dynamic job-specific intro paragraphs and adjust focus tone (Executive, Technical, or Metrics) with one click.",
      icon: <Sparkles size={20} />,
      path: "/summary-generator",
      badge: "Enhancv Premium",
      color: "#10b981"
    },
    {
      title: "Mock Interview Console",
      desc: "Simulate live interactive interviews with our AI, receive instant feedback reports, and track performance scores.",
      icon: <Briefcase size={20} />,
      path: "/interview",
      badge: "Nexus Engine",
      color: "#f59e0b"
    }
  ];

  return (
    <motion.div 
      className="db-prem-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="db-prem-glow-1" />
      <div className="db-prem-glow-2" />

      <div className="db-prem-container">
        
        {/* Header Greeting Row */}
        <div className="db-prem-header-section">
          <div className="db-prem-welcome">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              System Overview, <span className="db-prem-welcome-name">{userName}</span>
            </motion.h1>
            <p>Welcome back. AI models are online. Your profile match data has been compiled.</p>
          </div>
          <div className="db-prem-time">
            <div className="db-prem-time-num">{currentTime}</div>
            <div className="db-prem-time-date">{currentDate}</div>
          </div>
        </div>

        {/* Bento Grid layout */}
        <div className="db-prem-bento">
          
          {/* Main Hero Insight Banner (col-span-8) */}
          <motion.div 
            className="db-prem-card col-span-8 db-prem-hero-insight"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="db-prem-insight-tag">
              <span className="db-prem-insight-tag-dot" />
              <span>AI Insight Recommendation</span>
            </div>
            
            <div className="db-prem-insight-content">
              <h2>Your resume match is active</h2>
              <p>
                We scanned your current resume files against your target roles. Integrating 3 additional technical skills (Docker, AWS, and TypeScript) will boost your matching likelihood by up to <strong>24%</strong> for Front-End Developer roles.
              </p>
            </div>

            <div className="db-prem-progress-row">
              <div className="db-prem-progress-bar-wrap">
                <div className="db-prem-progress-bar">
                  <motion.div 
                    className="db-prem-progress-bar-fill" 
                    initial={{ width: 0 }}
                    animate={{ width: "88%" }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <div className="db-prem-progress-labels">
                  <span>Current Match Potential</span>
                  <span>88% Match Rate</span>
                </div>
              </div>

              <div className="db-prem-score-pill">
                <span className="db-prem-score-pill-num">{stats.MatchScore}%</span>
                <span className="db-prem-score-pill-lbl">ATS Health</span>
              </div>
            </div>
          </motion.div>

          {/* Stat Rings Widget (col-span-4) */}
          <motion.div 
            className="db-prem-card col-span-4 db-prem-rings-card"
            whileHover={{ y: -2 }}
          >
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resource Status
            </h3>

            <div className="db-prem-rings-grid">
              {[
                { value: stats.Resumes, label: "Resumes", color: "#7c3aed", pct: 75 },
                { value: stats.JobsApplied, label: "Target Jobs", color: "#3b82f6", pct: 60 },
                { value: `${stats.QualityRating}%`, label: "Quality Score", color: "#10b981", pct: 92 },
                { value: "Active", label: "Simulator", color: "#f59e0b", pct: 85 }
              ].map((ring, idx) => {
                const r = 18;
                const circ = 2 * Math.PI * r;
                const offset = circ - (ring.pct / 100) * circ;
                
                return (
                  <div key={idx} className="db-prem-ring-item">
                    <svg width="60" height="60" viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                      <motion.circle 
                        cx="30" 
                        cy="30" 
                        r={r} 
                        fill="none" 
                        stroke={ring.color} 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.2, delay: idx * 0.1 }}
                        transform="rotate(-90 30 30)"
                      />
                    </svg>
                    <div className="db-prem-ring-center">
                      <span className="db-prem-ring-val">{ring.value}</span>
                      <span className="db-prem-ring-lbl">{ring.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Header for Features grid */}
          <div className="db-prem-features-title">
            Product Controls & Engines
          </div>

          {/* 4 Feature Bento grids (each col-span-6 on desktop) */}
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="db-prem-card col-span-6 db-prem-feature-card"
              onClick={() => navigate(feature.path)}
              whileHover={{ y: -4, borderColor: feature.color }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.08 }}
            >
              <div>
                <div 
                  className="db-prem-feature-icon" 
                  style={{ background: `${feature.color}15`, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
              
              <div className="db-prem-feature-card-footer" style={{ color: feature.color }}>
                <span>Launch Controller</span>
                <span className="db-prem-feature-card-arrow">→</span>
              </div>
            </motion.div>
          ))}
          
        </div>

        {/* Brand Logo Wall - Credibility Verification (Apple-adjacent design rules) */}
        <div className="db-prem-logos-section">
          <span className="db-prem-logos-title">Linked Corporate Integrations & ATS Compatibility</span>
          <div className="db-prem-logos-wrap">
            {/* Vercel logo */}
            <div className="db-prem-logo">
              <svg viewBox="0 0 76 65" width="24" height="22" fill="currentColor">
                <path d="M37.527 0L75.054 65H0L37.527 0Z" />
              </svg>
            </div>
            
            {/* Shopify logo */}
            <div className="db-prem-logo">
              <svg viewBox="0 0 135 39" width="75" height="22" fill="currentColor">
                <path d="M12.9 8.2c-.4-1.2-1.5-2-2.8-2H8.3v4.6h1.8c1.3 0 2.4-.8 2.8-2.1l.5-1.5zm.3 6.9c-.3 1-1.3 1.7-2.4 1.7H7.2V11h3.6c1.1 0 2.1.7 2.4 1.8l.5 1.5c.1.3.1.6 0 .8zM24.7 6.2c-1.3 0-2.3 1.1-2.3 2.4s1 2.4 2.3 2.4 2.3-1.1 2.3-2.4-1-2.4-2.3-2.4z" opacity="0.8" />
                <rect x="36" y="8" width="8" height="20" rx="4" />
                <rect x="52" y="8" width="16" height="20" rx="4" />
                <rect x="76" y="8" width="12" height="20" rx="4" />
                <rect x="96" y="8" width="22" height="20" rx="4" />
              </svg>
            </div>

            {/* GitHub logo */}
            <div className="db-prem-logo">
              <svg viewBox="0 0 16 16" width="22" height="22" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z" />
              </svg>
            </div>
            
            {/* Stripe logo */}
            <div className="db-prem-logo">
              <svg viewBox="0 0 80 33" width="55" height="22" fill="currentColor">
                <path d="M10.3 14.3c0-2.3 1.8-3.7 4.7-3.7 1.8 0 3.3.4 4.3.9V6.2C18.1 5.6 16.2 5.3 14.3 5.3c-6.1 0-10.2 3.3-10.2 9.5 0 9.2 12.5 7.7 12.5 11.8 0 2.6-2.2 3.9-5.4 3.9-2.2 0-4.3-.6-5.8-1.4v5.4c1.8.8 4.1 1.2 6.2 1.2 6.5 0 10.8-3.2 10.8-9.7-.1-9.6-12.1-7.8-12.1-11.7z" />
                <rect x="29" y="10" width="6" height="22" rx="2" />
                <path d="M49 10v4.6h4.5v5.4H49v8c0 1.5.8 2.2 2.2 2.2.8 0 1.6-.1 2.2-.3v5.2c-.8.3-2.1.5-3.6.5-5 0-6.8-2.6-6.8-7.6V10H49z" />
                <rect x="62" y="10" width="6" height="22" rx="2" />
              </svg>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

// Dashboard.jsx - Updated with Feature Cards
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileSearch, 
  Sparkles, 
  Target,
  Monitor,
  Palette,
  Zap
} from "lucide-react";
import FeatureCard from "../components/FeatureCard";
import "../assets/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  const [metrics] = useState({
    totalResumes: 31,
    savedJobs: 14,
    applications: 78,
    aiRecommendations: 85,
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }));
      setCurrentDate(now.toLocaleDateString('en-US', { 
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // In Dashboard.jsx - Updated feature cards data

// In Dashboard.jsx
const featureCards = [
  {
    id: 1,
    title: "AI Resume Analysis",
    description: "Our AI scans your resume against job descriptions to identify gaps and suggest improvements that boost your ATS score.",
    icon: "📄",
    gradient: "linear-gradient(137deg, #7C3AED 0%, #A78BFA 45%, #6D28D9 100%)",
    delay: 0.1
  },
  {
    id: 2,
    title: "Smart Keyword Optimization",
    description: "Automatically detect missing keywords from job descriptions and seamlessly integrate them into your resume for better matching.",
    icon: "✨",
    gradient: "linear-gradient(137deg, #3B82F6 0%, #60A5FA 45%, #2563EB 100%)",
    delay: 0.2
  },
  {
    id: 3,
    title: "ATS Score Predictor",
    description: "Get real-time ATS compatibility scores and actionable insights to improve your chances of landing interviews.",
    icon: "🎯",
    gradient: "linear-gradient(137deg, #10B981 0%, #34D399 45%, #059669 100%)",
    delay: 0.3
  }
];

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-page-content">
        {/* Hero Section with Animated Particles */}
        <section className="hero-premium">
          <div className="hero-background-glow"></div>
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          
          <div className="hero-premium-content">
            <div className="hero-premium-left">
              <div className="hero-badge">
                <span className="badge-dot"></span>
                Welcome back
              </div>
              <h1 className="hero-premium-title">
                Good Afternoon, <span className="gradient-text">John</span> 👋
              </h1>
              <p className="hero-premium-subtitle">
                Keep pushing forward! Your next opportunity is closer than you think.
              </p>
              
              <div className="hero-premium-stats">
                <div className="hero-premium-stat">
                  <div className="stat-ring">
                    <svg className="ring-svg" viewBox="0 0 120 120">
                      <circle className="ring-bg" cx="60" cy="60" r="54" />
                      <circle className="ring-progress" cx="60" cy="60" r="54" style={{ strokeDasharray: 339.292, strokeDashoffset: 67.858 }} />
                    </svg>
                    <div className="stat-ring-content">
                      <span className="stat-ring-value">{metrics.totalResumes}</span>
                      <span className="stat-ring-label">Resumes</span>
                    </div>
                  </div>
                </div>
                <div className="hero-premium-stat">
                  <div className="stat-ring">
                    <svg className="ring-svg" viewBox="0 0 120 120">
                      <circle className="ring-bg" cx="60" cy="60" r="54" />
                      <circle className="ring-progress blue" cx="60" cy="60" r="54" style={{ strokeDasharray: 339.292, strokeDashoffset: 101.788 }} />
                    </svg>
                    <div className="stat-ring-content">
                      <span className="stat-ring-value">{metrics.savedJobs}</span>
                      <span className="stat-ring-label">Jobs Analyzed</span>
                    </div>
                  </div>
                </div>
                <div className="hero-premium-stat">
                  <div className="stat-ring">
                    <svg className="ring-svg" viewBox="0 0 120 120">
                      <circle className="ring-bg" cx="60" cy="60" r="54" />
                      <circle className="ring-progress orange" cx="60" cy="60" r="54" style={{ strokeDasharray: 339.292, strokeDashoffset: 74.644 }} />
                    </svg>
                    <div className="stat-ring-content">
                      <span className="stat-ring-value">78%</span>
                      <span className="stat-ring-label">ATS Match</span>
                    </div>
                  </div>
                </div>
                <div className="hero-premium-stat">
                  <div className="stat-ring">
                    <svg className="ring-svg" viewBox="0 0 120 120">
                      <circle className="ring-bg" cx="60" cy="60" r="54" />
                      <circle className="ring-progress green" cx="60" cy="60" r="54" style={{ strokeDasharray: 339.292, strokeDashoffset: 50.894 }} />
                    </svg>
                    <div className="stat-ring-content">
                      <span className="stat-ring-value">85%</span>
                      <span className="stat-ring-label">Profile Strength</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-premium-actions">
                <button className="btn-premium-primary" onClick={() => navigate('/resumes')}>
                  <span className="btn-icon">↑</span>
                  Upload Resume
                </button>
                <button className="btn-premium-secondary" onClick={() => navigate('/optimizer')}>
                  <span className="btn-icon">⚡</span>
                  Optimize Resume
                </button>
              </div>
            </div>

            <div className="hero-premium-right">
              <div className="hero-orbital">
                <div className="orbital-ring ring-1"></div>
                <div className="orbital-ring ring-2"></div>
                <div className="orbital-ring ring-3"></div>
                <div className="orbital-center">◆</div>
                <div className="orbital-dot dot-1"></div>
                <div className="orbital-dot dot-2"></div>
                <div className="orbital-dot dot-3"></div>
                <div className="orbital-dot dot-4"></div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Recommendation Card - Premium */}
        <section className="ai-premium-card">
          <div className="ai-premium-glow"></div>
          <div className="ai-premium-content">
            <div className="ai-premium-header">
              <span className="ai-premium-icon">✦</span>
              <span className="ai-premium-label">AI Insight</span>
              <span className="ai-premium-badge">Live</span>
            </div>
            <p className="ai-premium-text">
              Tailoring your resume for <strong>Front-End Developer at TradeLab</strong> could improve your ATS score by
            </p>
            <div className="ai-premium-score">
              <div className="ai-score-display">
                <span className="ai-score-number">24</span>
                <span className="ai-score-percent">%</span>
              </div>
              <div className="ai-score-visual">
                <div className="score-bar">
                  <div className="score-bar-fill" style={{ width: '24%' }}></div>
                </div>
                <div className="score-labels">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
            <button className="ai-premium-action" onClick={() => navigate('/optimizer')}>
              Optimize Now
              <span className="action-arrow">→</span>
            </button>
          </div>
        </section>

        {/* Premium Stats Grid with Glassmorphism */}
        <div className="stats-premium-grid">
          <div className="stat-premium-card card-glow-purple">
            <div className="stat-premium-icon">📄</div>
            <div className="stat-premium-info">
              <span className="stat-premium-value">31</span>
              <span className="stat-premium-label">Resumes</span>
              <span className="stat-premium-trend">↑ 12% this month</span>
            </div>
            <div className="stat-premium-chart">
              <svg viewBox="0 0 60 20" className="mini-chart">
                <polyline points="0,15 10,8 20,12 30,5 40,10 50,3 60,7" />
              </svg>
            </div>
          </div>

          <div className="stat-premium-card card-glow-blue">
            <div className="stat-premium-icon">💼</div>
            <div className="stat-premium-info">
              <span className="stat-premium-value">14</span>
              <span className="stat-premium-label">Jobs Analyzed</span>
              <span className="stat-premium-trend">↑ 8% this month</span>
            </div>
            <div className="stat-premium-chart">
              <svg viewBox="0 0 60 20" className="mini-chart">
                <polyline points="0,10 10,5 20,8 30,12 40,4 50,7 60,3" />
              </svg>
            </div>
          </div>

          <div className="stat-premium-card card-glow-orange">
            <div className="stat-premium-icon">🎯</div>
            <div className="stat-premium-info">
              <span className="stat-premium-value">78%</span>
              <span className="stat-premium-label">ATS Match</span>
              <span className="stat-premium-trend">Top 10%</span>
            </div>
            <div className="stat-premium-progress">
              <div className="premium-progress-bar" style={{ width: '78%' }}></div>
            </div>
          </div>

          <div className="stat-premium-card card-glow-green">
            <div className="stat-premium-icon">💪</div>
            <div className="stat-premium-info">
              <span className="stat-premium-value">85%</span>
              <span className="stat-premium-label">Profile Strength</span>
              <span className="stat-premium-trend">Nearly Complete</span>
            </div>
            <div className="stat-premium-progress">
              <div className="premium-progress-bar gradient" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>

        {/* Feature Cards Section */}
 
{/* Feature Cards Section - Premium Style */}
<div className="features-section">
  <div className="features-header">
    <div>
      <span className="features-eyebrow">✦ Premium Features</span>
      <h2 className="features-title">Built for modern workflows</h2>
    </div>
    <button className="features-view-all">
      View All Features →
    </button>
  </div>
  
  <div className="features-grid">
    {featureCards.map((card) => (
      <FeatureCard
        key={card.id}
        title={card.title}
        description={card.description}
        icon={card.icon}
        gradient={card.gradient}
        delay={card.delay}
      />
    ))}
  </div>
</div>

        {/* Bottom Section */}
        <div className="dashboard-bottom-grid">
          {/* Workspace */}
          <section className="workspace-premium">
            <div className="workspace-premium-header">
              <h2>Your Workspace</h2>
              <button className="view-all" onClick={() => navigate('/resumes')}>View All →</button>
            </div>
            <div className="workspace-premium-grid">
              <div className="workspace-premium-item" onClick={() => navigate('/resumes')}>
                <div className="workspace-premium-icon">📄</div>
                <div>
                  <h4>Recent Resumes</h4>
                  <p>View and manage your resumes</p>
                </div>
                <span className="workspace-premium-arrow">→</span>
              </div>
              <div className="workspace-premium-item" onClick={() => navigate('/jobs')}>
                <div className="workspace-premium-icon">💼</div>
                <div>
                  <h4>Saved Jobs</h4>
                  <p>Jobs you've saved for later</p>
                </div>
                <span className="workspace-premium-arrow">→</span>
              </div>
              <div className="workspace-premium-item highlight" onClick={() => navigate('/optimizer')}>
                <div className="workspace-premium-icon">🤖</div>
                <div>
                  <h4>AI Recommendations</h4>
                  <p>Personalized jobs for you</p>
                </div>
                <span className="workspace-premium-arrow">→</span>
              </div>
            </div>
          </section>

          {/* Weather & Time Widget */}
          <section className="widget-premium">
            <div className="widget-time">
              <div className="widget-time-display">
                <span className="widget-time-large">{currentTime}</span>
                <span className="widget-time-date">{currentDate}</span>
              </div>
              <div className="widget-weather">
                <span className="widget-weather-icon">☀️</span>
                <div>
                  <span className="widget-weather-temp">30°C</span>
                  <span className="widget-weather-desc">Mostly clear</span>
                </div>
              </div>
            </div>
            <div className="widget-language">
              <span className="widget-lang">ENG</span>
              <span className="widget-lang">IN</span>
              <span className="widget-lang active">23:09</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
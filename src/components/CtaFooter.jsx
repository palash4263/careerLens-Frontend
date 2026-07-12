import React from "react";
import { Link } from "react-router-dom";
import "./CtaFooter.css";

const CtaFooter = () => {
  return (
    <footer className="aesthetic-footer">
      <div className="footer-glow" />
      <div className="footer-container">
        <div className="footer-top">
          {/* Logo & Brand Info */}
          <div className="footer-brand">
            <Link to="/dashboard" className="footer-logo">
              <div className="footer-logo-orb">
                <span className="footer-logo-icon">✦</span>
                <div className="footer-logo-ring" />
              </div>
              <span className="footer-logo-text">
                Career<span className="footer-logo-accent">Lens</span>
              </span>
            </Link>
            <p className="footer-tagline">
              Empowering job seekers with AI-driven resume optimization, real-time job matching, and interactive interview intelligence.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="footer-links-col">
            <h4>Application</h4>
            <div className="footer-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/resumes">Resumes</Link>
              <Link to="/resume-optimizer">Resume Optimizer</Link>
              <Link to="/jobs">Job Matches</Link>
              <Link to="/interview">Mock Interview</Link>
            </div>
          </div>

          {/* Developer / Creator info column */}
          <div className="footer-links-col">
            <h4>Creator & Contact</h4>
            <div className="footer-links">
              <span className="footer-contact-item">
                📧 <a href="mailto:palashmishra47@gmail.com">palashmishra47@gmail.com</a>
              </span>
              <span className="footer-contact-item">
                💼 <a href="https://linkedin.com/in/palash-mishra-6a68a71aa" target="_blank" rel="noopener noreferrer">LinkedIn Profile</a>
              </span>
              <span className="footer-contact-item">
                🌐 <a href="https://github.com/palash4263" target="_blank" rel="noopener noreferrer">GitHub Account</a>
              </span>
            </div>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-copy">
            © 2026 CareerLens AI. Crafted for maximum career impact. All rights reserved.
          </p>
          <div className="footer-meta-links">
            <span className="footer-status-indicator">
              <span className="status-dot green" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CtaFooter;

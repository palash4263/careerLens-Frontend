// src/components/CtaFooter.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Mail, Compass, Cpu, Target, Award, Globe, Code } from "lucide-react";
import "./CtaFooter.css";

const CtaFooter = () => {
  return (
    <footer className="cf-footer-root">
      <div className="cf-footer-glow-top" />
      
      <div className="cf-footer-wrap">
        <div className="cf-footer-grid">
          
          {/* Brand Column */}
          <div className="cf-brand-col">
            <Link to="/dashboard" className="cf-logo-link">
              <div className="cf-logo-orb">
                <Cpu size={18} />
              </div>
              <span className="cf-logo-text">
                Career<span className="cf-logo-highlight">Lens</span>
              </span>
              <span className="cf-version-tag">v4.1</span>
            </Link>
            <p className="cf-brand-desc">
              Your AI-powered career co-pilot. We analyze, optimize, and supercharge your job search with deep intelligence.
            </p>
            <div className="cf-live-status">
              <span className="cf-status-dot" />
              All Systems Operational
            </div>
          </div>

          {/* Platform Column */}
          <div className="cf-links-col">
            <h4 className="cf-col-title">
              <Target size={14} /> Platform
            </h4>
            <div className="cf-links-list">
              <Link to="/resumes"><Sparkles size={14} /> Resume AI Scanner</Link>
              <Link to="/optimizer"><Compass size={14} /> Keyword Optimizer</Link>
              <Link to="/ats-calculator"><ShieldCheck size={14} /> ATS Predictor</Link>
              <Link to="/jobs"><Globe size={14} /> Job Board</Link>
            </div>
          </div>

          {/* Resources Column */}
          <div className="cf-links-col">
            <h4 className="cf-col-title">
              <Code size={14} /> Resources
            </h4>
            <div className="cf-links-list">
              <a href="#" className="cf-contact-link"><Award size={14} /> Interview Prep Hub</a>
              <a href="#" className="cf-contact-link"><Mail size={14} /> Contact Support</a>
              <a href="#" className="cf-contact-link">Privacy Policy</a>
              <a href="#" className="cf-contact-link">Terms of Service</a>
            </div>
          </div>

        </div>

        <div className="cf-footer-divider" />

        <div className="cf-footer-bottom">
          <span className="cf-copy">
            &copy; {new Date().getFullYear()} CareerLens AI. All rights reserved.
          </span>
          <div className="cf-live-status" style={{ color: '#64748b' }}>
            Built with ❤️ for Job Seekers
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CtaFooter;

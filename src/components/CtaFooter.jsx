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
        
        {/* Main Grid */}
        <div className="cf-footer-grid">
          
          {/* Brand Column */}
          <div className="cf-brand-col">
            <Link to="/dashboard" className="cf-logo-link">
              <div className="cf-logo-orb">
                <Sparkles size={16} className="cf-sparkle" />
              </div>
              <span className="cf-logo-text">
                Career<span className="cf-logo-highlight">Lens</span>
              </span>
              <span className="cf-version-tag">AI v4.1</span>
            </Link>
            
            <p className="cf-brand-desc">
              Next-generation AI Career Platform. Empowering job seekers with real-time resume optimization, 
              ATS compliance analysis, and tailored 20-question interview preparation consoles.
            </p>

            <div className="cf-live-status">
              <span className="cf-status-dot" />
              <span>AI Neural Engine Active & Operational</span>
            </div>
          </div>

          {/* Core Tools Links */}
          <div className="cf-links-col">
            <h4 className="cf-col-title">
              <Compass size={14} />
              <span>Core Tools</span>
            </h4>
            <div className="cf-links-list">
              <Link to="/dashboard">⊞ Dashboard</Link>
              <Link to="/resumes">📄 Resume Studio</Link>
              <Link to="/resume-optimizer">⚡ AI Optimizer</Link>
              <Link to="/templates">🎨 Templates Gallery</Link>
              <Link to="/ats-calculator">📊 ATS Score Calculator</Link>
              <Link to="/jobs">🎯 Job Tracker & Prep</Link>
            </div>
          </div>

          {/* Contact & Developer */}
          <div className="cf-links-col">
            <h4 className="cf-col-title">
              <Cpu size={14} />
              <span>Creator & Connect</span>
            </h4>
            <div className="cf-links-list">
              <a href="mailto:palashmishra47@gmail.com" className="cf-contact-link">
                <Mail size={14} />
                <span>palashmishra47@gmail.com</span>
              </a>
              <a href="https://linkedin.com/in/palash-mishra-6a68a71aa" target="_blank" rel="noopener noreferrer" className="cf-contact-link">
                <Globe size={14} />
                <span>LinkedIn Profile</span>
              </a>
              <a href="https://github.com/palash4263" target="_blank" rel="noopener noreferrer" className="cf-contact-link">
                <Code size={14} />
                <span>GitHub Portfolio</span>
              </a>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="cf-footer-divider" />

        {/* Bottom Bar */}
        <div className="cf-footer-bottom">
          <div className="cf-copy">
            © 2026 <strong>CareerLens AI</strong>. Designed & Engineered for Maximum Career Impact.
          </div>
          <div className="cf-badges">
            <span className="cf-mini-badge">🛡️ 100% ATS Compliant</span>
            <span className="cf-mini-badge">⚡ Instant AI Synthesis</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default CtaFooter;

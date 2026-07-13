import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "./CtaFooter.css";

const CtaFooter = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.15,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.footer 
      className="aesthetic-footer"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={containerVariants}
    >
      <div className="footer-glow" />
      <div className="footer-container">
        <div className="footer-top">
          {/* Logo & Brand Info */}
          <motion.div className="footer-brand" variants={itemVariants}>
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
          </motion.div>

          {/* Quick Links Column */}
          <motion.div className="footer-links-col" variants={itemVariants}>
            <h4>Application</h4>
            <div className="footer-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/resumes">Resumes</Link>
              <Link to="/resume-optimizer">Resume Optimizer</Link>
              <Link to="/jobs">Job Matches</Link>
            </div>
          </motion.div>

          {/* Developer / Creator info column */}
          <motion.div className="footer-links-col" variants={itemVariants}>
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
          </motion.div>
        </div>

        <motion.div className="footer-divider" variants={itemVariants} />

        <motion.div className="footer-bottom" variants={itemVariants}>
          <p className="footer-copy">
            © 2026 CareerLens AI. Crafted for maximum career impact. All rights reserved.
          </p>
          <div className="footer-meta-links">
            <span className="footer-status-indicator">
              <span className="status-dot green" />
              All Systems Operational
            </span>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default CtaFooter;

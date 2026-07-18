// src/components/resume/ScanCompletionModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, FileText, Download, Edit3, X, Sparkles, ArrowRight } from "lucide-react";
import "./ScanCompletionModal.css";

export default function ScanCompletionModal({
  isOpen,
  onClose,
  score = 94,
  title = "ATS Audit & Optimization Complete",
  subtitle = "Your resume has been processed against target ATS parsing algorithms.",
  onDownload,
  onEdit,
  keywordsCount = 12,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="scm-overlay" onClick={onClose}>
        {/* Particle confetti burst rays */}
        <div className="scm-ray-burst" />

        <motion.div
          className="scm-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <button className="scm-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>

          {/* Central Pulsing Radar Target */}
          <div className="scm-radar-wrapper">
            <div className="scm-pulse-ring ring-1" />
            <div className="scm-pulse-ring ring-2" />
            <div className="scm-pulse-ring ring-3" />
            <div className="scm-icon-circle">
              <CheckCircle2 size={38} className="scm-check-icon" />
            </div>
          </div>

          <div className="scm-header">
            <span className="scm-badge">
              <Sparkles size={12} />
              <span>ATS PARSER COMPLETED</span>
            </span>
            <h2 className="scm-title">{title}</h2>
            <p className="scm-subtitle">{subtitle}</p>
          </div>

          {/* Stats Bar */}
          <div className="scm-stats-grid">
            <div className="scm-stat-box">
              <span className="scm-stat-val">{score}%</span>
              <span className="scm-stat-lbl">MATCH SCORE</span>
            </div>
            <div className="scm-stat-divider" />
            <div className="scm-stat-box">
              <span className="scm-stat-val">+{keywordsCount}</span>
              <span className="scm-stat-lbl">KEYWORDS MATCHED</span>
            </div>
            <div className="scm-stat-divider" />
            <div className="scm-stat-box">
              <span className="scm-stat-val">100%</span>
              <span className="scm-stat-lbl">ATS PARSABLE</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="scm-actions">
            {onDownload && (
              <button className="scm-btn-primary" onClick={onDownload}>
                <Download size={16} />
                <span>Download PDF</span>
              </button>
            )}
            {onEdit && (
              <button className="scm-btn-secondary" onClick={onEdit}>
                <Edit3 size={16} />
                <span>Open Live Editor</span>
              </button>
            )}
            <button className="scm-btn-ghost" onClick={onClose}>
              <span>Close</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// src/components/resume/ScanCompletionModal.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Download, Edit3, X, Sparkles, Trophy, Target, ShieldCheck } from "lucide-react";
import "./ScanCompletionModal.css";

// Multi-color particle burst component
function ConfettiParticleBurst() {
  const particles = Array.from({ length: 32 }, (_, i) => {
    const angle = (i / 32) * (2 * Math.PI) + (Math.random() * 0.4 - 0.2);
    const distance = 120 + Math.random() * 140;
    const colors = ["#a3e635", "#38bdf8", "#a855f7", "#fbbf24", "#f43f5e", "#34d399"];
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 20,
      scale: 0.5 + Math.random() * 0.7,
      color: colors[i % colors.length],
      rotate: Math.random() * 360,
      delay: Math.random() * 0.1,
    };
  });

  return (
    <div className="scm-confetti-container" aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="scm-confetti-piece"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [1, 1, 0],
            scale: [0, p.scale, 0.2],
            rotate: p.rotate + 180,
          }}
          transition={{
            duration: 1.2,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}
    </div>
  );
}

// Animated Stat Counter
function StatCounter({ targetValue, prefix = "", suffix = "", duration = 1000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(targetValue, 10);
    if (isNaN(end)) {
      setCount(targetValue);
      return;
    }
    const stepTime = Math.max(16, Math.floor(duration / end));
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        clearInterval(timer);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [targetValue, duration]);

  return (
    <span>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

export default function ScanCompletionModal({
  isOpen,
  onClose,
  score = 95,
  title = "PDF Resume Compiled & Exported!",
  subtitle = "Your ATS-optimized executive PDF resume has been generated and saved successfully.",
  onDownload,
  onEdit,
  keywordsCount = 12,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="scm-overlay" onClick={onClose}>
        {/* Confetti Explosion */}
        <ConfettiParticleBurst />

        {/* Ambient Radial Background Glow */}
        <div className="scm-ambient-glow" />

        <motion.div
          className="scm-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.82, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 24 }}
        >
          {/* Close Button */}
          <button className="scm-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>

          {/* Glowing Animated Success Target */}
          <div className="scm-target-wrapper">
            <div className="scm-pulse-ring ring-1" />
            <div className="scm-pulse-ring ring-2" />
            <div className="scm-pulse-ring ring-3" />
            <motion.div
              className="scm-icon-circle"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.15 }}
            >
              <Check size={32} className="scm-check-icon" strokeWidth={3} />
            </motion.div>
          </div>

          {/* Header Info */}
          <div className="scm-header">
            <motion.span 
              className="scm-badge"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles size={12} className="scm-sparkle-spin" />
              <span>ATS PARSER COMPLETED</span>
            </motion.span>
            <h2 className="scm-title">{title}</h2>
            <p className="scm-subtitle">{subtitle}</p>
          </div>

          {/* Animated Stats Bar */}
          <motion.div 
            className="scm-stats-grid"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="scm-stat-box">
              <div className="scm-stat-header">
                <Trophy size={13} className="scm-stat-icon" />
                <span className="scm-stat-val">
                  <StatCounter targetValue={score} suffix="%" />
                </span>
              </div>
              <span className="scm-stat-lbl">MATCH SCORE</span>
            </div>

            <div className="scm-stat-divider" />

            <div className="scm-stat-box">
              <div className="scm-stat-header">
                <Target size={13} className="scm-stat-icon" />
                <span className="scm-stat-val">
                  <StatCounter targetValue={keywordsCount} prefix="+" />
                </span>
              </div>
              <span className="scm-stat-lbl">KEYWORDS MATCHED</span>
            </div>

            <div className="scm-stat-divider" />

            <div className="scm-stat-box">
              <div className="scm-stat-header">
                <ShieldCheck size={13} className="scm-stat-icon" />
                <span className="scm-stat-val">
                  <StatCounter targetValue={100} suffix="%" />
                </span>
              </div>
              <span className="scm-stat-lbl">ATS PARSABLE</span>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="scm-actions"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {onDownload && (
              <button className="scm-btn-primary" onClick={onDownload}>
                <Download size={16} />
                <span>Download PDF Resume</span>
                <span className="scm-btn-shimmer" />
              </button>
            )}
            {onEdit && (
              <button className="scm-btn-secondary" onClick={onEdit}>
                <Edit3 size={15} />
                <span>Back to Live Editor</span>
              </button>
            )}
            <button className="scm-btn-ghost" onClick={onClose}>
              <span>Close</span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

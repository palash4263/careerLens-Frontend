import React from "react";
import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Select Resume",
    desc: "Upload or choose your existing PDF CV. AI parses structural blocks.",
    icon: "📄",
    color: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.15)",
  },
  {
    step: "02",
    title: "Set Target Role",
    desc: "Paste or select a job description. Groq AI indexes required tech skills.",
    icon: "🎯",
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.15)",
  },
  {
    step: "03",
    title: "Run AI Optimizer",
    desc: "Groq Llama 3 models inject missing phrases and score adjustments.",
    icon: "⚡",
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.15)",
  },
  {
    step: "04",
    title: "Export Styled CV",
    desc: "Verify ATS compatibility score and download recruiter-ready PDF.",
    icon: "🏆",
    color: "#fbbf24",
    glow: "rgba(251, 191, 36, 0.15)",
  },
];

export const ResumeOptimizationFlow = () => {
  return (
    <div className="opt-flow-container">
      <h3 className="opt-flow-title">How It Works</h3>
      <div className="opt-flow-steps">
        {steps.map((s, idx) => (
          <div key={idx} className="opt-flow-step-wrapper">
            <motion.div
              className="opt-flow-step"
              style={{ '--step-color': s.color, '--step-glow': s.glow }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="opt-flow-badge">{s.step}</div>
              <div className="opt-flow-icon-wrapper">
                <span className="opt-flow-icon">{s.icon}</span>
              </div>
              <h4 className="opt-flow-step-title">{s.title}</h4>
              <p className="opt-flow-step-desc">{s.desc}</p>
            </motion.div>
            {idx < steps.length - 1 && (
              <div className="opt-flow-connector">
                <div className="connector-line"></div>
                <div className="connector-dot" style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}` }}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResumeOptimizationFlow;

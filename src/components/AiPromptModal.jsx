// src/components/AiPromptModal.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Wand2, Zap, Target, ShieldCheck, Rocket } from "lucide-react";
import "./AiPromptModal.css";

export default function AiPromptModal({ isOpen, onClose, onGenerate, title, defaultHint = "" }) {
  const [promptText, setPromptText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPromptText("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const PRESETS = [
    { icon: "🚀", label: "FAANG / Big Tech Scale", prompt: "Highlight high-throughput microservices, sub-50ms P99 latency, and large-scale cloud infrastructure." },
    { icon: "⚡", label: "High-Growth Startup", prompt: "Emphasize rapid MVP prototyping, full-stack agility, end-to-end ownership, and product speed." },
    { icon: "📊", label: "Quantifiable Metrics", prompt: "Focus heavily on measurable impact: % latency reduction, $ cost savings, and 99.9% uptime." },
    { icon: "🛡️", label: "Enterprise Security & DevOps", prompt: "Highlight OAuth2/JWT security protocols, Docker container orchestration, and automated CI/CD pipelines." },
    { icon: "🎯", label: "Leadership & Mentorship", prompt: "Emphasize leading sprint teams of engineers, code reviews, and accelerating developer onboarding." },
  ];

  const handleQuickPreset = (p) => {
    setPromptText(prev => prev ? `${prev} ${p}` : p);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onGenerate(promptText);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="aip-overlay" onClick={onClose}>
        <motion.div
          className="aip-modal-card"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="aip-header">
            <div className="aip-title-group">
              <div className="aip-icon-badge">
                <Sparkles size={18} color="#a855f7" className="aip-sparkle" />
              </div>
              <div>
                <h3 className="aip-title">{title || "Custom AI Prompt"}</h3>
                <p className="aip-subtitle">Add custom instructions or pick a 1-click prompt preset below.</p>
              </div>
            </div>
            <button className="aip-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="aip-body">
            <div className="aip-textarea-group">
              <label className="aip-label">YOUR CUSTOM AI INSTRUCTION / PROMPT</label>
              <textarea
                className="aip-textarea"
                rows={4}
                autoFocus
                placeholder={defaultHint || "e.g. Focus on React, Node.js microservices, Kafka streaming, and 40% performance improvement..."}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              />
            </div>

            {/* Quick Prompt Presets */}
            <div className="aip-presets-section">
              <span className="aip-presets-label"><Zap size={13} color="#f59e0b" /> QUICK 1-CLICK PROMPT PRESETS:</span>
              <div className="aip-presets-grid">
                {PRESETS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="aip-preset-chip"
                    onClick={() => handleQuickPreset(item.prompt)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="aip-actions">
              <button type="button" className="aip-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="aip-btn-generate" disabled={loading}>
                <Wand2 size={16} />
                <span>{loading ? "AI Generating..." : "Generate with AI Prompt"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// src/components/jobs/InterviewQuestionsModal.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Sparkles, Check, Copy, HelpCircle, ChevronDown, ChevronUp,
  Brain, Code, Users, Award, ExternalLink
} from "lucide-react";
import { generateInterviewQuestions } from "../../utils/interviewQuestionGenerator";
import "./InterviewQuestionsModal.css";

export default function InterviewQuestionsModal({ isOpen, onClose, job }) {
  if (!isOpen || !job) return null;

  const questions = generateInterviewQuestions(job);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedQ, setExpandedQ] = useState("q1");
  const [copiedId, setCopiedId] = useState(null);

  const filteredQuestions = activeTab === "all" 
    ? questions 
    : questions.filter(q => q.type === activeTab);

  const handleCopy = (q) => {
    const textToCopy = `Question: ${q.question}\n\nIdeal Answer:\n${q.idealAnswer}\n\nKey Talking Points:\n${q.talkingPoints.map(p => `• ${p}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case "Hard": return { bg: "rgba(239, 68, 68, 0.12)", color: "#f87171", border: "rgba(239, 68, 68, 0.3)" };
      case "Medium": return { bg: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" };
      default: return { bg: "rgba(16, 185, 129, 0.12)", color: "#34d399", border: "rgba(16, 185, 129, 0.3)" };
    }
  };

  return (
    <div className="iqm-overlay" onClick={onClose}>
      <motion.div
        className="iqm-card"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        {/* Header */}
        <div className="iqm-header">
          <div className="iqm-header-title-group">
            <div className="iqm-header-badge">
              <Sparkles size={14} className="iqm-sparkle-spin" />
              <span>AI INTERVIEW PREP CONSOLE</span>
            </div>
            <h2 className="iqm-job-title">{job.title}</h2>
            <p className="iqm-company-name">🏢 {job.company || "Target Company"} • {questions.length} Tailored Questions Generated</p>
          </div>
          <button className="iqm-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="iqm-tabs">
          {[
            { id: "all", label: `All Questions (${questions.length})`, icon: Brain },
            { id: "technical", label: "Technical & System Design", icon: HelpCircle },
            { id: "coding", label: "Coding & Frameworks", icon: Code },
            { id: "behavioral", label: "Behavioral & STAR", icon: Users },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`iqm-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Questions Body */}
        <div className="iqm-body">
          <AnimatePresence mode="wait">
            {filteredQuestions.map((q) => {
              const isExpanded = expandedQ === q.id;
              const diffStyle = getDifficultyColor(q.difficulty);
              const isCopied = copiedId === q.id;

              return (
                <motion.div
                  key={q.id}
                  className={`iqm-q-item ${isExpanded ? "expanded" : ""}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="iqm-q-header" onClick={() => setExpandedQ(isExpanded ? null : q.id)}>
                    <div className="iqm-q-title-row">
                      <span className="iqm-q-category">{q.category}</span>
                      <span className="iqm-q-diff" style={{ background: diffStyle.bg, color: diffStyle.color, borderColor: diffStyle.border }}>
                        {q.difficulty}
                      </span>
                    </div>
                    <h3 className="iqm-q-question">{q.question}</h3>
                    <div className="iqm-q-controls">
                      <button
                        className="iqm-copy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(q);
                        }}
                        title="Copy Question & Talking Points"
                      >
                        {isCopied ? <Check size={13} style={{ color: "#a3e635" }} /> : <Copy size={13} />}
                        <span>{isCopied ? "Copied!" : "Copy Q&A"}</span>
                      </button>
                      <button className="iqm-expand-btn">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Talking Points & Answer */}
                  {isExpanded && (
                    <motion.div
                      className="iqm-q-content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      {/* Talking Points */}
                      <div className="iqm-section">
                        <h4 className="iqm-section-label">🎯 Key Talking Points & Metrics</h4>
                        <ul className="iqm-points-list">
                          {q.talkingPoints.map((point, idx) => (
                            <li key={idx}>
                              <span className="iqm-point-bullet">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Sample Ideal Answer */}
                      <div className="iqm-section answer">
                        <h4 className="iqm-section-label">💡 Sample Ideal Answer</h4>
                        <p className="iqm-answer-text">"{q.idealAnswer}"</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Platform Links */}
        <div className="iqm-platforms">
          <div className="iqm-platforms-label">
            <ExternalLink size={13} />
            <span>Practice more questions on</span>
          </div>
          <div className="iqm-platforms-links">
            {[
              { name: "LeetCode",      url: "https://leetcode.com/problemset/", color: "#f59e0b",  icon: "⚡" },
              { name: "InterviewBit",  url: "https://www.interviewbit.com/",    color: "#38bdf8",  icon: "🎯" },
              { name: "Glassdoor",     url: "https://www.glassdoor.com/Interview/index.htm", color: "#34d399", icon: "💬" },
              { name: "Pramp",         url: "https://www.pramp.com/",           color: "#a78bfa",  icon: "🤝" },
              { name: "GeeksForGeeks", url: "https://www.geeksforgeeks.org/interview-preparation-for-software-developer/", color: "#4ade80", icon: "📚" },
              { name: "HackerRank",    url: "https://www.hackerrank.com/interview/preparation-kit", color: "#22d3ee", icon: "🏆" },
            ].map(p => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="iqm-platform-chip"
                style={{ "--chip-color": p.color }}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
                <ExternalLink size={10} style={{ opacity: 0.6 }} />
              </a>
            ))}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="iqm-footer">
          <div className="iqm-footer-left">
            <Award size={14} style={{ color: "#a3e635" }} />
            <span>20 questions tailored to target job parameters</span>
          </div>
          <button className="iqm-btn-done" onClick={onClose}>
            <span>Done Reviewing</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

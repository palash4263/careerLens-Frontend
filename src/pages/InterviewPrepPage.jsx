// src/pages/InterviewPrepPage.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Sparkles, Check, Copy, HelpCircle, ChevronDown, ChevronUp,
  Brain, Code, Code2, Users, Award, ExternalLink, BookOpen, Target, ShieldCheck
} from "lucide-react";
import { generateInterviewQuestions } from "../utils/interviewQuestionGenerator";
import { getJobDescriptions } from "../services/jobDescriptionService";
import CtaFooter from "../components/CtaFooter";
import CodeEditorSandbox from "../components/CodeEditorSandbox";
import "./InterviewPrepPage.css";

export default function InterviewPrepPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedQ, setExpandedQ] = useState("q1");
  const [activeSandboxId, setActiveSandboxId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobData() {
      setLoading(true);
      // 1. Check if job object was passed via router state
      if (location.state?.job) {
        const j = location.state.job;
        setJob(j);
        setQuestions(generateInterviewQuestions(j));
        setLoading(false);
        return;
      }

      // 2. Check query params or route params
      const searchParams = new URLSearchParams(location.search);
      const targetId = jobId || searchParams.get("jobId");

      if (targetId) {
        try {
          const allJobs = await getJobDescriptions();
          const found = allJobs.find((item) => String(item.id) === String(targetId));
          if (found) {
            setJob(found);
            setQuestions(generateInterviewQuestions(found));
          } else {
            fallbackDefaultJob();
          }
        } catch (err) {
          console.error("Error fetching job for interview prep:", err);
          fallbackDefaultJob();
        }
      } else {
        fallbackDefaultJob();
      }
      setLoading(false);
    }

    function fallbackDefaultJob() {
      const defaultJ = {
        title: "Senior Full Stack Engineer",
        company: "Target Tech Corp",
        description: "Looking for an engineer skilled in React, Node.js, TypeScript, PostgreSQL, and System Design.",
      };
      setJob(defaultJ);
      setQuestions(generateInterviewQuestions(defaultJ));
    }

    loadJobData();
  }, [location, jobId]);

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
      case "Hard":   return { bg: "rgba(239, 68, 68, 0.14)",  color: "#f87171", border: "rgba(239, 68, 68, 0.35)" };
      case "Medium": return { bg: "rgba(245, 158, 11, 0.14)", color: "#fbbf24", border: "rgba(245, 158, 11, 0.35)" };
      default:       return { bg: "rgba(16, 185, 129, 0.14)", color: "#34d399", border: "rgba(16, 185, 129, 0.35)" };
    }
  };

  if (loading) {
    return (
      <div className="ip-loading-container">
        <div className="ip-spinner"></div>
        <p>Generating AI Interview Intelligence Console...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="ip-page-wrapper"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="ip-container">
        
        {/* Top Breadcrumb Nav & Controls */}
        <div className="ip-top-bar">
          <button className="ip-back-btn" onClick={() => navigate("/jobs")}>
            <ArrowLeft size={16} />
            <span>Back to Job Tracker</span>
          </button>
          <div className="ip-live-badge">
            <span className="ip-pulse-dot" />
            <span>AI INTERVIEW STUDIO</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="ip-hero-card">
          <div className="ip-hero-glow" />
          <div className="ip-hero-content">
            <div className="ip-hero-badge">
              <Sparkles size={14} className="ip-sparkle-spin" />
              <span>20 TAILORED QUESTIONS GENERATED</span>
            </div>
            <h1 className="ip-job-title">{job?.title || "Target Software Engineer"}</h1>
            <p className="ip-company-subtitle">
              🏢 <strong>{job?.company || "Target Company"}</strong> · Custom Interview Preparation Suite & STAR Answers
            </p>
          </div>

          <div className="ip-hero-stats">
            <div className="ip-stat-chip">
              <span className="ip-stat-val">20</span>
              <span className="ip-stat-lbl">Questions</span>
            </div>
            <div className="ip-stat-chip">
              <span className="ip-stat-val">100%</span>
              <span className="ip-stat-lbl">Role Match</span>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="ip-main-layout">
          
          {/* Left Column: Questions List & Tabs */}
          <div className="ip-left-col">
            
            {/* Filter Tabs */}
            <div className="ip-tabs-bar">
              {[
                { id: "all",        label: `All Questions (${questions.length})`, icon: Brain },
                { id: "technical",  label: "Technical & System Design",          icon: HelpCircle },
                { id: "coding",     label: "Coding & Algorithms",                icon: Code },
                { id: "behavioral", label: "Behavioral & STAR",                  icon: Users },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    className={`ip-tab-btn ${isActive ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Questions List */}
            <div className="ip-questions-list">
              <AnimatePresence mode="wait">
                {filteredQuestions.map((q, idx) => {
                  const isExpanded = expandedQ === q.id;
                  const diffStyle = getDifficultyColor(q.difficulty);
                  const isCopied = copiedId === q.id;

                  return (
                    <motion.div
                      key={q.id}
                      className={`ip-q-card ${isExpanded ? "expanded" : ""}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="ip-q-header" onClick={() => setExpandedQ(isExpanded ? null : q.id)}>
                        <div className="ip-q-meta">
                          <span className="ip-q-num">Q{idx + 1}</span>
                          <span className="ip-q-category">{q.category}</span>
                          <span className="ip-q-diff" style={{ background: diffStyle.bg, color: diffStyle.color, borderColor: diffStyle.border }}>
                            {q.difficulty}
                          </span>
                        </div>
                        <h3 className="ip-q-title">{q.question}</h3>

                        <div className="ip-q-actions">
                          <div className="ip-q-actions-left">
                            <button
                              className="ip-copy-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(q);
                              }}
                              title="Copy Q&A to Clipboard"
                            >
                              {isCopied ? <Check size={14} style={{ color: "#34d399" }} /> : <Copy size={14} />}
                              <span>{isCopied ? "Copied!" : "Copy Q&A"}</span>
                            </button>

                            {q.leetcodeUrl && (
                              <a
                                href={q.leetcodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ip-leetcode-btn"
                                onClick={(e) => e.stopPropagation()}
                                title={`Open LeetCode #${q.leetcodeNum} in a new tab`}
                              >
                                <span>⚡</span>
                                <span>LeetCode #{q.leetcodeNum}</span>
                                <ExternalLink size={12} />
                              </a>
                            )}

                            <button
                              className={`ip-sandbox-toggle-btn ${activeSandboxId === q.id ? "active" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isExpanded) setExpandedQ(q.id);
                                setActiveSandboxId(activeSandboxId === q.id ? null : q.id);
                              }}
                              title="Toggle Live Code Editor Sandbox"
                            >
                              <Code2 size={13} />
                              <span>{activeSandboxId === q.id ? "Close Editor" : "Live Sandbox"}</span>
                            </button>
                          </div>

                          <button className="ip-toggle-btn">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <motion.div
                          className="ip-q-body"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="ip-section">
                            <h4 className="ip-section-title">🎯 Key Talking Points & Metrics</h4>
                            <ul className="ip-points-list">
                              {q.talkingPoints.map((point, pIdx) => (
                                <li key={pIdx}>
                                  <span className="ip-bullet">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="ip-section answer">
                            <h4 className="ip-section-title">💡 Sample Ideal STAR Answer</h4>
                            <p className="ip-answer-text">"{q.idealAnswer}"</p>
                          </div>

                          {/* Live Coding Sandbox Panel */}
                          {(activeSandboxId === q.id || q.type === "coding") && (
                            <CodeEditorSandbox question={q} />
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Tips & External Platforms */}
          <div className="ip-right-col">
            
            {/* STAR Framework Helper Box */}
            <div className="ip-sidebar-card">
              <div className="ip-sidebar-header">
                <ShieldCheck size={18} style={{ color: "#38bdf8" }} />
                <h3>STAR Method Cheat Sheet</h3>
              </div>
              <div className="ip-star-steps">
                <div className="ip-star-step">
                  <span className="ip-star-letter">S</span>
                  <div><strong>Situation</strong>: Set the scene and context clearly.</div>
                </div>
                <div className="ip-star-step">
                  <span className="ip-star-letter">T</span>
                  <div><strong>Task</strong>: Describe your responsibility and target outcome.</div>
                </div>
                <div className="ip-star-step">
                  <span className="ip-star-letter">A</span>
                  <div><strong>Action</strong>: Detail your exact technical steps & trade-offs.</div>
                </div>
                <div className="ip-star-step">
                  <span className="ip-star-letter">R</span>
                  <div><strong>Result</strong>: Quantify metrics (e.g., +40% speed, 99.9% uptime).</div>
                </div>
              </div>
            </div>

            {/* External Practice Platforms */}
            <div className="ip-sidebar-card">
              <div className="ip-sidebar-header">
                <ExternalLink size={18} style={{ color: "#a78bfa" }} />
                <h3>Practice Platforms</h3>
              </div>
              <p className="ip-platforms-desc">Need more practice? Access full coding problem sets and peer interview practice:</p>
              
              <div className="ip-platforms-grid">
                {[
                  { name: "LeetCode",      url: "https://leetcode.com/problemset/", icon: "⚡", color: "#f59e0b" },
                  { name: "InterviewBit",  url: "https://www.interviewbit.com/",    icon: "🎯", color: "#38bdf8" },
                  { name: "Glassdoor",     url: "https://www.glassdoor.com/Interview/index.htm", icon: "💬", color: "#34d399" },
                  { name: "Pramp",         url: "https://www.pramp.com/",           icon: "🤝", color: "#a78bfa" },
                  { name: "GeeksForGeeks", url: "https://www.geeksforgeeks.org/interview-preparation-for-software-developer/", icon: "📚", color: "#4ade80" },
                  { name: "HackerRank",    url: "https://www.hackerrank.com/interview/preparation-kit", icon: "🏆", color: "#22d3ee" },
                ].map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ip-platform-link-chip"
                    style={{ "--chip-glow": p.color }}
                  >
                    <span className="chip-icon">{p.icon}</span>
                    <span className="chip-name">{p.name}</span>
                    <ExternalLink size={12} className="chip-ext" />
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
      <CtaFooter />
    </motion.div>
  );
}

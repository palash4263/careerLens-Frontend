// src/pages/InterviewPrepPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Sparkles, Check, Copy, HelpCircle, ChevronRight, Play, RefreshCw,
  Brain, Code, Award, Target, BookOpen, Layers, Cpu, CheckCircle2, ChevronDown, ChevronUp,
  Users, ExternalLink, ShieldCheck, Briefcase
} from "lucide-react";
import { JAVA_TOPICS, ALL_JAVA_TOPIC_LIST } from "../utils/javaLearningTopics";
import { generateInterviewQuestions } from "../utils/interviewQuestionGenerator";
import { getJobDescriptions } from "../services/jobDescriptionService";
import CodeEditorSandbox from "../components/CodeEditorSandbox";
import "./InterviewPrepPage.css";

export default function InterviewPrepPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();

  // Mode switcher: 'job-questions' (Job Specific AI Q&A) vs 'java-tutor' (Topic Learning)
  const [viewMode, setViewMode] = useState(() => {
    return (location.state?.job || jobId || new URLSearchParams(location.search).get("jobId"))
      ? "job-questions"
      : "java-tutor";
  });

  // ─── 1. JOB INTERVIEW QUESTIONS STATE ───
  const [job, setJob] = useState(null);
  const [jobQuestions, setJobQuestions] = useState([]);
  const [activeJobTab, setActiveJobTab] = useState("all");
  const [expandedQ, setExpandedQ] = useState("q1");
  const [copiedId, setCopiedId] = useState(null);
  const [loadingJob, setLoadingJob] = useState(false);

  // ─── 2. JAVA TUTOR TOPIC LEARNING STATE ───
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSection, setActiveSection] = useState("intro");
  const [jvmStep, setJvmStep] = useState(0);
  const [userQuizAnswers, setUserQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [expandedInterviewQ, setExpandedInterviewQ] = useState(null);

  // Progress tracking in LocalStorage
  const [progressMap, setProgressMap] = useState(() => {
    try {
      const saved = localStorage.getItem("cl_java_topic_progress");
      return saved ? JSON.parse(saved) : { constructors: { percent: 68, status: "In Progress", score: null } };
    } catch (e) {
      return {};
    }
  });

  const [lastTopicId, setLastTopicId] = useState(() => {
    return localStorage.getItem("cl_last_java_topic") || "constructors";
  });

  useEffect(() => {
    localStorage.setItem("cl_java_topic_progress", JSON.stringify(progressMap));
  }, [progressMap]);

  // Load Job Data if in job-questions mode or URL param exists
  useEffect(() => {
    async function loadJobData() {
      setLoadingJob(true);
      if (location.state?.job) {
        const j = location.state.job;
        setJob(j);
        setJobQuestions(generateInterviewQuestions(j));
        setLoadingJob(false);
        return;
      }

      const searchParams = new URLSearchParams(location.search);
      const targetId = jobId || searchParams.get("jobId");

      if (targetId) {
        try {
          const allJobs = await getJobDescriptions();
          const found = allJobs.find((item) => String(item.id) === String(targetId));
          if (found) {
            setJob(found);
            setJobQuestions(generateInterviewQuestions(found));
          } else {
            fallbackDefaultJob();
          }
        } catch (err) {
          fallbackDefaultJob();
        }
      } else {
        fallbackDefaultJob();
      }
      setLoadingJob(false);
    }

    function fallbackDefaultJob() {
      const defaultJ = {
        title: "Senior Full Stack Engineer",
        company: "Target Tech Corp",
        description: "Looking for an engineer skilled in React, Node.js, TypeScript, PostgreSQL, Java, and System Design.",
      };
      setJob(defaultJ);
      setJobQuestions(generateInterviewQuestions(defaultJ));
    }

    loadJobData();
  }, [location, jobId]);

  // Topic lookup
  const activeTopic = JAVA_TOPICS.find(t => t.id === selectedTopicId) || null;

  // Filtered Onboarding Topic List
  const filteredTopics = ALL_JAVA_TOPIC_LIST.filter(t => {
    const matchesCat = activeCategory === "All" || t.category === activeCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredJobQuestions = activeJobTab === "all"
    ? jobQuestions
    : jobQuestions.filter(q => q.type === activeJobTab);

  const handleCopyJobQ = (q) => {
    const textToCopy = `Question: ${q.question}\n\nIdeal Answer:\n${q.idealAnswer}\n\nKey Talking Points:\n${q.talkingPoints.map(p => `• ${p}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSelectTopic = (topicId) => {
    setSelectedTopicId(topicId);
    setLastTopicId(topicId);
    localStorage.setItem("cl_last_java_topic", topicId);
    setActiveSection("intro");
    setJvmStep(0);
    setQuizSubmitted(false);
    setUserQuizAnswers({});
    setQuizScore(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuizOptionSelect = (qIdx, optIdx) => {
    if (quizSubmitted) return;
    setUserQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitQuiz = () => {
    if (!activeTopic || !activeTopic.quiz) return;
    let correct = 0;
    activeTopic.quiz.forEach((q, idx) => {
      if (userQuizAnswers[idx] === q.answer) correct++;
    });
    const pct = Math.round((correct / activeTopic.quiz.length) * 100);
    setQuizScore(pct);
    setQuizSubmitted(true);

    setProgressMap(prev => ({
      ...prev,
      [activeTopic.id]: {
        ...prev[activeTopic.id],
        percent: 100,
        status: "Completed",
        score: pct,
        lastOpened: new Date().toISOString()
      }
    }));
  };

  const categories = [
    "All", "Core Java & Syntax", "OOP Concepts", "JVM & Memory",
    "Collections & Multithreading", "Modern Java (8+)", "Database & Files", "Interview Core"
  ];

  const getDiffBadge = (diff) => {
    if (diff === "Advanced" || diff === "Hard") return { bg: "rgba(239, 68, 68, 0.14)", color: "#f87171" };
    if (diff === "Intermediate" || diff === "Medium") return { bg: "rgba(245, 158, 11, 0.14)", color: "#fbbf24" };
    return { bg: "rgba(16, 185, 129, 0.14)", color: "#34d399" };
  };

  const renderStars = (num) => "★".repeat(num) + "☆".repeat(5 - num);

  return (
    <div className="ip-onboarding-wrapper">
      <div className="ip-onboarding-container">

        {/* Global Top Bar & Mode Switcher */}
        <div className="ip-global-top-bar">
          <button className="ip-back-btn" onClick={() => navigate("/jobs")}>
            <ArrowLeft size={16} />
            <span>Back to Job Tracker</span>
          </button>

          {/* Mode Switcher Tabs */}
          <div className="ip-mode-switcher-pills">
            <button
              className={`ip-mode-pill ${viewMode === "job-questions" ? "active" : ""}`}
              onClick={() => setViewMode("job-questions")}
            >
              <Briefcase size={15} />
              <span>Job Interview Questions ({jobQuestions.length})</span>
            </button>

            <button
              className={`ip-mode-pill ${viewMode === "java-tutor" ? "active" : ""}`}
              onClick={() => setViewMode("java-tutor")}
            >
              <Brain size={15} />
              <span>Personalized Java AI Tutor (25 Topics)</span>
            </button>
          </div>

          <div className="ip-live-badge">
            <span className="ip-pulse-dot" />
            <span>AI INTERVIEW STUDIO</span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
           VIEW MODE 1: JOB INTERVIEW QUESTIONS CONSOLE (20 Tailored Qs)
        ────────────────────────────────────────────────────────────── */}
        {viewMode === "job-questions" && (
          <motion.div className="ip-job-mode-wrapper" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Job Hero Banner */}
            <div className="ip-hero-card">
              <div className="ip-hero-glow" />
              <div className="ip-hero-content">
                <div className="ip-hero-badge">
                  <Sparkles size={14} className="ip-sparkle-spin" />
                  <span>{jobQuestions.length} TAILORED QUESTIONS GENERATED</span>
                </div>
                <h1 className="ip-job-title">{job?.title || "Target Software Engineer"}</h1>
                <p className="ip-company-subtitle">
                  🏢 <strong>{job?.company || "Target Company"}</strong> · Custom Role Interview Questions, STAR Answers & Coding Sandboxes
                </p>
              </div>

              <div className="ip-hero-stats">
                <div className="ip-stat-chip">
                  <span className="ip-stat-val">{jobQuestions.length}</span>
                  <span className="ip-stat-lbl">Questions</span>
                </div>
                <div className="ip-stat-chip">
                  <span className="ip-stat-val">100%</span>
                  <span className="ip-stat-lbl">Role Match</span>
                </div>
              </div>
            </div>

            {/* Questions Filter Tabs */}
            <div className="ip-tabs-bar" style={{ marginTop: 24, marginBottom: 20 }}>
              {[
                { id: "all",        label: `All Questions (${jobQuestions.length})`, icon: Brain },
                { id: "technical",  label: "Technical & System Design",          icon: HelpCircle },
                { id: "coding",     label: "Coding & Algorithms",                icon: Code },
                { id: "behavioral", label: "Behavioral & STAR",                  icon: Users },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeJobTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    className={`ip-tab-btn ${isActive ? "active" : ""}`}
                    onClick={() => setActiveJobTab(tab.id)}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Questions List */}
            <div className="ip-questions-list">
              {filteredJobQuestions.map((q, idx) => {
                const isExpanded = expandedQ === q.id;
                const diffStyle = getDiffBadge(q.difficulty);
                const isCopied = copiedId === q.id;

                return (
                  <div key={q.id} className={`ip-q-card ${isExpanded ? "expanded" : ""}`}>
                    <div className="ip-q-header" onClick={() => setExpandedQ(isExpanded ? null : q.id)}>
                      <div className="ip-q-meta">
                        <span className="ip-q-num">Q{idx + 1}</span>
                        <span className="ip-q-cat">{q.category}</span>
                        <span className="ip-diff-pill" style={{ background: diffStyle.bg, color: diffStyle.color }}>
                          {q.difficulty}
                        </span>
                      </div>
                      <h3 className="ip-q-text">{q.question}</h3>
                      <span className="ip-q-toggle">{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                    </div>

                    {isExpanded && (
                      <div className="ip-q-body">
                        {q.idealAnswer && (
                          <div className="ip-ans-section">
                            <span className="ip-ans-lbl">Ideal Answer & STAR Framework:</span>
                            <p className="ip-ans-txt">{q.idealAnswer}</p>
                          </div>
                        )}

                        {q.talkingPoints && q.talkingPoints.length > 0 && (
                          <div className="ip-points-section">
                            <span className="ip-ans-lbl">Key Interview Talking Points:</span>
                            <ul>
                              {q.talkingPoints.map((pt, pIdx) => <li key={pIdx}>{pt}</li>)}
                            </ul>
                          </div>
                        )}

                        {q.type === "coding" && (
                          <div className="ip-sandbox-box">
                            <span className="ip-ans-lbl">💻 Live Interactive Code Sandbox:</span>
                            <CodeEditorSandbox qId={q.id} initialCode={q.initialCode} />
                          </div>
                        )}

                        <div className="ip-q-actions">
                          <button className="ip-action-btn" onClick={() => handleCopyJobQ(q)}>
                            {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                            <span>{isCopied ? "Copied to Clipboard!" : "Copy Q&A"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────────────────────
           VIEW MODE 2: PERSONALIZED JAVA AI TUTOR (25 Topics & Workspace)
        ────────────────────────────────────────────────────────────── */}
        {viewMode === "java-tutor" && (
          <motion.div className="ip-tutor-mode-wrapper" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Landing Experience (No topic selected) */}
            {!selectedTopicId ? (
              <div className="ip-landing-experience">
                {/* AI Mentor Greeting Text Header */}
                <div className="ip-greeting-hero">
                  <div className="ip-hero-pill">
                    <Sparkles size={14} className="ip-sparkle-spin" />
                    <span>PERSONALIZED JAVA AI MENTOR</span>
                  </div>

                  <h1 className="ip-greeting-title">
                    What Java topic would you like to learn today?
                  </h1>
                  <p className="ip-greeting-subtitle">
                    Select a core concept below to launch your dedicated interactive learning workspace with JVM visualizers, live code sandbox, and interview Q&A.
                  </p>

                  {/* Resume Learning Card */}
                  {ALL_JAVA_TOPIC_LIST.find(t => t.id === lastTopicId) && (
                    <div className="ip-resume-card">
                      <div className="ip-resume-left">
                        <span className="ip-resume-icon">{ALL_JAVA_TOPIC_LIST.find(t => t.id === lastTopicId).icon}</span>
                        <div>
                          <span className="ip-resume-badge">WELCOME BACK · CONTINUE LESSON</span>
                          <h4 className="ip-resume-title">{ALL_JAVA_TOPIC_LIST.find(t => t.id === lastTopicId).title}</h4>
                          <div className="ip-resume-prog-bar">
                            <div className="ip-resume-fill" style={{ width: `${(progressMap[lastTopicId] || { percent: 68 }).percent}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="ip-resume-right">
                        <span className="ip-resume-pct">{(progressMap[lastTopicId] || { percent: 68 }).percent}% Complete</span>
                        <button className="ip-resume-btn" onClick={() => handleSelectTopic(lastTopicId)}>
                          <Play size={14} />
                          <span>Resume Workspace</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Filter Pills & Search */}
                <div className="ip-controls-bar" style={{ marginTop: 24 }}>
                  <div className="ip-categories-row">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        className={`ip-cat-btn ${activeCategory === cat ? "active" : ""}`}
                        onClick={() => setActiveCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="ip-search-input"
                    placeholder="🔍 Search Java topic e.g. Constructors, Streams, JVM Memory..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* 25 Interactive Topic Cards Grid */}
                <div className="ip-topics-grid" style={{ marginTop: 20 }}>
                  {filteredTopics.map(t => {
                    const prog = progressMap[t.id] || { percent: 0, status: "Not Started" };
                    const diff = getDiffBadge(t.difficulty);

                    return (
                      <motion.div
                        key={t.id}
                        className="ip-topic-card"
                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        onClick={() => handleSelectTopic(t.id)}
                      >
                        <div className="ip-card-header">
                          <span className="ip-topic-icon">{t.icon}</span>
                          <span className="ip-diff-badge" style={{ background: diff.bg, color: diff.color }}>
                            {t.difficulty}
                          </span>
                        </div>

                        <h3 className="ip-card-title">{t.title}</h3>
                        <p className="ip-card-desc">"{t.desc}"</p>

                        <div className="ip-card-meta">
                          <span>⏱ {t.time}</span>
                          <span className="ip-stars" title="Interview Importance">{renderStars(t.stars)}</span>
                        </div>

                        <div className="ip-card-footer">
                          <div className="ip-prog-container">
                            <div className="ip-prog-bar">
                              <div className="ip-prog-fill" style={{ width: `${prog.percent}%` }} />
                            </div>
                            <span className="ip-prog-text">
                              {prog.status === "Completed" ? "✓ Completed" : prog.percent > 0 ? `${prog.percent}% In Progress` : "Not Started"}
                            </span>
                          </div>
                          <button className="ip-launch-btn">
                            <span>Start Workspace</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Dedicated Workspace Mode (Topic Selected) */
              <div className="ip-dedicated-workspace">
                <div className="ip-ws-topbar">
                  <button className="ip-ws-back" onClick={() => setSelectedTopicId(null)}>
                    <ArrowLeft size={16} />
                    <span>Choose Another Topic</span>
                  </button>
                  <div className="ip-ws-topic-title">
                    <span className="ip-ws-icon">{activeTopic?.icon || "📦"}</span>
                    <span className="ip-ws-name">{activeTopic?.title || "Constructors"}</span>
                    <span className="ip-ws-diff">{activeTopic?.difficulty || "Beginner"}</span>
                  </div>
                  <div className="ip-ws-prog">
                    <span>Progress: {(progressMap[selectedTopicId] || { percent: 68 }).percent}%</span>
                    <div className="ip-ws-pbar"><div className="ip-ws-pfill" style={{ width: `${(progressMap[selectedTopicId] || { percent: 68 }).percent}%` }} /></div>
                  </div>
                </div>

                {/* AI Tutor Goal Banner */}
                <div className="ip-ai-tutor-banner" style={{ marginTop: 20 }}>
                  <div className="ip-tutor-avatar">🤖</div>
                  <div className="ip-tutor-info">
                    <div className="ip-tutor-greeting">
                      <span>AI MENTOR LESSON</span> · Today we're going to learn <strong>{activeTopic?.title}</strong>
                    </div>
                    <div className="ip-tutor-goals-grid">
                      {(activeTopic?.objectives || []).map((obj, i) => (
                        <div key={i} className="ip-tutor-goal-item">
                          <CheckCircle2 size={14} className="ip-goal-check" />
                          <span>{obj}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ip-tutor-chips">
                    <div className="ip-chip">⏱ {activeTopic?.time || "15 mins"}</div>
                    <div className="ip-chip">★ {renderStars(activeTopic?.importance || 5)} Interview Importance</div>
                  </div>
                </div>

                {/* Workspace Layout */}
                <div className="ip-ws-layout" style={{ marginTop: 24 }}>
                  <div className="ip-ws-sidebar">
                    <div className="ip-sidebar-heading">DYNAMIC LESSON PATH</div>
                    {[
                      { id: "intro",     label: "1. Introduction & Overview", icon: BookOpen },
                      { id: "why",       label: "2. Why & Core Concepts",      icon: Target },
                      { id: "jvm",       label: "3. JVM Animation & Memory",  icon: Cpu },
                      { id: "code",      label: "4. Practice Code Sandbox",    icon: Code },
                      { id: "quiz",      label: "5. Knowledge Check & Quiz",   icon: Award },
                      { id: "interview", label: "6. FAANG Interview Q&A",      icon: Brain },
                    ].map(sec => {
                      const Icon = sec.icon;
                      const isActive = activeSection === sec.id;
                      return (
                        <button
                          key={sec.id}
                          className={`ip-sidebar-nav-btn ${isActive ? "active" : ""}`}
                          onClick={() => setActiveSection(sec.id)}
                        >
                          <Icon size={15} />
                          <span>{sec.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="ip-ws-main-panel">
                    {activeSection === "intro" && (
                      <div className="ip-section-box">
                        <h2>{activeTopic?.icon} Introduction to {activeTopic?.title}</h2>
                        <p className="ip-lead-paragraph">{activeTopic?.theory?.intro}</p>
                        <div className="ip-callout-box">🎯 <strong>Learning Goal:</strong> Master {activeTopic?.title?.toLowerCase()} for clean code & technical interviews.</div>
                        <h3>Key Characteristics & Variants</h3>
                        <div className="ip-types-grid">
                          {(activeTopic?.theory?.types || []).map((t, idx) => (
                            <div key={idx} className="ip-type-card">
                              <h4>{t.name}</h4>
                              <p>{t.desc}</p>
                              {t.code && <pre className="ip-code-snippet"><code>{t.code}</code></pre>}
                            </div>
                          ))}
                        </div>
                        <div className="ip-nav-actions">
                          <button className="ip-next-sec-btn" onClick={() => setActiveSection("why")}><span>Next: Why & Core Concepts</span><ChevronRight size={16} /></button>
                        </div>
                      </div>
                    )}

                    {activeSection === "why" && (
                      <div className="ip-section-box">
                        <h2>🎯 Why {activeTopic?.title}?</h2>
                        <p className="ip-lead-paragraph">{activeTopic?.theory?.why}</p>
                        <h3>⚠️ Common Pitfalls & Mistakes</h3>
                        <div className="ip-mistakes-list">
                          {(activeTopic?.theory?.mistakes || []).map((m, idx) => (
                            <div key={idx} className="ip-mistake-card"><span className="ip-warning-icon">⚠️</span><p>{m}</p></div>
                          ))}
                        </div>
                        <div className="ip-nav-actions">
                          <button className="ip-next-sec-btn" onClick={() => setActiveSection("jvm")}><span>Next: JVM Animation</span><ChevronRight size={16} /></button>
                        </div>
                      </div>
                    )}

                    {activeSection === "jvm" && (
                      <div className="ip-section-box">
                        <h2>🧠 JVM Internal Working & Memory Allocation</h2>
                        <div className="ip-jvm-controls">
                          <button className="ip-jvm-btn" disabled={jvmStep === 0} onClick={() => setJvmStep(s => Math.max(0, s - 1))}>◀ Previous Step</button>
                          <span className="ip-jvm-step-badge">Step {jvmStep + 1} of {(activeTopic?.jvmSteps || []).length || 5}</span>
                          <button className="ip-jvm-btn primary" disabled={jvmStep === (activeTopic?.jvmSteps || []).length - 1} onClick={() => setJvmStep(s => Math.min((activeTopic?.jvmSteps || []).length - 1, s + 1))}>Next Step ▶</button>
                        </div>
                        {activeTopic?.jvmSteps && activeTopic.jvmSteps[jvmStep] && (
                          <div className="ip-step-info-card">
                            <h4>Step {activeTopic.jvmSteps[jvmStep].step}: {activeTopic.jvmSteps[jvmStep].title}</h4>
                            <p>{activeTopic.jvmSteps[jvmStep].desc}</p>
                          </div>
                        )}
                        <div className="ip-jvm-canvas">
                          <div className="ip-jvm-area metaspace">
                            <span className="ip-area-title">METASPACE</span>
                            <div className="ip-area-box highlight"><code>{activeTopic?.title}.class</code></div>
                          </div>
                          <div className="ip-jvm-area stack">
                            <span className="ip-area-title">STACK MEMORY</span>
                            <div className={`ip-area-box ${jvmStep >= 3 ? "active-frame" : ""}`}><code>{activeTopic?.title}() Frame</code></div>
                            <div className="ip-area-box"><code>main() Frame</code></div>
                          </div>
                          <div className="ip-jvm-area heap">
                            <span className="ip-area-title">HEAP MEMORY</span>
                            <div className={`ip-heap-object ${jvmStep >= 2 ? "allocated" : ""}`}>
                              <div className="ip-obj-header">0x7f81a: {activeTopic?.title} Object</div>
                              <div className="ip-obj-field">status = {jvmStep >= 3 ? 'Initialized' : 'Default (0)'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="ip-nav-actions">
                          <button className="ip-next-sec-btn" onClick={() => setActiveSection("code")}><span>Next: Practice Code Sandbox</span><ChevronRight size={16} /></button>
                        </div>
                      </div>
                    )}

                    {activeSection === "code" && (
                      <div className="ip-section-box">
                        <h2>💻 Interactive Code Sandbox & Console</h2>
                        <CodeEditorSandbox qId={activeTopic?.id} initialCode={activeTopic?.codeSandbox?.initialCode || ""} />
                        <div className="ip-nav-actions" style={{ marginTop: 24 }}>
                          <button className="ip-next-sec-btn" onClick={() => setActiveSection("quiz")}><span>Next: Quiz</span><ChevronRight size={16} /></button>
                        </div>
                      </div>
                    )}

                    {activeSection === "quiz" && (
                      <div className="ip-section-box">
                        <h2>🏆 Knowledge Assessment Quiz</h2>
                        <div className="ip-quiz-container">
                          {(activeTopic?.quiz || []).map((q, qIdx) => (
                            <div key={qIdx} className="ip-quiz-card">
                              <h4 className="ip-quiz-question">Q{qIdx + 1}. {q.question}</h4>
                              <div className="ip-quiz-options">
                                {q.options.map((opt, optIdx) => {
                                  const isSelected = userQuizAnswers[qIdx] === optIdx;
                                  let optClass = "ip-quiz-opt";
                                  if (isSelected) optClass += " selected";
                                  if (quizSubmitted) {
                                    if (optIdx === q.answer) optClass += " correct";
                                    else if (isSelected && optIdx !== q.answer) optClass += " wrong";
                                  }
                                  return (
                                    <div key={optIdx} className={optClass} onClick={() => handleQuizOptionSelect(qIdx, optIdx)}>
                                      <span className="ip-opt-bullet">{String.fromCharCode(65 + optIdx)}</span>
                                      <span>{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              {quizSubmitted && <div className="ip-quiz-explanation">💡 <strong>Explanation:</strong> {q.explanation}</div>}
                            </div>
                          ))}
                          {!quizSubmitted ? (
                            <button className="ip-submit-quiz-btn" onClick={handleSubmitQuiz}>Submit Assessment & Save Progress</button>
                          ) : (
                            <div className="ip-quiz-result-banner">🎉 <strong>Assessment Completed!</strong> Score: {quizScore}%</div>
                          )}
                        </div>
                        <div className="ip-nav-actions">
                          <button className="ip-next-sec-btn" onClick={() => setActiveSection("interview")}><span>Next: Interview Q&A</span><ChevronRight size={16} /></button>
                        </div>
                      </div>
                    )}

                    {activeSection === "interview" && (
                      <div className="ip-section-box">
                        <h2>🎯 Top FAANG Technical Interview Questions</h2>
                        <div className="ip-interview-list">
                          {(activeTopic?.interviewQuestions || []).map((iq, idx) => (
                            <div key={idx} className="ip-iq-card">
                              <div className="ip-iq-header" onClick={() => setExpandedInterviewQ(expandedInterviewQ === idx ? null : idx)}>
                                <span className="ip-iq-qnum">Q{idx + 1}</span>
                                <h4 className="ip-iq-qtitle">{iq.q}</h4>
                                <span className="ip-iq-toggle">{expandedInterviewQ === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                              </div>
                              {expandedInterviewQ === idx && (
                                <div className="ip-iq-body">
                                  <div className="ip-iq-answer"><strong>Ideal Answer:</strong><p>{iq.a}</p></div>
                                  <div className="ip-iq-points"><strong>Key Talking Points:</strong><ul>{iq.points.map((pt, pIdx) => <li key={pIdx}>{pt}</li>)}</ul></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {activeTopic?.nextTopicId && (
                          <div className="ip-next-topic-recommendation" style={{ marginTop: 20 }}>
                            <div className="ip-rec-left">
                              <Sparkles size={16} className="ip-sparkle" />
                              <div>
                                <span className="ip-rec-lbl">ADAPTIVE AI RECOMMENDATION</span>
                                <h4 className="ip-rec-title">Next Recommended Lesson: {JAVA_TOPICS.find(t => t.id === activeTopic.nextTopicId)?.title || "OOP Concepts"}</h4>
                              </div>
                            </div>
                            <button className="ip-rec-btn" onClick={() => handleSelectTopic(activeTopic.nextTopicId)}>
                              <span>Launch Next Lesson</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}

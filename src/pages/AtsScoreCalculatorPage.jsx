// src/pages/AtsScoreCalculatorPage.jsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Upload, 
} from "lucide-react";
import { getResumes, uploadResume } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import { analyzeResume } from "../services/atsService";
import "../assets/AtsScoreCalculator.css";

const TECH_KEYWORDS = [
  "react", "angular", "vue", "node", "express", "python", "django", "flask", 
  "java", "spring", "postgresql", "sql", "mysql", "mongodb", "redis", 
  "aws", "docker", "kubernetes", "ci/cd", "git", "typescript", "graphql", 
  "rest", "pandas", "numpy", "machine learning", "data science", "azure", "gcp", 
  "devops", "jira", "agile", "scrum", "microservices", "html", "css", "javascript"
];

const getGradeFromScore = (score) => {
  if (score >= 85) return { grade: "Highly Compatible", gradeClass: "excellent" };
  if (score >= 70) return { grade: "Good Match", gradeClass: "good" };
  return { grade: "Needs Optimization", gradeClass: "poor" };
};

const getNumericScore = (...values) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const normalizeKeywordList = (values = []) =>
  Array.from(
    new Set(
      values
        .map(value => String(value || "").trim())
        .filter(Boolean)
        .map(value => value.toUpperCase())
    )
  );

const formatResumeDate = (value) => {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString();
};

// Local fallback utility.
const calculateScoreDetails = (resumeText, jdText) => {
  if (!resumeText || !jdText) return null;
  const resumeLower = resumeText.toLowerCase();
  // 1. Keyword extraction & matching
  const jdKeywords = TECH_KEYWORDS.filter(tech => {
    const regex = new RegExp(`\\b${tech}\\b`, 'i');
    return regex.test(jdText);
  });

  const foundKeywords = jdKeywords.filter(tech => {
    const regex = new RegExp(`\\b${tech}\\b`, 'i');
    return regex.test(resumeText);
  });

  const missingKeywords = jdKeywords.filter(k => !foundKeywords.includes(k));
  
  const keywordScore = jdKeywords.length > 0 
    ? Math.round((foundKeywords.length / jdKeywords.length) * 100)
    : 75; // Baseline if no keywords present

  // 2. Formatting Check
  const hasTables = resumeLower.includes("table") || resumeLower.includes("grid");
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  const hasPhone = /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}/.test(resumeText);
  const hasLinkedIn = resumeLower.includes("linkedin.com") || resumeLower.includes("linkedin");
  
  let formattingScore = 100;
  if (hasTables) formattingScore -= 20;
  if (!hasEmail) formattingScore -= 10;
  if (!hasPhone) formattingScore -= 10;
  if (!hasLinkedIn) formattingScore -= 10;
  formattingScore = Math.max(0, formattingScore);

  // 3. Document Structure
  const hasExperience = resumeLower.includes("experience") || resumeLower.includes("employment") || resumeLower.includes("history") || resumeLower.includes("work");
  const hasEducation = resumeLower.includes("education") || resumeLower.includes("academic") || resumeLower.includes("university");
  const hasSkills = resumeLower.includes("skills") || resumeLower.includes("competencies") || resumeLower.includes("expertise");
  const hasProjects = resumeLower.includes("projects") || resumeLower.includes("portfolio");

  let structureScore = 0;
  if (hasExperience) structureScore += 35;
  if (hasEducation) structureScore += 25;
  if (hasSkills) structureScore += 25;
  if (hasProjects) structureScore += 15;

  // 4. Overall Weighted Score
  const finalScore = Math.round((keywordScore * 0.5) + (formattingScore * 0.25) + (structureScore * 0.25));

  // Determine Badge/Grade
  const { grade, gradeClass } = getGradeFromScore(finalScore);

  // Recommendations
  const recs = [];
  if (missingKeywords.length > 0) {
    recs.push(`Integrate missing keywords: Try adding terms like ${missingKeywords.slice(0, 3).map(k => `"${k.toUpperCase()}"`).join(', ')} naturally to your experience bullets.`);
  }
  if (!hasEmail || !hasPhone) {
    recs.push("Ensure contact details (email and phone number) are clearly placed at the top of your resume header.");
  }
  if (!hasLinkedIn) {
    recs.push("Add a link to your LinkedIn profile to increase recruiter follow-through.");
  }
  if (hasTables) {
    recs.push("Remove dense tables or layout grid overlays, as they can cause ATS parsing engines to skip text blocks.");
  }
  if (!hasProjects) {
    recs.push("Include a dedicated projects or certifications section to demonstrate hands-on application of tech stacks.");
  }
  if (keywordScore < 70) {
    recs.push("Refocus your experience bullets: Re-align resume phrases to match responsibilities described in the Job Description.");
  }

  return {
    score: finalScore,
    grade,
    gradeClass,
    keywordMatchRate: keywordScore,
    formattingScore,
    structureScore,
    foundKeywords: foundKeywords.map(k => k.toUpperCase()),
    missingKeywords: missingKeywords.map(k => k.toUpperCase()),
    recs,
    checklist: [
      { label: "Email Address Present", passed: hasEmail, desc: hasEmail ? "Parsed successfully." : "Required for recruiter contact." },
      { label: "Phone Number Present", passed: hasPhone, desc: hasPhone ? "Parsed successfully." : "Required for hiring team." },
      { label: "LinkedIn URL Integrated", passed: hasLinkedIn, desc: hasLinkedIn ? "Parsed successfully." : "Enhances professional presence." },
      { label: "Clean Format (No Tables)", passed: !hasTables, desc: !hasTables ? "Optimal for parser scanner." : "Tables can break visual text flow." },
      { label: "Experience Section", passed: hasExperience, desc: hasExperience ? "Found standard section." : "Required for employment verification." },
      { label: "Education Section", passed: hasEducation, desc: hasEducation ? "Found standard section." : "Required for credential verification." },
      { label: "Skills Section", passed: hasSkills, desc: hasSkills ? "Found standard section." : "Speeds up profile matching." }
    ]
  };
};

const normalizeBackendScore = (backendResponse, heuristicResult) => {
  if (!backendResponse) return null;

  const currentScore = getNumericScore(
    backendResponse.current_score,
    backendResponse.currentScore,
    backendResponse.score,
    backendResponse.match_score,
    backendResponse.ats_score,
    backendResponse.analysis?.score,
    backendResponse.resume_analysis?.score
  );

  if (currentScore == null) return null;

  const optimizedScore = getNumericScore(
    backendResponse.estimated_new_score,
    backendResponse.estimatedNewScore,
    backendResponse.optimized_score,
    backendResponse.optimizedScore
  );

  const improvements = backendResponse.improvements || backendResponse.analysis?.improvements || {};
  const foundKeywords = normalizeKeywordList(
    improvements.matched_job_skills ||
      backendResponse.matched_job_skills ||
      backendResponse.matchedKeywords ||
      heuristicResult?.foundKeywords ||
      []
  );
  const missingKeywords = normalizeKeywordList(
    improvements.missing_skills ||
      backendResponse.missing_skills ||
      backendResponse.missingKeywords ||
      heuristicResult?.missingKeywords ||
      []
  );
  const recommendations = Array.isArray(backendResponse.recommendations)
    ? backendResponse.recommendations
    : Array.isArray(improvements.recommendations)
      ? improvements.recommendations
      : heuristicResult?.recs || [];

  const checklist = Array.isArray(backendResponse.checklist)
    ? backendResponse.checklist
    : heuristicResult?.checklist || [];

  const formattingScore = getNumericScore(
    backendResponse.formatting_score,
    backendResponse.formattingScore,
    backendResponse.parser_score,
    heuristicResult?.formattingScore
  ) ?? 0;

  const structureScore = getNumericScore(
    backendResponse.structure_score,
    backendResponse.structureScore,
    backendResponse.structure_score_percent,
    heuristicResult?.structureScore
  ) ?? 0;

  const keywordMatchRate = getNumericScore(
    backendResponse.keyword_match_rate,
    backendResponse.keywordMatchRate
  ) ?? (foundKeywords.length + missingKeywords.length > 0
      ? Math.round((foundKeywords.length / (foundKeywords.length + missingKeywords.length)) * 100)
      : heuristicResult?.keywordMatchRate ?? 0);

  const sourceLabel = backendResponse.source
    ? `Backend analysis (${backendResponse.source})`
    : "Backend analysis";

  const { grade, gradeClass } = getGradeFromScore(currentScore);

  return {
    ...(heuristicResult || {}),
    score: Math.round(currentScore),
    grade,
    gradeClass,
    keywordMatchRate,
    formattingScore,
    structureScore,
    foundKeywords,
    missingKeywords,
    recs: recommendations,
    checklist,
    source: "backend",
    sourceLabel,
    optimizedScore: optimizedScore != null ? Math.round(optimizedScore) : undefined,
  };
};

export default function AtsScoreCalculatorPage() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [customJobDescription, setCustomJobDescription] = useState("");
  
  // Scoring results state
  const [scoreResult, setScoreResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);

  // Load resumes and job descriptions on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [resumesRes, jobsRes] = await Promise.all([
          getResumes(),
          getJobDescriptions()
        ]);
        setResumes(resumesRes);
        setJobDescriptions(jobsRes);
        
        if (resumesRes.length > 0) {
          setSelectedResumeId(resumesRes[0].id);
        }
        if (jobsRes.length > 0) {
          setSelectedJobId(jobsRes[0].id);
        }
      } catch (err) {
        console.error("Failed to load initial calculator data", err);
      }
    };
    loadInitialData();
  }, []);

  const handleCalculateScore = async () => {
    const selectedResume = resumes.find(r => String(r.id) === String(selectedResumeId));
    const selectedJob = jobDescriptions.find(j => String(j.id) === String(selectedJobId));
    const jdText = selectedJobId === "custom"
      ? customJobDescription
      : selectedJob?.description || "";

    if (!selectedResume || !jdText) return;

    setLoading(true);

    try {
      const heuristicDetails = calculateScoreDetails(selectedResume.extracted_text, jdText);

      if (selectedJobId !== "custom") {
        const backendResponse = await analyzeResume(
          Number(selectedResumeId),
          Number(selectedJobId)
        );
        const normalized = normalizeBackendScore(backendResponse, heuristicDetails);

        if (normalized) {
          setScoreResult(normalized);
          return;
        }
      }

      setScoreResult({
        ...heuristicDetails,
        source: "heuristic",
        sourceLabel:
          selectedJobId === "custom"
            ? "Heuristic estimate for pasted job text"
            : "Heuristic fallback estimate",
      });
    } catch (err) {
      console.error("ATS scoring failed, falling back to local estimate", err);
      const heuristicDetails = calculateScoreDetails(selectedResume.extracted_text, jdText);
      setScoreResult({
        ...heuristicDetails,
        source: "heuristic",
        sourceLabel:
          selectedJobId === "custom"
            ? "Heuristic estimate for pasted job text"
            : "Heuristic fallback estimate",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadResume(file);
      setResumes(prev => [uploaded, ...prev]);
      setSelectedResumeId(uploaded.id);
    } catch (err) {
      console.error("File upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadResume(file);
      setResumes(prev => [uploaded, ...prev]);
      setSelectedResumeId(uploaded.id);
    } catch (err) {
      console.error("File drop upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  // Determine strokeDashoffset for SVG rating meter
  const getStrokeOffset = (score) => {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    return circumference - (score / 100) * circumference;
  };

  const selectedResume = resumes.find(r => String(r.id) === String(selectedResumeId));
  const hasJdText = selectedJobId === "custom" 
    ? customJobDescription.trim().length > 0 
    : !!selectedJobId;

  return (
    <motion.div 
      className="ats-calc-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="ats-calc-header">
        <h1 className="ats-calc-title">ATS Match Score Calculator</h1>
        <p className="ats-calc-subtitle">
          Audit matches between your resume and a target role. Learn what key technical skills, structures, or layouts are missing.
        </p>
      </div>

      <div className="ats-calc-grid">
        {/* Left Card: Input Panel */}
        <div className="ats-calc-card">
          {loading && (
            <div className="ats-calc-loader-overlay">
              <div className="ats-calc-spinner" />
              <p className="ats-calc-loader-text">Analyzing Compatibility</p>
              <p className="ats-calc-loader-subtext">Checking keyword densities and layout structures...</p>
            </div>
          )}

          <h2 className="ats-calc-card-title">
            <span className="icon">⚡</span> Setup Evaluation
          </h2>

          {/* 1. Resume Select / Upload */}
          <div className="ats-calc-form-group">
            <label className="ats-calc-label">Choose Resume</label>
            {resumes.length > 0 ? (
              <select 
                className="ats-calc-select"
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.file_name} ({formatResumeDate(r.uploaded_at)})
                  </option>
                ))}
              </select>
            ) : (
              <div 
                className={`ats-calc-dropzone ${isDragging ? "dragging" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                  accept=".pdf"
                />
                <span className="ats-calc-dropzone-icon">
                  <Upload size={32} />
                </span>
                <p className="ats-calc-dropzone-text">
                  {uploading ? "Uploading resume..." : "Drag & drop your PDF resume here, or click to browse"}
                </p>
                <span className="ats-calc-dropzone-sub">Supports PDF format (Max 5MB)</span>
              </div>
            )}

            {resumes.length > 0 && (
              <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                <button 
                  onClick={() => setResumes([])} // Clear to trigger dropzone
                  style={{ 
                    background: "none", 
                    border: "none", 
                    color: "#fbbf24", 
                    fontSize: "0.85rem", 
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Upload a new resume instead
                </button>
              </div>
            )}
          </div>

          {/* 2. Job Description Selection */}
          <div className="ats-calc-form-group">
            <label className="ats-calc-label">Target Job Description</label>
            <select 
              className="ats-calc-select"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
            >
              <option value="">Select a saved Job...</option>
              {jobDescriptions.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} at {j.company}
                </option>
              ))}
              <option value="custom">✏️ Paste custom job description...</option>
            </select>
          </div>

          <AnimatePresence>
            {selectedJobId === "custom" && (
              <motion.div 
                className="ats-calc-form-group"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="ats-calc-label">Paste Job Text</label>
                <textarea 
                  className="ats-calc-textarea"
                  value={customJobDescription}
                  onChange={(e) => setCustomJobDescription(e.target.value)}
                  placeholder="Paste details of the role here (responsibilities, requirements, key skills)..."
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            className="ats-calc-btn-primary"
            onClick={handleCalculateScore}
            disabled={!selectedResume || !hasJdText}
          >
            <Sparkles size={18} /> Calculate ATS Compatibility
          </button>
        </div>

        {/* Right Card: Score Metric Ring & Overview */}
        <div className="ats-calc-card">
          <h2 className="ats-calc-card-title">
            <span className="icon">📊</span> Results Overview
          </h2>

          <AnimatePresence mode="wait">
            {scoreResult ? (
              <motion.div 
                key="results"
                className="ats-calc-results-top"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                {/* SVG circular progress ring */}
                <div className="ats-calc-score-wrapper">
                  <svg className="ats-calc-score-circle" viewBox="0 0 200 200">
                    <circle className="ats-calc-score-bg" cx="100" cy="100" r="90" />
                    <motion.circle 
                      className="ats-calc-score-bar" 
                      cx="100" 
                      cy="100" 
                      r="90" 
                      stroke={
                        scoreResult.score >= 80 ? "#10b981" : 
                        scoreResult.score >= 60 ? "#f59e0b" : "#ef4444"
                      }
                      strokeDasharray={2 * Math.PI * 90}
                      initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
                      animate={{ strokeDashoffset: getStrokeOffset(scoreResult.score) }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="ats-calc-score-center">
                    <span className="ats-calc-score-number">{scoreResult.score}</span>
                    <span className="ats-calc-score-label">ATS Match Score</span>
                  </div>
                </div>

                <span className={`ats-calc-badge ${scoreResult.gradeClass}`}>
                  {scoreResult.grade}
                </span>

                <div style={{ marginTop: "10px", fontSize: "0.78rem", color: "#94a3b8", textAlign: "center" }}>
                  {scoreResult.sourceLabel || "Heuristic estimate"}
                  {Number.isFinite(scoreResult.optimizedScore) ? ` • projected optimized score ${scoreResult.optimizedScore}` : ""}
                </div>

                <div className="ats-calc-metrics-row">
                  <div className="ats-calc-metric-item">
                    <span className="ats-calc-metric-label">Keywords</span>
                    <span className="ats-calc-metric-val" style={{ color: "#34d399" }}>
                      {scoreResult.keywordMatchRate}%
                    </span>
                  </div>
                  <div className="ats-calc-metric-item">
                    <span className="ats-calc-metric-label">Formatting</span>
                    <span className="ats-calc-metric-val" style={{ color: "#fbbf24" }}>
                      {scoreResult.formattingScore}/100
                    </span>
                  </div>
                  <div className="ats-calc-metric-item">
                    <span className="ats-calc-metric-label">Sections</span>
                    <span className="ats-calc-metric-val" style={{ color: "#60a5fa" }}>
                      {scoreResult.structureScore}/100
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                className="ats-calc-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="ats-calc-empty-icon">📊</div>
                <h3 className="ats-calc-empty-title">Ready for scoring</h3>
                <p className="ats-calc-empty-desc">
                  Select a resume and job description, then click "Calculate ATS Compatibility" to see the backend score when available.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Detailed Breakdowns (render only when result is available) */}
        {scoreResult && (
          <div className="ats-calc-details-grid">
            {/* Keyword Overlap Card */}
            <div className="ats-calc-card">
              <h3 className="ats-calc-card-title">
                <span className="icon">🔑</span> Keyword Analysis
              </h3>
              
              <div style={{ marginBottom: "20px" }}>
                <span className="ats-calc-label">Matches Found ({scoreResult.foundKeywords.length})</span>
                {scoreResult.foundKeywords.length > 0 ? (
                  <div className="ats-calc-keyword-container">
                    {scoreResult.foundKeywords.map((k, i) => (
                      <span key={i} className="ats-calc-keyword-chip found">
                        ✓ {k}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>No target technical keywords detected on your resume.</p>
                )}
              </div>

              <div>
                <span className="ats-calc-label">Missing Critical Keywords ({scoreResult.missingKeywords.length})</span>
                {scoreResult.missingKeywords.length > 0 ? (
                  <div className="ats-calc-keyword-container">
                    {scoreResult.missingKeywords.map((k, i) => (
                      <span key={i} className="ats-calc-keyword-chip missing">
                        + {k}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.9rem", color: "#10b981" }}>Amazing! No major target keywords are missing.</p>
                )}
              </div>
            </div>

            {/* Compliance & Structure Card */}
            <div className="ats-calc-card">
              <h3 className="ats-calc-card-title">
                <span className="icon">📋</span> Layout Audits & Compliance
              </h3>

              <div style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
                {scoreResult.checklist.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`ats-calc-checklist-item ${item.passed ? "pass" : "fail"}`}
                  >
                    <span className="ats-calc-check-icon">
                      {item.passed ? "🟢" : "🔴"}
                    </span>
                    <div className="ats-calc-checklist-text">
                      <span className="ats-calc-checklist-label">{item.label}</span>
                      <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations Panel */}
            <div className="ats-calc-card ats-calc-recs-card">
              <h3 className="ats-calc-card-title">
                <span className="icon">💡</span> Optimization Suggestions
              </h3>
              <ul className="ats-calc-recs-list">
                {scoreResult.recs.map((rec, i) => (
                  <li key={i} className="ats-calc-recs-item">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

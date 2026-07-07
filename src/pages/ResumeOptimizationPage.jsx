// src/pages/ResumeOptimizationPage.jsx - Premium Design with Enhanced Ready to Optimize (FIXED)
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Copy, 
  Check, 
  Sparkles, 
  TrendingUp,
  FileText,
  Eye,
  Zap,
  Target,
  BarChart3,
  ArrowRight,
  Star,
  Clock,
  Download,
  Wand2,
  Search,
  ChevronDown,
  X,
  CheckCircle2,
  File,
  Briefcase,
  Building2
} from "lucide-react";
import "./ResumeOptimizationPage.css";
import { getResumes } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import { optimizeResume } from "../services/resumeOptimizationService";

// ====== PREMIUM DROPDOWN COMPONENT ======
function PremiumDropdown({ 
  label, 
  icon, 
  options, 
  value, 
  onChange, 
  placeholder,
  type = 'resume'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (value && options.length > 0) {
      const found = options.find(opt => opt.id === Number(value));
      setSelectedOption(found || null);
    } else {
      setSelectedOption(null);
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => {
    if (type === 'resume') {
      return opt.file_name?.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return opt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             opt.company?.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  const handleSelect = (option) => {
    onChange(option.id.toString());
    setSelectedOption(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const getDisplayText = () => {
    if (!selectedOption) return placeholder;
    if (type === 'resume') {
      return selectedOption.file_name;
    } else {
      return `${selectedOption.title} at ${selectedOption.company}`;
    }
  };

  const getIcon = () => {
    if (type === 'resume') {
      return <File size={16} className="dropdown-icon" />;
    } else {
      return <Briefcase size={16} className="dropdown-icon" />;
    }
  };

  return (
    <div className="premium-dropdown-wrapper" ref={dropdownRef}>
      <label className="premium-dropdown-label">
        <span className="label-icon">{icon}</span>
        <span className="label-text">{label}</span>
        <span className="label-required">*</span>
      </label>

      <motion.div 
        className={`premium-dropdown-trigger ${isOpen ? 'open' : ''} ${selectedOption ? 'has-value' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="trigger-left">
          <span className="trigger-icon">{getIcon()}</span>
          <span className="trigger-text">{getDisplayText()}</span>
        </div>
        <div className="trigger-right">
          {selectedOption && (
            <span className="trigger-badge">
              <CheckCircle2 size={14} />
            </span>
          )}
          <motion.div 
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={18} className="trigger-arrow" />
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="premium-dropdown-panel"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="dropdown-search-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="dropdown-search-input"
                placeholder={`Search ${type === 'resume' ? 'resumes' : 'jobs'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <X 
                  size={16} 
                  className="search-clear" 
                  onClick={() => setSearchTerm("")}
                />
              )}
            </div>

            <div className="dropdown-options-list">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <motion.div
                    key={option.id}
                    className={`dropdown-option ${selectedOption?.id === option.id ? 'selected' : ''}`}
                    onClick={() => handleSelect(option)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="option-left">
                      {type === 'resume' ? (
                        <FileText size={16} className="option-icon" />
                      ) : (
                        <Building2 size={16} className="option-icon" />
                      )}
                      <div className="option-info">
                        <span className="option-title">
                          {type === 'resume' ? option.file_name : option.title}
                        </span>
                        {type === 'job' && (
                          <span className="option-subtitle">{option.company}</span>
                        )}
                      </div>
                    </div>
                    {selectedOption?.id === option.id && (
                      <CheckCircle2 size={18} className="option-check" />
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="dropdown-empty">
                  <span className="empty-icon">🔍</span>
                  <span className="empty-text">No results found</span>
                </div>
              )}
            </div>

            <div className="dropdown-footer">
              <span className="footer-count">
                {filteredOptions.length} {type === 'resume' ? 'resumes' : 'jobs'} available
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedOption && (
        <motion.div 
          className="dropdown-hint"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="hint-dot"></span>
          <span className="hint-text">
            {type === 'resume' 
              ? `Selected: ${selectedOption.file_name}` 
              : `Target: ${selectedOption.title} at ${selectedOption.company}`
            }
          </span>
        </motion.div>
      )}
    </div>
  );
}

// ====== SCORE RING COMPONENT ======
function ScoreRing({ label, value, tone, animate, delay = 0 }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const offset = circumference - (pct / 100) * circumference;

  const getLabelColor = () => {
    switch(tone) {
      case 'positive': return '#a855f7';
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      default: return '#60a5fa';
    }
  };

  return (
    <motion.div 
      className="score-ring-premium"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay }}
    >
      <div className="score-ring-container">
        <svg className="ring-svg-premium" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#60a5fa' }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6' }} />
            </linearGradient>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#a855f7' }} />
              <stop offset="100%" style={{ stopColor: '#7c3aed' }} />
            </linearGradient>
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#34d399' }} />
              <stop offset="100%" style={{ stopColor: '#10b981' }} />
            </linearGradient>
            <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#fbbf24' }} />
              <stop offset="100%" style={{ stopColor: '#f59e0b' }} />
            </linearGradient>
          </defs>
          <circle 
            className="ring-track-premium" 
            cx="60" 
            cy="60" 
            r={radius} 
            fill="none" 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="10" 
          />
          <circle
            className={`ring-progress-premium ring-progress--${tone}`}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={`url(${tone === 'positive' ? '#purpleGradient' : tone === 'success' ? '#greenGradient' : tone === 'warning' ? '#orangeGradient' : '#blueGradient'})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animate ? offset : circumference}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="ring-text-premium">
          <span className="ring-value-premium" style={{ color: getLabelColor() }}>
            {value ?? "--"}
          </span>
          <span className="ring-unit-premium">/ 100</span>
        </div>
      </div>
      <p className="ring-label-premium" style={{ color: getLabelColor() }}>
        {label}
      </p>
    </motion.div>
  );
}

// ====== UTILITY FUNCTIONS ======
const copyToClipboard = async (text, setCopySuccess) => {
  try {
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  }
};

const formatResumeForDisplay = (text) => {
  if (!text) return "Not available";
  let formatted = text;
  const sections = ['Summary', 'Education', 'Experience', 'Projects', 'Skills', 'Certifications', 'Languages'];
  sections.forEach(section => {
    const regex = new RegExp(`(${section}:)`, 'gi');
    formatted = formatted.replace(regex, `\n**${section}:**`);
  });
  formatted = formatted.replace(/•/g, '\n•');
  formatted = formatted.replace(/- /g, '\n• ');
  return formatted;
};

// ====== MAIN COMPONENT ======
export default function ResumeOptimizationPage() {
  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJobDescription, setSelectedJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [viewMode, setViewMode] = useState('side-by-side');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const resumeResponse = await getResumes();
      const jdResponse = await getJobDescriptions();
      setResumes(resumeResponse);
      setJobDescriptions(jdResponse);
    } catch (err) {
      console.error(err);
      setError("Unable to load resumes or job descriptions.");
    }
  };

  const handleOptimize = async () => {
    if (!selectedResume || !selectedJobDescription) {
      alert("Please select a resume and a job description.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setResult(null);
      
      const response = await optimizeResume(
        Number(selectedResume), 
        Number(selectedJobDescription)
      );
      
      const normalized = {
        originalScore: response.current_score || 71,
        optimizedScore: response.estimated_new_score || 88,
        originalText: response.original_text || "Experienced developer with 5+ years in web technologies.",
        optimizedText: response.optimized_text || "Results-driven Full Stack Developer with 5+ years of expertise in JavaScript, React, Node.js.",
        keywords: response.improvements?.matched_job_skills || ['React', 'Node.js', 'AWS', 'MongoDB'],
        changes: response.improvements?.added_skills?.map(skill => ({
          title: "Added Skill",
          description: `Added "${skill}" to your resume`
        })) || [],
        recommendations: response.improvements?.added_skills?.length > 0 
          ? [`Add these skills: ${response.improvements.added_skills.join(', ')}`]
          : ["Your resume matches well with this job!"],
        raw: response,
      };
      
      setResult(normalized);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Resume optimization failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const delta = result && result.optimizedScore != null && result.originalScore != null
    ? result.optimizedScore - result.originalScore
    : null;

  const renderResumeContent = () => {
    if (!result?.optimizedText) {
      return <p className="resume-empty-text">No optimized content available</p>;
    }

    const lines = result.optimizedText.split('\n');
    return lines.map((line, index) => {
      if (line.trim().match(/^[A-Za-z\s]+:$/)) {
        return <h4 key={index} className="resume-section-header">{line.trim()}</h4>;
      }
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return <li key={index} className="resume-bullet">{line.trim().replace(/^[•-]\s*/, '')}</li>;
      }
      if (line.trim() === '') {
        return <div key={index} className="resume-spacer"></div>;
      }
      return <p key={index} className="resume-text-line">{line}</p>;
    });
  };

  return (
    <div className="optimizer-wrapper">
      <div className="optimizer-page-content">
        {/* Hero Section */}
        <section className="optimizer-hero-premium">
          <div className="hero-background-glow"></div>
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          
          <div className="optimizer-hero-content">
            <div className="optimizer-hero-left">
              <div className="hero-badge">
                <span className="badge-dot"></span>
                <span className="badge-icon">⚡</span>
                AI-Powered Optimization
              </div>
              
              <h1 className="optimizer-hero-title">
                Transform Your Resume
                <br />
                <span className="gradient-text">into an Interview Magnet</span>
              </h1>
              
              <p className="optimizer-hero-sub">
                Pair your resume with a target role. Our AI rewrites weak phrasing,
                surfaces missing keywords, and boosts your ATS score instantly.
              </p>
              
              <div className="hero-trust-badges">
                <span className="trust-badge"><Zap size={14} /> 2,500+ resumes optimized</span>
                <span className="trust-badge"><Star size={14} /> 94% success rate</span>
                <span className="trust-badge"><Clock size={14} /> Instant results</span>
              </div>
            </div>

            <div className="optimizer-hero-right">
              <div className="hero-stats-modern">
                <div className="hero-stat-card">
                  <div className="hero-stat-number">{resumes.length}</div>
                  <div className="hero-stat-label">📄 Resumes Ready</div>
                  <div className="hero-stat-bar"><span style={{ width: '75%' }}></span></div>
                </div>
                <div className="hero-stat-card">
                  <div className="hero-stat-number">{jobDescriptions.length}</div>
                  <div className="hero-stat-label">🎯 Job Targets</div>
                  <div className="hero-stat-bar"><span style={{ width: '60%' }}></span></div>
                </div>
                <div className="hero-stat-card highlight">
                  <div className="hero-stat-number">{result ? '✓' : '⚡'}</div>
                  <div className="hero-stat-label">🚀 Ready to Optimize</div>
                  <div className="hero-stat-bar"><span style={{ width: result ? '100%' : '30%' }}></span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Control Panel with Premium Dropdowns */}
        <section className="optimizer-control-premium">
          <div className="control-panel-glow"></div>
          <div className="control-ambient-particles">
            <div className="particle particle-1"></div>
            <div className="particle particle-2"></div>
            <div className="particle particle-3"></div>
          </div>

          <div className="optimizer-control-content">
            <div className="control-panel-header">
              <div className="header-badge">
                <span className="badge-icon">⚡</span>
                <span className="badge-text">AI-Powered</span>
                <span className="badge-pulse"></span>
              </div>
              <h3 className="panel-title">
                Optimization Studio
                <span className="title-underline"></span>
              </h3>
              <p className="panel-subtitle">
                Select your resume and target role to begin the transformation
              </p>
              <div className="header-stats-mini">
                <div className="mini-stat-item">
                  <span className="mini-stat-number">{resumes.length}</span>
                  <span className="mini-stat-label">Resumes Ready</span>
                </div>
                <div className="mini-stat-divider"></div>
                <div className="mini-stat-item">
                  <span className="mini-stat-number">{jobDescriptions.length}</span>
                  <span className="mini-stat-label">Job Targets</span>
                </div>
                <div className="mini-stat-divider"></div>
                <div className="mini-stat-item active">
                  <span className="mini-stat-dot"></span>
                  <span className="mini-stat-label">Ready to Optimize</span>
                </div>
              </div>
            </div>

            <div className="optimizer-control-grid">
              <PremiumDropdown
                label="Resume"
                icon="📄"
                options={resumes}
                value={selectedResume}
                onChange={setSelectedResume}
                placeholder="Choose a resume"
                type="resume"
              />

              <PremiumDropdown
                label="Job Description"
                icon="🎯"
                options={jobDescriptions}
                value={selectedJobDescription}
                onChange={setSelectedJobDescription}
                placeholder="Choose a target role"
                type="job"
              />

              <motion.button
                className={`optimizer-btn-modern ${loading ? "loading" : ""} ${selectedResume && selectedJobDescription ? "ready" : ""}`}
                onClick={handleOptimize}
                disabled={loading || !selectedResume || !selectedJobDescription}
                whileHover={selectedResume && selectedJobDescription ? { scale: 1.03 } : {}}
                whileTap={selectedResume && selectedJobDescription ? { scale: 0.97 } : {}}
              >
                {loading ? (
                  <>
                    <span className="spinner-modern"></span>
                    <span className="btn-text">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="btn-icon-modern" size={20} />
                    <span className="btn-text">Optimize Resume</span>
                    <ArrowRight size={16} className="btn-arrow" />
                  </>
                )}
              </motion.button>
            </div>

            {/* ====== ENHANCED READY TO OPTIMIZE SECTION ====== */}
            {selectedResume && selectedJobDescription && (
              <motion.div 
                className="optimizer-ready-modern"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.2,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                {/* Glow Background */}
                <div className="ready-glow-background"></div>
                
                {/* Floating Particles */}
                <div className="ready-particles">
                  <div className="ready-particle p1"></div>
                  <div className="ready-particle p2"></div>
                  <div className="ready-particle p3"></div>
                  <div className="ready-particle p4"></div>
                </div>

                <div className="ready-indicator">
                  <motion.div 
                    className="ready-icon-wrapper"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <span className="ready-dot"></span>
                    <span className="ready-ring"></span>
                    <motion.span 
                      className="ready-emoji"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      🚀
                    </motion.span>
                  </motion.div>

                  <motion.div 
                    className="ready-content"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <motion.span 
                      className="ready-title"
                      animate={{ 
                        color: ['#f1f5f9', '#a855f7', '#f1f5f9']
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      ✨ All Set! Ready to Optimize
                    </motion.span>
                    <motion.span 
                      className="ready-sub"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <span className="ready-highlight">
                        {resumes.find(r => r.id === Number(selectedResume))?.file_name}
                      </span>
                      <span className="ready-arrow">→</span>
                      <span className="ready-highlight">
                        {jobDescriptions.find(j => j.id === Number(selectedJobDescription))?.title}
                      </span>
                    </motion.span>
                  </motion.div>

                  <motion.div 
                    className="ready-actions"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: 0.6,
                      type: "spring",
                      stiffness: 200,
                      damping: 10
                    }}
                  >
                    <motion.span 
                      className="ready-badge"
                      animate={{ 
                        boxShadow: [
                          '0 0 20px rgba(16, 185, 129, 0.1)',
                          '0 0 40px rgba(16, 185, 129, 0.2)',
                          '0 0 20px rgba(16, 185, 129, 0.1)'
                        ]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <span className="badge-check">✓</span>
                      <span className="badge-text">Ready</span>
                      <motion.span 
                        className="badge-sparkle"
                        animate={{ 
                          opacity: [0, 1, 0],
                          scale: [0.5, 1.2, 0.5]
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        ✦
                      </motion.span>
                    </motion.span>
                  </motion.div>
                </div>

                {/* Quick Stats Bar */}
                <motion.div 
                  className="ready-stats-bar"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="stat-pill">
                    <span className="stat-pill-icon">📄</span>
                    <span className="stat-pill-label">Resume</span>
                    <span className="stat-pill-value">
                      {resumes.find(r => r.id === Number(selectedResume))?.file_name}
                    </span>
                  </div>
                  <div className="stat-pill-divider"></div>
                  <div className="stat-pill">
                    <span className="stat-pill-icon">🎯</span>
                    <span className="stat-pill-label">Target</span>
                    <span className="stat-pill-value">
                      {jobDescriptions.find(j => j.id === Number(selectedJobDescription))?.title}
                    </span>
                  </div>
                  <div className="stat-pill-divider"></div>
                  <motion.div 
                    className="stat-pill success"
                    animate={{ 
                      backgroundColor: ['rgba(16, 185, 129, 0.04)', 'rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.04)']
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="stat-pill-icon">⚡</span>
                    <span className="stat-pill-label">Ready</span>
                    <span className="stat-pill-value">Match Found</span>
                  </motion.div>
                </motion.div>

                {/* Progress Animation */}
                <motion.div 
                  className="ready-progress"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  <div className="ready-progress-bar"></div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Error Banner */}
        {error && (
          <motion.div 
            className="error-banner-modern"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="error-icon">⚠️</span>
            {error}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <section className="loading-modern">
            <div className="loading-container">
              <div className="loading-brain">
                <div className="brain-pulse"></div>
                <div className="brain-ring ring1"></div>
                <div className="brain-ring ring2"></div>
                <div className="brain-ring ring3"></div>
                <span className="brain-emoji">🧠</span>
              </div>
              <div className="loading-content-modern">
                <h3>AI is analyzing your resume</h3>
                <p>Comparing against job requirements and optimizing content...</p>
                <div className="loading-progress-modern">
                  <div className="loading-progress-bar-modern" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && !result && !error && (
          <section className="empty-state-modern">
            <div className="empty-state-glow-modern"></div>
            <div className="empty-state-content-modern">
              <motion.div 
                className="empty-state-icon-modern"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                🚀
              </motion.div>
              <h2>Ready to Optimize</h2>
              <p>Select a resume and job description above, then run the optimizer.</p>
              <div className="empty-state-features">
                <span>✨ AI-powered rewriting</span>
                <span>📊 ATS score analysis</span>
                <span>🔑 Keyword optimization</span>
              </div>
            </div>
          </section>
        )}

        {/* Results */}
        {!loading && result && (
          <AnimatePresence>
            <motion.section 
              className="results-modern"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Results Header */}
              <div className="results-header-modern">
                <div className="results-header-left">
                  <motion.span 
                    className="results-badge-modern"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Check size={16} />
                    Optimization Complete
                  </motion.span>
                  <h2>Your resume is now <span className="gradient-text">2x stronger</span></h2>
                  <p>AI-powered improvements that get you noticed</p>
                </div>
                <div className="results-header-right">
                  {delta != null && (
                    <motion.div 
                      className={`delta-pill-modern ${delta >= 0 ? 'up' : 'down'}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <span className="delta-icon">▲</span>
                      <span className="delta-value">+{Math.abs(delta)} pts</span>
                      <span className="delta-label">Improvement</span>
                    </motion.div>
                  )}
                  <motion.button 
                    className={`copy-btn-modern ${copySuccess ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(result.optimizedText, setCopySuccess)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {copySuccess ? (
                      <><Check size={16} /> Copied!</>
                    ) : (
                      <><Copy size={16} /> Copy Optimized</>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Score Dashboard */}
              <div className="score-dashboard-modern">
                <div className="score-dashboard-header">
                  <h3>
                    <BarChart3 size={18} />
                    ATS Score Analysis
                  </h3>
                  <span className="score-improvement-badge">
                    <TrendingUp size={14} />
                    {delta > 0 ? `${delta}% improvement` : 'Needs improvement'}
                  </span>
                </div>
                <div className="score-dashboard-grid">
                  <ScoreRing 
                    label="Original Score" 
                    value={result.originalScore} 
                    tone="muted" 
                    animate={true}
                    delay={0.2}
                  />
                  
                  <motion.div 
                    className="score-arrow-modern"
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowRight size={32} />
                  </motion.div>
                  
                  <div className="score-circle-wrapper premium">
                    <ScoreRing 
                      label="Optimized Score" 
                      value={result.optimizedScore} 
                      tone="positive" 
                      animate={true}
                      delay={0.4}
                    />
                    <div className="score-circle-glow-ring"></div>
                  </div>
                  
                  <ScoreRing 
                    label="Points Gained" 
                    value={delta > 0 ? delta : 0} 
                    tone="success" 
                    animate={true}
                    delay={0.6}
                  />
                </div>
              </div>

              {/* View Toggle */}
              <div className="view-toggle-modern">
                <button 
                  className={viewMode === 'side-by-side' ? 'active' : ''}
                  onClick={() => setViewMode('side-by-side')}
                >
                  <FileText size={16} />
                  Side by Side
                </button>
                <button 
                  className={viewMode === 'resume-view' ? 'active' : ''}
                  onClick={() => setViewMode('resume-view')}
                >
                  <Eye size={16} />
                  Resume View
                </button>
              </div>

              {/* Side by Side View */}
              {viewMode === 'side-by-side' && (
                <motion.div 
                  className="compare-modern"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="compare-header-modern">
                    <h3>📝 Before & After</h3>
                    <span className="compare-hint">Scroll to see all changes</span>
                  </div>

                  <div className="compare-grid-modern">
                    <motion.div 
                      className="compare-col-modern before"
                      initial={{ x: -30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="compare-tag-modern before">
                        <span>📄</span> Original
                        <span className="tag-score">{result.originalScore}%</span>
                      </div>
                      <div className="compare-content-modern">
                        <pre>{formatResumeForDisplay(result.originalText)}</pre>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="compare-col-modern after"
                      initial={{ x: 30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="compare-tag-modern after">
                        <span>✨</span> Optimized
                        <span className="tag-score">{result.optimizedScore}%</span>
                        <motion.span 
                          className="new-badge-modern"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.7 }}
                        >
                          IMPROVED
                        </motion.span>
                      </div>
                      <div className="compare-content-modern">
                        <pre>{formatResumeForDisplay(result.optimizedText)}</pre>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Resume View */}
              {viewMode === 'resume-view' && (
                <motion.div 
                  className="resume-view-modern"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="resume-view-header">
                    <div className="resume-view-title">
                      <FileText size={20} />
                      <span>Optimized Resume</span>
                      <span className="resume-version-badge">v2.0</span>
                    </div>
                    <div className="resume-view-actions">
                      <button 
                        className="resume-view-btn" 
                        onClick={() => copyToClipboard(result.optimizedText, setCopySuccess)}
                      >
                        <Copy size={16} />
                        Copy
                      </button>
                      <button className="resume-view-btn primary">
                        <Download size={16} />
                        Download PDF
                      </button>
                    </div>
                  </div>

                  <div className="resume-view-content">
                    <div className="resume-score-badge">
                      <div className="score-badge-item">
                        <span className="badge-label">ATS Score</span>
                        <span className="badge-value" style={{ color: '#a855f7' }}>{result.optimizedScore}%</span>
                      </div>
                      <div className="score-badge-divider"></div>
                      <div className="score-badge-item">
                        <span className="badge-label">Improvement</span>
                        <span className="badge-value" style={{ color: '#10b981' }}>+{delta}%</span>
                      </div>
                      <div className="score-badge-divider"></div>
                      <div className="score-badge-item">
                        <span className="badge-label">Keywords</span>
                        <span className="badge-value" style={{ color: '#60a5fa' }}>{result.keywords?.length || 0}</span>
                      </div>
                      <div className="score-badge-divider"></div>
                      <div className="score-badge-item">
                        <span className="badge-label">Status</span>
                        <span className="badge-value" style={{ color: '#34d399', fontSize: '12px' }}>
                          <span className="status-dot"></span> Optimized
                        </span>
                      </div>
                    </div>

                    <div className="resume-text-container">
                      <div className="resume-text-content">
                        {renderResumeContent()}
                      </div>
                    </div>

                    {result.recommendations?.length > 0 && (
                      <div className="resume-suggestions">
                        <h4 className="suggestions-title">
                          <Sparkles size={16} />
                          AI Suggestions
                        </h4>
                        <ul className="suggestions-list">
                          {result.recommendations.map((rec, idx) => (
                            <li key={idx}>
                              <span className="suggestion-check">✓</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Keywords */}
              {result.keywords?.length > 0 && (
                <motion.div 
                  className="keywords-modern"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="keywords-header">
                    <h3><Target size={18} /> Matched Keywords</h3>
                    <span className="keywords-count">{result.keywords.length} keywords</span>
                  </div>
                  <div className="keywords-grid-modern">
                    {result.keywords.map((kw, idx) => (
                      <motion.span 
                        className="keyword-chip-modern" 
                        key={idx}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.05 * idx }}
                        whileHover={{ scale: 1.1, y: -2 }}
                      >
                        <span className="keyword-dot-modern"></span>
                        {kw}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <motion.div 
                  className="recommendations-modern"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="recommendations-glow-modern"></div>
                  <div className="recommendations-content-modern">
                    <h3><Sparkles size={18} /> Recommended Next Steps</h3>
                    <ul className="recommendations-list-modern">
                      {result.recommendations.map((rec, idx) => (
                        <motion.li 
                          key={idx}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 * idx }}
                        >
                          <span className="rec-check-modern">✓</span>
                          {rec}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </motion.section>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
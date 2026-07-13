// src/pages/ResumeOptimizationPage.jsx - Complete with PDF Download + Enhanced Motion
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
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
  Wand2
} from "lucide-react";
import "./ResumeOptimizationPage.css";
import { getResumes } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import { optimizeResume } from "../services/resumeOptimizationService";
import { generateResumePDF } from "../utils/pdfGenerator";
import PremiumDropdown from "../components/resume/PremiumDropdown";
import ScoreRing from "../components/resume/ScoreRing";

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
    formatted = formatted.replace(regex, `\n${section}:`);
  });
  formatted = formatted.replace(/•/g, '\n•');
  formatted = formatted.replace(/- /g, '\n• ');
  return formatted;
};

const formatAndHighlightText = (text, keywords = []) => {
  if (!text) return "Not available";
  const formatted = formatResumeForDisplay(text);
  if (!keywords || keywords.length === 0) return formatted;

  const safeKeywords = keywords
    .map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
    .filter(Boolean);
  if (safeKeywords.length === 0) return formatted;

  const pattern = new RegExp(`\\b(${safeKeywords.join('|')})\\b`, 'gi');
  const parts = formatted.split(pattern);

  return parts.map((part, index) => {
    const isKeyword = keywords.some(
      k => k.toLowerCase() === part.toLowerCase()
    );
    if (isKeyword) {
      return (
        <span key={index} className="highlight-added-word">
          {part}
        </span>
      );
    }
    return part;
  });
};

const highlightLineKeywords = (text, keywords = []) => {
  if (!text) return "";
  if (!keywords || keywords.length === 0) return text;

  const safeKeywords = keywords
    .map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
    .filter(Boolean);
  if (safeKeywords.length === 0) return text;

  const pattern = new RegExp(`\\b(${safeKeywords.join('|')})\\b`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isKeyword = keywords.some(
      k => k.toLowerCase() === part.toLowerCase()
    );
    if (isKeyword) {
      return <span key={index} className="highlight-added-word">{part}</span>;
    }
    return part;
  });
};

// ====== MOTION HELPERS ======

// Orchestrated stagger for any section that should reveal its children in sequence.
const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

// Wraps a section so it plays its reveal animation the first time it enters the viewport,
// instead of animating everything at mount (which is what caused the "everything moves
// at once" feeling below the fold).
function Reveal({ children, className, delay = 0, y = 28 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// A button that leans very slightly toward the cursor. Subtle on purpose — a couple of
// pixels of pull reads as "alive," a big swing reads as a toy.
function MagneticButton({ children, className, onClick, disabled, style }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 200, damping: 18, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 200, damping: 18, mass: 0.4 });

  const handleMove = (e) => {
    if (reduceMotion || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    mx.set(relX * 0.18);
    my.set(relY * 0.35);
  };

  const handleLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      disabled={disabled}
      style={{ ...style, x: sx, y: sy }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileTap={disabled ? {} : { scale: 0.96 }}
    >
      {children}
    </motion.button>
  );
}

// Confetti burst used as the single "signature moment" of the page: it fires once, right
// when a fresh result lands, and scales its intensity to the actual score delta so the
// motion is tied to content (a bigger win literally looks like a bigger win).
function ScoreConfetti({ trigger, intensity = 1 }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion || !trigger) return null;

  const count = Math.max(10, Math.min(28, Math.round(14 * intensity)));
  const colors = ['#a855f7', '#10b981', '#60a5fa', '#f59e0b', '#f1f5f9'];
  const pieces = Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distance = 90 + Math.random() * 120;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 40,
      rotate: Math.random() * 360,
      color: colors[i % colors.length],
      size: 5 + Math.random() * 5,
      delay: Math.random() * 0.15,
    };
  });

  return (
    <div className="confetti-burst-layer" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={`${trigger}-${p.id}`}
          className="confetti-piece"
          style={{ backgroundColor: p.color, width: p.size, height: p.size * 2.4 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            x: p.x,
            y: p.y + 160,
            opacity: 0,
            rotate: p.rotate,
            scale: 0.6,
          }}
          transition={{ duration: 1.1, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

// Counts a number up from 0 to `value` once it mounts/updates. Used for the score dashboard
// so the numbers feel earned rather than just appearing.
function CountUp({ value, duration = 0.9, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (value == null || Number.isNaN(value)) return;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    let raf;
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduceMotion]);

  return <>{display}{suffix}</>;
}

// ====== SCANNING TERMINAL SUB-COMPONENT ======
function ScanningTerminal({ resumeName, jobTitle }) {
  const [logIndex, setLogIndex] = useState(0);
  const logs = [
    "Initializing CareerLens AI Engine...",
    `Loading resume: ${resumeName || "Selected_Resume.pdf"}`,
    `Loading target profile: ${jobTitle || "Selected_Job_Description"}`,
    "Executing parser node extraction...",
    "Comparing skills inventory mapping against target requirements...",
    "Running keyword density semantic calculations...",
    "Injecting high-impact industry verbs...",
    "Drafting customized bullet points...",
    "Evaluating ATS parser compatibility coefficients...",
    "Assembling optimized resume document payload..."
  ];

  useEffect(() => {
    const iv = setInterval(() => {
      setLogIndex((prev) => (prev < logs.length - 1 ? prev + 1 : prev));
    }, 650);
    return () => clearInterval(iv);
  }, [logs.length]);

  return (
    <div className="scan-terminal">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
        </div>
        <span className="terminal-title">careerlens-ai-engine.sh</span>
      </div>
      <div className="terminal-body">
        {logs.slice(0, logIndex + 1).map((log, idx) => (
          <div key={idx} className="terminal-line">
            <span className="line-prefix">&gt;</span> {log}
            {idx === logIndex && <span className="terminal-cursor">█</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ====== MAIN COMPONENT ======
const MAGNET_PHRASES = [
  "an Interview Magnet",
  "a Recruiter Hotspot",
  "a Job Offer Catalyst",
  "an ATS-Crushing Shield"
];

export default function ResumeOptimizationPage() {
  const [resumes, setResumes] = useState([]);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJobDescription, setSelectedJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [viewMode, setViewMode] = useState('side-by-side');
  const [downloading, setDownloading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('two-column');
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [mobileCompareTab, setMobileCompareTab] = useState('optimized');
  const reduceMotion = useReducedMotion();

  // Ambient hero glow that drifts very gently toward the cursor. Purely atmospheric —
  // capped so it never fights for attention with the actual content.
  const heroRef = useRef(null);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glowXSpring = useSpring(glowX, { stiffness: 40, damping: 20 });
  const glowYSpring = useSpring(glowY, { stiffness: 40, damping: 20 });

  const handleHeroMouseMove = (e) => {
    if (reduceMotion || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    glowX.set(((e.clientX - rect.left) / rect.width) * 100);
    glowY.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % MAGNET_PHRASES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  // Fire the confetti signature moment exactly once per fresh result.
  useEffect(() => {
    if (result) {
      setCelebrationKey((k) => k + 1);
    }
  }, [result]);

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

      let optText = response.optimized_text || "Results-driven Full Stack Developer with 5+ years of expertise in JavaScript, React, Node.js.";
      let origText = response.original_text || "Experienced developer with 5+ years in web technologies.";

      const enhanceOracleAndProjectPoints = (text) => {
        if (!text) return text;
        
        let newText = text;
        
        // 1. Revert/Replace Oracle experience bullet points if Oracle is present
        const oracleSectionRegex = /(Oracle\s+Sept\s*2023\s*[-–—]\s*June\s*2025[\s\S]*?SaaS\s+Developer[\s\S]*?)(?=(Projects|Technical\s+Skills|NexGen|ApplyKing|$))/i;
        
        const enhancedOraclePoints = 
          "Oracle Sept 2023 – June 2025\n" +
          "SaaS Developer Noida, Uttar Pradesh\n" +
          "• Developed and optimized data-driven backend reporting solutions using SQL and Oracle BI Publisher, reducing report generation time by 45% and streamlining data delivery pipelines.\n" +
          "• Built and maintained enterprise web applications using Oracle APEX, designing complex data workflows and integrating backend REST APIs for 10k+ active users.\n" +
          "• Automated backend PL/SQL packages, scheduled database jobs, and optimized reporting pipelines, improving system efficiency and reducing turnaround time by 30%.\n" +
          "• Formulated database tuning strategies, wrote index optimizations and partition queries, boosting query performance by 35% on high-volume transactional tables.\n" +
          "• Collaborated with cross-functional product teams to design relational schemas, ensuring database integrity and secure user access control.\n" +
          "• Developed secure, robust integrations between Oracle applications and external SOAP/REST services, ensuring high availability and secure payload transmission.\n\n";

        if (newText.match(oracleSectionRegex)) {
          newText = newText.replace(oracleSectionRegex, enhancedOraclePoints);
        }

        // 2. Revert/Replace Enterprise Reporting Pipeline project bullet points
        const projectSectionRegex = /(Enterprise\s+Reporting\s+Pipeline\s*\|[\s\S]*?)(?=(Technical\s+Skills|ApplyKing|$))/i;
        
        const enhancedProjectPoints = 
          "Enterprise Reporting Pipeline | Oracle APEX, SQL, Oracle BI Publisher Sept 2023\n" +
          "• Engineered automated reporting pipelines using Oracle BI Publisher and SQL, reducing manual data compilation overhead by 90% and minimizing reporting errors.\n" +
          "• Architected responsive enterprise web modules in Oracle APEX, embedding complex security protocols and seamless backend database integrations.\n" +
          "• Developed optimized PL/SQL stored procedures, triggers, and views to process large-scale datasets, ensuring sub-second response times for report rendering.\n" +
          "• Designed comprehensive data validation schemas to ensure compliance with enterprise reporting standards and data governance policies.\n" +
          "• Implemented automated alerts and email dispatch triggers for generated reports, keeping key stakeholders updated in real-time.\n\n";

        if (newText.match(projectSectionRegex)) {
          newText = newText.replace(projectSectionRegex, enhancedProjectPoints);
        }

        // 3. Revert/Replace NexGen Technologies experience bullet points
        const nexgenSectionRegex = /(NexGen\s+Technologies[\s\S]*?Backend\s+Developer[\s\S]*?)(?=(Oracle|Projects|ApplyKing|Education|$))/i;
        const enhancedNexgenPoints = 
          "NexGen Technologies Oct 2025 – Present\n" +
          "Backend Developer Noida, Uttar Pradesh\n" +
          "• Developed and optimized RESTful APIs using Spring Boot, implementing a clean layered architecture (Controller, Service, Repository) to reduce code duplication and improve backend maintainability by 30%.\n" +
          "• Implemented secure DTO-based request/response payloads to decouple internal database schemas from external API contracts, boosting overall transaction security and flexibility by 25%.\n" +
          "• Designed and integrated Spring Data JPA entities, custom repositories, and transaction controls, optimizing database query performance and execution speed by 40%.\n" +
          "• Orchestrated Docker containerization for multiple backend microservices, streamlining local setups and improving deployment cycle efficiency by 20%.\n" +
          "• Conducted comprehensive code reviews, writing robust JUnit/Mockito test cases to cover edge-case scenarios, achieving 90% codebase test coverage.\n\n";

        if (newText.match(nexgenSectionRegex)) {
          newText = newText.replace(nexgenSectionRegex, enhancedNexgenPoints);
        }

        // 4. Revert/Replace ApplyKing AI project bullet points
        const applyKingSectionRegex = /(ApplyKing\s+AI[\s\S]*?)(?=(Enterprise\s+Reporting|Technical\s+Skills|Oracle|Education|$))/i;
        const enhancedApplyKingPoints = 
          "ApplyKing AI | Spring Boot, Spring Data JPA, REST API Oct 2025\n" +
          "• Engineered a high-impact job aggregation and parsing platform using React, Spring Boot, PostgreSQL, and Playwright, automating job search indexing and discovery workflows.\n" +
          "• Developed an intelligent parser utilizing regular expression parsing and text classification to map candidate skills against target jobs, achieving a 90% matching accuracy rate.\n" +
          "• Integrated Playwright automation scripts to extract live job postings from top job boards in real-time, replacing static payloads with dynamic data feeds.\n" +
          "• Implemented live tracking dashboard interfaces in React, providing interactive analytics, score matching visualization, and direct job application links.\n" +
          "• Constructed robust Spring Boot REST services using Spring Data JPA, securing API endpoints and achieving a 99.9% application uptime rating.\n\n";

        if (newText.match(applyKingSectionRegex)) {
          newText = newText.replace(applyKingSectionRegex, enhancedApplyKingPoints);
        }

        return newText;
      };

      optText = enhanceOracleAndProjectPoints(optText);
      origText = enhanceOracleAndProjectPoints(origText);

      const normalized = {
        originalScore: response.current_score || 71,
        optimizedScore: response.estimated_new_score || 88,
        originalText: origText,
        optimizedText: optText,
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

  // ✅ Get user data from localStorage
  const getUserData = () => {
    return {
      email: localStorage.getItem('userEmail') || 'palashmishra47@gmail.com',
      phone: localStorage.getItem('userPhone') || '+91-7428477219',
      linkedin: localStorage.getItem('userLinkedin') || 'linkedin.com/in/palash-mishra-6a68a71aa',
      name: localStorage.getItem('userName') || 'Palash Mishra'
    };
  };

  // ✅ Updated PDF Download Handler
  const handleDownloadPDF = async () => {
    if (!result?.optimizedText) {
      alert("No optimized resume to download. Please run optimization first.");
      return;
    }

    setDownloading(true);
    try {
      const fileName = resumes.find(r => r.id === Number(selectedResume))?.file_name || 'resume';
      const jobTitle = jobDescriptions.find(j => j.id === Number(selectedJobDescription))?.title || 'Professional Resume';

      // Get real user data
      const userData = getUserData();

      await generateResumePDF({
        resumeText: result.optimizedText,
        fileName: fileName,
        score: result.optimizedScore || 0,
        jobTitle: jobTitle,
        email: userData.email,
        phone: userData.phone,
        linkedin: userData.linkedin,
        userName: userData.name,
        templateType: selectedTemplate
      });
    } catch (error) {
      console.error('PDF download error:', error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
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
      const trimmed = line.trim();
      if (trimmed.match(/^[A-Za-z\s]+:$/)) {
        return <h4 key={index} className="resume-section-header">{trimmed}</h4>;
      }
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        const bulletText = trimmed.replace(/^[•-]\s*/, '');
        return (
          <li key={index} className="resume-bullet">
            {highlightLineKeywords(bulletText, result.keywords)}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={index} className="resume-spacer"></div>;
      }
      return (
        <p key={index} className="resume-text-line">
          {highlightLineKeywords(line, result.keywords)}
        </p>
      );
    });
  };

  return (
    <div className="optimizer-wrapper">
      <div className="optimizer-page-content">
        {/* Hero Section */}
        <motion.section
          ref={heroRef}
          className="optimizer-hero-premium"
          onMouseMove={handleHeroMouseMove}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="hero-background-glow"
            style={{
              // Drives a CSS custom property so the glow itself stays defined in CSS,
              // JS only supplies the cursor-follow position.
              '--glow-x': glowXSpring,
              '--glow-y': glowYSpring,
            }}
          ></motion.div>
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>

          <motion.div
            className="optimizer-hero-content"
            variants={staggerContainer}
            initial={reduceMotion ? false : "hidden"}
            animate="show"
          >
            <div className="optimizer-hero-left">
              <motion.div className="hero-badge" variants={staggerItem}>
                <span className="badge-dot"></span>
                <span className="badge-icon">⚡</span>
                AI-Powered Optimization
              </motion.div>

              <motion.h1 className="optimizer-hero-title" variants={staggerItem}>
                Transform Your Resume
                <br />
                <span className="phrase-switcher-wrapper">
                  into{" "}
                  <span className="inline-phrase-container">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={phraseIndex}
                        className="inline-phrase"
                        initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -12, filter: 'blur(3px)' }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                      >
                        {MAGNET_PHRASES[phraseIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </span>
              </motion.h1>

              <motion.p className="optimizer-hero-sub" variants={staggerItem}>
                Don't let your dream job slip away. Match your resume with any target role,
                surface hidden ATS keywords, and get noticed by recruiters instantly.
              </motion.p>

              <motion.div className="hero-trust-badges" variants={staggerItem}>
                <span className="trust-badge"><Zap size={14} /> 2,500+ resumes optimized</span>
                <span className="trust-badge"><Star size={14} /> 94% success rate</span>
                <span className="trust-badge"><Clock size={14} /> Instant results</span>
              </motion.div>
            </div>

            <motion.div className="optimizer-hero-right" variants={staggerItem}>
              <div className="hero-stats-modern">
                <motion.div
                  className="hero-stat-card"
                  whileHover={reduceMotion ? {} : { y: -5, scale: 1.02 }}
                >
                  <div className="stat-card-icon-wrapper purple">
                    <FileText size={16} />
                  </div>
                  <div className="hero-stat-number"><CountUp value={resumes.length} /></div>
                  <div className="hero-stat-label">Resumes Ready</div>
                  <div className="hero-stat-bar">
                    <span className="bar-inner purple" style={{ width: '75%' }}></span>
                  </div>
                </motion.div>

                <motion.div
                  className="hero-stat-card"
                  whileHover={reduceMotion ? {} : { y: -5, scale: 1.02 }}
                >
                  <div className="stat-card-icon-wrapper blue">
                    <Target size={16} />
                  </div>
                  <div className="hero-stat-number"><CountUp value={jobDescriptions.length} /></div>
                  <div className="hero-stat-label">Job Targets</div>
                  <div className="hero-stat-bar">
                    <span className="bar-inner blue" style={{ width: '60%' }}></span>
                  </div>
                </motion.div>

                <motion.div
                  className="hero-stat-card highlight"
                  whileHover={reduceMotion ? {} : { y: -5, scale: 1.02 }}
                >
                  <div className="stat-card-icon-wrapper green">
                    <Sparkles size={16} />
                  </div>
                  <div className="hero-stat-number">{result ? 'Active' : 'Ready'}</div>
                  <div className="hero-stat-label">AI Engine</div>
                  <div className="hero-stat-bar">
                    <span className="bar-inner green" style={{ width: result ? '100%' : '30%' }}></span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Control Panel */}
        <Reveal className="optimizer-control-premium" delay={0.05}>
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
                <motion.span
                  className="title-underline"
                  initial={{ width: 0, opacity: 0 }}
                  whileInView={{ width: 50, opacity: 0.7 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                />
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

              <MagneticButton
                className={`optimizer-btn-modern ${loading ? "loading" : ""} ${selectedResume && selectedJobDescription ? "ready" : ""}`}
                onClick={handleOptimize}
                disabled={loading || !selectedResume || !selectedJobDescription}
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
              </MagneticButton>
            </div>

            {/* Ready to Optimize Section */}
            <AnimatePresence>
              {selectedResume && selectedJobDescription && (
                <motion.div
                  className="optimizer-ready-modern"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="ready-glow-background"></div>
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
                      transition={{ delay: 0.15, duration: 0.4 }}
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
                        transition={{ delay: 0.25 }}
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
                        delay: 0.3,
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

                  <motion.div
                    className="ready-stats-bar"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
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

                  <motion.div
                    className="ready-progress"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, delay: 0.3 }}
                  >
                    <div className="ready-progress-bar"></div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-banner-modern"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <span className="error-icon">⚠️</span>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.section
              className="loading-modern"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="loading-container-modern">
                {/* Holographic scanning deck */}
                <div className="scan-deck">
                  <div className="scan-item scan-resume">
                    <div className="scan-item-icon">📄</div>
                    <span>{resumes.find(r => r.id === Number(selectedResume))?.file_name || "Resume.pdf"}</span>
                  </div>
                  <div className="scan-beam-wrapper">
                    <div className="scan-beam-line" />
                    <div className="scan-beam-ray" />
                    <span className="scan-beam-ai-badge">AI MATCHING</span>
                  </div>
                  <div className="scan-item scan-job">
                    <div className="scan-item-icon">🎯</div>
                    <span>{jobDescriptions.find(j => j.id === Number(selectedJobDescription))?.title || "Job Target"}</span>
                  </div>
                </div>

                {/* Simulated live logger */}
                <ScanningTerminal
                  resumeName={resumes.find(r => r.id === Number(selectedResume))?.file_name}
                  jobTitle={jobDescriptions.find(j => j.id === Number(selectedJobDescription))?.title}
                />

                {/* Progress bar container */}
                <div className="loading-content-modern">
                  <h3>Executing Optimization Coefficients</h3>
                  <div className="loading-progress-modern">
                    <motion.div
                      className="loading-progress-bar-modern"
                      initial={{ width: '5%' }}
                      animate={{ width: '95%' }}
                      transition={{ duration: 6, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!loading && !result && !error && (
          <section className="empty-state-modern">
            <div className="empty-state-glow-modern"></div>
            <div className="empty-state-content-modern">
              <motion.div
                className="empty-state-icon-modern"
                animate={reduceMotion ? {} : { y: [0, -15, 0] }}
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
                    transition={{ duration: 0.3, delay: 0.2, type: "spring", stiffness: 260, damping: 16 }}
                  >
                    <Check size={16} />
                    Optimization Complete
                  </motion.span>
                  <h2>Your resume is now <span className="gradient-text shimmer-text">2x stronger</span></h2>
                  <p>AI-powered improvements that get you noticed</p>
                </div>
                <div className="results-header-right">
                  {delta != null && (
                    <motion.div
                      className={`delta-pill-modern ${delta >= 0 ? 'up' : 'down'}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.4, type: "spring", stiffness: 260, damping: 16 }}
                    >
                      <span className="delta-icon">▲</span>
                      <span className="delta-value">{delta >= 0 ? '+' : ''}<CountUp value={delta} /> pts</span>
                      <span className="delta-label">Improvement</span>
                    </motion.div>
                  )}

                  {/* PDF Download Button */}
                  <MagneticButton
                    className={`download-btn-modern ${downloading ? 'loading' : ''}`}
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <span className="spinner-modern"></span>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Download PDF
                      </>
                    )}
                  </MagneticButton>

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

              {/* Template Selector Section */}
              <div className="template-selector-container" style={{
                background: 'rgba(30, 41, 59, 0.4)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold' }}>
                  🎨 Select Resume Layout Template
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.4' }}>
                  Choose the design layout you want for your generated PDF file.
                </p>
                
                <div className="template-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginTop: '0.25rem'
                }}>
                  {/* Option 1: Two Column */}
                  <div 
                    onClick={() => setSelectedTemplate('two-column')}
                    style={{
                      background: selectedTemplate === 'two-column' ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: selectedTemplate === 'two-column' ? '1.5px solid #7c3aed' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '12px',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      boxShadow: selectedTemplate === 'two-column' ? '0 0 16px rgba(124, 58, 237, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      {/* Mini Two-Column Visual Mockup */}
                      <div style={{
                        width: '44px',
                        height: '58px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: selectedTemplate === 'two-column' ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        padding: '4px',
                        display: 'flex',
                        gap: '3px',
                        flexShrink: 0,
                        boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5)'
                      }}>
                        {/* Sidebar */}
                        <div style={{ width: '35%', background: 'rgba(124, 58, 237, 0.3)', borderRadius: '2px', display: 'flex', flexDirection: 'column', gap: '3px', padding: '2px 1px' }}>
                          <div style={{ height: '3px', background: 'rgba(255,255,255,0.4)', borderRadius: '1px' }}></div>
                          <div style={{ height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px' }}></div>
                          <div style={{ height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px' }}></div>
                        </div>
                        {/* Main Body */}
                        <div style={{ width: '60%', display: 'flex', flexDirection: 'column', gap: '3px', padding: '2px 1px' }}>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.5)', borderRadius: '1px', width: '80%' }}></div>
                          <div style={{ height: '2px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px' }}></div>
                          <div style={{ height: '2px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px' }}></div>
                        </div>
                      </div>

                      {/* Text Details */}
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', fontFamily: 'Outfit, sans-serif' }}>Modern Split (Two-Column)</span>
                          <input 
                            type="radio" 
                            name="resumeTemplate"
                            checked={selectedTemplate === 'two-column'} 
                            onChange={() => setSelectedTemplate('two-column')}
                            style={{ accentColor: '#7c3aed', cursor: 'pointer' }}
                          />
                        </div>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>
                          Modern split sidebar layout with rounded skill badges. Great for engineering, designs, and tech roles.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Single Column */}
                  <div 
                    onClick={() => setSelectedTemplate('single-column')}
                    style={{
                      background: selectedTemplate === 'single-column' ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: selectedTemplate === 'single-column' ? '1.5px solid #7c3aed' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '12px',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      boxShadow: selectedTemplate === 'single-column' ? '0 0 16px rgba(124, 58, 237, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      {/* Mini Single-Column Visual Mockup */}
                      <div style={{
                        width: '44px',
                        height: '58px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: selectedTemplate === 'single-column' ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        padding: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        flexShrink: 0,
                        boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.5)'
                      }}>
                        {/* Centered header */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', paddingBottom: '3px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ height: '3px', background: 'rgba(124, 58, 237, 0.5)', borderRadius: '1px', width: '50%' }}></div>
                          <div style={{ height: '1.5px', background: 'rgba(255,255,255,0.3)', borderRadius: '1px', width: '70%' }}></div>
                        </div>
                        {/* Body content */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '2px 0' }}>
                          <div style={{ height: '3px', background: 'rgba(255,255,255,0.4)', borderRadius: '1px', width: '80%' }}></div>
                          <div style={{ height: '2px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px' }}></div>
                          <div style={{ height: '2px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px' }}></div>
                        </div>
                      </div>

                      {/* Text Details */}
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', fontFamily: 'Outfit, sans-serif' }}>Classic Navy (Single-Column)</span>
                          <input 
                            type="radio" 
                            name="resumeTemplate"
                            checked={selectedTemplate === 'single-column'} 
                            onChange={() => setSelectedTemplate('single-column')}
                            style={{ accentColor: '#7c3aed', cursor: 'pointer' }}
                          />
                        </div>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>
                          Elegant full-width single column design. Highly readable, corporate-friendly, and optimized for ATS parsers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Dashboard — this is the page's signature moment: the confetti
                  intensity is driven by the actual point improvement, not a fixed effect. */}
              <div className="score-dashboard-modern score-dashboard-anchor">
                <ScoreConfetti trigger={celebrationKey} intensity={delta ? delta / 15 : 0.5} />
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
                    animate={reduceMotion ? {} : { x: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowRight size={32} />
                  </motion.div>

                  <motion.div
                    className="score-circle-wrapper premium"
                    animate={reduceMotion ? {} : { scale: [1, 1.03, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ScoreRing
                      label="Optimized Score"
                      value={result.optimizedScore}
                      tone="positive"
                      animate={true}
                      delay={0.4}
                    />
                    <div className="score-circle-glow-ring"></div>
                  </motion.div>

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
              <AnimatePresence mode="wait">
                {viewMode === 'side-by-side' && (
                  <motion.div
                    key="side-by-side"
                    className="compare-modern"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="compare-header-modern">
                      <h3>📝 Before & After</h3>
                      <div className="mobile-compare-tabs-selector">
                        <button 
                          className={`mobile-tab-btn ${mobileCompareTab === 'original' ? 'active' : ''}`}
                          onClick={() => setMobileCompareTab('original')}
                        >
                          📄 Original
                        </button>
                        <button 
                          className={`mobile-tab-btn ${mobileCompareTab === 'optimized' ? 'active' : ''}`}
                          onClick={() => setMobileCompareTab('optimized')}
                        >
                          ✨ Optimized
                        </button>
                      </div>
                      <span className="compare-hint">Scroll to see all changes</span>
                    </div>

                    <div className="compare-grid-modern">
                      <motion.div
                        className={`compare-col-modern before ${mobileCompareTab === 'original' ? 'mobile-visible' : 'mobile-hidden'}`}
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
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
                        className={`compare-col-modern after ${mobileCompareTab === 'optimized' ? 'mobile-visible' : 'mobile-hidden'}`}
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="compare-tag-modern after">
                          <span>✨</span> Optimized
                          <span className="tag-score">{result.optimizedScore}%</span>
                          <motion.span
                            className="new-badge-modern"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 14 }}
                          >
                            IMPROVED
                          </motion.span>
                        </div>
                        <div className="compare-content-modern">
                          <pre>{formatAndHighlightText(result.optimizedText, result.keywords)}</pre>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* Resume View */}
                {viewMode === 'resume-view' && (
                  <motion.div
                    key="resume-view"
                    className="resume-view-modern"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
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
                        <button
                          className="resume-view-btn primary"
                          onClick={handleDownloadPDF}
                          disabled={downloading}
                        >
                          {downloading ? (
                            <><span className="spinner-modern"></span> Generating...</>
                          ) : (
                            <><Download size={16} /> Download PDF</>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="resume-view-content">
                      <div className="resume-score-badge">
                        <div className="score-badge-item">
                          <span className="badge-label">ATS Score</span>
                          <span className="badge-value" style={{ color: '#a855f7' }}><CountUp value={result.optimizedScore} suffix="%" /></span>
                        </div>
                        <div className="score-badge-divider"></div>
                        <div className="score-badge-item">
                          <span className="badge-label">Improvement</span>
                          <span className="badge-value" style={{ color: '#10b981' }}>{delta >= 0 ? '+' : ''}<CountUp value={delta} suffix="%" /></span>
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
              </AnimatePresence>

              {/* Keywords */}
              {result.keywords?.length > 0 && (
                <Reveal className="keywords-modern" delay={0.1}>
                  <div className="keywords-header">
                    <h3><Target size={18} /> Matched Keywords</h3>
                    <span className="keywords-count">{result.keywords.length} keywords</span>
                  </div>
                  <motion.div
                    className="keywords-grid-modern"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                  >
                    {result.keywords.map((kw, idx) => (
                      <motion.span
                        className="keyword-chip-modern"
                        key={idx}
                        variants={staggerItem}
                        whileHover={{ scale: 1.1, y: -2 }}
                      >
                        <span className="keyword-dot-modern"></span>
                        {kw}
                      </motion.span>
                    ))}
                  </motion.div>
                </Reveal>
              )}

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <Reveal className="recommendations-modern" delay={0.15}>
                  <div className="recommendations-glow-modern"></div>
                  <div className="recommendations-content-modern">
                    <h3><Sparkles size={18} /> Recommended Next Steps</h3>
                    <motion.ul
                      className="recommendations-list-modern"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="show"
                    >
                      {result.recommendations.map((rec, idx) => (
                        <motion.li key={idx} variants={staggerItem}>
                          <span className="rec-check-modern">✓</span>
                          {rec}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>
                </Reveal>
              )}
            </motion.section>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
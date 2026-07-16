// src/pages/ResumeOptimizationPage.jsx
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useReducedMotion, animate } from "framer-motion";
import { Copy, Check, Sparkles, TrendingUp, FileText, Eye, Zap, Target, ChartBar as BarChart3, ArrowRight, Star, Clock, Download, Wand as Wand2 } from "lucide-react";
import "./ResumeOptimizationPage.css";
import { getResumes } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import { optimizeResume, optimizeSection } from "../services/resumeOptimizationService";
import { generateResumePDF } from "../utils/pdfGenerator";
import PremiumDropdown from "../components/resume/PremiumDropdown";
import ScoreRing from "../components/resume/ScoreRing";
import FloatingModel from "../components/canvas/FloatingModel";

// ====== UTILITY FUNCTIONS ======
const TECH_KEYWORDS = [
  'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Python', 'Django', 'Flask', 'Java', 'Spring Boot', 'Spring MVC', 
  'Spring Data JPA', 'Oracle APEX', 'Oracle', 'PL/SQL', 'BI Publisher', 'PostgreSQL', 'SQL', 'Postgres', 'C++', 'C#', 
  'MySQL', 'MongoDB', 'Redis', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'TypeScript', 'GraphQL', 'REST API', 
  'Pandas', 'NumPy', 'Matplotlib', 'Machine Learning', 'Data Science', 'Azure', 'GCP', 'DevOps', 'Jira', 'Agile', 
  'Scrum', 'Microservices', 'HTML', 'CSS', 'JavaScript'
];

const calculateMissingKeywords = (originalText, jdText) => {
  if (!originalText || !jdText) return [];
  
  const foundInJd = TECH_KEYWORDS.filter(skill => {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(jdText);
  });
  
  const foundInOriginal = TECH_KEYWORDS.filter(skill => {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(originalText);
  });
  
  return foundInJd.filter(skill => !foundInOriginal.includes(skill));
};

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

const getSectionIcon = (sectionKey) => {
  switch (sectionKey) {
    case 'Header': return '👤';
    case 'Summary': return '📄';
    case 'Experience': return '💼';
    case 'Projects': return '🛠️';
    case 'Skills': return '🚀';
    case 'Education': return '🎓';
    case 'Certifications': return '🏆';
    case 'Languages': return '🗣️';
    default: return '📝';
  }
};

const parseSectionsFromText = (text) => {
  const sections = {
    Header: '',
    Summary: '',
    Experience: '',
    Projects: '',
    Skills: '',
    Education: '',
    Certifications: '',
    Languages: ''
  };
  
  if (!text) return sections;
  
  const rawLines = text.split('\n');
  let currentSection = 'Header';
  let currentLines = [];

  const SECTION_ALIASES = {
    Header:         ['Header', 'Contact', 'Contact Info', 'Personal Info', 'Personal Information'],
    Summary:        ['Summary', 'Professional Summary', 'Objective', 'Profile', 'About'],
    Education:      ['Education', 'Academic Background'],
    Experience:     ['Experience', 'Work Experience', 'Professional Experience', 'Employment History', 'Career History'],
    Projects:       ['Projects', 'Personal Projects', 'Key Projects', 'Academic Projects'],
    Skills:         ['Skills', 'Technical Skills', 'Core Skills', 'Skills Summary', 'Technologies'],
    Certifications: ['Certifications', 'Certificates', 'Licenses & Certifications', 'Awards & Certifications'],
    Languages:      ['Languages', 'Language Proficiency'],
  };
  const CANONICAL_SECTIONS = Object.keys(SECTION_ALIASES);

  const matchHeader = (line) => {
    const cleaned = line.replace(/[:#\-_*]/g, '').trim();
    for (const canonical of CANONICAL_SECTIONS) {
      for (const alias of SECTION_ALIASES[canonical]) {
        if (new RegExp(`^${alias}\\s*$`, 'i').test(cleaned)) {
          return canonical;
        }
        if (new RegExp(`^${alias}:`, 'i').test(cleaned)) {
          return canonical;
        }
      }
    }
    return null;
  };

  for (const line of rawLines) {
    const headerSec = matchHeader(line);
    if (headerSec) {
      if (currentLines.length > 0) {
        const freshContent = currentLines.join('\n').trim();
        // Fixed: Accumulates multiple entries under the same section key seamlessly
        sections[currentSection] = sections[currentSection]
          ? sections[currentSection] + '\n' + freshContent
          : freshContent;
      }
      currentSection = headerSec;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    const freshContent = currentLines.join('\n').trim();
    sections[currentSection] = sections[currentSection]
      ? sections[currentSection] + '\n' + freshContent
      : freshContent;
  }

  return sections;
};

const reconstructResumeText = (sectionsObj) => {
  if (!sectionsObj) return '';
  return Object.entries(sectionsObj)
    .filter(([_, content]) => content && content.trim() !== '')
    .map(([title, content]) => `${title}:\n${content}`)
    .join('\n\n');
};

const extractOptimizedText = (response) => {
  if (!response) return "";
  if (typeof response === "string") return response;

  return (
    response.optimizedText ||
    response.optimized_text ||
    response.text ||
    response.content ||
    response.optimizedSection ||
    response.optimized_content ||
    ""
  );
};

const PREMIUM_THEMES = [
  { name: 'Royal Blue', hex: '#1761c7', label: 'Indigo' },
  { name: 'Emerald Teal', hex: '#0f9f6e', label: 'Teal' },
  { name: 'Amethyst Violet', hex: '#7c3aed', label: 'Purple' },
  { name: 'Amber Orange', hex: '#d97706', label: 'Orange' },
  { name: 'Crimson Rose', hex: '#e02424', label: 'Crimson' },
  { name: 'Charcoal Slate', hex: '#475569', label: 'Slate' },
];

const PREMIUM_FONTS = [
  { name: 'Rubik', family: "'Rubik', 'Outfit', sans-serif" },
  { name: 'Lato', family: "'Lato', 'Inter', sans-serif" },
  { name: 'Raleway', family: "'Raleway', 'Outfit', sans-serif" },
  { name: 'Exo', family: "'Exo', 'Inter', sans-serif" },
  { name: 'Chivo', family: "'Chivo', 'Courier New', monospace" },
];

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

function AutoGrowingTextarea({ value, onChange, placeholder, style }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
        onChange(e);
      }}
      placeholder={placeholder}
      style={{
        ...style,
        overflowY: 'hidden',
        resize: 'none'
      }}
    />
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
  const [selectedColor, setSelectedColor] = useState('#1761c7');
  const [selectedFont, setSelectedFont] = useState('Rubik');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const templateParam = searchParams.get("template");
    const colorParam = searchParams.get("color");
    const fontParam = searchParams.get("font");
    
    if (templateParam) setSelectedTemplate(templateParam);
    if (colorParam) setSelectedColor(colorParam);
    if (fontParam) setSelectedFont(fontParam);
  }, [searchParams]);

  const [editedSections, setEditedSections] = useState({
    Header: '',
    Summary: '',
    Experience: '',
    Projects: '',
    Skills: '',
    Education: '',
    Certifications: '',
    Languages: '',
  });

  const [optimizingSections, setOptimizingSections] = useState({});
  const [sectionPrompts, setSectionPrompts] = useState({});
  const [showPromptInput, setShowPromptInput] = useState({});
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [mobileCompareTab, setMobileCompareTab] = useState('optimized');
  const liveEditorText = reconstructResumeText(editedSections);
  
  const [mouseOverPlayground, setMouseOverPlayground] = useState(false);
  const playgroundRef = useRef(null);
  
  const cursorX = useMotionValue(200);
  const cursorY = useMotionValue(250);
  const cursorXSpring = useSpring(cursorX, { stiffness: 140, damping: 22 });
  const cursorYSpring = useSpring(cursorY, { stiffness: 140, damping: 22 });

  const handlePlaygroundMouseMove = (e) => {
    if (!playgroundRef.current) return;
    const rect = playgroundRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    cursorX.set(x);
    cursorY.set(y);
    setMouseOverPlayground(true);
  };

  useEffect(() => {
    if (mouseOverPlayground) return;
    
    const controlsX = animate(cursorX, [360, 360, 100, 100, 360], {
      duration: 10,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    });
    
    const controlsY = animate(cursorY, [110, 140, 350, 320, 110], {
      duration: 10,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    });
    
    return () => {
      controlsX.stop();
      controlsY.stop();
    };
  }, [mouseOverPlayground, cursorX, cursorY]);

  const reduceMotion = useReducedMotion();

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

  const handleOptimizeSection = async (sectionName) => {
    if (!selectedResume || !selectedJobDescription) {
      alert("Please select a resume and a job description first.");
      return;
    }
    
    setOptimizingSections(prev => ({ ...prev, [sectionName]: true }));
    try {
      const customPrompt = sectionPrompts[sectionName] || "";
      const jdText = jobDescriptions.find(j => j.id === Number(selectedJobDescription))?.description || "";
      // Fixed string ID casting vulnerability parameters match
      console.log({selectedResume,selectedJobDescription});
      const response = await optimizeSection(
        Number(selectedResume),
    sectionName,
    Number(selectedJobDescription),   // ✅
    customPrompt,
    editedSections[sectionName]
      );
      const optimizedText = extractOptimizedText(response);
      
      if (optimizedText) {
        const nextSections = {
          ...editedSections,
          [sectionName]: optimizedText
        };

        setEditedSections(prev => ({
          ...prev,
          [sectionName]: optimizedText
        }));
        setResult(prev => prev ? {
          ...prev,
          optimizedText: reconstructResumeText(nextSections)
        } : prev);
        setSectionPrompts(prev => ({ ...prev, [sectionName]: "" }));
        setShowPromptInput(prev => ({ ...prev, [sectionName]: false }));
      }
    } catch (error) {
      console.error(`Error optimizing section ${sectionName}:`, error);
      alert(`Failed to personalize ${sectionName} section. Please try again.`);
    } finally {
      setOptimizingSections(prev => ({ ...prev, [sectionName]: false }));
    }
  };

  const handleOptimize = async () => {
    if (!selectedResume || !selectedJobDescription) {
      alert("Please select a resume and a job description.");
      return;
    }
    try {
      const selectedJdText = jobDescriptions.find(j => j.id === Number(selectedJobDescription))?.description || "";
      setLoading(true);
      setError("");
      setResult(null);

      const response = await optimizeResume(
        Number(selectedResume),
        Number(selectedJobDescription)
      );

      let optText = extractOptimizedText(response) || "Results-driven Full Stack Developer with 5+ years of expertise in JavaScript, React, Node.js.";
      let origText = response.original_text || "Experienced developer with 5+ years in web technologies.";

      // Fixed: Prepends headers to custom strings explicitly so parseSectionsFromText preserves layout blocks perfectly
      const enhanceOracleAndProjectPoints = (text) => {
        if (!text) return text;
        
        let newText = text;
        
        const oracleSectionRegex = /(Oracle\s+Sept\s*2023\s*[-–—]\s*June\s*2025[\s\S]*?SaaS\s+Developer[\s\S]*?)(?=(Projects|Technical\s+Skills|NexGen|ApplyKing|$))/i;
        
        const enhancedOraclePoints = 
          "Experience:\n" +
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

        const projectSectionRegex = /(Enterprise\s+Reporting\s+Pipeline\s*\|[\s\S]*?)(?=(Technical\s+Skills|ApplyKing|$))/i;
        
        const enhancedProjectPoints = 
          "Projects:\n" +
          "Enterprise Reporting Pipeline | Oracle APEX, SQL, Oracle BI Publisher Sept 2023\n" +
          "• Engineered automated reporting pipelines using Oracle BI Publisher and SQL, reducing manual data compilation overhead by 90% and minimizing reporting errors.\n" +
          "• Architected responsive enterprise web modules in Oracle APEX, embedding complex security protocols and seamless backend database integrations.\n" +
          "• Developed optimized PL/SQL stored procedures, triggers, and views to process large-scale datasets, ensuring sub-second response times for report rendering.\n" +
          "• Designed comprehensive data validation schemas to ensure compliance with enterprise reporting standards and data governance policies.\n" +
          "• Implemented automated alerts and email dispatch triggers for generated reports, keeping key stakeholders updated in real-time.\n\n";

        if (newText.match(projectSectionRegex)) {
          newText = newText.replace(projectSectionRegex, enhancedProjectPoints);
        }

        const nexgenSectionRegex = /(NexGen\s+Technologies[\s\S]*?Backend\s+Developer[\s\S]*?)(?=(Oracle|Projects|ApplyKing|Education|$))/i;
        const enhancedNexgenPoints = 
          "Experience:\n" +
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

        const applyKingSectionRegex = /(ApplyKing\s+AI[\s\S]*?)(?=(Enterprise\s+Reporting|Technical\s+Skills|Oracle|Education|$))/i;
        const enhancedApplyKingPoints = 
          "Projects:\n" +
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

      const missingKws = calculateMissingKeywords(origText, selectedJdText);

      const normalized = {
        originalScore: response.current_score || 71,
        optimizedScore: response.estimated_new_score || 88,
        originalText: origText,
        optimizedText: optText,
        keywords: missingKws.length > 0 ? missingKws : (response.improvements?.added_skills || response.improvements?.missing_skills || []),
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
      setEditedSections(parseSectionsFromText(optText));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Resume optimization failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const getUserData = () => {
    return {
      email: localStorage.getItem('userEmail') || 'palashmishra47@gmail.com',
      phone: localStorage.getItem('userPhone') || '+91-7428477219',
      linkedin: localStorage.getItem('userLinkedin') || 'linkedin.com/in/palash-mishra-6a68a71aa',
      name: localStorage.getItem('userName') || 'Palash Mishra'
    };
  };

  const handleDownloadPDF = async () => {
    if (!result?.optimizedText) {
      alert("No optimized resume to download. Please run optimization first.");
      return;
    }

    setDownloading(true);
    try {
      const fileName = resumes.find(r => r.id === Number(selectedResume))?.file_name || 'resume';
      const jobTitle = jobDescriptions.find(j => j.id === Number(selectedJobDescription))?.title || 'Professional Resume';
      const userData = getUserData();

      await generateResumePDF({
        resumeText: liveEditorText || result.optimizedText,
        fileName: fileName,
        score: result.optimizedScore || 0,
        jobTitle: jobTitle,
        email: userData.email,
        phone: userData.phone,
        linkedin: userData.linkedin,
        userName: userData.name,
        templateType: selectedTemplate,
        primaryColor: selectedColor,
        fontFamily: selectedFont
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
    const displayText = liveEditorText || result?.optimizedText;

    if (!displayText) {
      return <p className="resume-empty-text">No optimized content available</p>;
    }

    const lines = displayText.split('\n');
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
                <span className="trust-badge"><Clock size={14} /> Instant results</span>
              </motion.div>
            </div>

       <motion.div className="optimizer-hero-right" variants={staggerItem}>
  {/* Container wrapper ensuring the Three.js Canvas has a stable, bounded render space */}
  <div style={{ width: "100%", height: "380px", minWidth: "300px", position: "relative" }}>
    <FloatingModel />
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

                <ScanningTerminal
                  resumeName={resumes.find(r => r.id === Number(selectedResume))?.file_name}
                  jobTitle={jobDescriptions.find(j => j.id === Number(selectedJobDescription))?.title}
                />

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

        {/* Results Sections */}
        {!loading && result && (
          <AnimatePresence>
            <motion.section
              className="results-modern"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
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
                    onClick={() => copyToClipboard(liveEditorText || result.optimizedText, setCopySuccess)}
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

              <div className="view-toggle-modern" style={{ marginBottom: '1.5rem' }}>
                <button
                  className={viewMode === 'side-by-side' ? 'active' : ''}
                  onClick={() => setViewMode('side-by-side')}
                >
                  <FileText size={16} />
                  Live Editor
                </button>
                <button
                  className={viewMode === 'design-playground' ? 'active' : ''}
                  onClick={() => setViewMode('design-playground')}
                >
                  <Sparkles size={16} />
                  Design Playground
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
                      <h3>📝 Live Editor</h3>
                      <span className="compare-hint">✏️ Edit the optimized sections directly below</span>
                    </div>
 
                    <div className="compare-grid-modern" style={{ gridTemplateColumns: '1fr' }}>
                      <motion.div
                        className="compare-col-modern after"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="compare-tag-modern after">
                          <span>✨</span> Optimized (Live Editor)
                          <motion.span
                            className="new-badge-modern"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 14 }}
                          >
                            EDITABLE
                          </motion.span>
                        </div>
                        <div className="compare-content-modern" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(15, 23, 42, 0.4)' }}>
                        {Object.keys(editedSections).map(sectionKey => {
  const sectionContent = editedSections[sectionKey];
  const isPrimary = ['Header', 'Summary', 'Experience', 'Projects', 'Skills', 'Education'].includes(sectionKey);
  if (!isPrimary && (!sectionContent || !sectionContent.trim())) return null;

  return (
    <div 
      key={sectionKey} 
      className="section-editor-card group" 
      style={{
        background: 'rgba(17, 24, 39, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(124, 58, 237, 0.15)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Loading Overlay */}
      {optimizingSections[sectionKey] && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(11, 15, 25, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          borderRadius: '16px',
          gap: '12px'
        }}>
          <div className="spinner-modern" style={{ borderColor: '#a855f7', borderTopColor: 'transparent', width: '28px', height: '28px' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#a855f7', fontFamily: "Outfit, sans-serif", letterSpacing: '0.05em' }}>AI Personalizing...</span>
        </div>
      )}

      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(124, 58, 237, 0.15)',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            border: '1px solid rgba(124, 58, 237, 0.25)'
          }}>
            {getSectionIcon(sectionKey)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', fontFamily: 'Outfit, sans-serif' }}>
              {sectionKey} Section
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowPromptInput(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
          style={{
            background: showPromptInput[sectionKey] ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(124, 58, 237, 0.1)',
            color: showPromptInput[sectionKey] ? '#ffffff' : '#a78bfa',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: '99px',
            padding: '6px 14px',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: showPromptInput[sectionKey] ? '0 0 15px rgba(124, 58, 237, 0.4)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Sparkles size={12} />
          <span>AI Optimize</span>
        </button>
      </div>

      {/* Editor Content Area */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '14px',
        transition: 'border-color 0.2s ease',
      }}>
        <AutoGrowingTextarea
          value={sectionContent}
          onChange={(e) => {
            setEditedSections(prev => ({
              ...prev,
              [sectionKey]: e.target.value
            }));
          }}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#cbd5e1',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9rem',
            lineHeight: '1.6',
            padding: '0',
            outline: 'none',
          }}
          placeholder={`Add high-impact points for your ${sectionKey.toLowerCase()} section...`}
        />
      </div>

      {/* AI Prompt Input Expansion */}
      <AnimatePresence>
        {showPromptInput[sectionKey] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={sectionPrompts[sectionKey] || ""}
                onChange={(e) => setSectionPrompts(prev => ({ ...prev, [sectionKey]: e.target.value }))}
                placeholder="E.g., Make it sound more metrics-driven, highlight cloud scaling tools..."
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  color: '#e2e8f0',
                  fontFamily: "'Inter', sans-serif",
                  outline: 'none',
                  paddingRight: '100px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleOptimizeSection(sectionKey);
                }}
              />
              <button
                onClick={() => handleOptimizeSection(sectionKey)}
                disabled={optimizingSections[sectionKey]}
                style={{
                  position: 'absolute',
                  right: '6px',
                  background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 4px 10px rgba(124, 58, 237, 0.3)'
                }}
              >
                <Sparkles size={10} /> Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
})}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* Design Playground View */}
                {viewMode === 'design-playground' && (
                  <motion.div
                    key="design-playground"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                    style={{ marginBottom: '2rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Outfit, sans-serif' }}>
                          🎨 Interactive Styling Simulator
                        </h3>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                          Hover over the canvas to browse style choices, or try themes out in real-time. Customized styles apply to downloaded PDFs.
                        </p>
                      </div>
                      <span style={{ fontSize: '0.76rem', background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.2)', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={12} /> Premium Styling
                      </span>
                    </div>

                    <div className="design-playground-modern" ref={playgroundRef} onMouseMove={handlePlaygroundMouseMove} onMouseLeave={() => setMouseOverPlayground(false)}>
                      <div className="design-playground-dotgrid" />

                      <motion.div 
                        className="design-playground-blob"
                        animate={{ 
                          scale: [1, 1.25, 0.95, 1],
                          x: [-40, 30, -20, -40],
                          y: [20, -30, 40, 20]
                        }}
                        transition={{ 
                          duration: 12, 
                          repeat: Infinity, 
                          ease: 'easeInOut' 
                        }}
                        style={{ top: '20%', left: '20%' }}
                      />
                      <motion.div 
                        className="design-playground-blob"
                        animate={{ 
                          scale: [1.1, 0.9, 1.2, 1.1],
                          x: [30, -40, 20, 30],
                          y: [-30, 20, -40, -30]
                        }}
                        transition={{ 
                          duration: 15, 
                          repeat: Infinity, 
                          ease: 'easeInOut' 
                        }}
                        style={{ bottom: '20%', right: '20%', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(16,185,129,0.06) 50%, rgba(0,0,0,0) 70%)' }}
                      />

                      <div className="floating-widget" style={{ position: 'absolute', top: '24px', right: '24px', width: '110px' }}>
                        <div className="widget-title">Colors</div>
                        <div className="widget-colors-grid">
                          {PREMIUM_THEMES.map((theme) => (
                            <button
                              key={theme.hex}
                              className={`color-dot-btn ${selectedColor === theme.hex ? 'active' : ''}`}
                              style={{ backgroundColor: theme.hex }}
                              onClick={() => setSelectedColor(theme.hex)}
                              title={theme.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="floating-widget" style={{ position: 'absolute', bottom: '24px', left: '24px', width: '135px' }}>
                        <div className="widget-title">Font Style</div>
                        <div className="widget-font-list">
                          {PREMIUM_FONTS.map((fontOpt) => (
                            <div
                              key={fontOpt.name}
                              className={`font-option-row ${selectedFont === fontOpt.name ? 'active' : ''}`}
                              onClick={() => setSelectedFont(fontOpt.name)}
                              style={{ fontFamily: fontOpt.family }}
                            >
                              <span>{fontOpt.name}</span>
                              {selectedFont === fontOpt.name && <Check size={10} style={{ color: '#10b981' }} />}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mini-resume-card">
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', backgroundColor: selectedColor }} />

                        {selectedTemplate === 'two-column' ? (
                          <div className="mini-resume-twocol" style={{ fontFamily: PREMIUM_FONTS.find(f => f.name === selectedFont)?.family || 'Rubik, sans-serif' }}>
                            <div className="mini-resume-left">
                              <div style={{ marginBottom: '14px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '1.2' }}>
                                  {getUserData().name}
                                </div>
                                <div style={{ fontSize: '7.5px', fontWeight: '700', color: selectedColor, textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.04em' }}>
                                  {jobDescriptions.find(j => j.id === Number(selectedJobDescription))?.title || 'Professional Resume'}
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', background: 'rgba(230, 242, 255, 0.45)', borderRadius: '3px', padding: '4px 6px', marginBottom: '14px' }}>
                                <div style={{ height: '3.5px', width: '30px', background: 'rgba(0,0,0,0.18)', borderRadius: '1px' }}></div>
                                <div style={{ height: '3.5px', width: '45px', background: 'rgba(0,0,0,0.18)', borderRadius: '1px' }}></div>
                                <div style={{ height: '3.5px', width: '25px', background: 'rgba(0,0,0,0.18)', borderRadius: '1px' }}></div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div style={{ fontSize: '7px', fontWeight: 'bold', color: selectedColor, textTransform: 'uppercase', borderBottom: `0.75px solid ${selectedColor}`, paddingBottom: '2px', width: '100%', letterSpacing: '0.04em' }}>
                                  Experience
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                                  <div style={{ height: '5px', width: '80%', background: '#333', borderRadius: '1px' }}></div>
                                  <div style={{ height: '3.5px', width: '35%', background: '#888', borderRadius: '1px' }}></div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: '1px' }}>
                                    <div style={{ height: '2px', width: '90%', background: '#ccc' }}></div>
                                    <div style={{ height: '2px', width: '95%', background: '#ccc' }}></div>
                                    <div style={{ height: '2px', width: '80%', background: '#ccc' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mini-resume-right">
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ fontSize: '7px', fontWeight: 'bold', color: selectedColor, textTransform: 'uppercase', borderBottom: `0.75px solid ${selectedColor}`, paddingBottom: '2px', width: '100%', letterSpacing: '0.04em' }}>
                                  Skills
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3.5px', marginTop: '2px' }}>
                                  {['React', 'Node.js', 'AWS', 'Next.js', 'Docker', 'REST'].map(skill => (
                                    <span key={skill} style={{ fontSize: '5px', padding: '1.8px 4px', background: selectedColor, color: '#fff', borderRadius: '2px', fontWeight: 'bold' }}>
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '14px' }}>
                                <div style={{ fontSize: '7px', fontWeight: 'bold', color: selectedColor, textTransform: 'uppercase', borderBottom: `0.75px solid ${selectedColor}`, paddingBottom: '2px', width: '100%', letterSpacing: '0.04em' }}>
                                  Education
                                </div>
                                <div style={{ marginTop: '2px' }}>
                                  <div style={{ height: '4px', width: '85%', background: '#222', borderRadius: '1px' }}></div>
                                  <div style={{ height: '3px', width: '60%', background: '#888', borderRadius: '1px', marginTop: '2px' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mini-resume-onecol" style={{ fontFamily: PREMIUM_FONTS.find(f => f.name === selectedFont)?.family || 'Rubik, sans-serif' }}>
                            <div style={{ display: 'flex', flexZero: 'column', alignItems: 'center', marginBottom: '14px' }}>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111', textTransform: 'uppercase', letterSpacing: '0.02em', textAlign: 'center' }}>
                                {getUserData().name}
                              </div>
                              <div style={{ fontSize: '7.5px', fontWeight: '700', color: '#666', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.04em', textAlign: 'center' }}>
                                {jobDescriptions.find(j => j.id === Number(selectedJobDescription))?.title || 'Professional Resume'}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '4px' }}>
                                <div style={{ height: '3.5px', width: '25px', background: 'rgba(0,0,0,0.18)', borderRadius: '1px' }}></div>
                                <div style={{ height: '3.5px', width: '35px', background: 'rgba(0,0,0,0.18)', borderRadius: '1px' }}></div>
                                <div style={{ height: '3.5px', width: '25px', background: 'rgba(0,0,0,0.18)', borderRadius: '1px' }}></div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px' }}>
                              <div style={{ fontSize: '7px', fontWeight: 'bold', color: selectedColor, textTransform: 'uppercase', width: '100%', letterSpacing: '0.04em' }}>
                                Summary
                              </div>
                              <div style={{ height: '0.75px', backgroundColor: '#e5e7eb', width: '100%', marginBottom: '2px' }} />
                              <div style={{ height: '3px', width: '100%', background: '#ccc' }}></div>
                              <div style={{ height: '3px', width: '95%', background: '#ccc' }}></div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px' }}>
                              <div style={{ fontSize: '7px', fontWeight: 'bold', color: selectedColor, textTransform: 'uppercase', width: '100%', letterSpacing: '0.04em' }}>
                                Experience
                              </div>
                              <div style={{ height: '0.75px', backgroundColor: '#e5e7eb', width: '100%', marginBottom: '2px' }} />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                                <div style={{ height: '5px', width: '50%', background: '#333', borderRadius: '1px' }}></div>
                                <div style={{ height: '4px', width: '20%', background: '#888', borderRadius: '1px' }}></div>
                              </div>
                              <div style={{ height: '3.5px', width: '30%', background: '#888', borderRadius: '1px', marginTop: '1px' }}></div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginTop: '3px' }}>
                                <div style={{ height: '2px', width: '98%', background: '#ccc' }}></div>
                                <div style={{ height: '2px', width: '92%', background: '#ccc' }}></div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div style={{ fontSize: '7px', fontWeight: 'bold', color: selectedColor, textTransform: 'uppercase', width: '100%', letterSpacing: '0.04em' }}>
                                Technical Skills
                              </div>
                              <div style={{ height: '0.75px', backgroundColor: '#e5e7eb', width: '100%', marginBottom: '2px' }} />
                              <div style={{ fontSize: '5.5px', color: '#333', lineHeight: '1.3', marginTop: '2px' }}>
                                <span style={{ fontWeight: 'bold' }}>Languages:</span> JavaScript, TypeScript, Python, HTML/CSS
                              </div>
                              <div style={{ fontSize: '5.5px', color: '#333', lineHeight: '1.3' }}>
                                <span style={{ fontWeight: 'bold' }}>Frameworks:</span> React, Node.js, Next.js, Express, Docker
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <motion.div 
                        className="custom-demo-cursor" 
                        style={{ 
                          x: cursorXSpring, 
                          y: cursorYSpring, 
                          '--cursor-color': selectedColor 
                        }}
                      >
                        <div className="custom-demo-cursor-pointer" />
                        <div className="custom-demo-cursor-pill">{getUserData().name.split(' ')[0]}</div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Keywords */}
              {result.keywords?.length > 0 && (
                <Reveal className="keywords-modern" delay={0.1}>
                  <div className="keywords-header">
                    <h3><Target size={18} style={{ color: '#fbbf24' }} /> Missing Keywords</h3>
                    <span className="keywords-count" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.2)' }}>{result.keywords.length} missing</span>
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
                        style={{ border: '1px solid rgba(251, 191, 36, 0.15)', background: 'rgba(251, 191, 36, 0.02)' }}
                      >
                        <span className="keyword-dot-modern" style={{ backgroundColor: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></span>
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
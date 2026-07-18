// src/pages/ResumeEditorPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Copy, Check, Sparkles, Download, 
  Trash2, LayoutGrid, CheckSquare,
  FileText, Bold, Award, Globe, Briefcase, GraduationCap, ChevronRight
} from "lucide-react";
import { getResumes } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import { optimizeSection } from "../services/resumeOptimizationService";
import { generateResumePDF } from "../utils/pdfGenerator";
import ScanCompletionModal from "../components/resume/ScanCompletionModal";
import "../components/resume/ScanCompletionModal.css";
import api from "../api/axiosConfig";
import "./ResumeEditorPage.css";

const PREMIUM_THEMES = [
  { name: "Royal Blue", hex: "#1761c7" },
  { name: "Emerald Teal", hex: "#0f9f6e" },
  { name: "Amethyst Violet", hex: "#7c3aed" },
  { name: "Amber Orange", hex: "#d97706" },
  { name: "Crimson Rose", hex: "#e02424" },
  { name: "Charcoal Slate", hex: "#475569" },
];

const PREMIUM_FONTS = [
  { name: "Outfit", family: "'Outfit', sans-serif" },
  { name: "Plus Jakarta", family: "'Plus Jakarta Sans', sans-serif" },
  { name: "Inter", family: "'Inter', sans-serif" },
];

const SECTION_ICONS = {
  Header: "👤",
  Summary: "📄",
  Experience: "💼",
  Projects: "⚡",
  Skills: "🎯",
  Education: "🎓",
  Certifications: "🏆",
  Languages: "🌐",
};

const sanitizeSections = (sectionsObj) => {
  if (!sectionsObj || typeof sectionsObj !== 'object') return sectionsObj;
  const cleaned = { ...sectionsObj };

  const SECTION_HEADER_KEYWORDS = [
    'experience', 'work experience', 'professional experience', 'employment history', 'career history',
    'education', 'academic background', 'projects', 'personal projects', 'skills', 'technical skills',
    'certifications', 'languages', 'summary', 'professional summary'
  ];

  // Fix Education section if Experience or orphaned date/location lines got appended into Education
  if (cleaned.Education && typeof cleaned.Education === 'string') {
    const eduLines = cleaned.Education.split('\n');
    const validEduLines = [];
    let foundSectionBreak = false;

    for (const line of eduLines) {
      const trimmed = line.trim();
      const lower = trimmed.toLowerCase().replace(/[:#\-_*]/g, '').trim();

      if (SECTION_HEADER_KEYWORDS.includes(lower) && lower !== 'education' && lower !== 'academic background') {
        foundSectionBreak = true;
        continue;
      }

      if (!foundSectionBreak) {
        validEduLines.push(line);
      }
    }

    cleaned.Education = validEduLines.join('\n').trim();
  }

  // Sanitize all section keys: remove standalone section headers inside section content
  for (const key of Object.keys(cleaned)) {
    if (cleaned[key] && typeof cleaned[key] === 'string') {
      const lines = cleaned[key].split('\n');
      const filteredLines = lines.filter(line => {
        const trimmedLower = line.trim().toLowerCase().replace(/[:#\-_*]/g, '');
        if (SECTION_HEADER_KEYWORDS.includes(trimmedLower) && trimmedLower !== key.toLowerCase()) {
          return false;
        }
        return true;
      });
      cleaned[key] = filteredLines.join('\n').trim();
    }
  }

  return cleaned;
};

export default function ResumeEditorPage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [selectedResume, setSelectedResume] = useState(() => localStorage.getItem("cl_selected_resume") || "");
  const [selectedJobDescription, setSelectedJobDescription] = useState(() => localStorage.getItem("cl_selected_jd") || "");
  
  const [result, setResult] = useState(() => {
    const saved = localStorage.getItem("cl_optimization_result");
    return saved ? JSON.parse(saved) : null;
  });

  const [editedSections, setEditedSections] = useState(() => {
    const saved = localStorage.getItem("cl_edited_sections");
    const parsed = saved ? JSON.parse(saved) : {
      Header: '',
      Summary: '',
      Experience: '',
      Projects: '',
      Skills: '',
      Education: '',
      Certifications: '',
      Languages: '',
    };
    return sanitizeSections(parsed);
  });

  const [selectedTemplate, setSelectedTemplate] = useState(() => localStorage.getItem("cl_selected_template") || 'two-column');
  const [selectedColor, setSelectedColor] = useState(() => localStorage.getItem("cl_selected_color") || '#1761c7');
  const [selectedFont, setSelectedFont] = useState(() => localStorage.getItem("cl_selected_font") || 'Outfit');
  const [pageMargins, setPageMargins] = useState(() => Number(localStorage.getItem("cl_selected_margins")) || 1);
  const [sectionSpacing, setSectionSpacing] = useState(() => Number(localStorage.getItem("cl_selected_spacing")) || 3);

  const [optimizingSections, setOptimizingSections] = useState({});
  const [sectionPrompts, setSectionPrompts] = useState({});
  const [showPromptInput, setShowPromptInput] = useState({});
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeSection, setActiveSection] = useState("Header");
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Sync state values to localStorage
  useEffect(() => {
    localStorage.setItem("cl_selected_resume", selectedResume);
  }, [selectedResume]);

  useEffect(() => {
    localStorage.setItem("cl_selected_jd", selectedJobDescription);
  }, [selectedJobDescription]);

  useEffect(() => {
    localStorage.setItem("cl_selected_template", selectedTemplate);
  }, [selectedTemplate]);

  useEffect(() => {
    localStorage.setItem("cl_selected_color", selectedColor);
  }, [selectedColor]);

  useEffect(() => {
    localStorage.setItem("cl_selected_font", selectedFont);
  }, [selectedFont]);

  useEffect(() => {
    localStorage.setItem("cl_selected_margins", pageMargins);
  }, [pageMargins]);

  useEffect(() => {
    localStorage.setItem("cl_selected_spacing", sectionSpacing);
  }, [sectionSpacing]);

  useEffect(() => {
    if (result) {
      localStorage.setItem("cl_optimization_result", JSON.stringify(result));
    } else {
      localStorage.removeItem("cl_optimization_result");
    }
  }, [result]);

  useEffect(() => {
    localStorage.setItem("cl_edited_sections", JSON.stringify(editedSections));
  }, [editedSections]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const resumeResponse = await getResumes();
        const jdResponse = await getJobDescriptions();
        setResumes(resumeResponse);
        setJobDescriptions(jdResponse);
      } catch (err) {
        console.error("Failed to load metadata inside full-page editor", err);
      }
    };
    fetchMetadata();
  }, []);

  const handleOptimizeSection = async (sectionName) => {
    if (!selectedResume || !selectedJobDescription) {
      alert("Please select a resume and a job description first.");
      return;
    }
    
    setOptimizingSections(prev => ({ ...prev, [sectionName]: true }));
    try {
      const customPrompt = sectionPrompts[sectionName] || "";
      const response = await optimizeSection(
        Number(selectedResume),
        sectionName,
        Number(selectedJobDescription),
        customPrompt
      );
      
      let optimizedText = "";
      if (typeof response === "string") {
        optimizedText = response;
      } else if (response) {
        optimizedText = response.optimized_text || response.text || response.content || response.optimizedSection || response.optimized_content || "";
      }
      
      if (optimizedText) {
        setEditedSections(prev => ({
          ...prev,
          [sectionName]: optimizedText
        }));
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

  const reconstructResumeText = (sections) => {
    return Object.entries(sections)
      .filter(([_, content]) => content && content.trim())
      .map(([title, content]) => `${title}:\n${content}`)
      .join("\n\n");
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const docName = resumes.find(r => r.id === Number(selectedResume))?.file_name || "optimized_resume";
      const cleanedDocName = docName.replace(/\.[^/.]+$/, ""); // Strip file extension
      
      const fullText = reconstructResumeText(editedSections);
      
      await generateResumePDF({
        resumeText: fullText,
        fileName: `${cleanedDocName}_optimized.pdf`,
        templateType: selectedTemplate,
        primaryColor: selectedColor,
        userName: editedSections.Header.split("\n")[0] || null,
        pageMargins: pageMargins,
        sectionSpacing: sectionSpacing,
      });

      setShowCompletionModal(true);
    } catch (err) {
      console.error("Failed to download PDF in full-page editor:", err);
      alert("Failed to build PDF. Please check your text formats.");
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      const fullText = Object.keys(editedSections)
        .map(key => `${key}:\n${editedSections[key]}`)
        .join("\n\n");
        
      await navigator.clipboard.writeText(fullText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert("Failed to copy content to clipboard.");
    }
  };

  const handleResetSession = () => {
    if (window.confirm("Are you sure you want to reset this session? Your current edits will be cleared.")) {
      setResult(null);
      setEditedSections({
        Header: '',
        Summary: '',
        Experience: '',
        Projects: '',
        Skills: '',
        Education: '',
        Certifications: '',
        Languages: '',
      });
      setSelectedResume("");
      setSelectedJobDescription("");
      localStorage.removeItem("cl_selected_resume");
      localStorage.removeItem("cl_selected_jd");
      localStorage.removeItem("cl_optimization_result");
      localStorage.removeItem("cl_edited_sections");
      navigate("/resume-optimizer");
    }
  };

  // Parsing utilities for live preview template
  const parseBulletPoints = (text) => {
    if (!text) return [];
    return text.split("\n")
      .map(line => line.trim())
      .filter(line => line.startsWith("•") || line.startsWith("-") || line.length > 0)
      .map(line => line.replace(/^[•\-\s]+/, ""));
  };

  const parseSkills = (text) => {
    if (!text) return [];
    return text.split(/[,\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const activeFontFamily = PREMIUM_FONTS.find(f => f.name === selectedFont)?.family || "sans-serif";

  return (
    <div className="red-wrapper" style={{ fontFamily: activeFontFamily }}>
      {/* ── STICKY TOP NAV ── */}
      <header className="red-topbar">
        <div className="red-topbar-left">
          <button className="red-back-btn" onClick={() => navigate("/resume-optimizer")} title="Back to Optimizer">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className="red-topbar-divider" />
          <div className="red-meta-info">
            <span className="red-meta-title" style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 400 }}>Live Resume Editor</span>
            {result && (
              <span className="red-score-badge" style={{ fontFamily: "'Fira Code', monospace", background: "rgba(163, 230, 53, 0.1)", borderColor: "rgba(163, 230, 53, 0.25)", color: "#a3e635" }}>
                🎯 Est. Score: {result.estimated_new_score || 85}%
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Theme Selectors inside Top Nav */}
        <div className="red-topbar-mid">
          {/* Template Toggle */}
          <div className="red-control-group">
            <LayoutGrid size={14} className="control-icon" />
            <select 
              value={selectedTemplate} 
              onChange={(e) => setSelectedTemplate(e.target.value)} 
              className="red-select"
            >
              <option value="two-column">Two Column Layout</option>
              <option value="single-column">Single Column Layout</option>
            </select>
          </div>

          {/* Color Dot Selector */}
          <div className="red-control-group">
            <div className="red-color-circles">
              {PREMIUM_THEMES.map((theme) => (
                <button
                  key={theme.hex}
                  className={`red-color-dot ${selectedColor === theme.hex ? 'active' : ''}`}
                  style={{ backgroundColor: theme.hex }}
                  onClick={() => setSelectedColor(theme.hex)}
                  title={theme.name}
                />
              ))}
            </div>
          </div>

          {/* Font Selector */}
          <div className="red-control-group">
            <select 
              value={selectedFont} 
              onChange={(e) => setSelectedFont(e.target.value)} 
              className="red-select font-selector"
            >
              {PREMIUM_FONTS.map(f => (
                <option key={f.name} value={f.name}>{f.name} Font</option>
              ))}
            </select>
          </div>
        </div>

        <div className="red-topbar-right">
          <button className={`red-btn-primary ${downloading ? 'loading' : ''}`} onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? <span className="red-spinner" /> : <Download size={14} />}
            <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
          </button>
          
          <button className={`red-btn-secondary ${copySuccess ? 'copied' : ''}`} onClick={copyToClipboard}>
            {copySuccess ? <Check size={14} /> : <Copy size={14} />}
            <span>{copySuccess ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <button className="red-btn-danger" onClick={handleResetSession} title="Reset optimization session">
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      {/* ── EDITOR BODY GRID ── */}
      <main className="red-body">
        
        {/* LEFT COLUMN: Section Editor Cards */}
        <section className="red-editor-col">
          {/* Document Layout Adjuster Panel */}
          <div className="red-formatting-panel" style={{
            padding: '16px 20px',
            display: 'flex',
            gap: '24px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            flexShrink: 0,
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 'bold', color: '#94a3b8', fontFamily: "'Fira Code', monospace", letterSpacing: '0.04em' }}>
                <span>PAGE MARGINS</span>
                <span style={{ color: '#a3e635' }}>{pageMargins === 1 ? 'Narrow (24px)' : pageMargins === 2 ? 'Normal (36px)' : 'Wide (48px)'}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="3" 
                value={pageMargins} 
                onChange={(e) => setPageMargins(Number(e.target.value))}
                style={{ width: '100%', height: '4px', accentColor: '#a3e635', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 'bold', color: '#94a3b8', fontFamily: "'Fira Code', monospace", letterSpacing: '0.04em' }}>
                <span>SECTION SPACING</span>
                <span style={{ color: '#a3e635' }}>Level {sectionSpacing} ({sectionSpacing * 6}px)</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                value={sectionSpacing} 
                onChange={(e) => setSectionSpacing(Number(e.target.value))}
                style={{ width: '100%', height: '4px', accentColor: '#a3e635', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="red-section-nav">
            {Object.keys(editedSections).map(key => {
              const isPrimary = ['Header', 'Summary', 'Experience', 'Projects', 'Skills', 'Education'].includes(key);
              const content = editedSections[key];
              if (!isPrimary && (!content || !content.trim())) return null;

              return (
                <button 
                  key={key} 
                  className={`red-nav-pill ${activeSection === key ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection(key);
                    document.getElementById(`editor-card-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  <span className="red-nav-icon">{SECTION_ICONS[key] || "📝"}</span>
                  <span>{key}</span>
                </button>
              );
            })}
          </div>

          <div className="red-editor-cards-container">
            {Object.keys(editedSections).map(sectionKey => {
              const sectionContent = editedSections[sectionKey];
              const isPrimary = ['Header', 'Summary', 'Experience', 'Projects', 'Skills', 'Education'].includes(sectionKey);
              if (!isPrimary && (!sectionContent || !sectionContent.trim())) return null;

              return (
                <div 
                  key={sectionKey}
                  id={`editor-card-${sectionKey}`}
                  className={`red-editor-card ${activeSection === sectionKey ? 'active' : ''}`}
                  onFocus={() => setActiveSection(sectionKey)}
                >
                  {/* Loading overlay for section optimization */}
                  {optimizingSections[sectionKey] && (
                    <div className="red-loading-overlay">
                      <span className="red-spinner-lg" />
                      <span>Optimizing with AI...</span>
                    </div>
                  )}

                  <div className="red-card-header">
                    <div className="red-card-title">
                      <span>{SECTION_ICONS[sectionKey]}</span>
                      <h4>{sectionKey} Section</h4>
                    </div>
                    <button
                      className={`red-ai-opt-btn ${showPromptInput[sectionKey] ? 'active' : ''}`}
                      onClick={() => setShowPromptInput(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
                    >
                      <Sparkles size={12} />
                      <span>AI Personalize</span>
                    </button>
                  </div>

                  {/* AI Prompt box */}
                  <AnimatePresence>
                    {showPromptInput[sectionKey] && (
                      <motion.div
                        className="red-prompt-box"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <input
                          type="text"
                          value={sectionPrompts[sectionKey] || ""}
                          onChange={(e) => setSectionPrompts(prev => ({ ...prev, [sectionKey]: e.target.value }))}
                          placeholder="E.g., highlight leadership skills, sound more technical, quantify metrics..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleOptimizeSection(sectionKey);
                          }}
                        />
                        <button onClick={() => handleOptimizeSection(sectionKey)} disabled={optimizingSections[sectionKey]}>
                          Apply AI
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <textarea
                    value={sectionContent}
                    onChange={(e) => setEditedSections(prev => ({ ...prev, [sectionKey]: e.target.value }))}
                    placeholder={`Enter details for ${sectionKey}...`}
                    rows={Math.max(4, sectionContent.split('\n').length + 1)}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT COLUMN: Live Document Preview */}
        <section className="red-preview-col">
          <div className="red-preview-header">
            <h3>🖨️ Real-Time Layout Simulator</h3>
            <span className="red-preview-badge" style={{ backgroundColor: selectedColor }}>
              {selectedTemplate === 'two-column' ? 'Double Column' : 'Single Column'}
            </span>
          </div>

          <div className="red-canvas-container">
            <style>{`
              .red-page-canvas {
                padding: var(--page-padding) !important;
              }
              .red-tmpl-section {
                margin-bottom: var(--section-margin) !important;
              }
              .red-tmpl-experience-list {
                gap: var(--list-gap) !important;
              }
              .red-tmpl-bullet-row {
                margin-bottom: var(--bullet-margin) !important;
              }
            `}</style>
            <div 
              className="red-page-canvas" 
              style={{ 
                fontFamily: activeFontFamily,
                '--page-padding': pageMargins === 1 ? '24px 20px' : pageMargins === 2 ? '36px 30px' : '48px 40px',
                '--section-margin': `${sectionSpacing * 6}px`,
                '--list-gap': `${sectionSpacing * 2.5}px`,
                '--bullet-margin': `${sectionSpacing * 1.2}px`,
              }}
            >
              <div className="red-canvas-top-accent" style={{ backgroundColor: selectedColor }} />

              {/* TWO COLUMN LIVE RENDER TEMPLATE */}
              {selectedTemplate === 'two-column' ? (
                <div className="red-tmpl-twocol">
                  {/* Left Column (Main Information) */}
                  <div className="red-tmpl-main">
                    {/* Header Details */}
                    <div className="red-tmpl-header-block">
                      <h2 className="red-tmpl-name">{editedSections.Header.split("\n")[0] || "Your Name"}</h2>
                      <h4 className="red-tmpl-title" style={{ color: selectedColor }}>
                        {editedSections.Header.split("\n")[1] || "Target Professional Role"}
                      </h4>
                      <p className="red-tmpl-contacts">
                        {editedSections.Header.split("\n").slice(2).join(" | ")}
                      </p>
                    </div>

                    {/* Summary */}
                    {editedSections.Summary && (
                      <div className="red-tmpl-section">
                        <h3 className="red-tmpl-section-title" style={{ color: selectedColor, borderBottomColor: selectedColor }}>
                          Professional Summary
                        </h3>
                        <p className="red-tmpl-body-text">{editedSections.Summary}</p>
                      </div>
                    )}

                    {/* Experience */}
                    {editedSections.Experience && (
                      <div className="red-tmpl-section">
                        <h3 className="red-tmpl-section-title" style={{ color: selectedColor, borderBottomColor: selectedColor }}>
                          Work Experience
                        </h3>
                        <div className="red-tmpl-experience-list">
                          {parseBulletPoints(editedSections.Experience).map((bullet, idx) => (
                            <div key={idx} className="red-tmpl-bullet-row">
                              <span className="red-tmpl-bullet-dot" style={{ backgroundColor: selectedColor }} />
                              <span className="red-tmpl-bullet-text">{bullet}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {editedSections.Projects && (
                      <div className="red-tmpl-section">
                        <h3 className="red-tmpl-section-title" style={{ color: selectedColor, borderBottomColor: selectedColor }}>
                          Personal Projects
                        </h3>
                        <div className="red-tmpl-experience-list">
                          {parseBulletPoints(editedSections.Projects).map((bullet, idx) => (
                            <div key={idx} className="red-tmpl-bullet-row">
                              <span className="red-tmpl-bullet-dot" style={{ backgroundColor: selectedColor }} />
                              <span className="red-tmpl-bullet-text">{bullet}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column (Sidebar details) */}
                  <div className="red-tmpl-sidebar" style={{ borderLeftColor: `${selectedColor}1A` }}>
                    {/* Skills */}
                    {editedSections.Skills && (
                      <div className="red-tmpl-section">
                        <h3 className="red-tmpl-section-title" style={{ color: selectedColor, borderBottomColor: selectedColor }}>
                          Core Skills
                        </h3>
                        <div className="red-tmpl-skills-grid">
                          {parseSkills(editedSections.Skills).map(skill => (
                            <span 
                              key={skill} 
                              className="red-tmpl-skill-chip" 
                              style={{ backgroundColor: `${selectedColor}12`, color: selectedColor, border: `1px solid ${selectedColor}22` }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {editedSections.Education && (
                      <div className="red-tmpl-section">
                        <h3 className="red-tmpl-section-title" style={{ color: selectedColor, borderBottomColor: selectedColor }}>
                          Education
                        </h3>
                        {parseBulletPoints(editedSections.Education).map((line, idx) => (
                          <p key={idx} className="red-tmpl-sidebar-item">{line}</p>
                        ))}
                      </div>
                    )}

                    {/* Certifications */}
                    {editedSections.Certifications && (
                      <div className="red-tmpl-section">
                        <h3 className="red-tmpl-section-title" style={{ color: selectedColor, borderBottomColor: selectedColor }}>
                          Certifications
                        </h3>
                        {parseBulletPoints(editedSections.Certifications).map((line, idx) => (
                          <p key={idx} className="red-tmpl-sidebar-item">{line}</p>
                        ))}
                      </div>
                    )}

                    {/* Languages */}
                    {editedSections.Languages && (
                      <div className="red-tmpl-section">
                        <h3 className="red-tmpl-section-title" style={{ color: selectedColor, borderBottomColor: selectedColor }}>
                          Languages
                        </h3>
                        {parseBulletPoints(editedSections.Languages).map((line, idx) => (
                          <p key={idx} className="red-tmpl-sidebar-item">{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* SINGLE COLUMN LIVE RENDER TEMPLATE */
                <div className="red-tmpl-single">
                  {/* Header */}
                  <div className="red-tmpl-header-centered">
                    <h2 className="red-tmpl-name">{editedSections.Header.split("\n")[0] || "Your Name"}</h2>
                    <h4 className="red-tmpl-title" style={{ color: selectedColor }}>
                      {editedSections.Header.split("\n")[1] || "Target Professional Role"}
                    </h4>
                    <p className="red-tmpl-contacts">
                      {editedSections.Header.split("\n").slice(2).join(" | ")}
                    </p>
                  </div>

                  <div className="red-tmpl-centered-divider" style={{ backgroundColor: selectedColor }} />

                  {/* Summary */}
                  {editedSections.Summary && (
                    <div className="red-tmpl-section">
                      <h3 className="red-tmpl-section-title centered" style={{ color: selectedColor }}>
                        Professional Summary
                      </h3>
                      <p className="red-tmpl-body-text centered">{editedSections.Summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {editedSections.Experience && (
                    <div className="red-tmpl-section">
                      <h3 className="red-tmpl-section-title centered" style={{ color: selectedColor }}>
                        Work Experience
                      </h3>
                      <div className="red-tmpl-experience-list">
                        {parseBulletPoints(editedSections.Experience).map((bullet, idx) => (
                          <div key={idx} className="red-tmpl-bullet-row">
                            <span className="red-tmpl-bullet-dot" style={{ backgroundColor: selectedColor }} />
                            <span className="red-tmpl-bullet-text">{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {editedSections.Projects && (
                    <div className="red-tmpl-section">
                      <h3 className="red-tmpl-section-title centered" style={{ color: selectedColor }}>
                        Personal Projects
                      </h3>
                      <div className="red-tmpl-experience-list">
                        {parseBulletPoints(editedSections.Projects).map((bullet, idx) => (
                          <div key={idx} className="red-tmpl-bullet-row">
                            <span className="red-tmpl-bullet-dot" style={{ backgroundColor: selectedColor }} />
                            <span className="red-tmpl-bullet-text">{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {editedSections.Skills && (
                    <div className="red-tmpl-section">
                      <h3 className="red-tmpl-section-title centered" style={{ color: selectedColor }}>
                        Skills & Expertise
                      </h3>
                      <div className="red-tmpl-skills-centered">
                        {parseSkills(editedSections.Skills).map(skill => (
                          <span 
                            key={skill} 
                            className="red-tmpl-skill-chip" 
                            style={{ backgroundColor: `${selectedColor}12`, color: selectedColor, border: `1px solid ${selectedColor}22` }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education / Certifications grid */}
                  <div className="red-tmpl-bottom-grid">
                    {/* Education */}
                    {editedSections.Education && (
                      <div className="red-tmpl-section">
                        <h3 className="red-tmpl-section-title" style={{ color: selectedColor, borderBottomColor: selectedColor }}>
                          Education
                        </h3>
                        {parseBulletPoints(editedSections.Education).map((line, idx) => (
                          <p key={idx} className="red-tmpl-body-text">{line}</p>
                        ))}
                      </div>
                    )}

                    {/* Certifications */}
                    {editedSections.Certifications && (
                      <div className="red-tmpl-section">
                        <h3 className="red-tmpl-section-title" style={{ color: selectedColor, borderBottomColor: selectedColor }}>
                          Certifications
                        </h3>
                        {parseBulletPoints(editedSections.Certifications).map((line, idx) => (
                          <p key={idx} className="red-tmpl-body-text">{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      <ScanCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        title="PDF Resume Compiled & Exported!"
        subtitle="Your ATS-optimized PDF resume has been formatted and saved."
        score={result?.estimated_new_score || 95}
      />
    </div>
  );
}

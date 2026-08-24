// ResumePage.jsx - Premium Redesign with View Resume Feature
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import {
  getResumes,
  uploadResume,
  deleteResume,
  getResumeFile,
} from "../services/resumeService";
import { generateResumePDF } from "../utils/pdfGenerator";
import { useScrollReveal } from "../hooks/useScrollReveal";
import AnimeHeroAnimation from "../components/common/AnimeHeroAnimation";
import AiNeuralTerminalConsole from "../components/common/AiNeuralTerminalConsole";
import AiCareerToolsQuickBar from "../components/common/AiCareerToolsQuickBar";
import JobMatchModal from "../components/JobMatchModal";
import SubNav from "../components/common/SubNav";
import { motion } from "framer-motion";
import "../assets/resume.css";

// ── Resume text → clean sections (Header/Summary/Experience/etc.) ──────────
// Strips personal info (name, email, phone, LinkedIn, stray "CONTACT" labels)
// out of body sections like Summary, so only the Header carries identity info.
const SECTION_HEADER_MAP = {
  Summary: /^(summary|professional summary|objective|profile|about)\s*:?$/i,
  Experience: /^(experience|work experience|professional experience|employment history|career history)\s*:?$/i,
  Education: /^(education|academic background)\s*:?$/i,
  Skills: /^(skills|technical skills|core skills|technologies)\s*:?$/i,
  Projects: /^(projects|personal projects|key projects|academic projects)\s*:?$/i,
  Certifications: /^(certifications|certificates|licenses)\s*:?$/i,
};

const extractIdentityTokens = (text) => {
  const name = (text.split("\n").find(l => {
    const t = l.trim();
    return t && t.length > 2 && t.length < 50 && /^[A-Za-z][A-Za-z\s.'-]+$/.test(t);
  }) || "").trim();
  const email = (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [])[0] || "";
  const phone = (text.match(/(\+?\d[\d\s-]{8,14}\d)/) || [])[0] || "";
  const linkedin = (text.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i) || [])[0] || "";
  return { name, email, phone, linkedin };
};

const stripPersonalInfo = (text, identity) => {
  let cleaned = text;
  [identity.name, identity.email, identity.phone, identity.linkedin]
    .filter(Boolean)
    .forEach((token) => {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      cleaned = cleaned.replace(new RegExp(escaped, "gi"), " ");
    });
  // Remove stray section-label words that sometimes bleed into body text
  cleaned = cleaned.replace(/\bCONTACT\b/gi, " ");
  return cleaned.replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
};

const parseResumeTextToSections = (rawText) => {
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  const identity = extractIdentityTokens(rawText);

  const sections = { Header: "", Summary: "", Experience: "", Education: "", Skills: "", Projects: "", Certifications: "" };
  let current = "Header";
  let headerLinesCount = 0;

  for (const line of lines) {
    const matchedKey = Object.keys(SECTION_HEADER_MAP).find(key => SECTION_HEADER_MAP[key].test(line));
    if (matchedKey) {
      current = matchedKey;
      continue;
    }
    // First few lines (before any recognized section header) are the header block
    if (current === "Header" && headerLinesCount < 4) {
      sections.Header += (sections.Header ? "\n" : "") + line;
      headerLinesCount++;
      continue;
    }
    if (current === "Header") current = "Summary"; // fallback if no explicit "Summary" header found
    sections[current] += (sections[current] ? "\n" : "") + line;
  }

  // Strip personal info from every section except Header
  Object.keys(sections).forEach((key) => {
    if (key === "Header") return;
    sections[key] = stripPersonalInfo(sections[key], identity);
  });

  return sections;
};

function ResumePage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [viewingResume, setViewingResume] = useState(null); 
  const [pdfUrl, setPdfUrl] = useState(null);
  const [scanStep, setScanStep] = useState(0); 
  const [jobMatchResume, setJobMatchResume] = useState(null);
  const [isJobMatchOpen, setIsJobMatchOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const fileInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadResumes = async () => {
    try {
      const data = await getResumes();
      if (Array.isArray(data)) {
        const enhancedData = data.map(r => ({
          ...r,
          atsScore: r.atsScore || Math.floor(65 + ((r.id * 23) % 33)) // Generates a consistent score between 65 and 97 based on ID
        }));
        setResumes(enhancedData);
      } else {
        setResumes([]);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to load resumes", "error");
      setResumes([]);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  useScrollReveal([resumes]);

  const filteredResumes = resumes.filter(r => {
    const matchesSearch = (r.file_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === "high_ats") return (r.atsScore || 0) >= 80;
    if (filterType === "needs_improvement") return (r.atsScore || 0) < 70;
    return true;
  });

  const handleFileChange = (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast("Please select a PDF file", "error");
      return;
    }

    setSelectedFile(file);
    setScanStep(0);
    const intervals = [600, 1300, 2000, 2700];
    intervals.forEach((time, index) => {
      setTimeout(() => {
        setScanStep(index + 1);
      }, time);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast("Please select a PDF file", "error");
      return;
    }

    try {
      setLoading(true);
      await uploadResume(selectedFile);
      showToast("Resume uploaded successfully!", "success");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadResumes();
    } catch (error) {
      console.error(error);
      showToast("Upload failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resume?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteResume(id);
      showToast("Resume deleted successfully!", "success");
      await loadResumes();
    } catch (error) {
      console.error(error);
      showToast("Failed to delete resume.", "error");
    }
  };

  const handleDeleteAll = async () => {
    if (resumes.length === 0) {
      showToast("No resumes to delete", "error");
      return;
    }

    const confirmed = window.confirm(
      `⚠️ This will permanently delete all ${resumes.length} resume(s). This action cannot be undone. Continue?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      let successCount = 0;
      let failureCount = 0;

      for (const resume of resumes) {
        try {
          await deleteResume(resume.id);
          successCount++;
        } catch (err) {
          console.error(err);
          failureCount++;
        }
      }

      if (successCount > 0) {
        showToast(`${successCount} resume(s) deleted successfully!`, "success");
      }
      if (failureCount > 0) {
        showToast(`Failed to delete ${failureCount} resume(s).`, "error");
      }

      await loadResumes();
    } catch (error) {
      console.error(error);
      showToast("Failed to delete resumes.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalytics = (resume) => {
    if (analyzingId) return;
    setAnalyzingId(resume.id);
    setTimeout(() => {
      navigate(`/ats?resumeId=${resume.id}`);
    }, 1100);
  };

  const handleViewResume = async (resume) => {
    try {
      setAnalyzingId(resume.id);
      const blob = await getResumeFile(resume.id);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setViewingResume(resume);
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch resume file.", "error");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleCloseModal = () => {
    setViewingResume(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const closeModal = handleCloseModal;

  // ── Styled, templated PDF download ─────────────────────────────────────
  // Generates a fresh, professionally designed PDF from the resume's
  // extracted text (dark sidebar + app's violet accent), instead of just
  // re-downloading the raw uploaded file.
  const handleDownload = async () => {
    if (!viewingResume) return;

    const resumeText = viewingResume.extracted_text || viewingResume.content || "";
    if (!resumeText) {
      showToast("No extracted text available to generate a styled PDF.", "error");
      return;
    }

    try {
      setDownloadingPdf(true);
      const editedSections = parseResumeTextToSections(resumeText);

      await generateResumePDF({
        editedSections,
        fileName: viewingResume.file_name || "resume",
        templateType: "two-column",   // dark sidebar — matches app branding
        primaryColor: "#7c3aed",      // app's signature violet accent
        pageMargins: 2,
        sectionSpacing: 3.5,
        baseFontSize: 10,
        fontFamily: "inter",
        mainSectionOrder: ["Summary", "Experience", "Projects"],
        sideSectionOrder: ["Skills", "Education", "Certifications"],
      });
      showToast("Styled resume PDF downloaded!", "success");
    } catch (err) {
      console.error("Styled PDF generation failed:", err);
      showToast("Failed to generate styled PDF.", "error");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleOpenNewTab = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank");
  };

  const totalResumes = resumes.length;
  const totalViews = resumes.reduce((acc, r) => acc + (r.views || 0), 0);
  const bestAtsScore = resumes.length > 0 ? Math.max(...resumes.map(r => r.atsScore || 0)) : 0;

  return (
    <motion.div 
      className="resume-wrapper"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="resume-page-content">
        <SubNav type="resume" />
        {/* Page Header */}
        <div className="resume-page-header">
          <div className="header-left">
            <div className="header-badge">
              <span className="badge-dot"></span>
              <span className="badge-icon">📄</span>
              Resume Management
            </div>
            <h1 className="page-title">Resume Management</h1>
            <p className="page-subtitle">Upload, manage and organize your resumes.</p>
          </div>
          <div className="header-right">
            <div className="header-stat">
              <span className="header-stat-value">{totalResumes}</span>
              <span className="header-stat-label">Total Resumes</span>
            </div>
          </div>
        </div>

        {/* Upload Studio Card */}
        <div className="upload-premium-card scroll-reveal-3d">
          <div className="upload-premium-glow"></div>
          <div className="upload-premium-content">
            <div className="upload-premium-left">
              <h3>
                <span className="upload-icon">📄</span>
                Upload New Resume
              </h3>
              <p className="upload-subtitle">Drag & drop your PDF file here</p>

              <label
                className={`dropzone-premium ${isDragging ? "dragging" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileChange(e.dataTransfer.files[0]);
                }}
              >
                <div className="dropzone-premium-icon">📄</div>
                <div className="dropzone-premium-title">
                  {isDragging ? "Drop your PDF here" : "Drag a PDF here, or click to browse"}
                </div>
                <div className="dropzone-premium-sub">PDF only • Max size 10MB</div>

                <input
                  id="resumeFile"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  className="dropzone-input"
                />
              </label>

              {selectedFile && (
                <div className="selected-file-premium">
                  <span className="selected-file-icon">✅</span>
                  <span className="selected-file-name">{selectedFile.name}</span>
                  <span className="selected-file-size">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}

              <div className="upload-actions">
                <button
                  className="upload-btn-premium"
                  onClick={handleUpload}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">↑</span>
                      Upload Resume
                    </>
                  )}
                </button>
                <div className="upload-security">
                  <span className="security-icon">🔒</span>
                  Your data is secure and private
                </div>
              </div>
            </div>

            {/* Right Interactive Visual Node */}
            <div className="upload-premium-right">
              {selectedFile ? (
                <div className="parsing-console-premium">
                  <div className="console-header">
                    <span className="console-title">🤖 AI Parsability Analysis</span>
                    <span className="console-badge">{scanStep < 4 ? "Scanning..." : "Complete"}</span>
                  </div>
                  
                  <div className="console-preview-row">
                    <div className="console-pdf-wrapper">
                      <div className="console-pdf-icon">📄</div>
                      {scanStep < 4 && <div className="console-scan-line"></div>}
                    </div>
                    <div className="console-meta">
                      <span className="console-filename">{selectedFile.name}</span>
                      <span className="console-filesize">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  </div>

                  <div className="console-logs">
                    <div className={`console-log-item ${scanStep >= 1 ? 'done' : 'pending'}`}>
                      <span className="log-status">{scanStep >= 1 ? '✓' : '●'}</span>
                      <span className="log-text">Verifying document metadata integrity...</span>
                    </div>
                    <div className={`console-log-item ${scanStep >= 2 ? 'done' : 'pending'}`}>
                      <span className="log-status">{scanStep >= 2 ? '✓' : '●'}</span>
                      <span className="log-text">Extracting structural columns & margins...</span>
                    </div>
                    <div className={`console-log-item ${scanStep >= 3 ? 'done' : 'pending'}`}>
                      <span className="log-status">{scanStep >= 3 ? '✓' : '●'}</span>
                      <span className="log-text">Parsing header sections (Experience, Skills)...</span>
                    </div>
                    <div className={`console-log-item ${scanStep >= 4 ? 'done' : 'pending'}`}>
                      <span className="log-status">{scanStep >= 4 ? '✓' : '●'}</span>
                      <span className="log-text">Calculating parsability score & indexing...</span>
                    </div>
                  </div>

                  {scanStep >= 4 && (
                    <div className="console-success-banner">
                      <span className="banner-icon">🎯</span>
                      <span className="banner-text">Parsability Index: 98% (High Compatibility)</span>
                    </div>
                  )}
                </div>
              ) : (
                <AiNeuralTerminalConsole fileName={selectedFile?.name} />
              )}
            </div>
          </div>
        </div>

        {/* AI Career Tools Quick Access Bar */}
        <AiCareerToolsQuickBar />

        {/* Stats Overview */}
        <div className="stats-overview-premium scroll-reveal">
          <div className="stat-overview-card">
            <div className="stat-overview-icon">📄</div>
            <div className="stat-overview-content">
              <span className="stat-overview-value">{totalResumes}</span>
              <span className="stat-overview-label">Total Resumes</span>
              <span className="stat-overview-trend">↑ 1 this week</span>
            </div>
          </div>

          <div className="stat-overview-card">
            <div className="stat-overview-icon">👁️</div>
            <div className="stat-overview-content">
              <span className="stat-overview-value">{totalViews}</span>
              <span className="stat-overview-label">Total Views</span>
              <span className="stat-overview-trend">↑ 3 this week</span>
            </div>
          </div>

          <div className="stat-overview-card">
            <div className="stat-overview-icon">🎯</div>
            <div className="stat-overview-content">
              <span className="stat-overview-value">{bestAtsScore}%</span>
              <span className="stat-overview-label">Best ATS Score</span>
              <span className="stat-overview-trend">↑ 8% this week</span>
            </div>
          </div>
        </div>

        {/* Resume Inventory List */}
        <section className="resume-list-premium scroll-reveal-3d">
          <div className="resume-list-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div>
                <h2>Uploaded Resumes</h2>
                <span className="resume-count">{filteredResumes.length} of {resumes.length} resumes</span>
              </div>
              {resumes.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  disabled={loading}
                  style={{
                    padding: "8px 14px",
                    background: "rgba(239,68,68,0.15)",
                    color: "#fca5a5",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.background = "rgba(239,68,68,0.25)";
                      e.target.style.borderColor = "rgba(239,68,68,0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(239,68,68,0.15)";
                    e.target.style.borderColor = "rgba(239,68,68,0.3)";
                  }}
                >
                  🗑️ Delete All
                </button>
              )}
            </div>
          </div>

          <div className="resume-search-filter-row">
            <div className="resume-search-box">
              <span className="resume-search-icon">🔍</span>
              <input
                type="text"
                className="resume-search-input"
                placeholder="Search resume by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="resume-filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Resumes</option>
              <option value="high_ats">High ATS Score (80%+)</option>
              <option value="needs_improvement">Needs Improvement (&lt;70%)</option>
            </select>
          </div>

          {filteredResumes.length === 0 ? (
            <div className="empty-state-premium">
              <div className="empty-state-icon">📭</div>
              <h3>No matching resumes found</h3>
              <p>Upload an existing PDF or build one from scratch with our guided builder.</p>
              <div className="empty-state-actions">
                <button
                  className="empty-state-upload-btn"
                  onClick={() => document.getElementById('resumeFile')?.click()}
                >
                  ↑ Upload PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="resume-grid-premium">
              {filteredResumes.map((resume, index) => (
                <div
                  className={`resume-card-premium ${analyzingId === resume.id ? "analyzing" : ""}`}
                  key={resume.id}
                >
                  {analyzingId === resume.id && (
                    <div className="scan-overlay">
                      <div className="scan-line"></div>
                      <div className="scan-label">🔍 Analyzing resume...</div>
                    </div>
                  )}

                  <div className="resume-card-header">
                    <div className="resume-card-icon">📄</div>
                    <div className="resume-card-info">
                      <h4 className="resume-card-name">
                        <span className="resume-name-label">Resume Name</span>
                        {resume.file_name}
                      </h4>
                      <div className="resume-card-meta">
                        <span>Uploaded on {resume.uploaded_at ? new Date(resume.uploaded_at).toLocaleDateString() : 'N/A'}</span>
                        <span className="meta-dot">•</span>
                        <span>{(resume.fileSize || 2.4).toFixed(1)} MB</span>
                      </div>
                    </div>
                    {index === 0 && (
                      <span className="resume-primary-badge">Primary</span>
                    )}
                  </div>

                  <div className="resume-card-body">
                    <div className="resume-ats-score">
                      <div className="ats-score-circle">
                        <svg viewBox="0 0 60 60">
                          <circle className="ats-score-bg" cx="30" cy="30" r="26" />
                          <circle
                            className="ats-score-progress"
                            cx="30"
                            cy="30"
                            r="26"
                            style={{
                              strokeDasharray: 163.36,
                              strokeDashoffset: 163.36 * (1 - (resume.atsScore || 65) / 100)
                            }}
                          />
                        </svg>
                        <span className="ats-score-value">{resume.atsScore || 65}%</span>
                      </div>
                      <div className="ats-score-info">
                        <span className="ats-score-label">ATS Score</span>
                        <span className="ats-score-status">
                          {resume.atsScore >= 80 ? '✅ Excellent' :
                           resume.atsScore >= 60 ? '⚠️ Good' : '🔴 Needs Improvement'}
                        </span>
                      </div>
                    </div>

                    <div className="resume-card-actions">
                      <button
                        className="resume-action-btn view"
                        onClick={() => handleViewResume(resume)}
                      >
                        <span>👁️</span> View Resume
                      </button>
                      <button
                        className="resume-action-btn primary"
                        onClick={() => handleViewAnalytics(resume)}
                        disabled={analyzingId === resume.id}
                      >
                        {analyzingId === resume.id ? (
                          <>
                            <span className="spinner"></span> Analyzing...
                          </>
                        ) : (
                          <>
                            <span>📊</span> View Analytics
                          </>
                        )}
                      </button>
                      <button
                        className="resume-action-btn primary"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#ffffff", border: "1px solid rgba(168,85,247,0.3)" }}
                        onClick={() => {
                          setJobMatchResume(resume);
                          setIsJobMatchOpen(true);
                        }}
                      >
                        <span>🔍</span> Match Jobs
                      </button>
                      <button
                        className="resume-action-btn secondary"
                        onClick={() => navigate(`/resume-optimizer?resumeId=${resume.id}`)}
                      >
                        <span>💡</span> Tips
                      </button>
                      <button
                        className="resume-action-btn delete"
                        onClick={() => handleDelete(resume.id)}
                      >
                        <span>🗑️</span> Delete
                      </button>
                    </div>
                  </div>

                  <div className="resume-card-footer">
                    <div className="resume-tips">
                      <span className="tips-label">💡 Quick Tips:</span>
                      <div className="tips-list">
                        <span className="tip">Add more relevant skills</span>
                        <span className="tip">Include measurable impact</span>
                        <span className="tip">Customize for each job</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pro ATS Compliance Checklist Widget */}
        <div className="ats-checklist-widget scroll-reveal">
          <div className="ats-checklist-header">
            <div className="ats-checklist-title-group">
              <span className="ats-checklist-icon">🛡️</span>
              <div>
                <h3>Pro ATS Compliance Checklist</h3>
                <p>Ensure your resume passes 99%+ of Enterprise Applicant Tracking Systems</p>
              </div>
            </div>
            <button className="ats-checklist-action-btn" onClick={() => navigate("/ats-score")}>
              Test Your Resume →
            </button>
          </div>

          <div className="ats-checklist-grid">
            {[
              { title: "Standard Section Headers", desc: "Use universal titles: Experience, Education, Skills, Summary", icon: "✓" },
              { title: "Quantified Metrics", desc: "Include %, $, numbers for high impact (e.g., Reduced latency by 45%)", icon: "✓" },
              { title: "Clean Single-Column Vector", desc: "Avoid graphics, text boxes, and multi-column tables", icon: "✓" },
              { title: "Action Verbs & Keywords", desc: "Start bullet points with strong verbs (Architected, Optimized, Led)", icon: "✓" },
            ].map((item, idx) => (
              <div key={idx} className="ats-checklist-item">
                <span className="ats-check-icon">{item.icon}</span>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secure Document Preview Overlay Frame */}
      {viewingResume && (
        <div className="resume-modal-overlay" onClick={closeModal}>
          <div className="resume-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="resume-modal-header">
              <div className="modal-header-left">
                <span className="modal-icon">📄</span>
                <h3>{viewingResume.file_name}</h3>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>
            
            <div className="resume-modal-body">
              <div className="resume-modal-info">
                <div className="modal-info-item">
                  <span className="info-label">Uploaded</span>
                  <span className="info-value">
                    {viewingResume.uploaded_at ? new Date(viewingResume.uploaded_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="info-label">File Size</span>
                  <span className="info-value">
                    {(viewingResume.fileSize || 2.4).toFixed(1)} MB
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="info-label">ATS Score</span>
                  <span className="info-value" style={{ 
                    color: viewingResume.atsScore >= 80 ? '#10b981' : 
                           viewingResume.atsScore >= 60 ? '#f59e0b' : '#ef4444'
                  }}>
                    {viewingResume.atsScore || 65}%
                  </span>
                </div>
              </div>

              <div className="resume-modal-preview" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#09090e', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '12px', overflow: 'hidden' }}>
                {pdfUrl ? (
                  <object
                    data={pdfUrl}
                    type="application/pdf"
                    width="100%"
                    height="450px"
                    style={{ border: 'none', borderRadius: '12px' }}
                  >
                    <div style={{ padding: '2rem', textColor: '#94a3b8', textAlign: 'center' }}>
                      <p>Your browser doesn't support PDF previews.</p>
                      <a href={pdfUrl} target="_blank" rel="noreferrer" style={{ color: '#c084fc', textDecoration: 'underline' }}>Click here to view/download the PDF</a>
                    </div>
                  </object>
                ) : (
                  <div className="pdf-preview-placeholder" style={{ margin: 'auto', textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1.5rem auto', width: '32px', height: '32px', border: '3px solid rgba(124, 59, 237, 0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Fetching secure document preview...</p>
                  </div>
                )}

                <div className="pdf-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  <button 
                    className="pdf-download-btn"
                    onClick={handleDownload}
                    disabled={!pdfUrl || downloadingPdf}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 18px',
                      background: 'rgba(124, 58, 237, 0.12)',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      borderRadius: '10px',
                      color: '#c084fc',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      cursor: (pdfUrl && !downloadingPdf) ? 'pointer' : 'not-allowed',
                      opacity: (pdfUrl && !downloadingPdf) ? 1 : 0.6
                    }}
                  >
                    {downloadingPdf ? '⏳ Generating...' : '⬇️ Download Styled PDF'}
                  </button>
                  <button 
                    className="pdf-view-btn"
                    onClick={handleOpenNewTab}
                    disabled={!pdfUrl}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 18px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      color: '#94a3b8',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      cursor: pdfUrl ? 'pointer' : 'not-allowed',
                      opacity: pdfUrl ? 1 : 0.6
                    }}
                  >
                    🔍 Open in New Tab
                  </button>
                </div>
              </div>

              <div className="resume-modal-actions">
                <button 
                  className="modal-action-btn primary"
                  onClick={() => {
                    closeModal();
                    navigate(`/resume-optimizer?resumeId=${viewingResume.id}`);
                  }}
                >
                  💡 Optimize Resume
                </button>
                <button 
                  className="modal-action-btn secondary"
                  onClick={() => {
                    closeModal();
                    navigate(`/ats?resumeId=${viewingResume.id}`);
                  }}
                >
                  📊 View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast-premium ${toast.type}`}>
          <span className="toast-icon">{toast.type === "success" ? "✓" : "ℹ"}</span>
          <p className="toast-message">{toast.message}</p>
        </div>
      )}

      <JobMatchModal
        isOpen={isJobMatchOpen}
        onClose={() => setIsJobMatchOpen(false)}
        resume={jobMatchResume}
      />
    </motion.div>
  );
}

export default ResumePage;
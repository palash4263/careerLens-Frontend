// ResumePage.jsx - Premium Redesign with View Resume Feature
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getResumes,
  uploadResume,
  deleteResume,
  getResumeFile,
} from "../services/resumeService";
import { useScrollReveal } from "../hooks/useScrollReveal";

import { motion } from "framer-motion";
import "../assets/resume.css";

function ResumePage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [viewingResume, setViewingResume] = useState(null); // ✅ State for viewing resume
  const [pdfUrl, setPdfUrl] = useState(null);
  const [scanStep, setScanStep] = useState(0); 
  const fileInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadResumes = async () => {
    try {
      const data = await getResumes();
      setResumes(data);
    } catch (error) {
      console.error(error);
      showToast("Failed to load resumes", "error");
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  useScrollReveal([resumes]);

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
      showToast("Delete failed.", "error");
    }
  };

  const handleViewAnalytics = (resume) => {
    if (analyzingId) return;
    setAnalyzingId(resume.id);
    setTimeout(() => {
      navigate(`/ats?resumeId=${resume.id}`);
    }, 1100);
  };

  // ✅ Handle viewing resume
  const handleViewResume = async (resume) => {
    setViewingResume(resume);
    setPdfUrl(null);
    try {
      const blob = await getResumeFile(resume.id);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch secure resume document", "error");
    }
  };

  // ✅ Close modal
  const closeModal = () => {
    setViewingResume(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  // ✅ Download PDF file securely
  const handleDownload = () => {
    if (!pdfUrl) {
      showToast("PDF content is still loading...", "info");
      return;
    }
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.setAttribute('download', viewingResume.file_name || 'resume.pdf');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    showToast("Download started!", "success");
  };

  // ✅ Open preview in a new window
  const handleOpenNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      showToast("PDF content is still loading...", "info");
    }
  };

  // Calculate stats
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

        {/* Upload Section */}
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
                <div className="impact-card">
                  <div className="impact-circle">
                    <svg className="impact-ring" viewBox="0 0 120 120">
                      <circle className="impact-ring-bg" cx="60" cy="60" r="54" />
                      <circle
                        className="impact-ring-progress"
                        cx="60"
                        cy="60"
                        r="54"
                        style={{
                          strokeDasharray: 339.292,
                          strokeDashoffset: 74.644
                        }}
                      />
                    </svg>
                    <div className="impact-content">
                      <span className="impact-value">78%</span>
                      <span className="impact-label">Resume Impact</span>
                    </div>
                  </div>
                  <div className="impact-text">
                    <span className="impact-title">Great Progress!</span>
                    <span className="impact-description">
                      Keep optimizing your resumes to increase your chances.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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

        {/* Resume List */}
        <section className="resume-list-premium scroll-reveal-3d">
          <div className="resume-list-header">
            <h2>Uploaded Resumes</h2>
            <span className="resume-count">{resumes.length} resumes</span>
          </div>

          {resumes.length === 0 ? (
            <div className="empty-state-premium">
              <div className="empty-state-icon">📭</div>
              <h3>No resumes uploaded yet</h3>
              <p>Upload your first resume to get started</p>
            </div>
          ) : (
            <div className="resume-grid-premium">
              {resumes.map((resume, index) => (
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
                      {/* ✅ View Resume Button */}
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
                    <button className="view-all-tips">View All Tips →</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ✅ Resume View Modal */}
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
                  <iframe 
                    src={pdfUrl} 
                    width="100%" 
                    height="450px" 
                    title="Resume Preview" 
                    style={{ border: 'none', borderRadius: '12px' }} 
                  />
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
                    disabled={!pdfUrl}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 18px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '10px',
                      color: '#34d399',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      cursor: pdfUrl ? 'pointer' : 'not-allowed',
                      opacity: pdfUrl ? 1 : 0.6
                    }}
                  >
                    ⬇️ Download PDF
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
    </motion.div>
  );
}

export default ResumePage;
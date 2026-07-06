// ResumePage.jsx - Premium Redesign (No Navbar)
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getResumes,
  uploadResume,
  deleteResume,
} from "../services/resumeService";

import "../assets/resume.css";

function ResumePage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  const handleFileChange = (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast("Please select a PDF file", "error");
      return;
    }

    setSelectedFile(file);
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

  // Calculate stats
  const totalResumes = resumes.length;
  const totalViews = resumes.reduce((acc, r) => acc + (r.views || 0), 0);
  const bestAtsScore = resumes.length > 0 ? Math.max(...resumes.map(r => r.atsScore || 0)) : 0;

  return (
    <div className="resume-wrapper">
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
        <div className="upload-premium-card">
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
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview-premium">
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
        <section className="resume-list-premium">
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
                <div className="resume-card-premium" key={resume.id}>
                  <div className="resume-card-header">
                    <div className="resume-card-icon">📄</div>
                    <div className="resume-card-info">
                      <h4 className="resume-card-name">{resume.fileName}</h4>
                      <div className="resume-card-meta">
                        <span>Uploaded on {new Date(resume.uploadedAt).toLocaleDateString()}</span>
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
                        className="resume-action-btn primary"
                        onClick={() => navigate(`/ats?resumeId=${resume.id}`)}
                      >
                        <span>📊</span> View Analytics
                      </button>
                      <button 
                        className="resume-action-btn secondary"
                        onClick={() => navigate(`/resume-optimizer?resumeId=${resume.id}`)}
                      >
                        <span>💡</span> Tips to Improve
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
      {toast && (
        <div className={`toast-premium ${toast.type}`}>
          <span className="toast-icon">{toast.type === "success" ? "✓" : "ℹ"}</span>
          <p className="toast-message">{toast.message}</p>
        </div>
      )}
    </div>
  );
}

export default ResumePage;
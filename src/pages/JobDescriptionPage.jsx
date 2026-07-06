// JobDescriptionPage.jsx - Premium Redesign (No Navbar)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createJobDescription,
  deleteJobDescription,
  getJobDescriptions,
} from "../services/jobDescriptionService";

import "../assets/jobDescription.css";

function JobDescriptionPage() {
  const navigate = useNavigate();
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadJobDescriptions = async () => {
    try {
      const data = await getJobDescriptions();
      setJobDescriptions(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadJobDescriptions();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createJobDescription(formData);
      showToast("Job description created successfully!", "success");
      setFormData({
        title: "",
        company: "",
        description: "",
      });
      await loadJobDescriptions();
    } catch (error) {
      console.error(error);
      showToast("Failed to create job description.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this job description?");
    if (!confirmed) return;
    try {
      await deleteJobDescription(id);
      showToast("Job description deleted successfully!", "success");
      loadJobDescriptions();
    } catch (error) {
      console.error(error);
      showToast("Failed to delete job description.", "error");
    }
  };

  const companyCount = new Set(jobDescriptions.map((job) => job.company)).size;
  const atsReadyCount = jobDescriptions.length;

  return (
    <div className="jobs-wrapper">
      <div className="jobs-page-content">
        {/* Hero Section */}
        <section className="jobs-hero-premium">
          <div className="jobs-hero-glow"></div>
          <div className="jobs-hero-content">
            <div className="jobs-hero-left">
              <div className="hero-badge">
                <span className="badge-dot"></span>
                <span className="badge-icon">📋</span>
                Job Descriptions
              </div>
              <h1 className="jobs-hero-title">
                Keep every role's requirements
                <br />
                <span className="gradient-text">in one place.</span>
              </h1>
              <p className="jobs-hero-sub">
                Save postings as you find them, then pair any of them with a
                resume in the optimizer to see exactly where the match is weak.
              </p>
            </div>
            <div className="jobs-hero-right">
              <div className="jobs-hero-stats">
                <div className="jobs-hero-stat">
                  <span className="jobs-hero-stat-value">{jobDescriptions.length}</span>
                  <span className="jobs-hero-stat-label">Total Jobs</span>
                </div>
                <div className="jobs-hero-stat">
                  <span className="jobs-hero-stat-value">{atsReadyCount}</span>
                  <span className="jobs-hero-stat-label">ATS Ready</span>
                </div>
                <div className="jobs-hero-stat">
                  <span className="jobs-hero-stat-value">{companyCount}</span>
                  <span className="jobs-hero-stat-label">Companies</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form + Stats Grid */}
        <div className="jobs-top-grid">
          {/* Form Card */}
          <section className="jobs-form-card">
            <div className="jobs-form-glow"></div>
            <div className="jobs-form-content">
              <div className="jobs-form-header">
                <h2>
                  <span className="form-icon">📝</span>
                  Add a job description
                </h2>
                <p className="form-subtitle">Fill in the details below to save a job posting</p>
              </div>

              <form onSubmit={handleSubmit} className="jobs-form">
                <div className="jobs-field">
                  <label>
                    <span className="field-label-icon">💼</span>
                    Role title
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="e.g. Senior Backend Engineer"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="jobs-input"
                  />
                </div>

                <div className="jobs-field">
                  <label>
                    <span className="field-label-icon">🏢</span>
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    placeholder="e.g. Acme Corp"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="jobs-input"
                  />
                </div>

                <div className="jobs-field">
                  <label>
                    <span className="field-label-icon">📄</span>
                    Description
                  </label>
                  <textarea
                    rows="6"
                    name="description"
                    placeholder="Paste the full job description here..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="jobs-textarea"
                  />
                </div>

                <button type="submit" className="jobs-submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">💾</span>
                      Save job description
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* Stats Cards */}
          <div className="jobs-stats-grid">
            <div className="jobs-stat-card card-glow-purple">
              <div className="jobs-stat-icon">📊</div>
              <div className="jobs-stat-content">
                <span className="jobs-stat-value">{jobDescriptions.length}</span>
                <span className="jobs-stat-label">Total Jobs</span>
                <span className="jobs-stat-trend">↑ {jobDescriptions.length > 0 ? 'Active' : 'No jobs yet'}</span>
              </div>
            </div>

            <div className="jobs-stat-card card-glow-green">
              <div className="jobs-stat-icon">✅</div>
              <div className="jobs-stat-content">
                <span className="jobs-stat-value">{atsReadyCount}</span>
                <span className="jobs-stat-label">ATS Ready</span>
                <span className="jobs-stat-trend">{atsReadyCount > 0 ? 'Ready to optimize' : 'Add jobs'}</span>
              </div>
            </div>

            <div className="jobs-stat-card card-glow-blue">
              <div className="jobs-stat-icon">🏢</div>
              <div className="jobs-stat-content">
                <span className="jobs-stat-value">{companyCount}</span>
                <span className="jobs-stat-label">Companies</span>
                <span className="jobs-stat-trend">{companyCount > 0 ? 'Unique employers' : 'No companies'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Job Descriptions */}
        <section className="jobs-list-section">
          <div className="jobs-list-header">
            <div className="jobs-list-header-left">
              <h2>Saved Job Descriptions</h2>
              <span className="jobs-count-badge">{jobDescriptions.length} total</span>
            </div>
            {jobDescriptions.length > 0 && (
              <button className="jobs-clear-btn" onClick={() => {
                if (window.confirm('Clear all job descriptions?')) {
                  // Add clear all functionality if needed
                }
              }}>
                Clear All
              </button>
            )}
          </div>

          {jobDescriptions.length === 0 ? (
            <div className="jobs-empty-state">
              <div className="jobs-empty-icon">📭</div>
              <h3>No job descriptions saved yet</h3>
              <p>Add a job description above to get started with tracking your applications.</p>
            </div>
          ) : (
            <div className="jobs-grid">
              {jobDescriptions.map((job, index) => (
                <div key={job.id} className="jobs-job-card">
                  <div className="jobs-job-card-header">
                    <div className="jobs-job-icon">💼</div>
                    <div className="jobs-job-info">
                      <h3 className="jobs-job-title">{job.title}</h3>
                      <span className="jobs-job-company">🏢 {job.company}</span>
                    </div>
                    <span className="jobs-job-badge">#{index + 1}</span>
                  </div>

                  <p className="jobs-job-description">
                    {job.description.length > 200
                      ? job.description.substring(0, 200) + "..."
                      : job.description}
                  </p>

                  <div className="jobs-job-footer">
                    <div className="jobs-job-meta">
                      <span className="jobs-job-date">
                        📅 Added {new Date(job.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="jobs-job-actions">
                      <button 
                        className="jobs-job-action-btn optimize"
                        onClick={() => navigate(`/resume-optimizer?jobId=${job.id}`)}
                      >
                        <span>⚡</span> Optimize
                      </button>
                      <button
                        className="jobs-job-action-btn delete"
                        onClick={() => handleDelete(job.id)}
                      >
                        <span>🗑️</span> Delete
                      </button>
                    </div>
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

export default JobDescriptionPage;
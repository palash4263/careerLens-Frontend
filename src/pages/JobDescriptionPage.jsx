// JobDescriptionPage.jsx - Premium with All Features
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
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [toast, setToast] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterCompany, setFilterCompany] = useState("all");
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
      setFilteredJobs(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadJobDescriptions();
  }, []);

  // Filter and sort jobs
  useEffect(() => {
    let result = [...jobDescriptions];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term)
      );
    }
    
    // Company filter
    if (filterCompany !== "all") {
      result = result.filter(job => job.company === filterCompany);
    }
    
    // Sort
    switch(sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case "alphabetical":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }
    
    setFilteredJobs(result);
  }, [jobDescriptions, searchTerm, filterCompany, sortBy]);

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
      setFormData({ title: "", company: "", description: "" });
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
      setSelectedJobs(selectedJobs.filter(j => j !== id));
    } catch (error) {
      console.error(error);
      showToast("Failed to delete job description.", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.length === 0) return;
    const confirmed = window.confirm(`Delete ${selectedJobs.length} job descriptions?`);
    if (!confirmed) return;
    try {
      for (const id of selectedJobs) {
        await deleteJobDescription(id);
      }
      showToast(`${selectedJobs.length} jobs deleted successfully!`, "success");
      loadJobDescriptions();
      setSelectedJobs([]);
    } catch (error) {
      console.error(error);
      showToast("Failed to delete jobs.", "error");
    }
  };

  const toggleJobSelection = (id) => {
    setSelectedJobs(prev => 
      prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]
    );
  };

  const toggleAllJobs = () => {
    if (selectedJobs.length === filteredJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(filteredJobs.map(j => j.id));
    }
  };

  const exportJobs = () => {
    // Simple CSV export
    const headers = ['Title', 'Company', 'Description', 'Date'];
    const rows = filteredJobs.map(j => [
      j.title,
      j.company,
      j.description.replace(/,/g, ' '),
      new Date(j.createdAt || Date.now()).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job_descriptions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const companyCount = new Set(jobDescriptions.map((job) => job.company)).size;
  const atsReadyCount = jobDescriptions.length;

  // Get top company
  const getTopCompany = () => {
    if (jobDescriptions.length === 0) return 'N/A';
    const counts = jobDescriptions.reduce((acc, j) => {
      acc[j.company] = (acc[j.company] || 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'N/A';
  };

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

        {/* Quick Stats Cards */}
        <div className="jobs-quick-stats">
          <div className="quick-stat-card">
            <div className="quick-stat-header">
              <span className="quick-stat-icon">🏢</span>
              <span className="quick-stat-label">Top Company</span>
            </div>
            <span className="quick-stat-value">{getTopCompany()}</span>
            <span className="quick-stat-sub">Most frequent employer</span>
          </div>
          <div className="quick-stat-card">
            <div className="quick-stat-header">
              <span className="quick-stat-icon">📈</span>
              <span className="quick-stat-label">Application Progress</span>
            </div>
            <div className="quick-stat-progress">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: Math.min(jobDescriptions.length * 10, 100) + '%' }}></div>
              </div>
              <span className="progress-label">{Math.min(jobDescriptions.length * 10, 100)}% complete</span>
            </div>
          </div>
          <div className="quick-stat-card">
            <div className="quick-stat-header">
              <span className="quick-stat-icon">📊</span>
              <span className="quick-stat-label">Total Saved</span>
            </div>
            <span className="quick-stat-value">{jobDescriptions.length}</span>
            <span className="quick-stat-sub">Job descriptions saved</span>
          </div>
        </div>

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

        {/* Search & Filter Bar */}
        <div className="jobs-search-bar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search jobs by title, company, or keywords..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm("")}>✕</button>
            )}
          </div>
          <div className="filter-group">
            <select 
              className="filter-select" 
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
            >
              <option value="all">All Companies</option>
              {[...new Set(jobDescriptions.map(j => j.company))].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Saved Job Descriptions */}
        <section className="jobs-list-section">
          <div className="jobs-list-header">
            <div className="jobs-list-header-left">
              <h2>Saved Job Descriptions</h2>
              <span className="jobs-count-badge">{filteredJobs.length} total</span>
            </div>
            <div className="jobs-list-actions">
              {jobDescriptions.length > 0 && (
                <button className="export-btn" onClick={exportJobs}>📤 Export</button>
              )}
              {selectedJobs.length > 0 && (
                <button className="bulk-delete-btn" onClick={handleBulkDelete}>
                  🗑️ Delete {selectedJobs.length}
                </button>
              )}
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="jobs-empty-state-premium">
              <div className="empty-state-illustration">📋</div>
              <h3>{jobDescriptions.length === 0 ? 'No job descriptions saved yet' : 'No matches found'}</h3>
              <p>
                {jobDescriptions.length === 0 
                  ? 'Add a job description above to get started with tracking your applications.' 
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              {jobDescriptions.length === 0 && (
                <div className="empty-state-actions">
                  <button className="empty-btn primary" onClick={() => document.querySelector('.jobs-form').scrollIntoView()}>
                    ✏️ Add First Job
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Select All */}
              {filteredJobs.length > 1 && (
                <div className="select-all-row">
                  <label className="select-all-label">
                    <input
                      type="checkbox"
                      checked={selectedJobs.length === filteredJobs.length}
                      onChange={toggleAllJobs}
                    />
                    Select All
                  </label>
                </div>
              )}
              
              <div className="jobs-grid">
                {filteredJobs.map((job, index) => (
                  <div key={job.id} className="jobs-job-card">
                    <div className="jobs-job-card-header">
                      <div className="jobs-job-select">
                        <input
                          type="checkbox"
                          checked={selectedJobs.includes(job.id)}
                          onChange={() => toggleJobSelection(job.id)}
                          className="job-select-checkbox"
                        />
                      </div>
                      <div className="jobs-job-icon">💼</div>
                      <div className="jobs-job-info" onClick={() => setSelectedJob(job)}>
                        <h3 className="jobs-job-title">{job.title}</h3>
                        <span className="jobs-job-company">🏢 {job.company}</span>
                      </div>
                      <span className="jobs-job-badge">#{index + 1}</span>
                    </div>

                    <p className="jobs-job-description" onClick={() => setSelectedJob(job)}>
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
            </>
          )}
        </section>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="job-detail-modal" onClick={() => setSelectedJob(null)}>
          <div className="job-detail-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedJob(null)}>✕</button>
            <div className="modal-header">
              <h2>{selectedJob.title}</h2>
              <span className="modal-company">🏢 {selectedJob.company}</span>
            </div>
            <div className="modal-body">
              <div className="modal-meta">
                <span>📅 Added: {new Date(selectedJob.createdAt || Date.now()).toLocaleDateString()}</span>
                <span>🔢 ID: #{selectedJob.id}</span>
              </div>
              <div className="modal-description">
                <h4>Full Description</h4>
                <p>{selectedJob.description}</p>
              </div>
              <div className="modal-actions">
                <button 
                  className="modal-btn primary"
                  onClick={() => {
                    setSelectedJob(null);
                    navigate(`/resume-optimizer?jobId=${selectedJob.id}`);
                  }}
                >
                  ⚡ Optimize Resume
                </button>
                <button 
                  className="modal-btn secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedJob.description);
                    showToast("Description copied to clipboard!", "success");
                  }}
                >
                  📋 Copy Description
                </button>
                <button 
                  className="modal-btn danger"
                  onClick={() => {
                    setSelectedJob(null);
                    handleDelete(selectedJob.id);
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
// JobDescriptionPage.jsx - Premium with All Features
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createJobDescription,
  deleteJobDescription,
  getJobDescriptions,
  fetchJobFromUrl,
} from "../services/jobDescriptionService";
import { useScrollReveal } from "../hooks/useScrollReveal";
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
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [activeTab, setActiveTab] = useState("ai");
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Extract tech keywords dynamically for live analyzer panel
  const getExtractedKeywords = (text) => {
    if (!text) return [];
    const techKeywords = [
      "react", "javascript", "typescript", "node", "python", "java", "sql", "aws", 
      "docker", "kubernetes", "git", "rest api", "graphql", "css", "html", "mongodb",
      "postgresql", "c++", "c#", "ruby", "go", "rust", "cicd", "agile", "scrum", "cloud"
    ];
    const words = text.toLowerCase();
    return techKeywords.filter(kw => words.includes(kw)).map(kw => {
      if (kw === "rest api") return "REST API";
      if (kw === "aws") return "AWS";
      if (kw === "sql") return "SQL";
      if (kw === "c++") return "C++";
      if (kw === "c#") return "C#";
      if (kw === "go") return "Go";
      if (kw === "css") return "CSS";
      if (kw === "html") return "HTML";
      if (kw === "cicd") return "CI/CD";
      return kw.charAt(0).toUpperCase() + kw.slice(1);
    });
  };

  // Extract soft skills dynamically for live analyzer panel
  const getExtractedSoftSkills = (text) => {
    if (!text) return [];
    const softSkills = [
      "leadership", "communication", "collaboration", "teamwork", "problem solving",
      "critical thinking", "creativity", "adaptability", "mentorship", "agile"
    ];
    const words = text.toLowerCase();
    return softSkills.filter(kw => words.includes(kw)).map(kw => {
      return kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    });
  };

  // Real AI Fetch — calls backend which scrapes the URL and uses Groq to extract job data
  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;
    setIsImporting(true);
    try {
      const data = await fetchJobFromUrl(urlInput.trim());
      setFormData({
        title: data.title || "",
        company: data.company || "",
        description: data.description || "",
      });
      setUrlInput("");
      showToast("✅ Job details auto-filled using AI!", "success");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "AI Fetch failed. Some job sites block scraping — try pasting the description manually.";
      showToast(msg, "error");
    } finally {
      setIsImporting(false);
    }
  };

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

  useScrollReveal([jobDescriptions, filteredJobs]);

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

    // Skill filter
    if (selectedSkill) {
      const skillLower = selectedSkill.toLowerCase();
      result = result.filter(job => 
        job.description.toLowerCase().includes(skillLower) || 
        job.title.toLowerCase().includes(skillLower)
      );
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
  }, [jobDescriptions, searchTerm, filterCompany, selectedSkill, sortBy]);

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
    const jobsToExport = selectedJobs.length > 0 
      ? filteredJobs.filter(j => selectedJobs.includes(j.id)) 
      : filteredJobs;
    
    // Simple CSV export
    const headers = ['Title', 'Company', 'Description', 'Date'];
    const rows = jobsToExport.map(j => [
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
    showToast(selectedJobs.length > 0 ? `Exported ${selectedJobs.length} selected jobs!` : "Exported all jobs!", "success");
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
        <div className="jobs-quick-stats scroll-reveal">
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
          <section className="jobs-form-card scroll-reveal-3d">
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
                <div className="jobs-field url-import-field" style={{ borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontWeight: '600' }}>
                    <span>✨</span> AI URL Auto-Fill (Optional)
                  </label>
                  <div className="url-input-wrapper" style={{ display: 'flex', gap: '0.75rem', marginTop: '6px' }}>
                    <input
                      type="url"
                      placeholder="Paste LinkedIn or Indeed job URL..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="jobs-input"
                      style={{ flex: 1, border: '1px solid rgba(168, 85, 247, 0.2)', background: 'rgba(168, 85, 247, 0.02)' }}
                    />
                    <button 
                      type="button" 
                      onClick={handleUrlImport}
                      disabled={isImporting || !urlInput}
                      className="jobs-import-btn"
                      style={{
                        padding: '8px 20px',
                        background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        cursor: urlInput ? 'pointer' : 'not-allowed',
                        opacity: urlInput ? 1 : 0.6,
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isImporting ? <span className="spinner"></span> : "✨ AI Fetch"}
                    </button>
                  </div>
                </div>

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

          {/* AI Parser Insights Panel */}
          <div className="jobs-ai-analyzer-card scroll-reveal-3d">
            <div className="analyzer-glow"></div>
            <div className="analyzer-content">
              <div className="analyzer-header">
                <h3>
                  <span className="analyzer-icon">🔮</span>
                  AI Live Parser Console
                </h3>
                <span className={`analyzer-status-badge ${formData.description ? 'active' : 'idle'}`}>
                  {formData.description ? "● Active Parsing" : "● Waiting"}
                </span>
              </div>

              {!formData.description ? (
                <div className="analyzer-empty-state">
                  <div className="empty-icon">⚡</div>
                  <h4>No Description Detected</h4>
                  <p>Paste a job description or use the <strong>AI URL Auto-Fill</strong> on the left to extract key technical requirements and soft skills dynamically.</p>
                </div>
              ) : (
                <div className="analyzer-metrics">
                  <div className="analyzer-stat-row">
                    <div className="stat-radial-wrapper">
                      <div className="radial-circle">
                        <svg viewBox="0 0 36 36" className="circular-chart purple">
                          <path className="circle-bg"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path className="circle"
                            strokeDasharray={`${Math.min(30 + getExtractedKeywords(formData.description).length * 10, 95)}, 100`}
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <text x="18" y="20.35" className="percentage">{Math.min(30 + getExtractedKeywords(formData.description).length * 10, 95)}%</text>
                        </svg>
                      </div>
                    </div>
                    <div className="stat-label-col">
                      <span className="stat-title">Rigor Index</span>
                      <span className="stat-desc">Complexity level of job requirements</span>
                    </div>
                  </div>

                  <div className="analyzer-keywords-section">
                    <span className="section-label">🛠️ Extracted Tech Stack ({getExtractedKeywords(formData.description).length})</span>
                    {getExtractedKeywords(formData.description).length > 0 ? (
                      <div className="keywords-list">
                        {getExtractedKeywords(formData.description).map((kw, i) => (
                          <span key={i} className="keyword-badge tech">{kw}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="no-keywords-text">Scanning for technical terms...</p>
                    )}
                  </div>

                  <div className="analyzer-keywords-section">
                    <span className="section-label">🤝 Extracted Soft Skills ({getExtractedSoftSkills(formData.description).length})</span>
                    {getExtractedSoftSkills(formData.description).length > 0 ? (
                      <div className="keywords-list">
                        {getExtractedSoftSkills(formData.description).map((kw, i) => (
                          <span key={i} className="keyword-badge soft">{kw}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="no-keywords-text">Scanning for core competencies...</p>
                    )}
                  </div>

                  <div className="analyzer-footer-tip">
                    <span className="tip-icon">💡</span>
                    <p className="tip-text">Use this saved profile in the <strong>Optimization Studio</strong> to match against your resume.</p>
                  </div>
                </div>
              )}
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

        {/* Dynamic Skill Filter Pills */}
        {jobDescriptions.length > 0 && (
          <div className="jobs-filter-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem', padding: '0 0.25rem' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', marginRight: '4px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filter by Skill:
            </span>
            {["React", "TypeScript", "Node", "Python", "SQL", "AWS", "Docker", "Agile"].map((skill) => {
              const hasSkill = jobDescriptions.some(j => j.description.toLowerCase().includes(skill.toLowerCase()) || j.title.toLowerCase().includes(skill.toLowerCase()));
              if (!hasSkill) return null;
              
              const isSelected = selectedSkill === skill;
              return (
                <button
                  key={skill}
                  onClick={() => setSelectedSkill(isSelected ? null : skill)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '99px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#c084fc' : '#94a3b8',
                    transition: 'all 0.3s ease',
                    boxShadow: isSelected ? '0 0 15px rgba(168, 85, 247, 0.15)' : 'none'
                  }}
                >
                  {skill}
                </button>
              );
            })}
            {selectedSkill && (
              <button
                onClick={() => setSelectedSkill(null)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '99px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  transition: 'all 0.3s ease'
                }}
              >
                Clear Filter ✕
              </button>
            )}
          </div>
        )}

        {/* Saved Job Descriptions */}
        <section className="jobs-list-section scroll-reveal">
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
                      <div className="jobs-job-select" onClick={(e) => e.stopPropagation()}>
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

                    {/* Live Extracted Skills Preview */}
                    <div className="job-card-skills-preview" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', margin: '0.75rem 0' }}>
                      {getExtractedKeywords(job.description).slice(0, 4).map((kw, i) => (
                        <span key={i} className="keyword-badge tech" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.12)', color: '#60a5fa', fontWeight: '600' }}>
                          {kw}
                        </span>
                      ))}
                      {getExtractedSoftSkills(job.description).slice(0, 2).map((kw, i) => (
                        <span key={i} className="keyword-badge soft" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.12)', color: '#34d399', fontWeight: '600' }}>
                          {kw}
                        </span>
                      ))}
                      {getExtractedKeywords(job.description).length === 0 && (
                        <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>No skills indexed</span>
                      )}
                    </div>

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
                <p style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '10px', fontSize: '13px', lineHeight: '1.6', color: '#cbd5e1' }}>{selectedJob.description}</p>
              </div>

              <div className="modal-extracted-insights" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                <h4 style={{ color: '#F1F5F9', fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔮</span> AI Indexed Keywords
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Tech Stack</span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {getExtractedKeywords(selectedJob.description).map((kw, i) => (
                        <span key={i} className="keyword-badge tech" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.12)', color: '#60a5fa', fontWeight: '600' }}>
                          {kw}
                        </span>
                      ))}
                      {getExtractedKeywords(selectedJob.description).length === 0 && (
                        <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>None detected</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Core Competencies</span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {getExtractedSoftSkills(selectedJob.description).map((kw, i) => (
                        <span key={i} className="keyword-badge soft" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.12)', color: '#34d399', fontWeight: '600' }}>
                          {kw}
                        </span>
                      ))}
                      {getExtractedSoftSkills(selectedJob.description).length === 0 && (
                        <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>None detected</span>
                      )}
                    </div>
                  </div>
                </div>
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
// JobDescriptionPage.jsx - Premium with All Features
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createJobDescription,
  deleteJobDescription,
  getJobDescriptions,
} from "../services/jobDescriptionService";
import { extractJobFromUrl } from "../services/groqService";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import AnimeLayoutGrid from "../components/common/AnimeLayoutGrid";
import CtaFooter from "../components/CtaFooter";
import SubNav from "../components/common/SubNav";
import "../assets/jobDescription.css";

// Common role titles offered alongside whatever the user has already saved,
// so the Role title field suggests options as soon as they start typing.
const COMMON_ROLE_TITLES = [
  "Software Engineer", "Senior Software Engineer", "Staff Software Engineer", "Principal Engineer",
  "Frontend Engineer", "Backend Engineer", "Full Stack Engineer", "Full Stack Developer",
  "Senior Backend Engineer", "Senior Frontend Engineer", "Senior Full Stack Engineer",
  "Mobile Engineer", "iOS Engineer", "Android Engineer",
  "DevOps Engineer", "Site Reliability Engineer", "Cloud Engineer", "Platform Engineer",
  "Data Engineer", "Data Scientist", "Data Analyst", "Machine Learning Engineer", "AI Engineer",
  "QA Engineer", "Test Automation Engineer", "SDET",
  "Product Manager", "Technical Product Manager", "Product Designer", "UX Designer", "UI/UX Designer",
  "Engineering Manager", "Technical Lead", "Solutions Architect", "Security Engineer",
  "Business Analyst", "Project Manager", "Scrum Master",
];

function JobDescriptionPage() {
  const navigate = useNavigate();
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [toast, setToast] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [interviewModalJob, setInterviewModalJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterCompany, setFilterCompany] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState(null);

  // Titles you've already saved, deduped, ahead of the common-role list.
  const roleTitleOptions = [
    ...new Set([
      ...jobDescriptions.map(j => j.title).filter(Boolean),
      ...COMMON_ROLE_TITLES,
    ]),
  ];
  const [activeTab, setActiveTab] = useState("ai");
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
  });
  const [urlInput, setUrlInput] = useState("");
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [loading, setLoading] = useState(false);

  // Curated technology dictionary: label -> alternation of regex-safe match patterns.
  // Matching is done with strict \b...\b word boundaries so substrings (e.g. "java"
  // inside "javascript", "sql" inside "postgresql") never produce false positives.
  const TECH_DICTIONARY = [
    ["React", ["react(?:\\.js|js)?"]],
    ["Next.js", ["next(?:\\.js|js)?"]],
    ["Vue.js", ["vue(?:\\.js|js)?"]],
    ["Angular", ["angular(?:js)?"]],
    ["TypeScript", ["typescript"]],
    ["JavaScript", ["javascript"]],
    ["Node.js", ["node(?:\\.js|js)?"]],
    ["Express.js", ["express(?:\\.js|js)?"]],
    ["Redux", ["redux"]],
    ["GraphQL", ["graphql"]],
    ["REST APIs", ["rest(?:ful)?\\s*api(?:s)?"]],
    ["Webpack", ["webpack"]],
    ["Babel", ["babel"]],
    ["Vite", ["vite"]],
    ["Jest", ["jest"]],
    ["Mocha", ["mocha"]],
    ["Cypress", ["cypress"]],
    ["Tailwind CSS", ["tailwind(?:\\s*css)?"]],
    ["Sass/SCSS", ["sass", "scss"]],
    ["CSS", ["css3?"]],
    ["HTML", ["html5?"]],
    ["WCAG/Accessibility", ["wcag", "accessibility", "a11y"]],
    ["Python", ["python"]],
    ["Java", ["java"]],
    ["C++", ["c\\+\\+"]],
    ["C#", ["c#"]],
    ["Ruby", ["ruby"]],
    ["Go", ["go(?:lang)?"]],
    ["Rust", ["rust"]],
    ["Spring Boot", ["spring\\s*boot", "spring"]],
    [".NET", ["\\.net", "dotnet"]],
    ["PostgreSQL", ["postgresql", "postgres"]],
    ["MySQL", ["mysql"]],
    ["MongoDB", ["mongodb", "mongo"]],
    ["NoSQL", ["nosql"]],
    ["SQL", ["sql"]],
    ["Redis", ["redis"]],
    ["AWS", ["aws", "amazon\\s*web\\s*services"]],
    ["Azure", ["azure"]],
    ["GCP", ["gcp", "google\\s*cloud"]],
    ["Docker", ["docker"]],
    ["Kubernetes", ["kubernetes", "k8s"]],
    ["Git", ["git(?:hub|lab)?"]],
    ["CI/CD", ["ci\\/cd", "cicd", "continuous\\s*integration", "continuous\\s*deployment"]],
    ["Microservices", ["microservices?"]],
    ["System Design", ["system\\s*design"]],
    ["Machine Learning", ["machine\\s*learning", "\\bml\\b"]],
    ["Artificial Intelligence", ["artificial\\s*intelligence"]],
    ["Data Structures & Algorithms", ["data\\s*structures", "algorithms?"]],
    ["Linux", ["linux", "unix"]],
    ["JUnit", ["junit"]],
    ["TestNG", ["testng"]],
    ["Jenkins", ["jenkins"]],
  ];

  // Extract tech keywords dynamically for live analyzer panel
  const getExtractedKeywords = (text) => {
    if (!text) return [];
    return TECH_DICTIONARY
      .filter(([, patterns]) => patterns.some(p => new RegExp(`(?<![\\w])(?:${p})(?!\\w)`, 'i').test(text)))
      .map(([label]) => label);
  };

  // Extract soft skills dynamically for live analyzer panel
  const getExtractedSoftSkills = (text) => {
    if (!text) return [];
    const softSkills = [
      ["Leadership", ["leadership"]],
      ["Communication", ["communication"]],
      ["Collaboration", ["collaboration", "collaborative"]],
      ["Teamwork", ["teamwork", "team\\s*player"]],
      ["Problem Solving", ["problem[\\s-]solving"]],
      ["Critical Thinking", ["critical\\s*thinking"]],
      ["Creativity", ["creativity", "creative"]],
      ["Adaptability", ["adaptability", "adaptable"]],
      ["Mentorship", ["mentorship", "mentoring"]],
      ["Agile/Scrum", ["agile", "scrum"]],
      ["Analytical", ["analytical"]],
      ["Debugging", ["debugging"]],
    ];
    return softSkills
      .filter(([, patterns]) => patterns.some(p => new RegExp(`(?<![\\w])(?:${p})(?!\\w)`, 'i').test(text)))
      .map(([label]) => label);
  };



  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadJobDescriptions = async () => {
    try {
      const data = await getJobDescriptions();
      if (Array.isArray(data)) {
        setJobDescriptions(data);
        setFilteredJobs(data);
      } else {
        setJobDescriptions([]);
        setFilteredJobs([]);
      }
    } catch (error) {
      console.error(error);
      setJobDescriptions([]);
      setFilteredJobs([]);
    }
  };

  useEffect(() => {
    loadJobDescriptions();
  }, []);

  const handleUrlExtract = async () => {
    if (!urlInput) return;
    setIsExtractingUrl(true);
    try {
      const extracted = await extractJobFromUrl(urlInput);
      setFormData({
        title: extracted.title || "",
        company: extracted.company || "",
        description: extracted.description || ""
      });
      showToast("Job details successfully extracted via AI!", "success");
      setUrlInput("");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to extract job details. Please paste manually.", "error");
    } finally {
      setIsExtractingUrl(false);
    }
  };

  useScrollReveal([jobDescriptions, filteredJobs]);

  // Filter and sort jobs
  useEffect(() => {
    let result = [...jobDescriptions];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(job => 
        (job.title || "").toLowerCase().includes(term) ||
        (job.company || "").toLowerCase().includes(term) ||
        (job.description || "").toLowerCase().includes(term)
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
        (job.description || "").toLowerCase().includes(skillLower) || 
        (job.title || "").toLowerCase().includes(skillLower)
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
        result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
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
      const savedTitle = formData.title?.trim();
      setFormData({ title: "", company: "", description: "" });
      await loadJobDescriptions();
      showToast(
        savedTitle ? `"${savedTitle}" saved` : "Job description saved",
        "success"
      );
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
    if (selectedJobs.length === (filteredJobs || []).length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs((filteredJobs || []).map(j => j.id));
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

  const companyCount = new Set((jobDescriptions || []).map((job) => job.company)).size;
  const atsReadyCount = (jobDescriptions || []).length;

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
    <motion.div 
      className="jobs-wrapper"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
    <div className="jobs-page-content">
      <SubNav type="career" />
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

                {/* AI URL Auto-Fill */}
                <div className="jobs-field" style={{ background: 'rgba(168, 85, 247, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)', marginBottom: '24px' }}>
                  <label style={{ color: '#c084fc', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>
                      <span className="field-label-icon">✨</span>
                      AI URL Auto-Fill
                    </span>
                    <span style={{ fontSize: '11px', background: '#c084fc', color: '#0f172a', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>BETA</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="url"
                      placeholder="Paste job link here (e.g. LinkedIn, Naukri)..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="jobs-input"
                      style={{ flex: 1, borderColor: 'rgba(168, 85, 247, 0.3)', margin: 0 }}
                    />
                    <button 
                      type="button" 
                      onClick={handleUrlExtract}
                      disabled={!urlInput || isExtractingUrl}
                      className="jobs-submit-btn" 
                      style={{ width: 'auto', padding: '0 20px', background: 'linear-gradient(135deg, #a855f7, #7c3aed)', margin: 0, minHeight: '44px' }}
                    >
                      {isExtractingUrl ? <span className="spinner" style={{ margin: 0 }}></span> : 'Extract'}
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
                    list="jobs-role-title-options"
                    autoComplete="off"
                  />
                  <datalist id="jobs-role-title-options">
                    {roleTitleOptions.map(t => <option key={t} value={t} />)}
                  </datalist>
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

                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <button type="submit" className="jobs-submit-btn" disabled={loading} style={{ flex: '1 1 200px' }}>
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

                  <button 
                    type="button" 
                    className="jobs-submit-btn"
                    style={{ 
                      flex: '1 1 200px', 
                      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', 
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35)'
                    }}
                    onClick={() => {
                      if (!formData.title && !formData.description) {
                        showToast("Please enter a role title or paste a description first!", "error");
                        return;
                      }
                      navigate("/interview-prep", {
                        state: {
                          job: {
                            title: formData.title || "Target Software Role",
                            company: formData.company || "Target Company",
                            description: formData.description
                          }
                        }
                      });
                    }}
                  >
                    <span className="btn-icon">🎯</span>
                    Generate Interview Questions
                  </button>
                </div>
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
            <Search className="search-icon" size={16} />
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
              {[...new Set((jobDescriptions || []).map(j => j.company).filter(Boolean))].map(c => (
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
              
              <AnimeLayoutGrid filterKey={searchTerm + sortBy + filterCompany} className="jobs-grid">
                {filteredJobs.map((job, index) => (
                  <div key={job.id} data-id={job.id} className="jobs-job-card">
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
                          className="jobs-job-action-btn interview"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/interview-prep/${job.id}`, { state: { job } });
                          }}
                          style={{
                            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(124, 58, 237, 0.25))',
                            border: '1px solid #c084fc',
                            color: '#ffffff',
                            fontWeight: '800',
                            boxShadow: '0 0 14px rgba(168, 85, 247, 0.3)'
                          }}
                          title="Generate & View Tailored Interview Questions"
                        >
                          <span>🎯</span> Interview Qs
                        </button>
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
              </AnimeLayoutGrid>
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
                  className="modal-btn secondary"
                  style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', fontWeight: '700' }}
                  onClick={() => {
                    const targetJob = selectedJob;
                    setSelectedJob(null);
                    navigate(`/interview-prep/${targetJob.id}`, { state: { job: targetJob } });
                  }}
                >
                  🎯 Interview Questions
                </button>
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

      <CtaFooter />
    </motion.div>
  );
}

export default JobDescriptionPage;
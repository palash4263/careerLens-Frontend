import { useState, useEffect } from "react";
import { Search, MapPin, ExternalLink, Loader2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "../assets/JobExtraction.css";

export default function JobExtractionPage() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedJobs, setSelectedJobs] = useState([]);

  // Mock job data generator - simulates scraper results (India-focused)
  const generateMockJobs = (jobTitle, jobLocation) => {
    const companies = [
      'TCS', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra', 'Cognizant',
      'Flipkart', 'Amazon India', 'Google India', 'Microsoft India', 'Meta India',
      'Zomato', 'Swiggy', 'Paytm', 'Dream11', 'Unacademy', 'Byju\'s', 'OYO',
      'Freshworks', 'MuSigma', 'Nutanix India', 'Rivigo', 'Dunzo', 'ShareChat',
      'Nykaa', 'BigBasket', 'Jio', 'Airtel', 'Idea Cellular', 'Reliance', 'Accenture India'
    ];

    const indianLocations = [
      'Bangalore', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune', 'Gurgaon', 'Noida',
      'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Remote', 'Hybrid'
    ];

    const locations = jobLocation
      ? [jobLocation, 'Remote', 'Hybrid'].filter(l => l)
      : indianLocations;

    const descriptions = [
      'Join our team to build cutting-edge web applications. We work with React, Node.js, and modern cloud technologies.',
      'Help us scale our platform to millions of users. Strong backend experience required with focus on performance.',
      'Lead a team of engineers in building next-gen features. Experience with system design and mentorship a plus.',
      'Work on challenging problems in a fast-paced environment. We value innovation, collaboration, and continuous learning.',
      'Be part of a mission-driven company transforming the industry. Competitive salary and comprehensive benefits.',
      'Collaborate with cross-functional teams to deliver high-quality solutions. Exposure to cloud infrastructure and microservices.',
      'Develop scalable solutions for a global audience. We offer competitive compensation and career growth opportunities.',
      'Join our innovative team building solutions for millions. Experience with modern tech stack and agile methodologies.'
    ];

    return Array.from({ length: 30 }, (_, i) => ({
      id: `job-${Date.now()}-${i}`,
      title: jobTitle || 'Software Developer',
      company: companies[Math.floor(Math.random() * companies.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(jobTitle || 'Developer')}&location=India`,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      posted: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  };

  const searchJobs = async () => {
    if (!keyword.trim()) {
      setError("Please enter a job title or role");
      return;
    }

    setLoading(true);
    setError("");
    setJobs([]);

    try {
      const backendUrl = `${import.meta.env.VITE_API_URL}/jobs/search`;
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, location, sources: ['naukri'] })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.jobs && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      } else {
        setError('No jobs found. Try different keywords.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching jobs. Please try again.');
      console.error('Job search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchJobs();
    }
  };

  const toggleJobSelection = (jobId) => {
    setSelectedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const downloadJobs = () => {
    const selectedJobData = jobs.filter(job => selectedJobs.includes(job.id));
    if (selectedJobData.length === 0) {
      alert('Please select jobs to download');
      return;
    }

    const csv = [
      ['Job Title', 'Company', 'Location', 'Link', 'Description'],
      ...selectedJobData.map(job => [
        job.title,
        job.company,
        job.location,
        job.link,
        job.description
      ])
    ];

    const csvContent = csv.map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jobs-${keyword}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="job-extraction-container">
      {/* Header */}
      <div className="job-extraction-header">
        <div className="job-extraction-content">
          <h1>🔍 Job Extractor</h1>
          <p>Search and extract job listings from multiple platforms</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="job-search-section">
        <div className="job-search-card">
          <div className="job-search-inputs">
            <div className="job-input-group">
              <label>Job Title / Role</label>
              <div className="job-input-wrapper">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="e.g. Full Stack Developer, Data Scientist..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>

            <div className="job-input-group">
              <label>Location (Optional)</label>
              <div className="job-input-wrapper">
                <MapPin size={18} />
                <input
                  type="text"
                  placeholder="e.g. Remote, New York, India..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>

            <button
              className="job-search-btn"
              onClick={searchJobs}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Search Jobs
                </>
              )}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="job-error-message"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="job-results-section">
        {jobs.length > 0 && (
          <div className="job-results-header">
            <div>
              <h2>Found {jobs.length} Jobs</h2>
              <p>Select jobs to download as CSV</p>
            </div>
            <button
              className="job-download-btn"
              onClick={downloadJobs}
              disabled={selectedJobs.length === 0}
            >
              <Download size={18} />
              Download Selected ({selectedJobs.length})
            </button>
          </div>
        )}

        <AnimatePresence>
          <div className="job-cards-grid">
            {jobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.05 }}
                className={`job-card ${selectedJobs.includes(job.id) ? 'selected' : ''}`}
                onClick={() => toggleJobSelection(job.id)}
              >
                <div className="job-card-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedJobs.includes(job.id)}
                    onChange={() => toggleJobSelection(job.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="job-card-content">
                  <div className="job-card-header">
                    <h3>{job.title}</h3>
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="job-card-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>

                  <p className="job-company">{job.company}</p>

                  <div className="job-card-meta">
                    <span className="job-location">
                      <MapPin size={14} />
                      {job.location}
                    </span>
                  </div>

                  <p className="job-description">{job.description}</p>

                  <div className="job-card-footer">
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="job-view-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Job →
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {!loading && jobs.length === 0 && !error && (
          <div className="job-empty-state">
            <div className="job-empty-icon">🔍</div>
            <h3>Start searching for jobs</h3>
            <p>Enter a job title and optionally a location to find relevant positions</p>
          </div>
        )}

        {loading && (
          <div className="job-loading-state">
            <div className="job-loader">
              <Loader2 size={40} className="spin" />
            </div>
            <p>Searching for jobs matching "{keyword}"...</p>
          </div>
        )}
      </div>
    </div>
  );
}

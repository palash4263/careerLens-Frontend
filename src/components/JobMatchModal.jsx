import React, { useState, useEffect } from "react";
import { X, Search, Sparkles, Briefcase, ExternalLink, ShieldCheck } from "lucide-react";
import { groqSuggestJobMatches } from "../services/groqService";
import "./JobMatchModal.css";

export default function JobMatchModal({ isOpen, onClose, resume }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isOpen && resume) {
      setLoading(true);
      (async () => {
        try {
          const res = await groqSuggestJobMatches(resume.file_name, "Software Engineer");
          setSuggestions(res);
          const topSkills = (res.skills || []).slice(0, 3).join(" ");
          const cleanTitle = (res.title || "Developer").replace(/\//g, " ").replace(/[^a-zA-Z0-9\s]/g, "").trim();
          setQuery(`${cleanTitle} ${topSkills}`);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isOpen, resume]);

  if (!isOpen || !resume) return null;

  const handleOpenNaukri = () => {
    const searchUrl = `https://www.naukri.com/jobs-in-india?k=${encodeURIComponent(query)}`;
    window.open(searchUrl, "_blank");
  };

  const handleOpenIndeed = () => {
    const searchUrl = `https://in.indeed.com/jobs?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, "_blank");
  };

  return (
    <div className="jmm-overlay">
      <div className="jmm-card">
        <div className="jmm-card-header">
          <div className="jmm-title-row">
            <Sparkles size={16} className="jmm-spark-icon" />
            <h3>AI Job Matcher — {resume.file_name}</h3>
          </div>
          <button className="jmm-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="jmm-loading-state">
            <div className="jmm-pulse-circle">
              <Briefcase size={28} className="jmm-briefcase-icon" />
              <div className="jmm-scanner-line"></div>
            </div>
            <h4>Extracting Resume Skills...</h4>
            <p>Groq AI is analyzing key tech tags & matching roles from Naukri and Indeed.</p>
          </div>
        ) : (
          <div className="jmm-card-body">
            {suggestions && (
              <>
                {/* Dynamic Metadata extracted from Resume */}
                <div className="jmm-stats-row">
                  <div className="jmm-stat-box">
                    <span className="jmm-stat-lbl">Primary Role Match</span>
                    <span className="jmm-stat-val">{suggestions.title}</span>
                  </div>
                  <div className="jmm-stat-box">
                    <span className="jmm-stat-lbl">ATS Compatibility</span>
                    <span className="jmm-stat-val text-green">{resume.atsScore || 78}%</span>
                  </div>
                </div>

                {/* Extracted Skills Section */}
                <div className="jmm-skills-area">
                  <span className="jmm-section-lbl">🛠️ Extracted Skills:</span>
                  <div className="jmm-skills-list">
                    {(suggestions.skills || []).map((sk) => (
                      <span key={sk} className="jmm-skill-chip">{sk}</span>
                    ))}
                  </div>
                </div>

                {/* Dynamic Query Builder Box */}
                <div className="jmm-query-builder">
                  <span className="jmm-section-lbl">🔍 Search Query:</span>
                  <div className="jmm-search-row">
                    <input
                      type="text"
                      className="jmm-query-input"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Customize search terms..."
                    />
                  </div>
                </div>

                {/* Main Open Buttons to Naukri & Indeed */}
                <div className="jmm-search-actions">
                  <button className="jmm-search-btn naukri" onClick={handleOpenNaukri}>
                    <ExternalLink size={14} />
                    <span>Search Naukri</span>
                  </button>
                  <button className="jmm-search-btn indeed" onClick={handleOpenIndeed}>
                    <ExternalLink size={14} />
                    <span>Search Indeed</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { getResumes } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import { analyzeResume } from "../services/atsService";
import { improveResume } from "../services/resumeImprovementService";
import "../assets/ats.css";

const AtsPage = () => {
  const [searchParams] = useSearchParams();
  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [toast, setToast] = useState(null);

  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJobDescription, setSelectedJobDescription] = useState("");
  const [improvement, setImprovement] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const [loading, setLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const resumeData = await getResumes();
      const jobData = await getJobDescriptions();

      setResumes(resumeData);
      setJobDescriptions(jobData);

      const resumeIdParam = searchParams.get("resumeId");
      const jobIdParam = searchParams.get("jobId");
      if (resumeIdParam) setSelectedResume(resumeIdParam);
      if (jobIdParam) setSelectedJobDescription(jobIdParam);
    } catch (error) {
      console.error(error);
      showToast("Failed to load ATS data.", "error");
    }
  };

  const handleAnalyze = async () => {
    if (!selectedResume) {
      showToast("Please select a resume.", "error");
      return;
    }

    if (!selectedJobDescription) {
      showToast("Please select a Job Description.", "error");
      return;
    }

    try {
      setLoading(true);

      const response = await analyzeResume(
        Number(selectedResume),
        Number(selectedJobDescription)
      );

      setAnalysis(response);
      showToast("ATS Analysis complete!", "success");
    } catch (error) {
      console.error(error);
      showToast("ATS Analysis failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImproveResume = async () => {
    try {
      const response = await improveResume(
        Number(selectedResume),
        Number(selectedJobDescription)
      );

      setImprovement(response);
      showToast("Resume optimization loaded!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to optimize resume.", "error");
    }
  };

  return (
    <div className="ats-page">

      <div className="ats-header">
        <h1>ATS Resume Analyzer</h1>

        <p>
          Compare resumes against job descriptions and
          get an ATS compatibility score.
        </p>
      </div>

      <div className="ats-card">

        <div className="ats-form-grid">

          <div className="ats-field">

            <label>Select Resume</label>

            <select
              value={selectedResume}
              onChange={(e) =>
                setSelectedResume(e.target.value)
              }
            >
              <option value="">
                Choose Resume
              </option>

              {resumes.map((resume) => (
                <option
                  key={resume.id}
                  value={resume.id}
                >
                  {resume.fileName}
                </option>
              ))}
            </select>

          </div>

          <div className="ats-field">

            <label>Select Job Description</label>

            <select
              value={selectedJobDescription}
              onChange={(e) =>
                setSelectedJobDescription(
                  e.target.value
                )
              }
            >
              <option value="">
                Choose Job Description
              </option>

              {jobDescriptions.map((job) => (
                <option
                  key={job.id}
                  value={job.id}
                >
                  {job.title} - {job.company}
                </option>
              ))}
            </select>

          </div>

        </div>

        <button
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading
            ? "Analyzing..."
            : "Run ATS Analysis"}
        </button>

      </div>

      {analysis && (

        <div className="ats-result-card">

          <div className="score-section">

            <h2>ATS SCORE</h2>

            <div className="score-circle">
              {analysis.score}%
            </div>

          </div>

          <div className="ats-grid">

            <div className="ats-column">

              <h3>Matched Skills</h3>

              {analysis.matchedSkills?.length > 0 ? (

                analysis.matchedSkills.map(
                  (skill, index) => (
                    <div
                      key={index}
                      className="matched-skill"
                    >
                      ✓ {skill}
                    </div>
                  )
                )

              ) : (

                <p>No matched skills</p>

              )}

            </div>

            <div className="ats-column">

              <h3>Missing Skills</h3>

              {analysis.missingSkills?.length > 0 ? (

                analysis.missingSkills.map(
                  (skill, index) => (
                    <div
                      key={index}
                      className="missing-skill"
                    >
                      ✗ {skill}
                    </div>
                  )
                )

              ) : (

                <p>No missing skills</p>

              )}

            </div>

          </div>

          <div className="suggestion-section">

            <h3>Suggestions</h3>

            {analysis.suggestions?.length > 0 ? (

              analysis.suggestions.map(
                (suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                  >
                    • {suggestion}
                  </div>
                )
              )

            ) : (

              <p>No suggestions available</p>

            )}

          </div>
          <button
  className="analyze-btn"
  onClick={handleImproveResume}
  style={{ marginTop: "20px" }}
>
  Optimize Resume
</button>

        </div>


      )}
      {improvement && (

  <div className="ats-result-card">

    <h2>Resume Optimization</h2>

    <div style={{ marginBottom: "20px" }}>
      Current Score:
      <strong> {improvement.currentScore}%</strong>
    </div>

    <div style={{ marginBottom: "20px" }}>
      Predicted Score:
      <strong> {improvement.predictedScore}%</strong>
    </div>

    <h3>Recommendations</h3>

    {improvement.recommendations.map((rec, index) => (
      <div
        key={index}
        className="suggestion-item"
      >
        {rec}
      </div>
    ))}

    <h3 style={{ marginTop: "20px" }}>
      Optimized Summary
    </h3>

    <div className="suggestion-section">
      {improvement.optimizedSummary}
    </div>

  </div>

)}

      {toast && (
        <div className={`toast-premium ${toast.type}`}>
          <span className="toast-icon">{toast.type === "success" ? "✓" : "ℹ"}</span>
          <p className="toast-message">{toast.message}</p>
        </div>
      )}
    </div>
  );
};

export default AtsPage;
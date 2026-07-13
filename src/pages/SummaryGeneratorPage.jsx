// Reading this as: landing page for job seekers and recruiters, with a clean B2B/consumer hybrid language, leaning toward custom glassy overlays + phosphor/radix icons.
// DESIGN_VARIANCE: 8 | MOTION_INTENSITY: 6 | VISUAL_DENSITY: 4

import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Sparkles, 
  UploadCloud, 
  Copy, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  FileCheck, 
  ChevronRight,
  Sparkle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axiosConfig";
import { uploadResume } from "../services/resumeService";
import { optimizeSection } from "../services/resumeOptimizationService";
import "../assets/SummaryGenerator.css";

export default function SummaryGeneratorPage() {
  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  
  // Selection States
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [customJobDescription, setCustomJobDescription] = useState("");
  
  // File Upload States
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Output and UI States
  const [generating, setGenerating] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loaderSubtext, setLoaderSubtext] = useState("Analyzing resume content...");
  
  const fileInputRef = useRef(null);

  // Trigger brief visual toasts
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load user data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resumesRes, jobsRes] = await Promise.all([
          api.get("/resumes"),
          api.get("/job-descriptions")
        ]);
        
        setResumes(resumesRes.data);
        setJobDescriptions(jobsRes.data);
        
        if (resumesRes.data.length > 0) {
          setSelectedResumeId(resumesRes.data[0].id);
        }
        if (jobsRes.data.length > 0) {
          setSelectedJobId(jobsRes.data[0].id);
          setCustomJobDescription(jobsRes.data[0].description || "");
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
        setError("Could not load resumes or job descriptions. Please refresh.");
      }
    };
    fetchData();
  }, []);

  // Sync custom job description when select box changes
  const handleJobSelectChange = (e) => {
    const jobId = e.target.value;
    setSelectedJobId(jobId);
    if (jobId === "custom") {
      setCustomJobDescription("");
    } else {
      const selectedJob = jobDescriptions.find(j => j.id === Number(jobId));
      setCustomJobDescription(selectedJob ? selectedJob.description : "");
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileUploadProcess(files[0]);
    }
  };

  const handleFileBrowseClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUploadProcess(files[0]);
    }
  };

  const handleFileUploadProcess = async (file) => {
    if (file.type !== "application/pdf") {
      showToast("Only PDF files are supported!");
      return;
    }
    
    setUploadedFile(file);
    try {
      setUploading(true);
      const uploadedData = await uploadResume(file);
      showToast("Resume parsed and saved!");
      
      // Refresh list and auto-select new resume
      const resumesRes = await api.get("/resumes");
      setResumes(resumesRes.data);
      const newResume = resumesRes.data.find(r => r.file_name === file.name) || resumesRes.data[0];
      if (newResume) {
        setSelectedResumeId(newResume.id);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to upload and parse resume file");
    } finally {
      setUploading(false);
    }
  };

  // Trigger main AI summary generation API call
  const handleGenerateSummary = async (toneInstruction = "") => {
    if (!selectedResumeId) {
      showToast("Please upload or select a resume first");
      return;
    }
    if (!customJobDescription.trim()) {
      showToast("Please enter a job description to target");
      return;
    }

    setGenerating(true);
    setError(null);
    setLoaderSubtext("Uploading context and aligning keywords...");

    // Dynamic loader subtitle updates for premium micro-animations feedback
    const steps = [
      "Analyzing resume sections...",
      "Mapping job description target skills...",
      "Synthesizing customized summary elevator pitch...",
      "Finalizing tone adjustments..."
    ];
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setLoaderSubtext(steps[stepIdx]);
        stepIdx++;
      }
    }, 1500);

    try {
      // Find or create temporary job description ID to feed to optimizeSection
      let jobIdToUse = selectedJobId;
      
      if (selectedJobId === "custom" || !selectedJobId) {
        // Create custom job description record so backend optimization has a reference
        const createJobRes = await api.post("/job-descriptions", {
          title: "Target Role",
          company: "Target Company",
          description: customJobDescription
        });
        jobIdToUse = createJobRes.data.id;
        // Sync lists
        const jobsRes = await api.get("/job-descriptions");
        setJobDescriptions(jobsRes.data);
        setSelectedJobId(jobIdToUse);
      }

      const promptText = toneInstruction 
        ? `Write a professional 3-4 sentence resume summary statement. Custom instruction: ${toneInstruction}`
        : "Write a professional 3-4 sentence resume summary statement highlighting key matching skills.";

      const response = await optimizeSection(
        selectedResumeId,
        "Summary",
        jobIdToUse,
        promptText
      );

      setGeneratedSummary(response.optimizedText || response.text || "");
      showToast("Tailored summary generated successfully!");
    } catch (err) {
      console.error(err);
      setError("AI generation failed. Please check your network and try again.");
    } finally {
      clearInterval(interval);
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedSummary);
      showToast("Summary copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  // Clear selections to start over
  const resetForm = () => {
    setGeneratedSummary("");
    setUploadedFile(null);
    setCustomJobDescription("");
    setSelectedJobId("custom");
  };

  return (
    <div className="sumgen-root">
      <div className="sumgen-bg-glow" />
      
      <div className="sumgen-container">
        
        {/* Left Column: Title & Info */}
        <motion.div 
          className="sumgen-hero"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="sumgen-badge">
            <Sparkle size={12} fill="#a78bfa" />
            <span>Resume Summary Generator</span>
          </div>
          
          <h1 className="sumgen-title">
            Create a job-specific <span className="sumgen-title-gradient">resume summary</span>
          </h1>
          
          <p className="sumgen-subtitle">
            Generate an elevator pitch that highlights your core strengths and aligns perfectly with recruiters' target job description.
          </p>
          
          <div className="sumgen-features">
            <div className="sumgen-feature-item">
              <span className="sumgen-feature-icon">✓</span>
              <span>Personalized by AI</span>
            </div>
            <div className="sumgen-feature-item">
              <span className="sumgen-feature-icon">✓</span>
              <span>Smart Content Match</span>
            </div>
            <div className="sumgen-feature-item">
              <span className="sumgen-feature-icon">✓</span>
              <span>Improve Existing Tone</span>
            </div>
            <div className="sumgen-feature-item">
              <span className="sumgen-feature-icon">✓</span>
              <span>Recruiter Approved</span>
            </div>
          </div>
        </motion.div>
        
        {/* Right Column: Interaction Card Widget */}
        <motion.div 
          className="sumgen-widget-wrapper"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="sumgen-glow-box" />
          
          <div className="sumgen-card">
            
            {/* Visual Pointing Cue (Arrow illustration pointing to dragzone) */}
            {!selectedResumeId && !uploadedFile && (
              <div className="sumgen-pointer">
                <span className="sumgen-pointer-text">Start here!</span>
                <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                  <path 
                    d="M10 20 C 30 10, 60 15, 75 45 C 78 52, 65 60, 58 52 C 55 48, 62 38, 70 34" 
                    stroke="#10b981" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeDasharray="4 4"
                  />
                  <polygon points="75,45 80,33 65,42" fill="#10b981" />
                </svg>
              </div>
            )}
            
            {/* Card Header */}
            <div className="sumgen-card-header">
              <div className="sumgen-header-icon-container">
                <FileText size={20} />
              </div>
              <div className="sumgen-header-text">
                <h3>Resume Summary Generator</h3>
                <p>Upload resume & paste job ad</p>
              </div>
            </div>

            {/* Main Interactive Forms (Overlay Loader triggers on generating) */}
            <AnimatePresence>
              {generating && (
                <motion.div 
                  className="sumgen-loader-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="sumgen-spinner" />
                  <span className="sumgen-loader-text">AI is tailoring your summary</span>
                  <span className="sumgen-loader-sub">{loaderSubtext}</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Output Presentation Screen */}
            {generatedSummary ? (
              <motion.div 
                className="sumgen-result-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="sumgen-result-header">
                  <h4>Your AI Summary</h4>
                  <button className="sumgen-btn-secondary" onClick={resetForm}>
                    <RefreshCw size={12} /> Start Over
                  </button>
                </div>
                
                <div className="sumgen-result-box">
                  {generatedSummary}
                </div>
                
                <div className="sumgen-result-actions">
                  <button className="sumgen-btn-secondary" onClick={copyToClipboard}>
                    <Copy size={14} /> Copy Summary
                  </button>
                </div>

                {/* Tone Adjustments panel */}
                <div className="sumgen-tone-container">
                  <span className="sumgen-tone-title">Adjust tone / focus</span>
                  <div className="sumgen-tone-grid">
                    <button 
                      className="sumgen-tone-chip"
                      onClick={() => handleGenerateSummary("make it sound more senior and leader-focused")}
                    >
                      💼 Executive Tone
                    </button>
                    <button 
                      className="sumgen-tone-chip"
                      onClick={() => handleGenerateSummary("emphasize core technical frameworks, programming languages, and SDE methodologies")}
                    >
                      ⚡ More Technical
                    </button>
                    <button 
                      className="sumgen-tone-chip"
                      onClick={() => handleGenerateSummary("add measurable results, percentage increases, and metric-based accomplishments")}
                    >
                      📊 Add Metrics
                    </button>
                    <button 
                      className="sumgen-tone-chip"
                      onClick={() => handleGenerateSummary("keep it ultra-concise, conversational, and direct")}
                    >
                      🎯 Muted / Concise
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              // Inputs Screen
              <div>
                
                {/* 1. Drag & Drop or Select Resume */}
                <div className="sumgen-form-group">
                  <span className="sumgen-label">1. Choose Resume Source</span>
                  
                  {resumes.length > 0 && (
                    <select 
                      className="sumgen-select" 
                      value={selectedResumeId} 
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      style={{ marginBottom: '10px' }}
                    >
                      {resumes.map(r => (
                        <option key={r.id} value={r.id}>
                          📂 {r.file_name} (Saved)
                        </option>
                      ))}
                    </select>
                  )}
                  
                  <div 
                    className={`sumgen-dropzone ${isDragging ? "dragging" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleFileBrowseClick}
                  >
                    <UploadCloud size={24} className="sumgen-dropzone-icon" />
                    <span className="sumgen-dropzone-text">Click to upload or drag & drop</span>
                    <span className="sumgen-dropzone-subtext">PDF only</span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      style={{ display: "none" }}
                      accept=".pdf" 
                    />
                  </div>
                  
                  {uploadedFile && (
                    <div className="sumgen-file-selected">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileCheck size={14} /> {uploadedFile.name}
                      </span>
                      <button onClick={() => setUploadedFile(null)}>×</button>
                    </div>
                  )}
                </div>

                {/* 2. Paste Target Job Description */}
                <div className="sumgen-form-group">
                  <span className="sumgen-label">2. Target Job Description</span>
                  
                  {jobDescriptions.length > 0 && (
                    <select 
                      className="sumgen-select" 
                      value={selectedJobId} 
                      onChange={handleJobSelectChange}
                      style={{ marginBottom: '10px' }}
                    >
                      {jobDescriptions.map(j => (
                        <option key={j.id} value={j.id}>
                          🎯 {j.company} - {j.title}
                        </option>
                      ))}
                      <option value="custom">✍️ Paste Custom Job Description...</option>
                    </select>
                  )}
                  
                  <textarea
                    className="sumgen-textarea"
                    placeholder="Paste the job requirements here so we can tailor the summary..."
                    value={customJobDescription}
                    onChange={(e) => setCustomJobDescription(e.target.value)}
                  />
                </div>

                {/* Action Submit button */}
                <motion.button 
                  className="sumgen-btn-primary"
                  onClick={() => handleGenerateSummary()}
                  disabled={!selectedResumeId || !customJobDescription.trim() || uploading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Generate Summary</span>
                  <ArrowRight size={16} />
                </motion.button>
              </div>
            )}
            
            {/* Inline validation errors */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#ef4444', fontSize: '0.8rem' }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
            
          </div>
        </motion.div>
      </div>

      {/* Floating interactive toast notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            className="sumgen-toast"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            <CheckCircle size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

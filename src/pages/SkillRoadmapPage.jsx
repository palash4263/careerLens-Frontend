import React, { useState, useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Map, Target, Briefcase, ChevronRight, ChevronDown, BookOpen, CheckCircle2, Circle, Download, RotateCcw, FileText, Brain, Zap, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { getResumes } from '../services/resumeService';
import { extractSkillsFromResume, generateSkillRoadmap } from '../services/groqService';
import SubNav from '../components/common/SubNav';
import '../assets/skillRoadmap.css';
import CtaFooter from '../components/CtaFooter';

// Enhanced Markdown renderer with beautiful visual blocks
const SimpleMarkdown = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  let phaseCount = 0;

  return (
    <div className="roadmap-markdown">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) return <h1 key={idx} className="rm-h1"><span className="rm-icon">🚀</span> {trimmed.substring(2).replace(/\*/g, '')}</h1>;
        if (trimmed.startsWith('## ')) {
            phaseCount++;
            return <h2 key={idx} className="rm-h2"><span className="rm-step-badge">Phase {phaseCount}</span> {trimmed.substring(3).replace(/\*/g, '')}</h2>;
        }
        if (trimmed.startsWith('### ')) return <h3 key={idx} className="rm-h3">{trimmed.substring(4).replace(/\*/g, '')}</h3>;
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2);
          const parts = content.split(/(\*\*.*?\*\*)/g);
          return (
            <li key={idx} className="rm-li">
              <div className="rm-li-dot"></div>
              <div>
                {parts.map((part, i) => 
                  part.startsWith('**') && part.endsWith('**') 
                    ? <strong key={i} className="rm-strong">{part.slice(2, -2)}</strong> 
                    : part
                )}
              </div>
            </li>
          );
        }
        if (trimmed.includes('**')) {
           const parts = trimmed.split(/(\*\*.*?\*\*)/g);
           return (
             <p key={idx} className="rm-p">
               {parts.map((part, i) => 
                 part.startsWith('**') && part.endsWith('**') 
                   ? <strong key={i} className="rm-strong">{part.slice(2, -2)}</strong> 
                   : part
               )}
             </p>
           );
        }
        if (trimmed === '') return <div key={idx} className="rm-spacer" />;
        return <p key={idx} className="rm-p">{trimmed}</p>;
      })}
    </div>
  );
};

export default function SkillRoadmapPage() {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  
  const [skills, setSkills] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [roadmap, setRoadmap] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (resumes.length > 0) {
      animate('.resume-select-btn', {
        translateX: [-30, 0],
        opacity: [0, 1],
        delay: stagger(100),
        easing: 'easeOutExpo',
        duration: 800
      });
    }
  }, [resumes]);

  useEffect(() => {
    if (skills.length > 0) {
      animate('.skill-pill', {
        scale: [0, 1],
        opacity: [0, 1],
        delay: stagger(50),
        easing: 'easeOutElastic(1, .6)',
        duration: 800
      });
    }
  }, [skills]);

  useEffect(() => {
    // Update current step based on progress
    if (selectedSkill && roadmap) {
      setCurrentStep(4);
    } else if (selectedSkill) {
      setCurrentStep(3);
    } else if (skills.length > 0) {
      setCurrentStep(2);
    } else if (selectedResume) {
      setCurrentStep(1);
    } else {
      setCurrentStep(1);
    }
  }, [selectedResume, skills, selectedSkill, roadmap]);

  const fetchResumes = async () => {
    try {
      const data = await getResumes();
      setResumes(data || []);
    } catch (e) {
      console.error("Failed to fetch resumes:", e);
    }
  };

  const handleResumeSelect = async (resume, e) => {
    if (e && e.currentTarget) {
      animate(e.currentTarget, {
        scale: [1, 0.95, 1],
        duration: 400,
        easing: 'easeInOutQuad'
      });
    }

    setSelectedResume(resume);
    setSkills([]);
    setRoadmap("");
    setSelectedSkill(null);
    setIsExtracting(true);
    
    try {
      const extractedSkills = await extractSkillsFromResume(resume.extracted_text || resume.original_text || "");
      setSkills(extractedSkills || []);
    } catch (err) {
      console.error("Failed to extract skills:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSkillSelect = async (skill) => {
    setSelectedSkill(skill);
    setRoadmap("");
    setIsGenerating(true);
    
    try {
      const result = await generateSkillRoadmap(skill, selectedResume?.extracted_text || "");
      setRoadmap(result);
    } catch (e) {
      console.error("Failed to generate roadmap:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setSelectedResume(null);
    setSkills([]);
    setSelectedSkill(null);
    setRoadmap("");
    setCurrentStep(1);
  };

  const steps = [
    { number: 1, title: "Select Resume", icon: <Briefcase size={18} /> },
    { number: 2, title: "Choose Skill", icon: <Target size={18} /> },
    { number: 3, title: "Generate Path", icon: <Zap size={18} /> },
    { number: 4, title: "View Roadmap", icon: <Map size={18} /> }
  ];

  return (
    <div className="roadmap-page">
      <div className="roadmap-container">
        <SubNav type="career" />
        {/* Enhanced Header */}
        <div className="roadmap-header">
          <motion.div
            className="roadmap-header-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Brain size={16} />
            <span>AI-Powered Learning Path Generator</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            AI Skill Roadmap
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Extract skills from your resume and generate a customized path to mastery with our intelligent AI assistant.
          </motion.p>
        </div>

        {/* Progress Steps Indicator */}
        <motion.div 
          className="roadmap-steps-indicator"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {steps.map((step, idx) => (
            <React.Fragment key={step.number}>
              <div className={`roadmap-step-item ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}>
                <div className="roadmap-step-icon">
                  {currentStep > step.number ? <CheckCircle2 size={20} /> : step.icon}
                </div>
                <span className="roadmap-step-title">{step.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`roadmap-step-connector ${currentStep > step.number ? 'active' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </motion.div>

        {/* Step 1: Select Resume */}
        <motion.div 
          className="glass-card roadmap-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="roadmap-card-header">
            <div className="roadmap-card-icon" style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)' }}>
              <Briefcase size={20} color="#fff" />
            </div>
            <div>
              <h2>Select Resume Profile</h2>
              <p className="roadmap-card-subtitle">Choose the resume you want to analyze</p>
            </div>
          </div>

          {resumes.length === 0 ? (
            <div className="roadmap-empty-state">
              <div className="roadmap-empty-icon">📄</div>
              <h3>No Resumes Found</h3>
              <p>Upload a resume to get started with your personalized learning roadmap</p>
            </div>
          ) : (
            <div className="custom-dropdown" ref={dropdownRef}>
              <button
                className={`resume-select-btn ${selectedResume ? 'selected' : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="resume-select-btn-content">
                  <div className="resume-select-btn-icon">
                    <FileText size={18} />
                  </div>
                  <div className="resume-select-btn-text">
                    <span className="resume-select-btn-label">Selected Resume</span>
                    <span className="resume-select-btn-value">{selectedResume ? (selectedResume.file_name || selectedResume.filename) : "Choose a resume..."}</span>
                  </div>
                </div>
                <ChevronDown size={18} className={`resume-select-chevron ${isDropdownOpen ? 'open' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    className="dropdown-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {resumes.map(r => (
                      <button
                        key={r.id}
                        className="dropdown-menu-item"
                        onClick={(e) => {
                          setIsDropdownOpen(false);
                          handleResumeSelect(r, e);
                        }}
                      >
                        <FileText size={16} />
                        <span>{r.file_name || r.filename || "Resume Profile"}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Step 2: Extracted Skills */}
        <AnimatePresence>
          {selectedResume && (
            <motion.div 
              className="glass-card roadmap-card"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="roadmap-card-header">
                <div className="roadmap-card-icon" style={{ background: 'linear-gradient(135deg, #a855f7, #c084fc)' }}>
                  <Target size={20} color="#fff" />
                </div>
                <div>
                  <h2>Extracted Core Skills</h2>
                  <p className="roadmap-card-subtitle">Select a skill to generate your learning path</p>
                </div>
              </div>
              
              {isExtracting ? (
                <div className="roadmap-loading">
                  <div className="roadmap-loading-spinner">
                    <div className="spinner"></div>
                    <div className="roadmap-loading-pulse"></div>
                  </div>
                  <h3>Analyzing Your Resume</h3>
                  <p>Our AI is extracting your core skills...</p>
                </div>
              ) : skills.length > 0 ? (
                <>
                  <div className="skills-grid">
                    {skills.map((skill, idx) => (
                      <button
                        key={idx}
                        className={`skill-pill ${selectedSkill === skill ? 'selected' : ''}`}
                        onClick={() => handleSkillSelect(skill)}
                      >
                        <span className="skill-pill-icon">
                          {selectedSkill === skill ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        </span>
                        {skill}
                      </button>
                    ))}
                  </div>
                  {selectedSkill && (
                    <motion.div 
                      className="skill-selected-banner"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Sparkles size={16} />
                      <span>Generating roadmap for <strong>{selectedSkill}</strong>...</span>
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="roadmap-empty-state">
                  <div className="roadmap-empty-icon">⚠️</div>
                  <h3>No Skills Detected</h3>
                  <p>We couldn't extract skills from this resume. Try uploading a different resume.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Roadmap Generation */}
        <AnimatePresence>
          {selectedSkill && (
            <motion.div 
              className="glass-card roadmap-card roadmap-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="roadmap-card-header">
                <div className="roadmap-card-icon" style={{ background: 'linear-gradient(135deg, #34d399, #4ade80)' }}>
                  <Map size={20} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <h2>Your Roadmap for {selectedSkill}</h2>
                  <p className="roadmap-card-subtitle">A personalized learning path crafted by AI</p>
                </div>
                {roadmap && !isGenerating && (
                  <button className="roadmap-action-btn" onClick={handleReset} title="Start Over">
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
              
              {isGenerating ? (
                <div className="roadmap-loading">
                  <div className="roadmap-loading-spinner">
                    <div className="spinner" style={{ borderTopColor: '#34d399' }}></div>
                    <div className="roadmap-loading-pulse"></div>
                  </div>
                  <h3>Crafting Your Learning Path</h3>
                  <p>Structuring a customized roadmap for {selectedSkill}...</p>
                  <div className="roadmap-loading-steps">
                    <div className="roadmap-loading-step active">
                      <TrendingUp size={16} />
                      <span>Analyzing current level</span>
                    </div>
                    <div className="roadmap-loading-step">
                      <BookOpen size={16} />
                      <span>Curating resources</span>
                    </div>
                    <div className="roadmap-loading-step">
                      <Award size={16} />
                      <span>Building milestones</span>
                    </div>
                  </div>
                </div>
              ) : roadmap ? (
                <div className="roadmap-content">
                  <SimpleMarkdown text={roadmap} />
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <CtaFooter />
    </div>
  );
}

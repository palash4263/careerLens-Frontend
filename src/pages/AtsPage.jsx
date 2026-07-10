// src/pages/AtsPage.jsx - Clean ATS Score Page with 3D
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Ring, Float, MeshDistortMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";

import { getResumes } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import { analyzeResume } from "../services/atsService";
import { improveResume } from "../services/resumeImprovementService";
import "../assets/ats.css";

// ====== 3D SCORE SPHERE COMPONENT ======
function ScoreSphere({ score }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      meshRef.current.rotation.y += 0.005;
    }
  });

  const getColor = () => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getStatus = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  return (
    <group>
      <Float
        speed={1.5}
        rotationIntensity={0.5}
        floatIntensity={0.5}
      >
        <mesh
          ref={meshRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[2, 64, 64]} />
          <MeshDistortMaterial
            color={getColor()}
            distort={0.3}
            speed={1.5}
            roughness={0.2}
            metalness={0.8}
            opacity={0.95}
            transparent
          />
        </mesh>
      </Float>
      
      <Ring
        args={[2.2, 2.6, 64]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial
          color={getColor()}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </Ring>
      
      <ParticleOrbit color={getColor()} />
      
      <Float
        speed={2}
        rotationIntensity={0}
        floatIntensity={1}
        position={[0, 3.2, 0]}
      >
        <SpriteLabel text={`${score}%`} color="#ffffff" size={1.5} />
      </Float>
      
      <Float
        speed={1.5}
        rotationIntensity={0}
        floatIntensity={0.8}
        position={[0, -3.2, 0]}
      >
        <SpriteLabel text={getStatus()} color={getColor()} size={0.7} />
      </Float>
    </group>
  );
}

// ====== SPRITE LABEL COMPONENT ======
function SpriteLabel({ text, color, size }) {
  const canvas = useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'Bold 60px Inter, sans-serif';
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.fillStyle = color;
    ctx.fillText(text, canvas.width/2, canvas.height/2);
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, canvas.width/2, canvas.height/2);
    
    return canvas;
  }, [text, color]);

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [canvas]);

  return (
    <sprite>
      <spriteMaterial map={texture} transparent opacity={0.95} />
    </sprite>
  );
}

// ====== PARTICLE ORBIT COMPONENT ======
function ParticleOrbit({ color }) {
  const particlesRef = useRef();
  const count = 50;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 3 + Math.random() * 1.5;
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.002;
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.08}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ====== SCENE BACKGROUND COMPONENT ======
function SceneBackground() {
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color('#0A0A0F');
    scene.fog = new THREE.Fog('#0A0A0F', 8, 15);
  }, [scene]);

  return null;
}

// ====== SKILLS VISUALIZATION ======
function SkillsVisualization({ skills, type }) {
  const color = type === 'matched' ? '#10b981' : '#ef4444';

  if (!skills || skills.length === 0) return null;

  const displaySkills = skills.slice(0, 6);

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {displaySkills.map((skill, index) => {
          const angle = (index / displaySkills.length) * Math.PI * 2;
          const radius = 3 + Math.random() * 0.5;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = (Math.random() - 0.5) * 2;

          return (
            <Float
              key={index}
              speed={1 + Math.random() * 0.5}
              rotationIntensity={0.3}
              floatIntensity={0.5 + Math.random() * 0.3}
              position={[x, y, z]}
            >
              <SpriteLabel text={skill} color={color} size={0.4} />
            </Float>
          );
        })}
      </group>
    </Float>
  );
}

// ====== MAIN COMPONENT ======
const getMostRecentJobDescription = (jobs) => {
  if (!jobs || jobs.length === 0) return null;

  const getTimestamp = (job) => {
    const dateValue = job.createdAt || job.postedAt || job.updatedAt || job.uploadedAt;
    const parsed = dateValue ? new Date(dateValue).getTime() : NaN;
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  return [...jobs].sort((a, b) => getTimestamp(b) - getTimestamp(a))[0];
};

export default function AtsPage() {
  const [searchParams] = useSearchParams();
  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [toast, setToast] = useState(null);

  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJobDescription, setSelectedJobDescription] = useState("");
  const [autoSelectedJobId, setAutoSelectedJobId] = useState(null);
  const [improvement, setImprovement] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('analysis');

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

      if (resumeIdParam) {
        setSelectedResume(resumeIdParam);
      }

      if (jobIdParam) {
        setSelectedJobDescription(jobIdParam);
      } else {
        const mostRecent = getMostRecentJobDescription(jobData);
        if (mostRecent) {
          setSelectedJobDescription(String(mostRecent.id));
          setAutoSelectedJobId(mostRecent.id);
        }
      }
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
      setActiveView('optimization');
      showToast("Resume optimization loaded!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to optimize resume.", "error");
    }
  };

  return (
    <div className="ats-page-premium">
      {/* 3D Background Scene */}
      <div className="ats-3d-background">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <SceneBackground />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7C3AED" />
          <Environment preset="night" />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={0.8}
          />
          
          {analysis && (
            <>
              <ScoreSphere score={analysis.score} />
              
              {analysis.matchedSkills?.length > 0 && (
                <SkillsVisualization 
                  skills={analysis.matchedSkills.slice(0, 6)} 
                  type="matched" 
                />
              )}
              {analysis.missingSkills?.length > 0 && (
                <SkillsVisualization 
                  skills={analysis.missingSkills.slice(0, 6)} 
                  type="missing" 
                />
              )}
            </>
          )}
        </Canvas>
      </div>

      {/* Overlay Content */}
      <div className="ats-content-overlay">
        {/* Header */}
        <motion.div 
          className="ats-header-premium"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="ats-header-badge">
            <span className="badge-dot"></span>
            AI-Powered ATS Analysis
          </div>
          <h1 className="ats-header-title">
            Resume <span className="gradient-text">Intelligence</span>
          </h1>
          <p className="ats-header-sub">
            Compare resumes against job descriptions and get an ATS compatibility score
          </p>
        </motion.div>

        {/* Control Panel */}
        <motion.div 
          className="ats-control-panel"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="ats-control-grid">
            <div className="ats-field-premium">
              <label>
                <span className="field-icon">📄</span>
                Resume
              </label>
              <select
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className={`ats-select ${selectedResume ? 'has-value' : ''}`}
              >
                <option value="">Choose Resume</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.fileName || resume.file_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="ats-field-premium">
              <label>
                <span className="field-icon">🎯</span>
                Job Description
                {autoSelectedJobId && String(autoSelectedJobId) === selectedJobDescription && (
                  <span className="auto-badge">Auto-selected</span>
                )}
              </label>
              <select
                value={selectedJobDescription}
                onChange={(e) => {
                  setSelectedJobDescription(e.target.value);
                  setAutoSelectedJobId(null);
                }}
                className={`ats-select ${selectedJobDescription ? 'has-value' : ''}`}
              >
                <option value="">Choose Job Description</option>
                {jobDescriptions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.company}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ats-control-actions">
            <motion.button
              className="ats-btn-primary"
              onClick={handleAnalyze}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span className="btn-icon">⚡</span>
                  Run ATS Analysis
                </>
              )}
            </motion.button>

            {analysis && (
              <motion.button
                className="ats-btn-secondary"
                onClick={handleImproveResume}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="btn-icon">✨</span>
                Optimize Resume
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {analysis && (
            <motion.div 
              className="ats-results-premium"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              <div className="ats-score-overview">
                <div className="ats-score-card">
                  <span className="score-label">ATS Score</span>
                  <span className="score-value">{analysis.score}%</span>
                  <div className="score-bar">
                    <div className="score-bar-fill" style={{ width: `${analysis.score}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="ats-skills-grid">
                <div className="ats-skills-card matched">
                  <h3>✅ Matched Skills</h3>
                  <div className="skills-list">
                    {analysis.matchedSkills?.length > 0 ? (
                      analysis.matchedSkills.map((skill, index) => (
                        <motion.span 
                          key={index} 
                          className="skill-tag matched"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {skill}
                        </motion.span>
                      ))
                    ) : (
                      <p className="empty-text">No matched skills</p>
                    )}
                  </div>
                </div>

                <div className="ats-skills-card missing">
                  <h3>❌ Missing Skills</h3>
                  <div className="skills-list">
                    {analysis.missingSkills?.length > 0 ? (
                      analysis.missingSkills.map((skill, index) => (
                        <motion.span 
                          key={index} 
                          className="skill-tag missing"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {skill}
                        </motion.span>
                      ))
                    ) : (
                      <p className="empty-text">No missing skills</p>
                    )}
                  </div>
                </div>
              </div>

              {analysis.suggestions?.length > 0 && (
                <div className="ats-suggestions">
                  <h3>💡 Suggestions</h3>
                  <div className="suggestions-list">
                    {analysis.suggestions.map((suggestion, index) => (
                      <motion.div 
                        key={index} 
                        className="suggestion-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className="suggestion-bullet">•</span>
                        {suggestion}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optimization Results */}
        <AnimatePresence>
          {improvement && activeView === 'optimization' && (
            <motion.div 
              className="ats-optimization-premium"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              <div className="optimization-header">
                <h2>✨ Resume Optimization</h2>
                <div className="optimization-scores">
                  <div className="score-compare">
                    <span className="score-label">Current</span>
                    <span className="score-value old">{improvement.currentScore}%</span>
                  </div>
                  <div className="score-arrow">→</div>
                  <div className="score-compare">
                    <span className="score-label">Predicted</span>
                    <span className="score-value new">{improvement.predictedScore}%</span>
                  </div>
                </div>
              </div>

              <div className="optimization-recommendations">
                <h3>Recommendations</h3>
                {improvement.recommendations?.map((rec, index) => (
                  <motion.div 
                    key={index} 
                    className="optimization-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="rec-check">✓</span>
                    {rec}
                  </motion.div>
                ))}
              </div>

              {improvement.optimizedSummary && (
                <div className="optimization-summary">
                  <h3>Optimized Summary</h3>
                  <p>{improvement.optimizedSummary}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast-premium ${toast.type}`}>
          <span className="toast-icon">{toast.type === "success" ? "✓" : "ℹ"}</span>
          <p className="toast-message">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
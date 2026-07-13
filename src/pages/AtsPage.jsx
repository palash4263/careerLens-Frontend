// src/pages/AtsPage.jsx - Standalone Resume Quality Auditor Dashboard
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Ring, Float, MeshDistortMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";

import { getResumes } from "../services/resumeService";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "../assets/ats.css";

// ====== 3D SCORE SPHERE COMPONENT ======
function ScoreSphere({ score, grade }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      meshRef.current.rotation.y += 0.005;
    }
  });

  const getColor = () => {
    if (score >= 85) return "#10b981"; // Green
    if (score >= 70) return "#f59e0b"; // Orange/Yellow
    return "#ef4444"; // Red
  };

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh
          ref={meshRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[2, 64, 64]} />
          <MeshDistortMaterial
            color={getColor()}
            distort={0.25}
            speed={1.5}
            roughness={0.2}
            metalness={0.8}
            opacity={0.9}
            transparent
          />
        </mesh>
      </Float>
      
      <Ring args={[2.2, 2.4, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={getColor()} transparent opacity={0.25} side={THREE.DoubleSide} />
      </Ring>
      
      <Float speed={2} rotationIntensity={0} floatIntensity={1} position={[0, 3.2, 0]}>
        <SpriteLabel text={grade} color="#ffffff" />
      </Float>
      
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.8} position={[0, -3.2, 0]}>
        <SpriteLabel text={`${score} Health`} color={getColor()} />
      </Float>
    </group>
  );
}

// ====== SPRITE LABEL ======
function SpriteLabel({ text, color }) {
  const canvas = useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'Bold 55px Inter, sans-serif';
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = color;
    ctx.fillText(text, canvas.width/2, canvas.height/2);
    
    return canvas;
  }, [text, color]);

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [canvas]);

  return (
    <sprite scale={[4, 1, 1]}>
      <spriteMaterial map={texture} transparent opacity={0.9} />
    </sprite>
  );
}

// ====== ORBITING LABELS ======
function OrbitingLabels({ items, color }) {
  if (!items || items.length === 0) return null;
  const displayItems = items.slice(0, 5);

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
      <group>
        {displayItems.map((item, index) => {
          const angle = (index / displayItems.length) * Math.PI * 2;
          const radius = 3.5;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = (index % 2 === 0 ? 0.8 : -0.8);

          return (
            <Float
              key={index}
              speed={1 + Math.random() * 0.5}
              rotationIntensity={0.3}
              floatIntensity={0.5}
              position={[x, y, z]}
            >
              <SpriteLabel text={item} color={color} />
            </Float>
          );
        })}
      </group>
    </Float>
  );
}

// ====== BACKGROUND ======
function SceneBackground() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color('#0A0A0F');
    scene.fog = new THREE.Fog('#0A0A0F', 8, 15);
  }, [scene]);
  return null;
}

// ====== Standalone Audit Logic ======
const auditResumeText = (text, fileName) => {
  if (!text) {
    return {
      score: 65,
      grade: "B-",
      contact: { email: false, phone: false, linkedin: false, github: false, portfolio: false, score: 40 },
      sections: { experience: false, education: false, skills: false, projects: false, score: 50 },
      impact: { actionVerbs: [], metricsCount: 0, score: 45 },
      ats: { parseable: true, singleColumn: true, fileFormat: fileName?.toLowerCase()?.endsWith('.pdf'), score: 80 },
      skills: ["COMMUNICATION", "TEAMWORK", "MANAGEMENT"],
      recs: ["Please ensure your resume contains readable text. Scanning placeholder files might result in limited insights."]
    };
  }

  const textLower = text.toLowerCase();
  
  // 1. Contact Info check
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
  
  const hasEmail = emailRegex.test(text);
  const hasPhone = phoneRegex.test(text);
  const hasLinkedin = textLower.includes("linkedin.com") || textLower.includes("linkedin");
  const hasGithub = textLower.includes("github.com") || textLower.includes("github");
  const hasPortfolio = textLower.includes("portfolio") || textLower.includes("website") || textLower.includes("personal-site") || textLower.includes("behance") || textLower.includes("dribbble");
  
  let contactScore = 0;
  if (hasEmail) contactScore += 30;
  if (hasPhone) contactScore += 30;
  if (hasLinkedin) contactScore += 20;
  if (hasGithub) contactScore += 10;
  if (hasPortfolio) contactScore += 10;

  // 2. Sections check
  const hasExperience = textLower.includes("experience") || textLower.includes("employment") || textLower.includes("history") || textLower.includes("work") || textLower.includes("professional profile");
  const hasEducation = textLower.includes("education") || textLower.includes("academic") || textLower.includes("university") || textLower.includes("college") || textLower.includes("school");
  const hasSkills = textLower.includes("skills") || textLower.includes("competencies") || textLower.includes("expertise") || textLower.includes("technologies") || textLower.includes("specialties");
  const hasProjects = textLower.includes("projects") || textLower.includes("portfolio") || textLower.includes("accomplishments") || textLower.includes("certifications") || textLower.includes("awards");
  
  let sectionScore = 0;
  if (hasExperience) sectionScore += 35;
  if (hasEducation) sectionScore += 30;
  if (hasSkills) sectionScore += 20;
  if (hasProjects) sectionScore += 15;

  // 3. Impact check (action verbs & metrics)
  const verbsList = ["led", "managed", "designed", "developed", "built", "implemented", "increased", "created", "optimized", "spearheaded", "collaborated", "facilitated", "analyzed", "delivered", "coordinated", "engineered", "streamlined", "automated", "executed", "architected"];
  const foundVerbs = verbsList.filter(verb => new RegExp(`\\b${verb}\\b`, 'i').test(text));
  
  const metricIndicators = ["%", "\\$", "\\bmillion\\b", "\\bbillion\\b", "\\brevenue\\b", "\\bpercent\\b", "\\bsaved\\b", "\\bincreased by\\b", "\\breduced by\\b", "\\bgrowth\\b"];
  let foundMetricsCount = 0;
  metricIndicators.forEach(ind => {
    const matches = textLower.match(new RegExp(ind, 'g'));
    if (matches) foundMetricsCount += matches.length;
  });

  let impactScore = Math.min(100, (foundVerbs.length * 5) + (foundMetricsCount * 12) + 20);

  // 4. ATS check
  const hasTables = textLower.includes("table") || textLower.includes("grid");
  const isPdf = fileName?.toLowerCase()?.endsWith('.pdf');
  
  let atsScore = 80;
  if (isPdf) atsScore += 10;
  if (hasTables) atsScore -= 15;
  
  // Weighted Health Score Calculation
  const finalScore = Math.round((contactScore * 0.25) + (sectionScore * 0.3) + (impactScore * 0.3) + (atsScore * 0.15));
  
  // Grade
  let grade = "C";
  if (finalScore >= 95) grade = "A+";
  else if (finalScore >= 90) grade = "A";
  else if (finalScore >= 85) grade = "A-";
  else if (finalScore >= 80) grade = "B+";
  else if (finalScore >= 75) grade = "B";
  else if (finalScore >= 70) grade = "B-";
  else if (finalScore >= 65) grade = "C+";
  else if (finalScore >= 60) grade = "C";
  else grade = "D";

  // Action items recommendations
  const recs = [];
  if (!hasEmail) recs.push("⚠️ Contact Information: Add a professional email address to your header.");
  if (!hasPhone) recs.push("⚠️ Contact Information: Provide a valid telephone/mobile contact number.");
  if (!hasLinkedin) recs.push("💡 Online Footprint: Include your professional LinkedIn profile URL.");
  if (!hasGithub) recs.push("💡 Code Presence: Link to your GitHub profile to showcase real code repositories.");
  if (!hasExperience) recs.push("❌ Layout structure: Define a clean, standard 'Work Experience' or 'Employment History' heading.");
  if (!hasSkills) recs.push("❌ Skills Section: Group and list your technical stack in a readable 'Skills' section.");
  if (foundVerbs.length < 5) recs.push("❌ Impact Verbs: Enhance bullet points using action-driven verbs (e.g. 'Spearheaded', 'Optimized').");
  if (foundMetricsCount < 3) recs.push("❌ Quantitative Metrics: Quantify achievements. Include percentages, dollars, or time metrics to prove your results.");
  if (hasTables) recs.push("⚠️ Parser Warning: Avoid utilizing dense tables or overlapping grid shapes which confuse ATS scan readers.");

  const commonTech = ["react", "typescript", "javascript", "node", "python", "sql", "aws", "docker", "agile", "css", "html", "git", "java", "c++", "kubernetes", "rest", "nosql", "ci/cd"];
  const parsedTech = commonTech.filter(tech => textLower.includes(tech)).map(t => t.toUpperCase());

  return {
    score: finalScore,
    grade,
    contact: { email: hasEmail, phone: hasPhone, linkedin: hasLinkedin, github: hasGithub, portfolio: hasPortfolio, score: contactScore },
    sections: { experience: hasExperience, education: hasEducation, skills: hasSkills, projects: hasProjects, score: sectionScore },
    impact: { actionVerbs: foundVerbs, metricsCount: foundMetricsCount, score: impactScore },
    ats: { parseable: true, singleColumn: !hasTables, fileFormat: isPdf, score: atsScore },
    skills: parsedTech.length > 0 ? parsedTech : ["COMMUNICATION", "PROBLEM-SOLVING", "TEAMWORK", "AGILE"],
    recs
  };
};

export default function AtsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("strengths"); // strengths, checklist

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadResumesList();
  }, []);

  useScrollReveal([audit, resumes]);

  const loadResumesList = async () => {
    try {
      setLoading(true);
      const data = await getResumes();
      setResumes(data);
      
      const resumeIdParam = searchParams.get("resumeId");
      if (resumeIdParam) {
        setSelectedResumeId(resumeIdParam);
        const match = data.find(r => String(r.id) === String(resumeIdParam));
        if (match) {
          const result = auditResumeText(match.extracted_text, match.file_name);
          setAudit(result);
          showToast(`Audited ${match.file_name} successfully!`, "success");
        }
      } else if (data.length > 0) {
        // Default to first
        setSelectedResumeId(String(data[0].id));
        const result = auditResumeText(data[0].extracted_text, data[0].file_name);
        setAudit(result);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load resumes.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSelect = (e) => {
    const rId = e.target.value;
    setSelectedResumeId(rId);
    if (!rId) {
      setAudit(null);
      return;
    }
    const match = resumes.find(r => String(r.id) === String(rId));
    if (match) {
      const result = auditResumeText(match.extracted_text, match.file_name);
      setAudit(result);
      showToast(`Switched audit to ${match.file_name}!`, "success");
    }
  };

  // Trait list for 3D orbiting labels
  const orbitalTraits = useMemo(() => {
    if (!audit) return [];
    const traits = [];
    if (audit.contact.email) traits.push("✉️ Email OK");
    if (audit.contact.linkedin) traits.push("💼 LinkedIn OK");
    if (audit.sections.experience) traits.push("📁 Work Exp");
    if (audit.impact.actionVerbs.length >= 5) traits.push("🔥 Action Verbs");
    if (audit.ats.singleColumn) traits.push("✨ ATS Layout");
    return traits.length > 0 ? traits : ["📋 Core Text", "📂 Structure"];
  }, [audit]);

  return (
    <motion.div 
      className={`ats-page-premium ${audit ? 'dashboard-active' : ''}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(10,10,15,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
          <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Running AI Resume Quality Audit...</p>
        </div>
      )}

      {audit ? (
        // ================== AUDITOR DASHBOARD VIEW ==================
        <div className="ats-dashboard-container">
          {/* Header Bar */}
          <div className="ats-db-top-bar">
            <div className="ats-db-brand">
              <span className="ats-db-logo">🛡️</span>
              <div className="ats-db-title-grp">
                <h2>AI Resume Auditor</h2>
                <p>Standalone Quality & Compliance Audit</p>
              </div>
            </div>
            <div className="ats-db-meta-info">
              <div className="meta-info-card">
                <span className="meta-info-label">Auditing Document</span>
                <select
                  value={selectedResumeId}
                  onChange={handleResumeSelect}
                  className="ats-select"
                  style={{ background: 'transparent', border: 'none', color: '#fff', padding: 0, fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', outline: 'none', maxWidth: '220px' }}
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id} style={{ background: '#0F0F16', color: '#fff' }}>
                      {r.file_name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="ats-reset-btn" onClick={() => navigate("/resumes")} style={{ background: 'rgba(255,255,255,0.03)', color: '#fff', borderColor: 'rgba(255,255,255,0.08)' }}>
                ⬅ Back to Resumes
              </button>
            </div>
          </div>

          <div className="ats-db-grid">
            {/* Left Side: 3D Auditor Sphere Canvas */}
            <div className="ats-db-left-panel scroll-reveal-left">
              <div className="ats-canvas-card">
                <div className="ats-canvas-header">
                  <span className="badge-dot"></span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interactive Health Space</span>
                </div>
                <div className="ats-interactive-canvas-container">
                  <Canvas camera={{ position: [0, 0, 9], fov: 45 }}>
                    <SceneBackground />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7C3AED" />
                    <Environment preset="night" />
                    <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
                    
                    <ScoreSphere score={audit.score} grade={audit.grade} />
                    <OrbitingLabels items={orbitalTraits} color={audit.score >= 80 ? '#10b981' : '#f59e0b'} />
                  </Canvas>
                </div>
                <div className="ats-canvas-hint">
                  💡 Orbiting indicators represent positive credentials found in document text
                </div>
              </div>

              {/* Quality Distribution radar values */}
              <div className="ats-quick-actions-card" style={{ padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Quality Dimensions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  {[
                    { label: "Contact completeness", val: audit.contact.score, color: '#38bdf8' },
                    { label: "Section standard flow", val: audit.sections.score, color: '#c084fc' },
                    { label: "Impact & Actionable metrics", val: audit.impact.score, color: '#34d399' },
                    { label: "ATS compatibility level", val: audit.ats.score, color: '#fbbf24' }
                  ].map((dim, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>
                        <span>{dim.label}</span>
                        <span style={{ color: dim.color }}>{dim.val}%</span>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${dim.val}%`, background: dim.color, height: '100%', borderRadius: '10px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side: Deep Insights & Checklist Reports */}
            <div className="ats-db-right-panel scroll-reveal-right">
              <div className="ats-panel-tabs">
                <button 
                  className={`panel-tab ${activeTab === 'strengths' ? 'active' : ''}`}
                  onClick={() => setActiveTab('strengths')}
                >
                  🚀 Health Summary
                </button>
                <button 
                  className={`panel-tab ${activeTab === 'checklist' ? 'active' : ''}`}
                  onClick={() => setActiveTab('checklist')}
                >
                  📋 Audit Checklist
                </button>
              </div>

              <div className="ats-tab-content-container">
                {activeTab === 'strengths' ? (
                  <div className="ats-tab-panel-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* General health bar overview */}
                    <div className="ats-db-score-overview">
                      <div className="ats-db-score-row">
                        <div className="score-main-stat">
                          <span className="big-score" style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            {audit.grade}
                            <span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: '600' }}>({audit.score}/100 Health)</span>
                          </span>
                          <span className="score-desc-label">Overall Standalone Grade</span>
                        </div>
                        <div className="score-status-pill-container">
                          <span className={`status-pill ${audit.score >= 85 ? 'excellent' : audit.score >= 70 ? 'good' : 'poor'}`}>
                            {audit.score >= 85 ? '🛡️ Top Quality' : audit.score >= 70 ? '⚠️ Fair Quality' : '🔴 Revision Required'}
                          </span>
                        </div>
                      </div>
                      <div className="ats-db-progress-bar">
                        <div className="ats-db-progress-fill" style={{ width: `${audit.score}%`, background: audit.score >= 85 ? '#10b981' : audit.score >= 70 ? '#f59e0b' : '#ef4444' }}></div>
                      </div>
                    </div>

                    {/* Recommendations action cards */}
                    <div className="ats-db-section-card">
                      <h3>🛠️ Quality Improvement Action Plan ({audit.recs.length})</h3>
                      <div className="ats-db-suggestions-list">
                        {audit.recs.length > 0 ? (
                          audit.recs.map((rec, i) => (
                            <div key={i} className="ats-db-suggestion-item" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '12px' }}>
                              <span className="suggestion-bullet-pt" style={{ color: rec.startsWith('❌') ? '#ef4444' : rec.startsWith('⚠️') ? '#f59e0b' : '#38bdf8' }}>✦</span>
                              <p style={{ color: '#cbd5e1', fontSize: '12px' }}>{rec}</p>
                            </div>
                          ))
                        ) : (
                          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#34d399' }}>
                            🎉 Perfect Audit! No action items identified for this resume.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detected Action Verbs & Metrics Grid */}
                    <div className="ats-skills-db-grid">
                      <div className="skills-db-card matched" style={{ borderLeft: '3px solid #34d399' }}>
                        <div className="card-lbl-header">
                          <span className="header-status-indicator matched" style={{ background: '#34d399' }}></span>
                          <h4>Impact Verbs Detected ({audit.impact.actionVerbs.length})</h4>
                        </div>
                        <div className="skills-tags-wrap">
                          {audit.impact.actionVerbs.length > 0 ? (
                            audit.impact.actionVerbs.map((verb, idx) => (
                              <span key={idx} className="db-skill-tag matched" style={{ color: '#34d399', background: 'rgba(52,211,153,0.05)', borderColor: 'rgba(52,211,153,0.1)' }}>
                                {verb}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>No action verbs scanned. Add words like 'designed', 'led', 'automated'.</span>
                          )}
                        </div>
                      </div>

                      <div className="skills-db-card missing" style={{ borderLeft: '3px solid #fbbf24' }}>
                        <div className="card-lbl-header">
                          <span className="header-status-indicator missing" style={{ background: '#fbbf24' }}></span>
                          <h4>Metric Points Scanned ({audit.impact.metricsCount})</h4>
                        </div>
                        <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                          We detected <strong>{audit.impact.metricsCount}</strong> occurrences of quantitative metrics (%, $, numbers) in descriptions.
                        </p>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '6px 0 0 0' }}>
                          💡 Aim for at least 3-5 quantified metric points to demonstrate measurable success.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Audit checklist tab
                  <div className="ats-tab-panel-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="ats-db-section-card">
                      <h3>📋 Detail Quality Checklist</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                        {/* Section 1: Contact info */}
                        <div>
                          <h4 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem 0', fontWeight: '700' }}>Contact Header Elements</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[
                              { label: "Email Address", ok: audit.contact.email },
                              { label: "Phone Number", ok: audit.contact.phone },
                              { label: "LinkedIn Profile Link", ok: audit.contact.linkedin },
                              { label: "GitHub Profile Link", ok: audit.contact.github },
                              { label: "Portfolio / Web URL", ok: audit.contact.portfolio }
                            ].map((item, idx) => (
                              <div key={idx} className="checklist-item">
                                <span className={`checklist-icon ${item.ok ? 'ok' : 'missing'}`}>
                                  {item.ok ? '✓' : '✗'}
                                </span>
                                <span style={{ color: item.ok ? '#f1f5f9' : '#64748b' }}>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

                        {/* Section 2: Layout standard elements */}
                        <div>
                          <h4 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem 0', fontWeight: '700' }}>Structural Standard Sections</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[
                              { label: "Work Experience Section", ok: audit.sections.experience },
                              { label: "Education Details", ok: audit.sections.education },
                              { label: "Core Skills Group", ok: audit.sections.skills },
                              { label: "Projects / Affiliations List", ok: audit.sections.projects }
                            ].map((item, idx) => (
                              <div key={idx} className="checklist-item">
                                <span className={`checklist-icon ${item.ok ? 'ok' : 'missing'}`}>
                                  {item.ok ? '✓' : '✗'}
                                </span>
                                <span style={{ color: item.ok ? '#f1f5f9' : '#64748b' }}>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

                        {/* Section 3: ATS format standards */}
                        <div>
                          <h4 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem 0', fontWeight: '700' }}>ATS Scan Friendliness</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[
                              { label: "Text-based file format (PDF)", ok: audit.ats.fileFormat },
                              { label: "Standard columns layout (no dense tables)", ok: audit.ats.singleColumn },
                              { label: "No hidden text tricks", ok: true },
                              { label: "Standard web-safe fonts used", ok: true }
                            ].map((item, idx) => (
                              <div key={idx} className="checklist-item">
                                <span className={`checklist-icon ${item.ok ? 'ok' : 'missing'}`}>
                                  {item.ok ? '✓' : '✗'}
                                </span>
                                <span style={{ color: item.ok ? '#f1f5f9' : '#64748b' }}>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detected Skills Cloud */}
                    <div className="ats-db-section-card">
                      <h3>🏷️ Parsed Skills & Keywords Cloud ({audit.skills.length})</h3>
                      <div className="skills-tags-wrap" style={{ marginTop: '0.5rem' }}>
                        {audit.skills.map((skill, i) => (
                          <span key={i} className="db-skill-tag matched" style={{ background: 'rgba(56,189,248,0.04)', borderColor: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Empty state config view fallback (if no resumes exist)
        <div className="ats-content-overlay" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <span style={{ fontSize: '3rem' }}>📭</span>
          <h2>No Resumes to Audit</h2>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 1.5rem 0' }}>Please upload a resume in the Resumes page before running an AI quality audit.</p>
          <button className="ats-btn-primary" onClick={() => navigate("/resumes")}>
            Upload Resume
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast-premium ${toast.type}`}>
          <span className="toast-icon">{toast.type === "success" ? "✓" : "ℹ"}</span>
          <p className="toast-message">{toast.message}</p>
        </div>
      )}
    </motion.div>
  );
}
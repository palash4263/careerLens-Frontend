import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { animate, stagger } from "animejs";
import {
  generateAiSummary,
  generateAiExperienceBullets,
  generateAiSkills,
  generateAiProject,
  generateAiEducation,
  generateAiPersonal
} from "../services/groqService";
import { generateResumePDF } from "../utils/pdfGenerator";
import "./ResumeBuilderPage.css";

/* ─── Step config ─── */
const STEPS = [
  { id: "personal",    label: "Personal"    },
  { id: "summary",     label: "Summary"     },
  { id: "experience",  label: "Experience"  },
  { id: "education",   label: "Education"   },
  { id: "skills",      label: "Skills"      },
  { id: "projects",    label: "Projects"    },
  { id: "preview",     label: "Preview"     },
];

/* ─── Default data shapes ─── */
const defaultExperience = () => ({
  id: Date.now() + Math.random(),
  company: "", role: "", startDate: "", endDate: "", current: false,
  bullets: [""],
});
const defaultEducation = () => ({
  id: Date.now() + Math.random(),
  school: "", degree: "", field: "", startYear: "", endYear: "", gpa: "",
});
const defaultProject = () => ({
  id: Date.now() + Math.random(),
  name: "", url: "", description: "", tech: "",
});

export default function ResumeBuilderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [skillInput, setSkillInput] = useState("");
  const [aiLoading, setAiLoading] = useState({});
  const printRef = useRef(null);

  /* ─── Form state ─── */
  const [personal, setPersonal] = useState({
    name: "", title: "", email: "", phone: "", location: "", linkedin: "", portfolio: "",
  });
  const [summary, setSummary] = useState("");
  const [experiences, setExperiences] = useState([defaultExperience()]);
  const [educations, setEducations] = useState([defaultEducation()]);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([defaultProject()]);
  const [docFontSize, setDocFontSize] = useState(10);
  const [docThemeColor, setDocThemeColor] = useState("#6366f1");

  const setAiKeyLoading = (key, val) => setAiLoading(p => ({ ...p, [key]: val }));

  /* ─── Anime.js Kinetic Animations ─── */
  useEffect(() => {
    // 1. Anime.js Staggered Form Field Slide & Fade Entrance
    setTimeout(() => {
      const targets = document.querySelectorAll(".rb-field, .rb-entry-card");
      if (targets && targets.length > 0) {
        animate(targets, {
          translateY: [16, 0],
          opacity: [0, 1],
          delay: stagger(45),
          duration: 450,
          ease: "outQuad",
        });
      }
    }, 50);

    // 2. Anime.js Active Step Badge Elastic Bounce
    const activeCircle = document.querySelector(".rb-step-btn.active .rb-step-circle");
    if (activeCircle) {
      animate(activeCircle, {
        scale: [1, 1.25, 1],
        boxShadow: [
          "0 0 0px rgba(99, 102, 241, 0)",
          "0 0 24px rgba(99, 102, 241, 0.9)",
          "0 0 10px rgba(99, 102, 241, 0.4)",
        ],
        duration: 650,
        ease: "outBack",
      });
    }

    // 3. Anime.js Progress Bar Fill Animation
    const progressFill = document.querySelector(".rb-progress-fill");
    if (progressFill) {
      animate(progressFill, {
        width: `${((step + 1) / STEPS.length) * 100}%`,
        duration: 500,
        ease: "outExpo",
      });
    }
  }, [step]);

  /* ─── Helpers ─── */
  const updatePersonal = (k, v) => setPersonal(p => ({ ...p, [k]: v }));

  const updateExp = (id, k, v) =>
    setExperiences(exps => exps.map(e => e.id === id ? { ...e, [k]: v } : e));
  const updateExpBullet = (id, idx, v) =>
    setExperiences(exps => exps.map(e => {
      if (e.id !== id) return e;
      const b = [...e.bullets]; b[idx] = v; return { ...e, bullets: b };
    }));
  const addBullet = (id) =>
    setExperiences(exps => exps.map(e => e.id === id ? { ...e, bullets: [...e.bullets, ""] } : e));
  const removeBullet = (id, idx) =>
    setExperiences(exps => exps.map(e => {
      if (e.id !== id) return e;
      const b = e.bullets.filter((_, i) => i !== idx);
      return { ...e, bullets: b.length ? b : [""] };
    }));

  const updateEdu = (id, k, v) =>
    setEducations(eds => eds.map(e => e.id === id ? { ...e, [k]: v } : e));

  const updateProj = (id, k, v) =>
    setProjects(ps => ps.map(p => p.id === id ? { ...p, [k]: v } : p));

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(s => [...s, trimmed]);
      setSkillInput("");
    }
  };
  const removeSkill = (sk) => setSkills(s => s.filter(x => x !== sk));

  /* ─── AI Action Handlers ─── */
  const handleAiSummary = async () => {
    const aiBtn = document.querySelector(".rb-ai-btn");
    if (aiBtn) animate(aiBtn, { scale: [1, 1.06, 1], duration: 350, ease: "outQuad" });
    setAiKeyLoading("summary", true);
    try {
      const generated = await generateAiSummary(personal.title || "Full Stack Developer", personal.name || "Candidate");
      setSummary(generated);
    } catch (e) {
      console.error(e);
    } finally {
      setAiKeyLoading("summary", false);
    }
  };

  const handleAiExpBullets = async (expId, role, company) => {
    setAiKeyLoading(`exp_${expId}`, true);
    try {
      const targetExp = experiences.find(e => e.id === expId);
      const existingClean = (targetExp?.bullets || []).filter(b => b.trim() !== "");

      const newBullets = await generateAiExperienceBullets(
        role || personal.title || "Software Engineer",
        company || "Tech Corp",
        existingClean
      );

      const freshBullets = newBullets.filter(
        nb => !existingClean.some(eb => eb.toLowerCase().trim() === nb.toLowerCase().trim())
      );

      const finalAdditions = freshBullets.length > 0 ? freshBullets : [
        `Spearheaded automated performance profiling at ${company || "the organization"}, cutting memory overhead by 35%.`,
        `Optimized API serialization protocols, boosting throughput by 40% across client connections.`,
        `Integrated OpenTelemetry distributed tracing to diagnose cross-service latencies in real time.`
      ];

      setExperiences(exps => exps.map(e => {
        if (e.id !== expId) return e;
        const currentClean = (e.bullets || []).filter(b => b.trim() !== "");
        return { ...e, bullets: [...currentClean, ...finalAdditions] };
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setAiKeyLoading(`exp_${expId}`, false);
    }
  };

  const handleAiSkills = async () => {
    setAiKeyLoading("skills", true);
    try {
      const recs = await generateAiSkills(personal.title || "Full Stack Developer");
      setSkills(prev => Array.from(new Set([...prev, ...recs])));
    } catch (e) {
      console.error(e);
    } finally {
      setAiKeyLoading("skills", false);
    }
  };

  const handleAiProject = async (targetId, cardIdx = 0) => {
    const key = targetId ? `proj_${targetId}` : "project";
    setAiKeyLoading(key, true);
    try {
      const existingNames = projects.map(p => p.name).filter(Boolean);
      const proj = await generateAiProject(personal.title || "Full Stack Developer", cardIdx, existingNames);
      setProjects(prev => {
        if (targetId) {
          return prev.map(p => p.id === targetId ? { ...p, ...proj } : p);
        }
        const hasEmpty = prev.some(p => !p.name);
        if (hasEmpty) {
          return prev.map(p => !p.name ? { ...p, ...proj } : p);
        }
        return [...prev, { id: Date.now() + Math.random(), ...proj }];
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAiKeyLoading(key, false);
    }
  };

  const handlePrint = async () => {
    try {
      const headerText = [
        personal.name || "Candidate Name",
        personal.title || "",
        [personal.email, personal.phone, personal.location, personal.linkedin, personal.portfolio].filter(Boolean).join(" | ")
      ].filter(Boolean).join("\n");

      const expText = experiences
        .filter(e => e.company || e.role)
        .map(e => {
          const header = `${e.role || "Role"} | ${e.company || "Company"} | ${e.startDate || ""} - ${e.current ? "Present" : (e.endDate || "")}`;
          const bullets = (e.bullets || []).filter(b => b.trim()).map(b => `• ${b}`).join("\n");
          return bullets ? `${header}\n${bullets}` : header;
        })
        .join("\n\n");

      const eduText = educations
        .filter(e => e.school || e.degree)
        .map(e => `${e.degree || "Degree"}${e.field ? ` in ${e.field}` : ""} | ${e.school} | ${e.startYear || ""} - ${e.endYear || ""}${e.gpa ? ` | GPA: ${e.gpa}` : ""}`)
        .join("\n");

      const projText = projects
        .filter(p => p.name)
        .map(p => {
          const header = `${p.name} | ${p.tech || ""} | ${p.url || ""}`;
          return p.description ? `${header}\n${p.description}` : header;
        })
        .join("\n\n");

      const editedSections = {
        Header: headerText,
        Summary: summary || "",
        Experience: expText,
        Education: eduText,
        Skills: skills.join(", "),
        Projects: projText,
      };

      const computedSpacing = docFontSize >= 11 ? 4.5 : docFontSize >= 10 ? 3.8 : 3.0;

      await generateResumePDF({
        editedSections,
        fileName: `${(personal.name || "Resume").replace(/\s+/g, "_")}_Resume`,
        templateType: "single-column",
        primaryColor: docThemeColor,
        pageMargins: 1,
        sectionSpacing: computedSpacing,
        baseFontSize: docFontSize,
        mainSectionOrder: ["Summary", "Experience", "Projects", "Education", "Skills"],
        sideSectionOrder: [],
      });
    } catch (err) {
      console.error("Vector PDF generation error, falling back to print window:", err);
      const el = document.querySelector(".rb-resume-doc");
      if (!el) return;
      const win = window.open("", "_blank");
      win.document.write(`<html><head><title>${personal.name || "Resume"}</title><style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @page { size: A4 portrait; margin: 12mm; }
        body { margin: 0; padding: 20px; font-family: 'Outfit', sans-serif; color: #1e293b; line-height: 1.5; background: #fff; }
        * { box-sizing: border-box; }
        .rb-doc-name { font-size: 1.6rem; font-weight: 900; color: #0f172a; margin: 0 0 2px; }
        .rb-doc-title { font-size: 0.95rem; font-weight: 600; color: ${docThemeColor}; margin: 0 0 8px; }
        .rb-doc-contact { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 0.8rem; color: #475569; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 2px solid ${docThemeColor}; }
        .rb-doc-section { margin-top: 16px; }
        .rb-doc-section-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: ${docThemeColor}; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; margin-bottom: 8px; }
        .rb-doc-summary { font-size: 0.85rem; color: #334155; line-height: 1.6; }
        .rb-doc-entry { margin-bottom: 12px; }
        .rb-doc-entry-header { display: flex; justify-content: space-between; align-items: baseline; }
        .rb-doc-entry-title { font-size: 0.9rem; font-weight: 800; color: #0f172a; }
        .rb-doc-entry-date { font-size: 0.76rem; color: #94a3b8; white-space: nowrap; }
        .rb-doc-entry-sub { font-size: 0.82rem; color: ${docThemeColor}; font-weight: 600; margin-bottom: 4px; }
        .rb-doc-bullets { margin: 0; padding-left: 18px; }
        .rb-doc-bullets li { font-size: 0.82rem; color: #334155; margin-bottom: 3px; }
        .rb-doc-skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .rb-doc-skill-tag { padding: 3px 10px; border-radius: 4px; background: #f1f5f9; color: #334155; font-size: 0.78rem; font-weight: 600; }
      </style></head><body>${el.outerHTML}</body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 500);
    }
  };

  const renderFontToolbar = () => (
    <div className="rb-font-toolbar">
      <div className="rb-font-control-group">
        <span className="rb-font-label">Font Size:</span>
        <button className="rb-font-btn" onClick={() => setDocFontSize(s => Math.max(7.5, Number((s - 0.5).toFixed(1))))} title="Decrease font size">A-</button>
        <span className="rb-font-val">{docFontSize.toFixed(1)}pt</span>
        <button className="rb-font-btn" onClick={() => setDocFontSize(s => Math.min(13.5, Number((s + 0.5).toFixed(1))))} title="Increase font size">A+</button>
      </div>

      <div className="rb-font-control-group">
        {[
          { label: "Compact", pt: 8.5 },
          { label: "Standard", pt: 10.0 },
          { label: "Large", pt: 11.5 },
          { label: "Fill Page 🎯", pt: 12.5 },
        ].map(p => (
          <button
            key={p.label}
            className={`rb-preset-btn${docFontSize === p.pt ? " active" : ""}`}
            onClick={() => setDocFontSize(p.pt)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rb-color-swatches">
        {["#6366f1", "#10b981", "#2563eb", "#8b5cf6", "#f43f5e", "#0f172a"].map(hex => (
          <button
            key={hex}
            className={`rb-color-swatch${docThemeColor === hex ? " active" : ""}`}
            style={{ backgroundColor: hex }}
            onClick={() => setDocThemeColor(hex)}
            title={`Set theme color to ${hex}`}
          />
        ))}
      </div>
    </div>
  );

  /* ─── Slide animation ─── */
  const variants = {
    enter:  { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit:   { opacity: 0, x: -40 },
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  const handleAiPersonal = async () => {
    setAiKeyLoading("personal", true);
    try {
      const res = await generateAiPersonal(personal.title || "Full Stack Engineer", personal.name || "Candidate");
      setPersonal(prev => ({
        ...prev,
        title: res.title || prev.title,
        location: res.location || prev.location,
        linkedin: res.linkedin || prev.linkedin,
        portfolio: res.portfolio || prev.portfolio,
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setAiKeyLoading("personal", false);
    }
  };

  const renderStepPersonal = () => (
    <div>
      <div className="rb-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Personal Information</h2>
          <p>Start with your contact details — the top section of every resume.</p>
        </div>
        <button
          className="rb-ai-btn"
          onClick={handleAiPersonal}
          disabled={aiLoading["personal"]}
        >
          {aiLoading["personal"] ? <Loader2 size={14} className="rb-ai-spin" /> : <Sparkles size={14} />}
          <span>{aiLoading["personal"] ? "Autofilling..." : "AI Autofill Details"}</span>
        </button>
      </div>
      <div className="rb-field-grid">
        {[
          { k: "name",      label: "Full Name",          placeholder: "Palash Mishra" },
          { k: "title",     label: "Professional Title", placeholder: "Full Stack Engineer" },
          { k: "email",     label: "Email",              placeholder: "palash@email.com" },
          { k: "phone",     label: "Phone",              placeholder: "+91 98765 43210" },
          { k: "location",  label: "Location",           placeholder: "Mumbai, India" },
          { k: "linkedin",  label: "LinkedIn URL",       placeholder: "linkedin.com/in/palash" },
          { k: "portfolio", label: "Portfolio / GitHub", placeholder: "github.com/palash" },
        ].map(({ k, label, placeholder }) => (
          <div key={k} className={`rb-field${k === "portfolio" || k === "linkedin" ? " full" : ""}`}>
            <label className="rb-label">{label}</label>
            <input
              className="rb-input"
              type="text"
              placeholder={placeholder}
              value={personal[k]}
              onChange={e => updatePersonal(k, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderStepSummary = () => (
    <div>
      <div className="rb-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Professional Summary</h2>
          <p>2–3 sentences that capture your experience, skills, and career goal.</p>
        </div>
        <button
          className="rb-ai-btn"
          onClick={handleAiSummary}
          disabled={aiLoading["summary"]}
        >
          {aiLoading["summary"] ? <Loader2 size={14} className="rb-ai-spin" /> : <Sparkles size={14} />}
          <span>{aiLoading["summary"] ? "AI Generating..." : "AI Generate Summary"}</span>
        </button>
      </div>
      <div className="rb-field full">
        <label className="rb-label">Summary</label>
        <textarea
          className="rb-textarea"
          rows={6}
          placeholder="Experienced full-stack engineer with 4+ years building scalable React + Node.js applications. Passionate about clean code, AI integrations, and shipping fast. Looking for a senior engineering role at a product-driven startup."
          value={summary}
          onChange={e => setSummary(e.target.value)}
        />
      </div>
      <div className="rb-ai-hint">✨ Tip: Click 'AI Generate Summary' above to craft a summary tailored to your title ({personal.title || "Software Engineer"}).</div>
    </div>
  );

  const renderStepExperience = () => (
    <div>
      <div className="rb-section-heading">
        <h2>Work Experience</h2>
        <p>Add your roles from most recent to oldest. Include measurable impact.</p>
      </div>
      <div className="rb-entries">
        {experiences.map((exp, ei) => (
          <div key={exp.id} className="rb-entry-card">
            <div className="rb-entry-card-header">
              <span className="rb-entry-card-title">Experience #{ei + 1}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className="rb-ai-btn"
                  onClick={() => handleAiExpBullets(exp.id, exp.role, exp.company)}
                  disabled={aiLoading[`exp_${exp.id}`]}
                >
                  {aiLoading[`exp_${exp.id}`] ? <Loader2 size={13} className="rb-ai-spin" /> : <Sparkles size={13} />}
                  <span>{aiLoading[`exp_${exp.id}`] ? "Generating Bullets..." : "AI Generate Bullets"}</span>
                </button>
                {experiences.length > 1 && (
                  <button className="rb-entry-remove-btn" onClick={() => setExperiences(es => es.filter(e => e.id !== exp.id))}>×</button>
                )}
              </div>
            </div>
            <div className="rb-field-grid">
              <div className="rb-field">
                <label className="rb-label">Company</label>
                <input className="rb-input" placeholder="Google" value={exp.company} onChange={e => updateExp(exp.id, "company", e.target.value)} />
              </div>
              <div className="rb-field">
                <label className="rb-label">Role / Title</label>
                <input className="rb-input" placeholder="Senior Software Engineer" value={exp.role} onChange={e => updateExp(exp.id, "role", e.target.value)} />
              </div>
              <div className="rb-field">
                <label className="rb-label">Start Date</label>
                <input className="rb-input" type="month" value={exp.startDate} onChange={e => updateExp(exp.id, "startDate", e.target.value)} />
              </div>
              <div className="rb-field">
                <label className="rb-label">End Date</label>
                <input className="rb-input" type="month" value={exp.endDate} disabled={exp.current} onChange={e => updateExp(exp.id, "endDate", e.target.value)} />
              </div>
            </div>
            <div className="rb-field" style={{ marginTop: 12 }}>
              <label className="rb-label" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={exp.current} onChange={e => updateExp(exp.id, "current", e.target.checked)} />
                Currently working here
              </label>
            </div>
            <hr className="rb-divider" />
            <div className="rb-field full">
              <label className="rb-label">Key Accomplishments</label>
              {exp.bullets.map((b, bi) => (
                <div key={bi} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    className="rb-input"
                    placeholder="Led migration to microservices, reducing response time by 35%"
                    value={b}
                    onChange={e => updateExpBullet(exp.id, bi, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {exp.bullets.length > 1 && (
                    <button className="rb-entry-remove-btn" onClick={() => removeBullet(exp.id, bi)}>×</button>
                  )}
                </div>
              ))}
              <button className="rb-add-entry-btn" style={{ marginTop: 4 }} onClick={() => addBullet(exp.id)}>+ Add Bullet</button>
            </div>
          </div>
        ))}
        <button className="rb-add-entry-btn" onClick={() => setExperiences(es => [...es, defaultExperience()])}>+ Add Another Role</button>
      </div>
    </div>
  );

  const handleAiEducation = async () => {
    setAiKeyLoading("education", true);
    try {
      const edu = await generateAiEducation(personal.title || "Full Stack Developer");
      setEducations(prev => {
        const hasEmpty = prev.some(e => !e.school);
        if (hasEmpty) {
          return prev.map(e => !e.school ? { ...e, ...edu } : e);
        }
        return [...prev, { id: Date.now() + Math.random(), ...edu }];
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAiKeyLoading("education", false);
    }
  };

  const renderStepEducation = () => (
    <div>
      <div className="rb-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Education</h2>
          <p>Add your degrees from most recent to oldest.</p>
        </div>
        <button
          className="rb-ai-btn"
          onClick={handleAiEducation}
          disabled={aiLoading["education"]}
        >
          {aiLoading["education"] ? <Loader2 size={14} className="rb-ai-spin" /> : <Sparkles size={14} />}
          <span>{aiLoading["education"] ? "Suggesting..." : "AI Suggest Education"}</span>
        </button>
      </div>
      <div className="rb-entries">
        {educations.map((edu, ei) => (
          <div key={edu.id} className="rb-entry-card">
            <div className="rb-entry-card-header">
              <span className="rb-entry-card-title">Education #{ei + 1}</span>
              {educations.length > 1 && (
                <button className="rb-entry-remove-btn" onClick={() => setEducations(es => es.filter(e => e.id !== edu.id))}>×</button>
              )}
            </div>
            <div className="rb-field-grid">
              <div className="rb-field full">
                <label className="rb-label">School / University</label>
                <input className="rb-input" placeholder="IIT Bombay" value={edu.school} onChange={e => updateEdu(edu.id, "school", e.target.value)} />
              </div>
              <div className="rb-field">
                <label className="rb-label">Degree</label>
                <input className="rb-input" placeholder="B.Tech" value={edu.degree} onChange={e => updateEdu(edu.id, "degree", e.target.value)} />
              </div>
              <div className="rb-field">
                <label className="rb-label">Field of Study</label>
                <input className="rb-input" placeholder="Computer Science" value={edu.field} onChange={e => updateEdu(edu.id, "field", e.target.value)} />
              </div>
              <div className="rb-field">
                <label className="rb-label">Start Year</label>
                <input className="rb-input" type="number" placeholder="2018" value={edu.startYear} onChange={e => updateEdu(edu.id, "startYear", e.target.value)} />
              </div>
              <div className="rb-field">
                <label className="rb-label">End Year</label>
                <input className="rb-input" type="number" placeholder="2022" value={edu.endYear} onChange={e => updateEdu(edu.id, "endYear", e.target.value)} />
              </div>
              <div className="rb-field">
                <label className="rb-label">GPA / Percentage (optional)</label>
                <input className="rb-input" placeholder="8.5 / 10" value={edu.gpa} onChange={e => updateEdu(edu.id, "gpa", e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <button className="rb-add-entry-btn" onClick={() => setEducations(es => [...es, defaultEducation()])}>+ Add Another Degree</button>
      </div>
    </div>
  );

  const renderStepSkills = () => (
    <div>
      <div className="rb-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Skills</h2>
          <p>Add your technical and soft skills. Press Enter or click Add.</p>
        </div>
        <button
          className="rb-ai-btn"
          onClick={handleAiSkills}
          disabled={aiLoading["skills"]}
        >
          {aiLoading["skills"] ? <Loader2 size={14} className="rb-ai-spin" /> : <Sparkles size={14} />}
          <span>{aiLoading["skills"] ? "Recommending..." : "AI Recommend Skills"}</span>
        </button>
      </div>
      <div className="rb-skills-container">
        <div className="rb-tags-display">
          {skills.length === 0 && <span style={{ color: "#475569", fontSize: "0.82rem" }}>No skills added yet…</span>}
          {skills.map(sk => (
            <span key={sk} className="rb-tag">
              {sk}
              <span className="rb-tag-remove" onClick={() => removeSkill(sk)}>×</span>
            </span>
          ))}
        </div>
        <div className="rb-tag-input-row">
          <input
            className="rb-input"
            placeholder="e.g. React, Node.js, Python, Leadership…"
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); }}}
            style={{ flex: 1 }}
          />
          <button className="rb-tag-add-btn" onClick={addSkill}>+ Add</button>
        </div>
        <div className="rb-ai-hint">✨ Click 'AI Recommend Skills' above to auto-suggest top skills for {personal.title || "your role"}.</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {["React", "TypeScript", "Node.js", "Python", "AWS", "Docker", "SQL", "Git", "REST APIs", "Agile"].map(s => (
            !skills.includes(s) && (
              <button
                key={s}
                onClick={() => setSkills(sk => [...sk, s])}
                style={{
                  padding: "4px 12px", borderRadius: "99px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#94a3b8", fontSize: "0.78rem", cursor: "pointer"
                }}
              >+ {s}</button>
            )
          ))}
        </div>
      </div>
    </div>
  );

  const renderStepProjects = () => (
    <div>
      <div className="rb-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Projects</h2>
          <p>Showcase 2–4 projects that demonstrate your skills.</p>
        </div>
        <button
          className="rb-ai-btn"
          onClick={handleAiProject}
          disabled={aiLoading["project"]}
        >
          {aiLoading["project"] ? <Loader2 size={14} className="rb-ai-spin" /> : <Sparkles size={14} />}
          <span>{aiLoading["project"] ? "Generating Project..." : "AI Suggest Project"}</span>
        </button>
      </div>
      <div className="rb-entries">
        {projects.map((proj, pi) => (
          <div key={proj.id} className="rb-entry-card">
            <div className="rb-entry-card-header">
              <span className="rb-entry-card-title">Project #{pi + 1}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className="rb-ai-btn"
                  onClick={() => handleAiProject(proj.id, pi)}
                  disabled={aiLoading[`proj_${proj.id}`]}
                >
                  {aiLoading[`proj_${proj.id}`] ? <Loader2 size={13} className="rb-ai-spin" /> : <Sparkles size={13} />}
                  <span>{aiLoading[`proj_${proj.id}`] ? "Generating Project..." : "AI Generate Project"}</span>
                </button>
                {projects.length > 1 && (
                  <button className="rb-entry-remove-btn" onClick={() => setProjects(ps => ps.filter(p => p.id !== proj.id))}>×</button>
                )}
              </div>
            </div>
            <div className="rb-field-grid">
              <div className="rb-field">
                <label className="rb-label">Project Name</label>
                <input className="rb-input" placeholder="CareerLens AI" value={proj.name} onChange={e => updateProj(proj.id, "name", e.target.value)} />
              </div>
              <div className="rb-field">
                <label className="rb-label">URL / GitHub Link</label>
                <input className="rb-input" placeholder="github.com/you/project" value={proj.url} onChange={e => updateProj(proj.id, "url", e.target.value)} />
              </div>
              <div className="rb-field full">
                <label className="rb-label">Description</label>
                <textarea
                  className="rb-textarea"
                  rows={3}
                  placeholder="Built a resume optimization platform using React, Node.js, and Groq AI…"
                  value={proj.description}
                  onChange={e => updateProj(proj.id, "description", e.target.value)}
                />
              </div>
              <div className="rb-field full">
                <label className="rb-label">Technologies Used</label>
                <input className="rb-input" placeholder="React, Node.js, PostgreSQL, Groq AI" value={proj.tech} onChange={e => updateProj(proj.id, "tech", e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <button className="rb-add-entry-btn" onClick={() => setProjects(ps => [...ps, defaultProject()])}>+ Add Another Project</button>
      </div>
    </div>
  );

  /* ─── Live Resume Preview Renderer ─── */
  const renderResumePreview = () => (
    <div
      className="rb-resume-doc"
      ref={printRef}
      style={{
        "--doc-scale": docFontSize / 10,
        "--doc-theme": docThemeColor,
      }}
    >
      <div className="rb-doc-name">{personal.name || "Your Name"}</div>
      {personal.title && <div className="rb-doc-title">{personal.title}</div>}
      <div className="rb-doc-contact">
        {personal.email    && <span>✉ {personal.email}</span>}
        {personal.phone    && <span>📱 {personal.phone}</span>}
        {personal.location && <span>📍 {personal.location}</span>}
        {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
        {personal.portfolio&& <span>💻 {personal.portfolio}</span>}
      </div>

      {summary && (
        <div className="rb-doc-section">
          <div className="rb-doc-section-title">Summary</div>
          <div className="rb-doc-summary">{summary}</div>
        </div>
      )}

      {experiences.some(e => e.company || e.role) && (
        <div className="rb-doc-section">
          <div className="rb-doc-section-title">Experience</div>
          {experiences.filter(e => e.company || e.role).map(exp => (
            <div key={exp.id} className="rb-doc-entry">
              <div className="rb-doc-entry-header">
                <span className="rb-doc-entry-title">{exp.role || "Role"}</span>
                <span className="rb-doc-entry-date">
                  {exp.startDate ? exp.startDate.replace("-", "/") : ""}{exp.startDate && " – "}{exp.current ? "Present" : (exp.endDate ? exp.endDate.replace("-", "/") : "")}
                </span>
              </div>
              <div className="rb-doc-entry-sub">{exp.company}</div>
              {exp.bullets.filter(b => b).length > 0 && (
                <ul className="rb-doc-bullets">
                  {exp.bullets.filter(b => b).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {educations.some(e => e.school || e.degree) && (
        <div className="rb-doc-section">
          <div className="rb-doc-section-title">Education</div>
          {educations.filter(e => e.school || e.degree).map(edu => (
            <div key={edu.id} className="rb-doc-entry">
              <div className="rb-doc-entry-header">
                <span className="rb-doc-entry-title">{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>
                <span className="rb-doc-entry-date">{edu.startYear}{edu.startYear && edu.endYear && " – "}{edu.endYear}</span>
              </div>
              <div className="rb-doc-entry-sub">{edu.school}{edu.gpa ? ` · GPA: ${edu.gpa}` : ""}</div>
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div className="rb-doc-section">
          <div className="rb-doc-section-title">Skills</div>
          <div className="rb-doc-skills-grid">
            {skills.map(sk => <span key={sk} className="rb-doc-skill-tag">{sk}</span>)}
          </div>
        </div>
      )}

      {projects.some(p => p.name) && (
        <div className="rb-doc-section">
          <div className="rb-doc-section-title">Projects</div>
          {projects.filter(p => p.name).map(proj => (
            <div key={proj.id} className="rb-doc-entry">
              <div className="rb-doc-entry-header">
                <span className="rb-doc-entry-title">{proj.name}</span>
                {proj.url && <span className="rb-doc-entry-date" style={{ fontSize: "0.68rem", color: docThemeColor }}>{proj.url}</span>}
              </div>
              {proj.tech && <div className="rb-doc-entry-sub">{proj.tech}</div>}
              {proj.description && <div style={{ fontSize: "0.78rem", color: "#334155" }}>{proj.description}</div>}
            </div>
          ))}
        </div>
      )}

      {!personal.name && !summary && experiences.every(e => !e.company) && (
        <div className="rb-doc-empty">Fill in the form on the left to see your resume build in real time ✨</div>
      )}
    </div>
  );

  const renderActiveStep = () => {
    switch (step) {
      case 0: return renderStepPersonal();
      case 1: return renderStepSummary();
      case 2: return renderStepExperience();
      case 3: return renderStepEducation();
      case 4: return renderStepSkills();
      case 5: return renderStepProjects();
      case 6:
        return (
          <div>
            <div className="rb-section-heading">
              <h2>Preview & Export</h2>
              <p>Your resume is ready. Adjust font size and colors, then download as PDF.</p>
            </div>
            {renderFontToolbar()}
            {renderResumePreview()}
            <button className="rb-download-btn" style={{ marginTop: 24 }} onClick={handlePrint}>
              ⬇ Download as PDF
            </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="rb-shell">
      {/* Top bar */}
      <div className="rb-topbar">
        <button className="rb-back-btn" onClick={() => navigate("/resumes")}>
          ← Back to Resumes
        </button>
        <span className="rb-topbar-title">✦ Resume Builder</span>
        <button className="rb-save-btn" onClick={handlePrint}>
          ⬇ Export PDF
        </button>
      </div>

      {/* Stepper */}
      <div className="rb-stepper-wrapper">
        <div className="rb-stepper">
          {STEPS.map((s, i) => (
            <div key={s.id} className="rb-step-item">
              <button
                className={`rb-step-btn ${i === step ? "active" : i < step ? "done" : ""}`}
                onClick={() => i < step && setStep(i)}
              >
                <div className="rb-step-circle">{i < step ? "✓" : i + 1}</div>
                <span className="rb-step-label">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`rb-step-connector ${i < step ? "done" : ""}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="rb-progress-bar">
        <div className="rb-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Body */}
      <div className="rb-body">
        {/* Form panel */}
        <div className="rb-form-panel">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderActiveStep()}
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <div className="rb-nav-row">
            <button
              className="rb-btn-prev"
              disabled={step === 0}
              onClick={() => setStep(s => s - 1)}
            >
              ← Previous
            </button>
            {step < STEPS.length - 1 ? (
              <button className="rb-btn-next" onClick={() => setStep(s => s + 1)}>
                Next →
              </button>
            ) : (
              <button className="rb-btn-finish" onClick={() => navigate("/resumes")}>
                ✓ Finish &amp; Go to Resumes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

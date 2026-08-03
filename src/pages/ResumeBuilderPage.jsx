import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Check } from "lucide-react";
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
import { uploadResume } from "../services/resumeService";
import AiPromptModal from "../components/AiPromptModal";
import CustomMonthPicker from "../components/CustomMonthPicker";
import CustomYearPicker from "../components/CustomYearPicker";
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

const SESSION_KEY = "cl_resume_builder_session";

const loadSavedSession = () => {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Session restore error:", e);
  }
  return null;
};

export default function ResumeBuilderPage() {
  const navigate = useNavigate();
  const savedData = loadSavedSession();

  const [step, setStep] = useState(savedData?.step ?? 0);
  const [skillInput, setSkillInput] = useState("");
  const [aiLoading, setAiLoading] = useState({});
  const printRef = useRef(null);

  /* ─── Form state with Session Persistence ─── */
  const [personal, setPersonal] = useState(savedData?.personal || {
    name: "", title: "", email: "", phone: "", location: "", linkedin: "", portfolio: "",
  });
  const [summary, setSummary] = useState(savedData?.summary ?? "");
  const [experiences, setExperiences] = useState(savedData?.experiences || [defaultExperience(), defaultExperience()]);
  const [educations, setEducations] = useState(savedData?.educations || [defaultEducation()]);
  const [skills, setSkills] = useState(savedData?.skills || [
    "JavaScript", "TypeScript", "React.js", "Node.js", "Express.js",
    "HTML5/CSS3", "Tailwind CSS", "MongoDB", "PostgreSQL", "RESTful APIs",
    "Git & GitHub", "Docker", "AWS", "Agile/Scrum", "Problem Solving", "Team Leadership"
  ]);
  const [projects, setProjects] = useState(savedData?.projects || [defaultProject(), defaultProject()]);
  const [docFontSize, setDocFontSize] = useState(savedData?.docFontSize || 10);
  const [docThemeColor, setDocThemeColor] = useState(savedData?.docThemeColor || "#6366f1");
  const [docFontFamily, setDocFontFamily] = useState(savedData?.docFontFamily || "inter");
  const [docTemplateType, setDocTemplateType] = useState(savedData?.docTemplateType || "single-column");

  const setAiKeyLoading = (key, val) => setAiLoading(p => ({ ...p, [key]: val }));

  /* ─── Auto-Save Session Effect ─── */
  useEffect(() => {
    try {
      const stateToSave = {
        personal, summary, experiences, educations, skills, projects,
        docFontSize, docThemeColor, docFontFamily, docTemplateType, step
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn("Session auto-save error:", e);
    }
  }, [personal, summary, experiences, educations, skills, projects, docFontSize, docThemeColor, docFontFamily, docTemplateType, step]);

  const handleClearSession = () => {
    if (window.confirm("Are you sure you want to clear your current resume draft and start fresh?")) {
      localStorage.removeItem(SESSION_KEY);
      setPersonal({ name: "", title: "", email: "", phone: "", location: "", linkedin: "", portfolio: "" });
      setSummary("");
      setExperiences([defaultExperience(), defaultExperience()]);
      setEducations([defaultEducation()]);
      setSkills(["JavaScript", "React.js", "Node.js"]);
      setProjects([defaultProject(), defaultProject()]);
      setStep(0);
    }
  };

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

  /* ─── AI Prompt Modal State & Inline Prompts ─── */
  const [inlinePrompts, setInlinePrompts] = useState({});
  const [promptModal, setPromptModal] = useState({
    isOpen: false,
    title: "",
    defaultHint: "",
    onGenerate: null,
  });

  const openPromptModal = (title, defaultHint, onGenerate) => {
    setPromptModal({
      isOpen: true,
      title,
      defaultHint,
      onGenerate,
    });
  };

  const closePromptModal = () => {
    setPromptModal(prev => ({ ...prev, isOpen: false }));
  };

  /* ─── Direct Groq Execution Handlers ─── */
  const executeGroqSummary = async (userPrompt = "") => {
    const aiBtn = document.querySelector(".rb-ai-btn");
    if (aiBtn) animate(aiBtn, { scale: [1, 1.06, 1], duration: 350, ease: "outQuad" });
    setAiKeyLoading("summary", true);
    try {
      const generated = await generateAiSummary(personal.title || "Full Stack Developer", personal.name || "Candidate", userPrompt);
      setSummary(generated);
    } catch (e) {
      console.error(e);
    } finally {
      setAiKeyLoading("summary", false);
    }
  };

  const executeGroqProject = async (targetId, cardIdx = 0, userPrompt = "") => {
    const key = targetId ? `proj_${targetId}` : "project";
    setAiKeyLoading(key, true);
    try {
      const existingNames = projects.map(p => p.name).filter(Boolean);
      const proj = await generateAiProject(personal.title || "Full Stack Developer", cardIdx, existingNames, userPrompt);
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

  const executeGroqExpBullets = async (expId, role, company, userPrompt = "") => {
    setAiKeyLoading(`exp_${expId}`, true);
    try {
      const targetExp = experiences.find(e => e.id === expId);
      const cardIdx = experiences.findIndex(e => e.id === expId);
      const existingClean = (targetExp?.bullets || []).filter(b => b.trim() !== "");

      const sampleData = [
        { company: "Google", role: personal.title || "Senior Software Engineer", startDate: "2022-01", endDate: "2024-05" },
        { company: "Microsoft", role: "Full Stack Engineer", startDate: "2019-08", endDate: "2021-12" },
        { company: "Amazon Web Services", role: "Software Development Engineer", startDate: "2017-06", endDate: "2019-07" },
      ];
      const fallback = sampleData[(cardIdx >= 0 ? cardIdx : 0) % sampleData.length];

      const effectiveRole = role || targetExp?.role || fallback.role;
      const effectiveCompany = company || targetExp?.company || fallback.company;

      const newBullets = await generateAiExperienceBullets(
        effectiveRole,
        effectiveCompany,
        existingClean,
        userPrompt
      );

      const freshBullets = newBullets.filter(
        nb => !existingClean.some(eb => eb.toLowerCase().trim() === nb.toLowerCase().trim())
      );

      const finalAdditions = freshBullets.length > 0 ? freshBullets : [
        `Spearheaded automated performance profiling at ${effectiveCompany}, cutting memory overhead by 35%.`,
        `Optimized API serialization protocols, boosting throughput by 40% across client connections.`,
        `Integrated OpenTelemetry distributed tracing to diagnose cross-service latencies in real time.`
      ];

      setExperiences(exps => exps.map(e => {
        if (e.id !== expId) return e;
        const currentClean = (e.bullets || []).filter(b => b.trim() !== "");
        return {
          ...e,
          company: e.company && e.company.trim() !== "" ? e.company : fallback.company,
          role: e.role && e.role.trim() !== "" ? e.role : fallback.role,
          startDate: e.startDate && e.startDate.trim() !== "" ? e.startDate : fallback.startDate,
          endDate: (e.endDate || e.current) ? e.endDate : fallback.endDate,
          bullets: [...currentClean, ...finalAdditions]
        };
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setAiKeyLoading(`exp_${expId}`, false);
    }
  };

  const executeGroqSkills = async (userPrompt = "") => {
    setAiKeyLoading("skills", true);
    try {
      const recs = await generateAiSkills(personal.title || "Full Stack Developer", userPrompt);
      setSkills(prev => Array.from(new Set([...prev, ...recs])));
    } catch (e) {
      console.error(e);
    } finally {
      setAiKeyLoading("skills", false);
    }
  };

  /* ─── AI Action Handlers (Open Modal) ─── */
  const handleAiSummary = () => {
    openPromptModal(
      "✨ Custom AI Executive Summary",
      "e.g. Focus on Full-Stack leadership, React/Node microservices, and 40% performance gains...",
      (userPrompt) => executeGroqSummary(userPrompt)
    );
  };

  const handleAiExpBullets = (expId, role, company) => {
    openPromptModal(
      `✨ Custom AI Experience Bullets - ${company || 'Workplace'}`,
      "e.g. Emphasize AWS serverless architecture, CI/CD deployment, and 99.9% uptime metrics...",
      (userPrompt) => executeGroqExpBullets(expId, role, company, userPrompt)
    );
  };

  const handleAiSkills = () => {
    openPromptModal(
      "✨ Custom AI Skills Recommendation",
      "e.g. Suggest modern cloud & DevOps tools like Docker, Kubernetes, Terraform, and AWS...",
      (userPrompt) => executeGroqSkills(userPrompt)
    );
  };

  const handleAiProject = (targetId, cardIdx = 0) => {
    openPromptModal(
      `✨ Custom AI Project Idea & Description`,
      "e.g. Generate an E-commerce microservices project using Kafka, Redis, and React...",
      (userPrompt) => executeGroqProject(targetId, cardIdx, userPrompt)
    );
  };

  /* ─── Helper: Render Inline Groq AI Custom Prompt Assistant Card ─── */
  const renderInlineGroqPromptBar = (sectionKey, sectionTitle, placeholderHint, onGenerateCallback) => (
    <div className="rb-groq-inline-card">
      <div className="rb-groq-header-row">
        <div className="rb-groq-badge">
          <Sparkles size={14} color="#a855f7" className="aip-sparkle" />
          <span>GROQ AI CUSTOM PROMPT ASSISTANT</span>
        </div>
        <span className="rb-groq-sub-text">Type custom prompt or click presets below to generate tailored {sectionTitle} with Groq AI</span>
      </div>

      <div className="rb-groq-input-row">
        <input
          type="text"
          className="rb-groq-input"
          placeholder={placeholderHint || "Type custom instructions for Groq AI..."}
          value={inlinePrompts[sectionKey] || ""}
          onChange={(e) => setInlinePrompts(prev => ({ ...prev, [sectionKey]: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onGenerateCallback(inlinePrompts[sectionKey] || "");
            }
          }}
        />
        <button
          type="button"
          className="rb-groq-action-btn"
          disabled={aiLoading[sectionKey]}
          onClick={() => onGenerateCallback(inlinePrompts[sectionKey] || "")}
        >
          {aiLoading[sectionKey] ? <Loader2 size={14} className="rb-ai-spin" /> : <Sparkles size={14} />}
          <span>{aiLoading[sectionKey] ? "Groq Generating..." : "Generate with Groq AI"}</span>
        </button>
      </div>

      <div className="rb-groq-preset-chips">
        <span className="rb-chip-lbl">Quick Presets:</span>
        {[
          "🚀 FAANG High-Impact Metrics",
          "⚡ High-Growth Startup Tech",
          "🛡️ Cloud Microservices & Security",
          "📊 40% Latency & Cost Reduction",
        ].map((preset) => (
          <button
            key={preset}
            type="button"
            className="rb-groq-chip-btn"
            onClick={() => {
              setInlinePrompts(prev => ({ ...prev, [sectionKey]: preset }));
            }}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );

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

      const formatEduDateDisplay = (dStr) => {
        if (!dStr) return "";
        if (dStr.includes("-")) {
          const [y, m] = dStr.split("-");
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const mIdx = (parseInt(m, 10) || 1) - 1;
          return `${monthNames[mIdx] || ""} ${y}`.trim();
        }
        return dStr;
      };

      const eduText = educations
        .filter(e => e.school || e.degree)
        .map(e => `${e.degree || "Degree"}${e.field ? ` in ${e.field}` : ""} | ${e.school} | ${formatEduDateDisplay(e.startYear)} - ${formatEduDateDisplay(e.endYear)}${e.gpa ? ` | GPA: ${e.gpa}` : ""}`)
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

      return await generateResumePDF({
        editedSections,
        fileName: `${(personal.name || "Candidate").replace(/\s+/g, "_")}_${(personal.title || "Software_Engineer").replace(/\s+/g, "_")}_Resume`,
        templateType: docTemplateType,
        primaryColor: docThemeColor,
        pageMargins: 1,
        sectionSpacing: computedSpacing,
        baseFontSize: docFontSize,
        fontFamily: docFontFamily,
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
        <span className="rb-font-label">Layout Template:</span>
        {[
          { id: "single-column", label: "Single Column 📄" },
          { id: "two-column", label: "Two Column 📑" },
          { id: "minimal", label: "Minimalist 🎨" },
          { id: "executive", label: "Executive 🏛️" },
        ].map(t => (
          <button
            key={t.id}
            className={`rb-preset-btn${docTemplateType === t.id ? " active" : ""}`}
            onClick={() => setDocTemplateType(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rb-font-control-group">
        <span className="rb-font-label">Font Family:</span>
        {[
          { id: "inter", label: "Inter (Tech)" },
          { id: "serif", label: "Georgia (Harvard)" },
          { id: "outfit", label: "Outfit (SaaS)" },
          { id: "mono", label: "Mono (Dev)" },
        ].map(f => (
          <button
            key={f.id}
            className={`rb-preset-btn${docFontFamily === f.id ? " active" : ""}`}
            onClick={() => setDocFontFamily(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

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
        {["#000000", "#6366f1", "#10b981", "#2563eb", "#8b5cf6", "#f43f5e", "#0284c7", "#d97706", "#059669", "#7c3aed", "#475569", "#0f172a"].map(hex => (
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

  const [aiBurst, setAiBurst] = useState(false);

  const triggerAiBurst = () => {
    setAiBurst(true);
    setTimeout(() => setAiBurst(false), 1500);
  };

  const calculateCompletionScore = () => {
    let score = 0;
    if (personal.name) score += 12;
    if (personal.title) score += 8;
    if (personal.email) score += 5;
    if (personal.phone) score += 5;
    if (summary && summary.length > 15) score += 15;
    if (experiences.some(e => e.company && e.role)) score += 20;
    if (experiences.some(e => e.bullets && e.bullets.some(b => b.trim() !== ""))) score += 10;
    if (educations.some(e => e.school)) score += 10;
    if (skills.length >= 5) score += 10;
    if (projects.some(p => p.name)) score += 5;
    return Math.min(100, score);
  };

  const completionScore = calculateCompletionScore();

  /* ─── Slide animation ─── */
  const variants = {
    enter:  { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit:   { opacity: 0, x: -40 },
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  const handleAiPersonal = async () => {
    setAiKeyLoading("personal", true);
    triggerAiBurst();
    try {
      const res = await generateAiPersonal(personal.title || "Full Stack Engineer", personal.name || "Palash Mishra");
      setPersonal(prev => ({
        name: prev.name && prev.name.trim() !== "" ? prev.name : (res.name || "Palash Mishra"),
        title: res.title || prev.title || "Full Stack Engineer",
        email: prev.email && prev.email.trim() !== "" ? prev.email : (res.email || "palash.mishra@email.com"),
        phone: prev.phone && prev.phone.trim() !== "" ? prev.phone : (res.phone || "+91 98765 43210"),
        location: res.location || prev.location || "Mumbai, India",
        linkedin: res.linkedin || prev.linkedin || "linkedin.com/in/palashmishra",
        portfolio: res.portfolio || prev.portfolio || "github.com/palashmishra",
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setAiKeyLoading("personal", false);
    }
  };

  const [isShaking, setIsShaking] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Field validation helpers
  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isNonEmpty = (str) => Boolean(str && str.trim().length > 0);

  const handleNextStep = () => {
    // Validate current step
    if (step === 0 && !isNonEmpty(personal.name)) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    setStep(s => s + 1);
  };

  const handleSubmitSuccess = async () => {
    setSubmitSuccess(true);
    try {
      const fileName = `${(personal.name || "Resume").replace(/\s+/g, "_")}_Resume.pdf`;
      const pdfBytes = await handlePrint();
      if (pdfBytes) {
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const file = new File([blob], fileName, { type: "application/pdf" });
        await uploadResume(file);
      }
    } catch (e) {
      console.error("Failed to upload auto-generated resume:", e);
    }
    setTimeout(() => {
      setSubmitSuccess(false);
      navigate("/resumes");
    }, 1500);
  };

  const renderStepPersonal = () => (
    <div className={isShaking ? "rb-shake" : ""}>
      <div className="rb-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Personal Information</h2>
          <p>Start with your contact details — floating labels & live validation.</p>
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
          { k: "name",      label: "Full Name",          placeholder: " ", valid: isNonEmpty(personal.name) },
          { k: "title",     label: "Professional Title", placeholder: " ", valid: isNonEmpty(personal.title) },
          { k: "email",     label: "Email Address",      placeholder: " ", valid: isValidEmail(personal.email) },
          { k: "phone",     label: "Phone Number",       placeholder: " ", valid: isNonEmpty(personal.phone) },
          { k: "location",  label: "Location",           placeholder: " ", valid: isNonEmpty(personal.location) },
          { k: "linkedin",  label: "LinkedIn URL",       placeholder: " ", valid: isNonEmpty(personal.linkedin) },
          { k: "portfolio", label: "Portfolio / GitHub", placeholder: " ", valid: isNonEmpty(personal.portfolio) },
        ].map(({ k, label, placeholder, valid }) => (
          <div key={k} className={`rb-float-group${k === "portfolio" || k === "linkedin" ? " full" : ""} ${personal[k] ? "has-value" : ""}`}>
            <input
              className="rb-float-input"
              type="text"
              placeholder={placeholder}
              value={personal[k]}
              onChange={e => updatePersonal(k, e.target.value)}
            />
            <label className="rb-float-label">{label}</label>
            {valid && (
              <div className="rb-spring-checkmark">
                <Check size={14} color="#10b981" />
              </div>
            )}
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

      {/* Inline Groq AI Custom Prompt Assistant */}
      {renderInlineGroqPromptBar(
        "summary",
        "Summary",
        "e.g. Focus on Full-Stack Leadership, React/Node microservices, and 40% performance gains...",
        (promptText) => executeGroqSummary(promptText)
      )}

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
      <div className="rb-ai-hint">✨ Tip: Type a custom instruction in the Groq AI box above, or click 'AI Generate Summary' to generate tailored prose.</div>
    </div>
  );

  const renderStepExperience = () => (
    <div>
      <div className="rb-section-heading">
        <h2>Work Experience</h2>
        <p>Add your roles from most recent to oldest. Include measurable impact.</p>
      </div>

      {/* Inline Groq AI Custom Prompt Assistant */}
      {renderInlineGroqPromptBar(
        "experience",
        "Work Experience Bullets",
        "e.g. Emphasize AWS serverless architecture, Docker containerization, and 99.9% uptime...",
        (promptText) => {
          if (experiences.length > 0) {
            executeGroqExpBullets(experiences[0].id, experiences[0].role, experiences[0].company, promptText);
          }
        }
      )}

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
                <CustomMonthPicker
                  value={exp.startDate}
                  onChange={val => updateExp(exp.id, "startDate", val)}
                  placeholder="Select Start Date"
                />
              </div>
              <div className="rb-field">
                <label className="rb-label">End Date</label>
                <CustomMonthPicker
                  value={exp.endDate}
                  onChange={val => updateExp(exp.id, "endDate", val)}
                  placeholder={exp.current ? "Present" : "Select End Date"}
                  disabled={exp.current}
                />
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
                <label className="rb-label">Start Date / Year</label>
                <CustomMonthPicker
                  value={edu.startYear}
                  onChange={val => updateEdu(edu.id, "startYear", val)}
                  placeholder="Select Start Date"
                />
              </div>
              <div className="rb-field">
                <label className="rb-label">End Date / Year</label>
                <CustomMonthPicker
                  value={edu.endYear}
                  onChange={val => updateEdu(edu.id, "endYear", val)}
                  placeholder="Select End Date"
                />
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

      {/* Inline Groq AI Custom Prompt Assistant */}
      {renderInlineGroqPromptBar(
        "skills",
        "Skills",
        "e.g. Suggest modern cloud & DevOps tools like Docker, Kubernetes, Terraform, and AWS...",
        (promptText) => executeGroqSkills(promptText)
      )}

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
          {[
            "Next.js", "Python", "GraphQL", "Kubernetes", "Redis",
            "CI/CD Pipelines", "System Design", "Microservices", "Jest & RTL",
            "Java", "C++", "Google Cloud", "UI/UX Design", "Communication", "Cross-Functional Collaboration"
          ].map(s => (
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

      {/* Inline Groq AI Custom Prompt Assistant Card */}
      {renderInlineGroqPromptBar(
        "projects",
        "Projects",
        "e.g. Build an E-Commerce Microservices app with React, Kafka, Redis, sub-50ms latency...",
        (promptText) => executeGroqProject(null, 0, promptText)
      )}
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
  const renderResumePreview = () => {
    const isTwoColumn = docTemplateType === "two-column";

    const renderHeader = () => (
      <div className="rb-doc-header-block">
        <div className="rb-doc-name">{personal.name || "Your Name"}</div>
        {personal.title && <div className="rb-doc-title">{personal.title}</div>}
        <div className="rb-doc-contact">
          {personal.email    && <span>✉ {personal.email}</span>}
          {personal.phone    && <span>📱 {personal.phone}</span>}
          {personal.location && <span>📍 {personal.location}</span>}
          {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
          {personal.portfolio&& <span>💻 {personal.portfolio}</span>}
        </div>
      </div>
    );

    const renderSummarySection = () => summary && (
      <div className="rb-doc-section">
        <div className="rb-doc-section-title">Summary</div>
        <div className="rb-doc-summary">{summary}</div>
      </div>
    );

    const renderExperienceSection = () => experiences.some(e => e.company || e.role) && (
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
    );

    const renderEducationSection = () => educations.some(e => e.school || e.degree) && (
      <div className="rb-doc-section">
        <div className="rb-doc-section-title">Education</div>
        {educations.filter(e => e.school || e.degree).map(edu => (
          <div key={edu.id} className="rb-doc-entry">
            <div className="rb-doc-entry-header">
              <span className="rb-doc-entry-title">{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>
              <span className="rb-doc-entry-date">
                {edu.startYear ? edu.startYear.replace("-", "/") : ""}{edu.startYear && edu.endYear && " – "}{edu.endYear ? edu.endYear.replace("-", "/") : ""}
              </span>
            </div>
            <div className="rb-doc-entry-sub">{edu.school}{edu.gpa ? ` · GPA: ${edu.gpa}` : ""}</div>
          </div>
        ))}
      </div>
    );

    const renderSkillsSection = () => skills.length > 0 && (
      <div className="rb-doc-section">
        <div className="rb-doc-section-title">Skills</div>
        <div className="rb-doc-skills-grid">
          {skills.map(sk => <span key={sk} className="rb-doc-skill-tag">{sk}</span>)}
        </div>
      </div>
    );

    const renderProjectsSection = () => projects.some(p => p.name) && (
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
    );

    return (
      <div
        className={`rb-resume-doc template-${docTemplateType}`}
        ref={printRef}
        style={{
          "--doc-scale": docFontSize / 10,
          "--doc-theme": docThemeColor,
          fontFamily: docFontFamily === "serif" ? "Georgia, 'Times New Roman', serif" :
                      docFontFamily === "mono" ? "'Fira Code', monospace" :
                      docFontFamily === "outfit" ? "'Outfit', sans-serif" : "'Inter', sans-serif"
        }}
      >
        {!personal.name && !summary && experiences.every(e => !e.company) ? (
          <div className="rb-doc-empty">Fill in the form on the left to see your resume build in real time ✨</div>
        ) : isTwoColumn ? (
          <div className="rb-layout-two-col">
            {/* Sidebar Column (Left) */}
            <div className="rb-sidebar-col" style={{ borderRight: `1.5px solid ${docThemeColor}33` }}>
              {/* Initials Avatar */}
              <div className="rb-avatar-badge" style={{ background: docThemeColor }}>
                {(personal.name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="rb-sidebar-title">{personal.name || "Your Name"}</div>
              {personal.title && <div className="rb-sidebar-subtitle">{personal.title}</div>}
              
              <div className="rb-sidebar-section">
                <div className="rb-sidebar-section-title" style={{ color: docThemeColor }}>Contact</div>
                <div className="rb-sidebar-contact-list">
                  {personal.email && <div>✉ {personal.email}</div>}
                  {personal.phone && <div>📱 {personal.phone}</div>}
                  {personal.location && <div>📍 {personal.location}</div>}
                  {personal.linkedin && <div>🔗 {personal.linkedin}</div>}
                  {personal.portfolio && <div>💻 {personal.portfolio}</div>}
                </div>
              </div>

              {renderSkillsSection()}
              {renderEducationSection()}
            </div>

            {/* Main Content Column (Right) */}
            <div className="rb-main-col">
              {renderSummarySection()}
              {renderExperienceSection()}
              {renderProjectsSection()}
            </div>
          </div>
        ) : (
          <div className="rb-layout-single-col">
            {renderHeader()}
            {renderSummarySection()}
            {renderExperienceSection()}
            {renderEducationSection()}
            {renderSkillsSection()}
            {renderProjectsSection()}
          </div>
        )}
      </div>
    );
  };

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
            <button
              className={`rb-download-btn ${submitSuccess ? "success-morph" : ""}`}
              style={{ marginTop: 24 }}
              onClick={handleSubmitSuccess}
            >
              {submitSuccess ? "✓ Submitted & Exporting PDF..." : "⬇ Download as PDF"}
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
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="rb-preset-btn"
            style={{ padding: "6px 14px", color: "#f87171", borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)" }}
            onClick={handleClearSession}
            title="Reset form draft"
          >
            Clear Draft 🗑️
          </button>
          <button className={`rb-save-btn ${submitSuccess ? "success-morph" : ""}`} onClick={handleSubmitSuccess}>
            {submitSuccess ? "✓ Exporting..." : "⬇ Export PDF"}
          </button>
        </div>
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
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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
              <button className="rb-btn-next" onClick={handleNextStep}>
                Next →
              </button>
            ) : (
              <button
                className={`rb-btn-finish ${submitSuccess ? "success-morph" : ""}`}
                onClick={handleSubmitSuccess}
              >
                {submitSuccess ? "✓ Submitted!" : "✓ Finish & Go to Resumes"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Custom Prompt Modal */}
      <AiPromptModal
        isOpen={promptModal.isOpen}
        onClose={closePromptModal}
        onGenerate={promptModal.onGenerate}
        title={promptModal.title}
        defaultHint={promptModal.defaultHint}
      />
    </div>
  );
}

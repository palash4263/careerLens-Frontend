import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Check, Edit2 } from "lucide-react";
import { animate, stagger } from "animejs";
import {
  generateAiSummary,
  generateAiExperienceBullets,
  generateAiSkills,
  generateAiProject,
  generateAiProjectBullets,
  generateProjectBulletsWithClaude
} from "../services/groqService";
import { generateResumePDF } from "../utils/pdfGenerator";
import { uploadResume, getResumes } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import { extractKeywords, parseSections } from "../utils/resumeOptimizer";
import AiPromptModal from "../components/AiPromptModal";
import CustomMonthPicker from "../components/CustomMonthPicker";
import CustomYearPicker from "../components/CustomYearPicker";
import {
  TargetJdStep,
  PersonalStep,
  SummaryStep,
  ExperienceStep,
  EducationStep,
  SkillsStep,
  ProjectsStep,
} from "../components/resume-builder-steps";
import "./ResumeBuilderPage.css";

/* ─── Step config ─── */
const STEPS = [
  { id: "targetJd",   label: "Target Job"  },
  { id: "personal",   label: "Personal"    },
  { id: "summary",    label: "Summary"     },
  { id: "experience", label: "Experience"  },
  { id: "education",  label: "Education"   },
  { id: "skills",     label: "Skills"      },
  { id: "projects",   label: "Projects"    },
  { id: "preview",    label: "Preview"     },
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
  bullets: [""],
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
  const [darkMode, setDarkMode] = useState(false);
  const printRef = useRef(null);

  /* ─── Form state with Session Persistence ─── */
  const [personal, setPersonal] = useState(savedData?.personal || {
    name: "", title: "", email: "", phone: "", location: "", linkedin: "", portfolio: "",
  });
  const [summary, setSummary] = useState(savedData?.summary ?? "");
  const [experiences, setExperiences] = useState(savedData?.experiences || [defaultExperience(), defaultExperience()]);
  const [educations, setEducations] = useState(savedData?.educations || [defaultEducation()]);
  const [skills, setSkills] = useState(savedData?.skills || []);
  const [projects, setProjects] = useState(savedData?.projects || [defaultProject(), defaultProject()]);
  const [docFontSize, setDocFontSize] = useState(savedData?.docFontSize || 10);
  const [docThemeColor, setDocThemeColor] = useState(savedData?.docThemeColor || "#6366f1");
  const [docFontFamily, setDocFontFamily] = useState(savedData?.docFontFamily || "inter");
  const [docTemplateType, setDocTemplateType] = useState(savedData?.docTemplateType || "single-column");

  /* ─── Target Job Description State ─── */
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [selectedJdId, setSelectedJdId] = useState("");
  const [customJdText, setCustomJdText] = useState("");
  const [jdSkillsExtracted, setJdSkillsExtracted] = useState([]);
  const [jdExtractSuccess, setJdExtractSuccess] = useState("");

  useEffect(() => {
    getJobDescriptions()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setJobDescriptions(data);
          setSelectedJdId(String(data[0].id));
        }
      })
      .catch(err => console.warn("Could not load JDs in ResumeBuilderPage", err));
  }, []);

  /* ─── Uploaded Resumes (for extracting personal details) ─── */
  const [uploadedResumes, setUploadedResumes] = useState([]);
  useEffect(() => {
    getResumes()
      .then(data => { if (Array.isArray(data)) setUploadedResumes(data); })
      .catch(err => console.warn("Could not load uploaded resumes in ResumeBuilderPage", err));
  }, []);

  /* ─── Parse Name/Email/Phone/Location/Links out of a raw resume's Header text ─── */
  const extractPersonalFromResumeText = (text) => {
    if (!text || !text.trim()) return null;
    const header = parseSections(text).Header || text;
    const lines = header.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    const email = (header.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [])[0] || "";
    const phone = (header.match(/(\+?\d{1,3}[\s.-]?)?\(?\d{3,5}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/) || [])[0]?.trim() || "";
    const linkedin = (header.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[^\s,|]+/i) || [])[0] || "";
    const github = (header.match(/(https?:\/\/)?(www\.)?(github|gitlab)\.com\/[^\s,|]+/i) || [])[0] || "";

    const isNoiseLine = (l) => !l || l === email || l === phone || /@|https?:\/\/|linkedin\.com|github\.com|gitlab\.com/i.test(l) || /^\+?\d/.test(l);

    const contactLine = lines.find(l => (email && l.includes(email)) || (phone && l.includes(phone))) || "";
    let location = "";
    if (contactLine) {
      const tokens = contactLine.split("|").map(t => t.trim()).filter(Boolean);
      location = tokens.find(t => !isNoiseLine(t)) || "";
    }

    const name = lines.find(l => l !== contactLine && !isNoiseLine(l)) || "";
    const ROLE_HINT = /\b(developer|engineer|designer|manager|analyst|architect|consultant|specialist|lead|intern|scientist)\b/i;
    const nameIdx = lines.indexOf(name);
    const title = (nameIdx >= 0 ? lines.slice(nameIdx + 1) : []).find(l => l !== contactLine && !isNoiseLine(l) && ROLE_HINT.test(l)) || "";

    if (!email && !phone && !name) return null;
    return { name, title, email, phone, location, linkedin, portfolio: github };
  };

  const MONTH_MAP = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
    sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
  };
  const toYearMonth = (part) => {
    if (!part) return "";
    const t = part.trim();
    if (/^\d{4}-\d{2}$/.test(t)) return t;
    const m = t.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/);
    if (m) {
      const mm = MONTH_MAP[m[1].toLowerCase()];
      if (mm) return `${m[2]}-${String(mm).padStart(2, "0")}`;
    }
    if (/^\d{4}$/.test(t)) return t;
    return t;
  };

  /* ─── Parse Company/Role/Dates/Bullets out of a raw resume's Experience section ─── */
  const extractExperiencesFromResumeText = (text) => {
    if (!text || !text.trim()) return [];
    const expSection = parseSections(text).Experience;
    if (!expSection || !expSection.trim()) return [];

    const DATE_RANGE = /((?:[A-Za-z]{3,9}\.?\s+)?\d{4}(?:-\d{2})?)\s*(?:[-–—]+\s*((?:[A-Za-z]{3,9}\.?\s+)?\d{4}(?:-\d{2})?|Present|Current|Till\s+Date|Now))?/i;
    const JOB_TITLE_REGEX = /\b(?:engineer|developer|architect|lead|manager|consultant|analyst|specialist|administrator|designer|director|intern|associate|officer|coordinator|founder|scientist)\b/i;

    const lines = expSection.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const blocks = [];
    let current = null;
    const flush = () => { if (current && (current.role || current.company || current.bullets.length)) blocks.push(current); current = null; };

    // Once role & company are both known, any further plain text line is a bullet/description
    // line — PDFs generated by this app draw bullet dots as vector shapes, so extracted text
    // has NO leading "•"/"-"/"*" marker on those lines at all.
    const assignField = (cur, text) => {
      if (!text) return;
      if (!cur.role && !cur.company) {
        if (JOB_TITLE_REGEX.test(text)) cur.role = text;
        else cur.company = text;
      } else if (!cur.role) {
        cur.role = text;
      } else if (!cur.company) {
        cur.company = text;
      } else {
        cur.bullets.push(text);
      }
    };

    for (const line of lines) {
      const isMarkedBullet = /^[•+*-]/.test(line);
      if (isMarkedBullet) {
        if (!current) current = { role: "", company: "", dateText: "", bullets: [] };
        current.bullets.push(line.replace(/^[•+*-]\s*/, "").trim());
        continue;
      }

      const dateMatch = line.match(DATE_RANGE);
      const hasDate = dateMatch && /\d{4}/.test(dateMatch[0]);
      const hasPipe = line.includes("|");

      if ((hasPipe || hasDate) && current && (current.bullets.length > 0 || (current.role && current.company))) {
        flush();
      }
      if (!current) current = { role: "", company: "", dateText: "", bullets: [] };

      if (hasPipe) {
        const parts = line.split("|").map(p => p.trim()).filter(Boolean);
        const datePart = parts.find(p => /\d{4}/.test(p) && DATE_RANGE.test(p));
        const textParts = parts.filter(p => p !== datePart);
        if (datePart) current.dateText = datePart;
        if (textParts.length >= 2) {
          const [a, b] = textParts;
          if (JOB_TITLE_REGEX.test(a) && !JOB_TITLE_REGEX.test(b)) { current.role = current.role || a; current.company = current.company || b; }
          else if (JOB_TITLE_REGEX.test(b) && !JOB_TITLE_REGEX.test(a)) { current.role = current.role || b; current.company = current.company || a; }
          else { current.role = current.role || a; current.company = current.company || b; }
        } else if (textParts.length === 1) {
          assignField(current, textParts[0]);
        }
      } else if (hasDate) {
        current.dateText = dateMatch[0];
        const rest = line.replace(dateMatch[0], "").replace(/^[\s,|–—-]+|[\s,|–—-]+$/g, "").trim();
        assignField(current, rest);
      } else {
        assignField(current, line);
      }
    }
    flush();

    return blocks.filter(b => b.role || b.company).map(b => {
      const dm = b.dateText.match(DATE_RANGE);
      let startDate = "", endDate = "", isCurrent = false;
      if (dm) {
        startDate = toYearMonth(dm[1]);
        if (dm[2]) {
          if (/present|current|now|till/i.test(dm[2])) isCurrent = true;
          else endDate = toYearMonth(dm[2]);
        }
      }
      return {
        id: Date.now() + Math.random(),
        company: b.company || "",
        role: b.role || "",
        startDate, endDate, current: isCurrent,
        bullets: b.bullets.length ? b.bullets : [""],
      };
    });
  };

  /* ─── Parse School/Degree/Field/Dates/GPA out of a raw resume's Education section ─── */
  const extractEducationFromResumeText = (text) => {
    if (!text || !text.trim()) return [];
    const eduSection = parseSections(text).Education;
    if (!eduSection || !eduSection.trim()) return [];

    const DEGREE_REGEX = /\b(bachelor|master|b\.?\s?tech|m\.?\s?tech|b\.?\s?sc|m\.?\s?sc|b\.?\s?e\b|m\.?\s?e\b|bca|mca|mba|phd|ph\.d|diploma|associate)\b/i;
    const YEAR_RANGE = /((?:[A-Za-z]{3,9}\.?\s+)?\d{4})\s*(?:[-–—]+\s*((?:[A-Za-z]{3,9}\.?\s+)?\d{4}|Present|Current))?/i;
    const GPA_REGEX = /GPA\s*[:\-]?\s*([\d.]+\s*\/\s*[\d.]+|[\d.]+%?)/i;

    // PDF text extraction often leaves stray connector-word fragments on their own line
    // (e.g. a wrapped "B.Tech in Computer Science" splits across a column break, leaving
    // a lone "in" line) — these must never be mistaken for a real school/degree name.
    const JUNK_LINE = /^(in|of|and|the|at|for|with|to|&|,|-)$/i;
    const lines = eduSection.split(/\r?\n/).map(l => l.trim()).filter(l => l && !JUNK_LINE.test(l));
    const entries = [];
    let current = null;
    const flush = () => { if (current && (current.school || current.degree)) entries.push(current); current = null; };

    const setDegree = (cur, text) => {
      const inSplit = text.split(/\s+in\s+/i);
      cur.degree = inSplit[0].trim();
      if (inSplit[1] && !cur.field) cur.field = inSplit[1].trim();
    };

    const assignField = (cur, text) => {
      if (!text) return;
      const looksLikeDegree = DEGREE_REGEX.test(text);
      if (!cur.school && !cur.degree) {
        if (looksLikeDegree) setDegree(cur, text);
        else cur.school = text;
      } else if (!cur.degree) {
        setDegree(cur, text);
      } else if (!cur.school) {
        cur.school = text;
      }
    };

    for (const line of lines) {
      const gpaMatch = line.match(GPA_REGEX);
      const dateMatch = line.match(YEAR_RANGE);
      const hasDate = dateMatch && /\d{4}/.test(dateMatch[0]);
      const hasPipe = line.includes("|");

      if ((hasPipe || hasDate) && current && current.school && current.degree) {
        flush();
      }
      if (!current) current = { school: "", degree: "", field: "", gpa: "", dateText: "" };

      if (gpaMatch) current.gpa = gpaMatch[1].trim();

      if (hasPipe) {
        const parts = line.split("|").map(p => p.trim()).filter(Boolean);
        for (const part of parts) {
          if (GPA_REGEX.test(part)) continue;
          const pDate = part.match(YEAR_RANGE);
          if (pDate && /\d{4}/.test(pDate[0])) { current.dateText = pDate[0]; continue; }
          if (DEGREE_REGEX.test(part) && !current.degree) {
            setDegree(current, part);
            continue;
          }
          assignField(current, part);
        }
      } else if (hasDate) {
        current.dateText = dateMatch[0];
        const rest = line.replace(dateMatch[0], "").replace(/^[\s,|–—-]+|[\s,|–—-]+$/g, "").replace(GPA_REGEX, "").trim();
        if (rest) assignField(current, rest);
      } else if (!gpaMatch) {
        assignField(current, line);
      }
    }
    flush();

    const toYear = (part) => {
      if (!part) return "";
      const y = (part.match(/\d{4}/) || [])[0];
      if (!y) return "";
      const iso = toYearMonth(part.trim());
      return /^\d{4}-\d{2}$/.test(iso) ? iso : `${y}-01`;
    };

    // School-level entries (Class X/XII, SSC, HSC) rarely state a "degree" the way a
    // college entry does — infer a sensible label instead of leaving Degree blank.
    const inferSchoolLevelDegree = (schoolText) => {
      if (!schoolText) return "";
      const t = schoolText.toLowerCase();
      if (/\b(xii|12th|class\s*12|grade\s*12)\b/.test(t)) return "Higher Secondary (Class XII)";
      if (/\b(10th|class\s*10|grade\s*10)\b/.test(t)) return "Secondary (Class X)";
      if (/\bssc\b/.test(t)) return "Secondary School Certificate (SSC)";
      if (/\bhsc\b/.test(t)) return "Higher Secondary Certificate (HSC)";
      return "";
    };

    return entries
      // Drop phantom entries where school/degree only picked up a short, meaningless fragment
      .filter(e => (e.school && e.school.trim().length > 2) || (e.degree && e.degree.trim().length > 2))
      .map(e => {
        const dm = (e.dateText || "").match(YEAR_RANGE);
        let startYear = "", endYear = "";
        if (dm) {
          startYear = toYear(dm[1]);
          if (dm[2] && !/present|current/i.test(dm[2])) endYear = toYear(dm[2]);
        }
        return {
          id: Date.now() + Math.random(),
          school: e.school || "",
          degree: e.degree || inferSchoolLevelDegree(e.school) || "",
          field: e.field || "",
          startYear, endYear,
          gpa: e.gpa || "",
        };
      });
  };

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
      setSkills([]);
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

  // Strip exact-duplicate bullet lines (case/whitespace-insensitive) wherever bullets are
  // rendered or exported — a safety net for bullets that were duplicated by an earlier bug
  // and are still sitting in a saved draft. Keeps each bullet's ORIGINAL array index so
  // inline-edit handlers (which write back by index) still target the right entry.
  const visibleBullets = (bullets) => {
    const seen = new Set();
    return (bullets || [])
      .map((b, idx) => ({ b, idx }))
      .filter(({ b }) => {
        const key = b.trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };
  const dedupeBullets = (bullets) => visibleBullets(bullets).map(({ b }) => b);

  /* ─── AI Prompt Modal State ─── */
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

  const executeGroqProjectWithJdSkills = async (targetId, cardIdx = 0) => {
    const key = targetId ? `proj_${targetId}` : "project";
    setAiKeyLoading(key, true);
    try {
      let targetJdText = "";
      if (selectedJdId === "custom") {
        targetJdText = customJdText;
      } else if (selectedJdId) {
        const found = jobDescriptions.find(j => String(j.id) === String(selectedJdId));
        targetJdText = found?.description || found?.title || "";
      }

      // 1. Gather active extracted JD skills + candidate's skills
      let activeSkills = jdSkillsExtracted;
      if (!activeSkills || activeSkills.length === 0) {
        activeSkills = extractKeywords(targetJdText);
      }
      if (!activeSkills || activeSkills.length === 0) {
        activeSkills = skills;
      }

      const skillsListStr = activeSkills.slice(0, 10).join(", ");
      const userPrompt = `TARGET JD SKILLS TO WEAVE IN: [${skillsListStr || "React, Node.js, Spring Boot, PostgreSQL, Docker, AWS"}]

MANDATORY REQUIREMENTS:
1. The tech stack MUST prominently feature the target JD skills listed above
2. The description MUST explicitly name at least 3-4 of those skills in context (not just list them)
3. Follow Google's XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]"
4. Include at least 2 concrete metrics (latency in ms, throughput req/sec, % improvement, user scale)
5. Show ARCHITECTURAL depth — mention specific patterns (caching, queuing, microservices, indexing) that a senior engineer would recognize
6. Every skill mentioned should be tied to a real technical decision, not name-dropped

The goal is maximum ATS keyword match while remaining technically credible to a hiring engineer.`;

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
      alert("Failed to generate project with JD skills. Please try again.");
    } finally {
      setAiKeyLoading(key, false);
    }
  };

  const executeGroqProjectBullets = async (projId, userPrompt = "") => {
    setAiKeyLoading(`proj_bullets_${projId}`, true);
    try {
      const targetProj = projects.find(p => p.id === projId);
      const existingClean = (targetProj?.bullets || []).filter(b => b.trim() !== "");
      const projectName = targetProj?.name?.trim() || "this project";
      const tech = targetProj?.tech || "";

      const newBullets = await generateProjectBulletsWithClaude(projectName, tech, existingClean, userPrompt);

      const freshBullets = newBullets.filter(
        nb => !existingClean.some(eb => eb.toLowerCase().trim() === nb.toLowerCase().trim())
      );

      if (freshBullets.length === 0) {
        alert("The AI generated bullets that already match your existing ones. Try again, or add a custom prompt to steer it toward a different angle.");
        return;
      }

      setProjects(prev => prev.map(p => {
        if (p.id !== projId) return p;
        const currentClean = (p.bullets || []).filter(b => b.trim() !== "");
        return { ...p, bullets: [...currentClean, ...freshBullets] };
      }));
    } catch (e) {
      console.error(e);
      alert("Failed to generate project bullets. Please try again.");
    } finally {
      setAiKeyLoading(`proj_bullets_${projId}`, false);
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

      if (freshBullets.length === 0) {
        alert("The AI generated bullets that already match your existing ones. Try again, or add a custom prompt to steer it toward a different angle.");
        return;
      }

      setExperiences(exps => exps.map(e => {
        if (e.id !== expId) return e;
        const currentClean = (e.bullets || []).filter(b => b.trim() !== "");
        return {
          ...e,
          company: e.company && e.company.trim() !== "" ? e.company : fallback.company,
          role: e.role && e.role.trim() !== "" ? e.role : fallback.role,
          startDate: e.startDate && e.startDate.trim() !== "" ? e.startDate : fallback.startDate,
          endDate: (e.endDate || e.current) ? e.endDate : fallback.endDate,
          bullets: [...currentClean, ...freshBullets]
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

  const handleExtractSkillsFromJd = async () => {
    setAiKeyLoading("jd_skills", true);
    setJdExtractSuccess("");
    try {
      let targetJdText = "";
      if (selectedJdId === "custom") {
        targetJdText = customJdText;
      } else {
        const found = jobDescriptions.find(j => String(j.id) === String(selectedJdId));
        targetJdText = found?.description || found?.title || "";
      }

      if (!targetJdText.trim()) {
        alert("Please select an uploaded Job Description or paste job text first.");
        return;
      }

      // 1. Fast regex keyword extraction from JD
      const extractedLocal = extractKeywords(targetJdText);

      // 2. Groq AI contextual skills extraction from JD
      let extractedAi = [];
      try {
        extractedAi = await generateAiSkills(
          personal.title || "Full Stack Developer",
          `Extract top 12 core technical and soft skills directly from this Job Description:\n${targetJdText}`
        );
      } catch (e) {
        console.warn("Groq AI JD skills extraction fallback:", e);
      }

      const combinedExtracted = Array.from(new Set([...extractedLocal, ...extractedAi])).filter(Boolean);

      if (combinedExtracted.length > 0) {
        setSkills(prev => Array.from(new Set([...prev, ...combinedExtracted])));
        setJdSkillsExtracted(combinedExtracted);
        setJdExtractSuccess(`Success! Added ${combinedExtracted.length} skills matching your target Job Description.`);
        setTimeout(() => setJdExtractSuccess(""), 5000);
      } else {
        alert("No specific technical skills detected in the provided Job Description text.");
      }
    } catch (err) {
      console.error("Error extracting skills from JD:", err);
      alert("Failed to extract skills from Job Description. Please try again.");
    } finally {
      setAiKeyLoading("jd_skills", false);
    }
  };

  /* ─── Skills auto-extraction disabled - users now manually extract via button ─── */

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

  const handleAutofillExperience = async () => {
    try {
      setAiKeyLoading("experience", true);
      const resumes = await getResumes();
      if (!resumes || resumes.length === 0) {
        alert("No uploaded resumes found. Please upload a resume first.");
        return;
      }

      const resume = resumes[0];
      if (!resume.extracted_text) {
        alert("Resume text could not be extracted. Please try uploading again.");
        return;
      }

      const parsed = extractExperiencesFromResumeText(resume.extracted_text);
      if (parsed.length === 0) {
        alert("No work experience found in your resume.");
        return;
      }

      setExperiences(parsed);
      alert(`✅ Autofilled ${parsed.length} work experience(s) from your resume!`);
    } catch (err) {
      console.error("Autofill experience error:", err);
      alert("Failed to autofill experience. Please check your resume format.");
    } finally {
      setAiKeyLoading("experience", false);
    }
  };

  const handleAutofillEducation = async () => {
    try {
      setAiKeyLoading("education", true);
      const resumes = await getResumes();
      if (!resumes || resumes.length === 0) {
        alert("No uploaded resumes found. Please upload a resume first.");
        return;
      }

      const resume = resumes[0];
      if (!resume.extracted_text) {
        alert("Resume text could not be extracted. Please try uploading again.");
        return;
      }

      const parsed = extractEducationFromResumeText(resume.extracted_text);
      if (parsed.length === 0) {
        alert("No education found in your resume.");
        return;
      }

      setEducations(parsed);
      alert(`✅ Autofilled ${parsed.length} education entry(ies) from your resume!`);
    } catch (err) {
      console.error("Autofill education error:", err);
      alert("Failed to autofill education. Please check your resume format.");
    } finally {
      setAiKeyLoading("education", false);
    }
  };

  const handleAiProject = (targetId, cardIdx = 0) => {
    openPromptModal(
      `✨ Custom AI Project Idea & Description`,
      "e.g. Generate an E-commerce microservices project using Kafka, Redis, and React...",
      (userPrompt) => executeGroqProject(targetId, cardIdx, userPrompt)
    );
  };

  const handleAiProjectBullets = (projId, name) => {
    openPromptModal(
      `✨ Custom AI Bullet Points - ${name || 'Project'}`,
      "e.g. Emphasize the real-time sync architecture, WebSocket scaling, and 99.9% uptime...",
      (userPrompt) => executeGroqProjectBullets(projId, userPrompt)
    );
  };

  /* ─── Helper: Render Inline Groq AI Custom Prompt Assistant Card ─── */
  const handlePrint = async () => {
    try {
      const headerText = [
        personal.name || "Candidate Name",
        personal.title || "",
        [personal.email, personal.phone, personal.location, personal.linkedin, personal.portfolio].filter(Boolean).join(" | ")
      ].filter(Boolean).join("\n");

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

      const expText = experiences
        .filter(e => e.company || e.role)
        .map(e => {
          const header = `${e.role || "Role"} | ${e.company || "Company"} | ${formatEduDateDisplay(e.startDate)} - ${e.current ? "Present" : formatEduDateDisplay(e.endDate)}`;
          const bullets = dedupeBullets(e.bullets).map(b => `• ${b}`).join("\n");
          return bullets ? `${header}\n${bullets}` : header;
        })
        .join("\n\n");

      const eduText = educations
        .filter(e => (e.school && e.school.trim().length > 2) || (e.degree && e.degree.trim().length > 2))
        .map(e => `${e.degree || e.field || "Degree"}${e.degree && e.field ? ` in ${e.field}` : ""} | ${e.school} | ${formatEduDateDisplay(e.startYear)} - ${formatEduDateDisplay(e.endYear)}${e.gpa ? ` | GPA: ${e.gpa}` : ""}`)
        .join("\n");

      const projText = projects
        .filter(p => p.name)
        .map(p => {
          const header = `${p.name} | ${p.tech || ""} | ${p.url || ""}`;
          const bullets = dedupeBullets(p.bullets).map(b => `• ${b}`).join("\n");
          if (bullets) return `${header}\n${bullets}`;
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
        mainSectionOrder: ["Summary", "Experience", "Projects"],
        sideSectionOrder: ["Skills", "Education"],
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
      // Prefer real contact details pulled from the user's most recently uploaded resume
      // over AI-fabricated placeholder data.
      const latestResume = uploadedResumes[0];
      const extracted = latestResume ? extractPersonalFromResumeText(latestResume.extracted_text || latestResume.content || "") : null;

      if (extracted) {
        setPersonal(prev => ({
          name: prev.name && prev.name.trim() !== "" ? prev.name : (extracted.name || prev.name),
          title: prev.title && prev.title.trim() !== "" ? prev.title : (extracted.title || prev.title),
          email: prev.email && prev.email.trim() !== "" ? prev.email : (extracted.email || prev.email),
          phone: prev.phone && prev.phone.trim() !== "" ? prev.phone : (extracted.phone || prev.phone),
          location: prev.location && prev.location.trim() !== "" ? prev.location : (extracted.location || prev.location),
          linkedin: prev.linkedin && prev.linkedin.trim() !== "" ? prev.linkedin : (extracted.linkedin || prev.linkedin),
          portfolio: prev.portfolio && prev.portfolio.trim() !== "" ? prev.portfolio : (extracted.portfolio || prev.portfolio),
        }));
      } else {
        alert("No uploaded resume found to extract details from. Upload a resume in Resume Studio first, or fill in your details manually.");
      }
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
    if (step === 1 && !isNonEmpty(personal.name)) {
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


  /* ─── Live Resume Preview Renderer ─── */
  const [inplaceEdit, setInplaceEdit] = useState(false);

  const renderResumePreview = () => {
    const isTwoColumn = docTemplateType === "two-column";

    const editableProps = (onSave) => inplaceEdit ? {
      contentEditable: true,
      suppressContentEditableWarning: true,
      onBlur: (e) => onSave(e.target.innerText),
    } : {};

    const renderHeader = () => (
      <div className="rb-doc-header-block">
        <div className="rb-doc-name" {...editableProps(v => updatePersonal('name', v))}>{personal.name || "Your Name"}</div>
        {personal.title && <div className="rb-doc-title" {...editableProps(v => updatePersonal('title', v))}>{personal.title}</div>}
        <div className="rb-doc-contact">
          {personal.email    && <span {...editableProps(v => updatePersonal('email', v))}>✉ {personal.email}</span>}
          {personal.phone    && <span {...editableProps(v => updatePersonal('phone', v))}>📱 {personal.phone}</span>}
          {personal.location && <span {...editableProps(v => updatePersonal('location', v))}>📍 {personal.location}</span>}
          {personal.linkedin && <span {...editableProps(v => updatePersonal('linkedin', v))}>🔗 {personal.linkedin}</span>}
          {personal.portfolio&& <span {...editableProps(v => updatePersonal('portfolio', v))}>💻 {personal.portfolio}</span>}
        </div>
      </div>
    );

    const renderSummarySection = () => summary && (
      <div className="rb-doc-section">
        <div className="rb-doc-section-title">Summary</div>
        <div className="rb-doc-summary" {...editableProps(v => setSummary(v))}>{summary}</div>
      </div>
    );

    const renderExperienceSection = () => experiences.some(e => e.company || e.role) && (
      <div className="rb-doc-section">
        <div className="rb-doc-section-title">Experience</div>
        {experiences.filter(e => e.company || e.role).map(exp => (
          <div key={exp.id} className="rb-doc-entry">
            <div className="rb-doc-entry-header">
              <span className="rb-doc-entry-title" {...editableProps(v => updateExp(exp.id, "role", v))}>{exp.role || "Role"}</span>
              <span className="rb-doc-entry-date">
                {exp.startDate ? exp.startDate.replace("-", "/") : ""}{exp.startDate && " – "}{exp.current ? "Present" : (exp.endDate ? exp.endDate.replace("-", "/") : "")}
              </span>
            </div>
            <div className="rb-doc-entry-sub" {...editableProps(v => updateExp(exp.id, "company", v))}>{exp.company}</div>
            {visibleBullets(exp.bullets).length > 0 && (
              <ul className="rb-doc-bullets">
                {visibleBullets(exp.bullets).map(({ b, idx }) => <li key={idx} {...editableProps(v => updateExpBullet(exp.id, idx, v))}>{b}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    );

    const hasMeaningfulEduContent = (e) => (e.school && e.school.trim().length > 2) || (e.degree && e.degree.trim().length > 2);

    const renderEducationSection = () => educations.some(hasMeaningfulEduContent) && (
      <div className="rb-doc-section">
        <div className="rb-doc-section-title">Education</div>
        {educations.filter(hasMeaningfulEduContent).map(edu => (
          <div key={edu.id} className="rb-doc-entry">
            <div className="rb-doc-entry-header">
              <span className="rb-doc-entry-title" {...editableProps(v => updateEdu(edu.id, "degree", v))}>{edu.degree || edu.field || ""}{edu.degree && edu.field ? ` in ${edu.field}` : ""}</span>
              <span className="rb-doc-entry-date">
                {edu.startYear ? edu.startYear.replace("-", "/") : ""}{edu.startYear && edu.endYear && " – "}{edu.endYear ? edu.endYear.replace("-", "/") : ""}
              </span>
            </div>
            <div className="rb-doc-entry-sub" {...editableProps(v => updateEdu(edu.id, "school", v))}>{edu.school}{edu.gpa ? ` · GPA: ${edu.gpa}` : ""}</div>
          </div>
        ))}
      </div>
    );

    const renderSkillsSection = () => skills.length > 0 && (
      <div className="rb-doc-section">
        <div className="rb-doc-section-title">Skills</div>
        <div className="rb-doc-skills-grid">
          {skills.map((sk, i) => (
            <span
              key={`${sk}-${i}`}
              className="rb-doc-skill-tag"
              {...editableProps(v => setSkills(prev => prev.map((s, si) => si === i ? v : s)))}
            >{sk}</span>
          ))}
        </div>
      </div>
    );

    const renderProjectsSection = () => projects.some(p => p.name) && (
      <div className="rb-doc-section">
        <div className="rb-doc-section-title">Projects</div>
        {projects.filter(p => p.name).map(proj => (
          <div key={proj.id} className="rb-doc-entry">
            <div className="rb-doc-entry-header">
              <span className="rb-doc-entry-title" {...editableProps(v => updateProj(proj.id, "name", v))}>{proj.name}</span>
              {proj.url && <span className="rb-doc-entry-date" style={{ fontSize: "0.68rem", color: docThemeColor }} {...editableProps(v => updateProj(proj.id, "url", v))}>{proj.url}</span>}
            </div>
            {proj.tech && <div className="rb-doc-entry-sub" {...editableProps(v => updateProj(proj.id, "tech", v))}>{proj.tech}</div>}
            {/* Render bullets if present, otherwise fall back to description */}
            {visibleBullets(proj.bullets).length > 0 ? (
              <ul className="rb-doc-bullets">
                {visibleBullets(proj.bullets).map(({ b, idx }) => (
                  <li key={idx} {...editableProps(v => {
                    const updated = [...(proj.bullets || [""])];
                    updated[idx] = v;
                    updateProj(proj.id, "bullets", updated);
                  })}>{b}</li>
                ))}
              </ul>
            ) : proj.description ? (
              <div style={{ fontSize: "0.78rem", color: "#334155" }} {...editableProps(v => updateProj(proj.id, "description", v))}>{proj.description}</div>
            ) : null}
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
              <div
                className="rb-sidebar-title"
                contentEditable={inplaceEdit}
                suppressContentEditableWarning
                onBlur={(e) => updatePersonal('name', e.target.innerText)}
              >{personal.name || "Your Name"}</div>
              {personal.title && (
                <div
                  className="rb-sidebar-subtitle"
                  contentEditable={inplaceEdit}
                  suppressContentEditableWarning
                  onBlur={(e) => updatePersonal('title', e.target.innerText)}
                >{personal.title}</div>
              )}
              
              <div className="rb-sidebar-section">
                <div className="rb-sidebar-section-title" style={{ color: docThemeColor }}>Contact</div>
                <div className="rb-sidebar-contact-list">
                    {personal.email && <div contentEditable={inplaceEdit} suppressContentEditableWarning onBlur={(e)=>updatePersonal('email', e.target.innerText)}>✉ {personal.email}</div>}
                    {personal.phone && <div contentEditable={inplaceEdit} suppressContentEditableWarning onBlur={(e)=>updatePersonal('phone', e.target.innerText)}>📱 {personal.phone}</div>}
                    {personal.location && <div contentEditable={inplaceEdit} suppressContentEditableWarning onBlur={(e)=>updatePersonal('location', e.target.innerText)}>📍 {personal.location}</div>}
                    {personal.linkedin && <div contentEditable={inplaceEdit} suppressContentEditableWarning onBlur={(e)=>updatePersonal('linkedin', e.target.innerText)}>🔗 {personal.linkedin}</div>}
                    {personal.portfolio && <div contentEditable={inplaceEdit} suppressContentEditableWarning onBlur={(e)=>updatePersonal('portfolio', e.target.innerText)}>💻 {personal.portfolio}</div>}
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
      case 0:
        return (
          <TargetJdStep
            jobDescriptions={jobDescriptions}
            selectedJdId={selectedJdId}
            customJdText={customJdText}
            jdSkillsExtracted={jdSkillsExtracted}
            aiLoading={aiLoading["jd_skills"]}
            onJobDescriptionChange={(e) => {
              setSelectedJdId(e.target.value);
              if (e.target.value && e.target.value !== "custom") {
                setTimeout(() => handleExtractSkillsFromJd(), 100);
              }
            }}
            onCustomTextChange={(e) => setCustomJdText(e.target.value)}
            onExtractSkills={handleExtractSkillsFromJd}
            onContinue={async () => {
              await handleExtractSkillsFromJd();
              let jdTitle = "";
              if (selectedJdId !== "custom") {
                const found = jobDescriptions.find(j => String(j.id) === String(selectedJdId));
                jdTitle = found?.title || found?.role || "";
              }
              if (jdTitle && (!personal.title || personal.title === "Full Stack Engineer")) {
                setPersonal(prev => ({ ...prev, title: jdTitle }));
              }
              setStep(1);
            }}
          />
        );
      case 1:
        return (
          <PersonalStep
            personal={personal}
            jobDescriptions={jobDescriptions}
            selectedJdId={selectedJdId}
            aiLoading={aiLoading["personal"]}
            isShaking={isShaking}
            onUpdatePersonal={updatePersonal}
            onAutoFill={handleAiPersonal}
            onChangeTargetJd={() => setStep(0)}
          />
        );
      case 2:
        return (
          <SummaryStep
            summary={summary}
            aiLoading={aiLoading["summary"]}
            onSummaryChange={setSummary}
            onGenerateSummary={handleAiSummary}
          />
        );
      case 3:
        return (
          <ExperienceStep
            experiences={experiences}
            aiLoading={aiLoading}
            onAddExperience={() => setExperiences(es => [...es, defaultExperience()])}
            onDeleteExperience={(id) => setExperiences(es => es.filter(e => e.id !== id))}
            onUpdateExperience={updateExp}
            onUpdateBullet={updateExpBullet}
            onAddBullet={(id) => setExperiences(es => es.map(e => e.id === id ? { ...e, bullets: [...(e.bullets || [""]), ""] } : e))}
            onDeleteBullet={removeBullet}
            onGenerateBullets={(id) => executeGroqExpBullets("", id)}
            onAutofill={handleAutofillExperience}
          />
        );
      case 4:
        return (
          <EducationStep
            educations={educations}
            aiLoading={aiLoading["education"]}
            onAddEducation={() => setEducations(es => [...es, defaultEducation()])}
            onDeleteEducation={(id) => setEducations(es => es.filter(e => e.id !== id))}
            onUpdateEducation={updateEdu}
            onAutofill={handleAutofillEducation}
          />
        );
      case 5:
        return (
          <SkillsStep
            skills={skills}
            skillInput={skillInput}
            jobDescriptions={jobDescriptions}
            selectedJdId={selectedJdId}
            customJdText={customJdText}
            jdExtractSuccess={jdExtractSuccess}
            aiLoading={aiLoading}
            personal={personal}
            jdSkillsExtracted={jdSkillsExtracted}
            onSkillInputChange={setSkillInput}
            onAddSkill={addSkill}
            onRemoveSkill={removeSkill}
            onRemoveAllSkills={() => {
              if (window.confirm(`Remove all ${skills.length} skills?`)) setSkills([]);
            }}
            onQuickAddSkill={(skill) => setSkills(sk => [...sk, skill])}
            onGenerateSkills={handleAiSkills}
            onExtractJdSkills={handleExtractSkillsFromJd}
            onJobDescriptionChange={(e) => setSelectedJdId(e.target.value)}
            onCustomTextChange={(e) => setCustomJdText(e.target.value)}
          />
        );
      case 6:
        return (
          <ProjectsStep
            projects={projects}
            jdSkillsExtracted={jdSkillsExtracted}
            skills={skills}
            aiLoading={aiLoading}
            docThemeColor={docThemeColor}
            onUpdateProject={updateProj}
            onDeleteProject={(id) => setProjects(ps => ps.filter(p => p.id !== id))}
            onAddProject={() => setProjects(ps => [...ps, defaultProject()])}
            onAddBullet={(id) => setProjects(ps => ps.map(p => p.id === id ? { ...p, bullets: [...(p.bullets || [""]), ""] } : p))}
            onUpdateBullet={(id, idx, value) => {
              const updated = [...(projects.find(p => p.id === id)?.bullets || [""])];
              updated[idx] = value;
              updateProj(id, "bullets", updated);
            }}
            onDeleteBullet={(id, idx) => {
              const updated = (projects.find(p => p.id === id)?.bullets || [""]).filter((_, i) => i !== idx);
              updateProj(id, "bullets", updated.length ? updated : [""]);
            }}
            onGenerateBullets={(id) => executeGroqProjectBullets(id)}
            onWeaveJdSkills={(id, idx) => executeGroqProjectWithJdSkills(id, idx)}
            onAddSkillToPrompt={(skill) => {
              setInlinePrompts(prev => ({
                ...prev,
                projects: prev.projects ? `${prev.projects}, ${skill}` : `Weave skill: ${skill}`
              }));
            }}
          />
        );
      case 7:
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
          <button
            className={`rb-save-btn rb-edit-toggle ${inplaceEdit ? 'active' : ''}`}
            onClick={() => setInplaceEdit(v => !v)}
            title="Toggle inline editing in preview"
            style={{ marginLeft: 8 }}
          >
            {inplaceEdit ? <Check size={14} /> : <Edit2 size={14} />}
            <span style={{ marginLeft: 6 }}>{inplaceEdit ? 'Inline Editing' : 'Enable Editing'}</span>
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
              style={{ visibility: step === 0 ? "hidden" : "visible" }}
            >
              ← Previous
            </button>
            {step === 0 ? (
              /* Target JD step: the CTA is inside the card, no bottom "Next" needed */
              <span style={{ opacity: 0, pointerEvents: "none" }}>—</span>
            ) : step < STEPS.length - 1 ? (
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

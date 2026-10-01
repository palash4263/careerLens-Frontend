// src/pages/AutoOptimizePage.jsx
// One-click resume optimization: pick a resume + JD, press Optimize, download a one-page PDF.
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, FileText, Briefcase, Download, RotateCcw, ChevronDown, ChevronUp,
  CheckCircle2, Loader2, Circle, Sparkles, AlertTriangle, Settings2,
} from "lucide-react";
import SubNav from "../components/common/SubNav";
import { getResumes } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import {
  autoOptimizeResume,
  buildResumeFileName,
  nameFromHeader,
  keywordCoverage,
  atsScore,
  AUTO_SECTIONS,
  DEFAULT_OPTIMIZE_PROMPT,
  DEFAULT_OPTIMIZE_PROMPT_KEY,
} from "../services/autoOptimizeService";
import { generateOnePageResumePDF } from "../utils/pdfGenerator";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "./AutoOptimizePage.css";

const STEPS = [
  { id: "keywords", label: "Extracting JD keywords" },
  { id: "parse", label: "Reading resume sections" },
  { id: "rewrite", label: "Rewriting Summary, Experience, Projects & Skills" },
  { id: "score", label: "Scoring against the JD" },
];

const TEMPLATES = [
  { id: "single-column", label: "Classic" },
  { id: "split-header", label: "Split header" },
  { id: "two-column", label: "Sidebar left" },
  { id: "right-sidebar", label: "Sidebar right" },
];

const COLORS = ["#1761c7", "#0f766e", "#7c3aed", "#b91c1c", "#111827"];

const SECTION_ORDER = ["Header", "Summary", "Experience", "Projects", "Skills", "Education", "Certifications"];

const getUserData = () => ({
  name: localStorage.getItem("userName") || "",
  email: localStorage.getItem("userEmail") || "",
  phone: localStorage.getItem("userPhone") || "",
  linkedin: localStorage.getItem("userLinkedin") || "",
});

export default function AutoOptimizePage() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loadError, setLoadError] = useState("");

  const [resumeId, setResumeId] = useState(() => localStorage.getItem("cl_selected_resume") || "");
  const [jobId, setJobId] = useState(() => localStorage.getItem("cl_selected_jd") || "");

  const [prompt, setPrompt] = useState(() => localStorage.getItem(DEFAULT_OPTIMIZE_PROMPT_KEY) || DEFAULT_OPTIMIZE_PROMPT);
  const [showPrompt, setShowPrompt] = useState(false);

  const [template, setTemplate] = useState(() => localStorage.getItem("cl_auto_template") || "single-column");
  const [color, setColor] = useState(() => localStorage.getItem("cl_auto_color") || COLORS[0]);

  const [running, setRunning] = useState(false);
  const [doneSteps, setDoneSteps] = useState([]);
  const [activeStep, setActiveStep] = useState("");
  const [sectionDone, setSectionDone] = useState([]);
  const [error, setError] = useState("");

  const [result, setResult] = useState(null);
  const [sections, setSections] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadNote, setDownloadNote] = useState("");

  useScrollReveal([resumes, result]);

  useEffect(() => {
    (async () => {
      try {
        const [r, j] = await Promise.all([getResumes(), getJobDescriptions()]);
        setResumes(r || []);
        setJobs(j || []);
        if (!resumeId && r?.[0]) setResumeId(String(r[0].id));
        if (!jobId && j?.[0]) setJobId(String(j[0].id));
      } catch (e) {
        console.error(e);
        setLoadError("Unable to load resumes or job descriptions.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (resumeId) localStorage.setItem("cl_selected_resume", resumeId); }, [resumeId]);
  useEffect(() => { if (jobId) localStorage.setItem("cl_selected_jd", jobId); }, [jobId]);
  useEffect(() => { localStorage.setItem(DEFAULT_OPTIMIZE_PROMPT_KEY, prompt); }, [prompt]);
  useEffect(() => { localStorage.setItem("cl_auto_template", template); }, [template]);
  useEffect(() => { localStorage.setItem("cl_auto_color", color); }, [color]);

  const resume = useMemo(() => resumes.find((r) => String(r.id) === String(resumeId)), [resumes, resumeId]);
  const job = useMemo(() => jobs.find((j) => String(j.id) === String(jobId)), [jobs, jobId]);

  // Live score/coverage follows any manual edits made to the sections.
  const live = useMemo(() => {
    if (!result || !sections) return null;
    const text = SECTION_ORDER.map((k) => sections[k] || "").join("\n");
    return { coverage: keywordCoverage(text, result.keywords), score: atsScore(text, result.keywords) };
  }, [result, sections]);

  const handleOptimize = async () => {
    if (!resume || !job) {
      setError("Select a resume and a job description first.");
      return;
    }
    setError("");
    setResult(null);
    setSections(null);
    setDownloadNote("");
    setDoneSteps([]);
    setSectionDone([]);
    setRunning(true);

    try {
      const out = await autoOptimizeResume({
        resumeText: resume.extracted_text || resume.content || "",
        job,
        userPrompt: prompt,
        onProgress: (step, detail) => {
          if (step === "section") {
            setSectionDone((s) => [...s, detail]);
            return;
          }
          setActiveStep(step);
          setDoneSteps((s) => {
            const idx = STEPS.findIndex((x) => x.id === step);
            return STEPS.slice(0, idx).map((x) => x.id);
          });
        },
      });
      setDoneSteps(STEPS.map((s) => s.id));
      setActiveStep("");
      setResult(out);
      setSections(out.sections);
    } catch (e) {
      console.error(e);
      setError(e.message || "Optimization failed. Please try again.");
    } finally {
      setRunning(false);
    }
  };

  const handleDownload = async () => {
    if (!sections || !job) return;
    setDownloading(true);
    setDownloadNote("");
    try {
      const user = getUserData();
      const name = nameFromHeader(sections.Header, user.name);
      const fileName = buildResumeFileName(name, job.company, job.title);
      const fit = await generateOnePageResumePDF({
        resumeText: "",
        editedSections: sections,
        fileName,
        jobTitle: job.title,
        email: user.email || null,
        phone: user.phone || null,
        linkedin: user.linkedin || null,
        userName: name,
        templateType: template,
        primaryColor: color,
        fontFamily: "Rubik",
        pageMargins: Number(localStorage.getItem("cl_selected_margins")) || 1,
        sectionSpacing: Number(localStorage.getItem("cl_selected_spacing")) || 3,
      });
      setDownloadNote(
        fit.fitted
          ? `Saved ${fileName}.pdf — one page at ${fit.fontSize}pt.`
          : `Saved ${fileName}.pdf — content still ran to ${fit.pageCount} pages at the smallest size; trim a few bullets and download again.`
      );
    } catch (e) {
      console.error(e);
      setError("PDF generation failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const stepState = (id) => (doneSteps.includes(id) ? "done" : activeStep === id ? "active" : "todo");

  return (
    <div className="ao-page">
      <SubNav type="resume" />

      <header className="ao-hero scroll-reveal">
        <div className="ao-badge"><Sparkles size={13} /> One-click tailoring</div>
        <h1>AI Resume Optimizer</h1>
        <p>Pick a resume and a job. We rewrite the Summary, Experience, Projects and Skills to match the JD and hand you a one-page PDF named for the company.</p>
      </header>

      {loadError && <div className="ao-alert"><AlertTriangle size={16} /> {loadError}</div>}

      <section className="ao-card ao-setup scroll-reveal">
        <div className="ao-grid">
          <label className="ao-field">
            <span><FileText size={14} /> Resume</span>
            <select value={resumeId} onChange={(e) => setResumeId(e.target.value)} disabled={running}>
              <option value="">Select a resume…</option>
              {resumes.map((r) => <option key={r.id} value={r.id}>{r.file_name || `Resume #${r.id}`}</option>)}
            </select>
          </label>
          <label className="ao-field">
            <span><Briefcase size={14} /> Target job</span>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} disabled={running}>
              <option value="">Select a job description…</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}{j.company ? ` — ${j.company}` : ""}</option>)}
            </select>
          </label>
        </div>

        <div className="ao-grid ao-grid-style">
          <label className="ao-field">
            <span><Settings2 size={14} /> Template</span>
            <select value={template} onChange={(e) => setTemplate(e.target.value)}>
              {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          <div className="ao-field">
            <span>Accent colour</span>
            <div className="ao-swatches">
              {COLORS.map((c) => (
                <button key={c} type="button" aria-label={c} className={`ao-swatch${color === c ? " on" : ""}`} style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
        </div>

        <button type="button" className="ao-toggle" onClick={() => setShowPrompt((v) => !v)}>
          {showPrompt ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Optimization instructions
          <em>{prompt === DEFAULT_OPTIMIZE_PROMPT ? "default" : "customised"}</em>
        </button>
        <AnimatePresence initial={false}>
          {showPrompt && (
            <motion.div key="prompt" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="ao-prompt-wrap">
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={7} spellCheck={false} />
              <div className="ao-prompt-actions">
                <small>Applied to every section automatically. Saved on this device.</small>
                <button type="button" onClick={() => setPrompt(DEFAULT_OPTIMIZE_PROMPT)} disabled={prompt === DEFAULT_OPTIMIZE_PROMPT}>Reset to default</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <div className="ao-alert"><AlertTriangle size={16} /> {error}</div>}

        <div className="ao-actions">
          <button type="button" className="ao-primary" onClick={handleOptimize} disabled={running || !resume || !job}>
            {running ? <Loader2 size={18} className="ao-spin" /> : <Zap size={18} />}
            {running ? "Optimizing…" : result ? "Optimize again" : "Optimize"}
          </button>
          {job && <span className="ao-hint">Targeting <b>{job.title}</b>{job.company ? <> at <b>{job.company}</b></> : null}</span>}
        </div>
      </section>

      <AnimatePresence>
        {(running || (result && doneSteps.length)) && (
          <motion.section key="progress" className="ao-card ao-progress" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ol>
              {STEPS.map((s) => {
                const st = stepState(s.id);
                return (
                  <li key={s.id} className={st}>
                    {st === "done" ? <CheckCircle2 size={16} /> : st === "active" ? <Loader2 size={16} className="ao-spin" /> : <Circle size={16} />}
                    <span>{s.label}</span>
                    {s.id === "rewrite" && (st === "active" || st === "done") && (
                      <span className="ao-section-pills">
                        {AUTO_SECTIONS.map((name) => (
                          <em key={name} className={sectionDone.includes(name) || st === "done" ? "on" : ""}>{name}</em>
                        ))}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </motion.section>
        )}
      </AnimatePresence>

      {result && sections && live && (
        <motion.section className="ao-results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="ao-card ao-summary">
            <div className="ao-scores">
              <div className="ao-score">
                <small>Before</small>
                <strong>{result.scoreBefore}</strong>
              </div>
              <div className="ao-score-arrow">→</div>
              <div className="ao-score ao-score-after">
                <small>After</small>
                <strong>{live.score}</strong>
              </div>
              <div className="ao-score-meta">
                <span><b>{live.coverage.matched.length}</b> / {result.keywords.length} JD keywords covered</span>
                <span className="ao-engines">
                  {AUTO_SECTIONS.map((n) => (
                    <em key={n} className={result.sources[n]} title={result.sources[n] === "groq" ? "Rewritten by Groq" : "Groq unavailable — local engine"}>{n}</em>
                  ))}
                </span>
              </div>
            </div>

            {live.coverage.missing.length > 0 && (
              <div className="ao-missing">
                <small>Still missing</small>
                <div className="ao-chips">
                  {live.coverage.missing.map((k) => <span key={k}>{k}</span>)}
                </div>
              </div>
            )}

            <div className="ao-download-row">
              <button type="button" className="ao-primary" onClick={handleDownload} disabled={downloading}>
                {downloading ? <Loader2 size={18} className="ao-spin" /> : <Download size={18} />}
                {downloading ? "Fitting to one page…" : "Download one-page PDF"}
              </button>
              <button type="button" className="ao-ghost" onClick={() => setSections(result.sections)} title="Discard manual edits">
                <RotateCcw size={16} /> Reset edits
              </button>
              <span className="ao-filename">{buildResumeFileName(nameFromHeader(sections.Header, getUserData().name), job?.company, job?.title)}.pdf</span>
            </div>
            {downloadNote && <p className="ao-note">{downloadNote}</p>}
          </div>

          <div className="ao-sections">
            {SECTION_ORDER.filter((k) => sections[k]?.trim() || AUTO_SECTIONS.includes(k)).map((k) => (
              <div key={k} className={`ao-card ao-section${AUTO_SECTIONS.includes(k) ? " rewritten" : ""}`}>
                <div className="ao-section-head">
                  <h3>{k}</h3>
                  {AUTO_SECTIONS.includes(k) && <span className="ao-tag">{result.sources[k] === "groq" ? "AI rewritten" : "Rule engine"}</span>}
                  {sections[k] !== result.sections[k] && <span className="ao-tag edited">edited</span>}
                </div>
                <textarea
                  value={sections[k] || ""}
                  onChange={(e) => setSections((s) => ({ ...s, [k]: e.target.value }))}
                  rows={Math.min(18, Math.max(3, (sections[k] || "").split("\n").length + 1))}
                  spellCheck={false}
                />
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

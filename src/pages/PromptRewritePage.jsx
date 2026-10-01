// src/pages/PromptRewritePage.jsx
// Prompt-driven rewrite: pick (or upload) a resume, describe the changes, get a new resume as a PDF.
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, FileText, Wand2, Download, RotateCcw, CheckCircle2, Loader2,
  Circle, Sparkles, AlertTriangle, Info, FileCheck2,
} from "lucide-react";
import SubNav from "../components/common/SubNav";
import { getResumes, uploadResume } from "../services/resumeService";
import { buildResumeFileName, nameFromHeader } from "../services/autoOptimizeService";
import {
  rewriteResumeWithPrompt,
  DEFAULT_REWRITE_PROMPT,
  REWRITE_PROMPT_KEY,
  REWRITE_SECTIONS,
  REWRITE_STEPS,
} from "../services/promptRewriteService";
import { parseSections } from "../utils/resumeOptimizer";
import { generateOnePageResumePDF } from "../utils/pdfGenerator";
import { useScrollReveal } from "../hooks/useScrollReveal";
import "./PromptRewritePage.css";

const MAX_PROMPT = 4000;

const getUserData = () => ({
  name: localStorage.getItem("userName") || "",
  email: localStorage.getItem("userEmail") || "",
  phone: localStorage.getItem("userPhone") || "",
  linkedin: localStorage.getItem("userLinkedin") || "",
});

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

// Paper-style render of resume sections: bullets as a list, "A | B | C" lines as entry headers.
function ResumeSheet({ sections }) {
  const [nameLine, ...contactLines] = (sections.Header || "").split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <article className="pr-sheet">
      <header className="pr-sheet-head">
        <h2>{nameLine || "Your Name"}</h2>
        {contactLines.length > 0 && <p>{contactLines.join("  ·  ")}</p>}
      </header>
      {REWRITE_SECTIONS.filter((k) => k !== "Header" && sections[k]?.trim()).map((k) => {
        const lines = sections[k].split("\n").map((l) => l.trim()).filter(Boolean);
        return (
          <section key={k} className="pr-sheet-section">
            <h3>{k}</h3>
            {lines.map((line, i) => {
              if (/^[-•*▪]\s*/.test(line)) return <li key={i}>{line.replace(/^[-•*▪]\s*/, "")}</li>;
              if (line.includes("|")) return <p key={i} className="pr-sheet-entry">{line}</p>;
              return <p key={i}>{line}</p>;
            })}
          </section>
        );
      })}
    </article>
  );
}

export default function PromptRewritePage() {
  const [resumes, setResumes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [resumeId, setResumeId] = useState(() => localStorage.getItem("cl_selected_resume") || "");

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [prompt, setPrompt] = useState(() => localStorage.getItem(REWRITE_PROMPT_KEY) || DEFAULT_REWRITE_PROMPT);

  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState("");
  const [error, setError] = useState("");

  const [result, setResult] = useState(null);
  const [view, setView] = useState("new");
  const [downloading, setDownloading] = useState(false);
  const [downloadNote, setDownloadNote] = useState("");

  useScrollReveal([resumes]);

  const loadResumes = async (selectId) => {
    try {
      const list = (await getResumes()) || [];
      setResumes(list);
      if (selectId) setResumeId(String(selectId));
      else if (!list.some((r) => String(r.id) === String(resumeId)) && list[0]) setResumeId(String(list[0].id));
    } catch (e) {
      console.error(e);
      setError("Unable to load your resumes.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    (async () => { await loadResumes(); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (resumeId) localStorage.setItem("cl_selected_resume", resumeId); }, [resumeId]);
  useEffect(() => { localStorage.setItem(REWRITE_PROMPT_KEY, prompt); }, [prompt]);

  const resume = useMemo(() => resumes.find((r) => String(r.id) === String(resumeId)), [resumes, resumeId]);
  const resumeText = resume?.extracted_text || resume?.content || "";
  const originalSections = useMemo(() => parseSections(resumeText), [resumeText]);

  const handleFile = async (file) => {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name)) {
      setError("Please upload a PDF resume.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const uploaded = await uploadResume(file);
      await loadResumes(uploaded?.id);
      setResult(null);
    } catch (e) {
      console.error(e);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!resume) {
      setError("Select or upload a resume first.");
      return;
    }
    setError("");
    setResult(null);
    setDownloadNote("");
    setView("new");
    setRunning(true);
    try {
      const out = await rewriteResumeWithPrompt({ resumeText, prompt, onProgress: setActiveStep });
      setResult(out);
    } catch (e) {
      console.error(e);
      setError(e.message || "Rewrite failed. Please try again.");
    } finally {
      setRunning(false);
      setActiveStep("");
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    setDownloading(true);
    setDownloadNote("");
    try {
      const user = getUserData();
      const name = nameFromHeader(result.sections.Header, user.name);
      const fileName = buildResumeFileName(name, "", "Rewritten");
      const fit = await generateOnePageResumePDF({
        resumeText: "",
        editedSections: result.sections,
        fileName,
        email: user.email || null,
        phone: user.phone || null,
        linkedin: user.linkedin || null,
        userName: name,
        templateType: localStorage.getItem("cl_auto_template") || "single-column",
        primaryColor: localStorage.getItem("cl_auto_color") || "#1761c7",
        fontFamily: "Rubik",
        pageMargins: Number(localStorage.getItem("cl_selected_margins")) || 1,
        sectionSpacing: Number(localStorage.getItem("cl_selected_spacing")) || 3,
      });
      setDownloadNote(
        fit.fitted
          ? `Saved ${fileName}.pdf — one page at ${fit.fontSize}pt.`
          : `Saved ${fileName}.pdf — ran to ${fit.pageCount} pages at the smallest size.`
      );
    } catch (e) {
      console.error(e);
      setError("PDF generation failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const stepIndex = REWRITE_STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div className="pr-page">
      <SubNav type="resume" />

      <header className="pr-hero scroll-reveal">
        <div className="pr-badge"><Sparkles size={13} /> Prompt rewrite</div>
        <h1>Rewrite your resume with a prompt</h1>
        <p>Choose a resume, tell the AI exactly how to change it, and download the new version as a PDF.</p>
      </header>

      <div className="pr-layout">
        {/* ── Inputs ── */}
        <div className="pr-inputs">
          <section className="pr-card scroll-reveal">
            <h2 className="pr-step"><span>1</span> Resume</h2>

            <label
              className={`pr-drop${dragOver ? " over" : ""}${uploading ? " busy" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
            >
              <input
                type="file"
                accept=".pdf"
                hidden
                disabled={uploading || running}
                onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
              />
              {uploading ? <Loader2 size={22} className="pr-spin" /> : <UploadCloud size={22} />}
              <span>{uploading ? "Uploading…" : <><b>Upload a PDF</b> or drag it here</>}</span>
            </label>

            <div className="pr-list" role="radiogroup" aria-label="Uploaded resumes">
              {loadingList && <p className="pr-muted">Loading your resumes…</p>}
              {!loadingList && resumes.length === 0 && <p className="pr-muted">No resumes yet — upload one above.</p>}
              {resumes.map((r) => {
                const on = String(r.id) === String(resumeId);
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`pr-resume${on ? " on" : ""}`}
                    onClick={() => { setResumeId(String(r.id)); setResult(null); }}
                    disabled={running}
                  >
                    {on ? <FileCheck2 size={18} /> : <FileText size={18} />}
                    <span className="pr-resume-name">{r.file_name || `Resume #${r.id}`}</span>
                    {formatDate(r.created_at) && <span className="pr-resume-date">{formatDate(r.created_at)}</span>}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="pr-card scroll-reveal">
            <h2 className="pr-step"><span>2</span> Your prompt</h2>
            <textarea
              className="pr-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT))}
              rows={9}
              placeholder="e.g. Rewrite for a Senior Backend Engineer role. Emphasise Java, Spring Boot and AWS…"
              disabled={running}
            />
            <div className="pr-prompt-meta">
              <small>Saved on this device · {prompt.length}/{MAX_PROMPT}</small>
              <button type="button" onClick={() => setPrompt(DEFAULT_REWRITE_PROMPT)} disabled={running || prompt === DEFAULT_REWRITE_PROMPT}>
                Reset to default
              </button>
            </div>

            {error && <div className="pr-alert"><AlertTriangle size={16} /> {error}</div>}

            <button type="button" className="pr-primary" onClick={handleGenerate} disabled={running || uploading || !resume || !prompt.trim()}>
              {running ? <Loader2 size={18} className="pr-spin" /> : <Wand2 size={18} />}
              {running ? "Rewriting…" : result ? "Generate again" : "Generate new resume"}
            </button>
          </section>
        </div>

        {/* ── Output ── */}
        <section className="pr-card pr-output">
          <AnimatePresence mode="wait">
            {running ? (
              <motion.ol key="progress" className="pr-progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {REWRITE_STEPS.map((s, i) => {
                  const st = i < stepIndex ? "done" : i === stepIndex ? "active" : "todo";
                  return (
                    <li key={s.id} className={st}>
                      {st === "done" ? <CheckCircle2 size={16} /> : st === "active" ? <Loader2 size={16} className="pr-spin" /> : <Circle size={16} />}
                      {s.label}
                    </li>
                  );
                })}
              </motion.ol>
            ) : result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="pr-toolbar">
                  <div className="pr-seg" role="tablist" aria-label="Resume version">
                    <button type="button" role="tab" aria-selected={view === "new"} className={view === "new" ? "on" : ""} onClick={() => setView("new")}>Rewritten</button>
                    <button type="button" role="tab" aria-selected={view === "original"} className={view === "original" ? "on" : ""} onClick={() => setView("original")}>Original</button>
                  </div>
                  <div className="pr-toolbar-actions">
                    <button type="button" className="pr-ghost" onClick={handleGenerate} title="Run the prompt again">
                      <RotateCcw size={15} /> Regenerate
                    </button>
                    <button type="button" className="pr-primary pr-primary-sm" onClick={handleDownload} disabled={downloading}>
                      {downloading ? <Loader2 size={16} className="pr-spin" /> : <Download size={16} />}
                      {downloading ? "Building PDF…" : "Download PDF"}
                    </button>
                  </div>
                </div>

                {result.preview && (
                  <div className="pr-info"><Info size={15} /> Preview mode — the AI rewrite isn't connected yet, so this shows your original content.</div>
                )}
                {downloadNote && <p className="pr-note">{downloadNote}</p>}

                <div className="pr-sheet-wrap">
                  <ResumeSheet sections={view === "new" ? result.sections : originalSections} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" className="pr-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="pr-empty-icon"><FileText size={28} /></div>
                <h3>Your new resume will appear here</h3>
                <p>Pick a resume, write your prompt, then press <b>Generate new resume</b>.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}

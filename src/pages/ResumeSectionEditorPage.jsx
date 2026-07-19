import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Upload,
  FileText,
  Sparkles,
  RotateCcw,
  Copy,
  Download,
  Check,
  Loader2,
} from "lucide-react";
import PremiumDropdown from "../components/resume/PremiumDropdown";
import { getResumes, uploadResume } from "../services/resumeService";
import { createJobDescription, getJobDescriptions } from "../services/jobDescriptionService";
import { optimizeSection } from "../services/resumeOptimizationService";
import { copyToClipboard } from "../utils/clipboard";
import { generateResumePDF } from "../utils/pdfGenerator";
import { parseResumeSections } from "../utils/resumeParser";
import "./ResumeSectionEditorPage.css";

const SECTION_ORDER = [
  "Header",
  "Summary",
  "Experience",
  "Projects",
  "Skills",
  "Education",
  "Certifications",
  "Languages",
];

const SECTION_META = {
  Header: { icon: "👤", description: "Contact details, headline, and profile summary." },
  Summary: { icon: "📝", description: "A concise overview of your fit and value." },
  Experience: { icon: "💼", description: "Impact, scope, and measurable outcomes." },
  Projects: { icon: "🛠️", description: "Work samples, shipped projects, and outcomes." },
  Skills: { icon: "⚙️", description: "Technical, tooling, and domain skills." },
  Education: { icon: "🎓", description: "Degrees, institutions, and academic details." },
  Certifications: { icon: "🏅", description: "Licenses, certificates, and credentials." },
  Languages: { icon: "🗣️", description: "Languages and proficiency levels." },
};

const DEFAULT_TARGET = "General resume improvement for ATS clarity, stronger impact, and a more polished professional tone.";
const DEFAULT_INSTRUCTION = "Make the section sharper, more specific, and achievement-focused while keeping facts intact.";

const emptySections = () =>
  SECTION_ORDER.reduce((acc, key) => {
    acc[key] = "";
    return acc;
  }, {});

const emptyOptimizationState = () =>
  SECTION_ORDER.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {});

const normalizeTitle = (title = "") => {
  const clean = title.trim().toLowerCase().replace(/[:#\-_*]/g, "");
  const aliases = {
    Header: ["header", "contact", "contact info", "personal info", "personal information", "resume"],
    Summary: ["summary", "professional summary", "objective", "profile", "about"],
    Experience: ["experience", "work experience", "professional experience", "employment history", "career history"],
    Projects: ["projects", "personal projects", "key projects", "academic projects"],
    Skills: ["skills", "technical skills", "core skills", "skills summary", "technologies"],
    Education: ["education", "academic background"],
    Certifications: ["certifications", "certificates", "licenses & certifications", "awards & certifications"],
    Languages: ["languages", "language proficiency"],
  };

  for (const [canonical, values] of Object.entries(aliases)) {
    if (values.some((value) => clean === value || clean.startsWith(`${value}:`))) {
      return canonical;
    }
  }

  return null;
};

const sectionsFromResumeText = (text = "") => {
  const parsed = parseResumeSections(text);
  const sections = emptySections();

  if (parsed.length === 1 && parsed[0]?.title === "Resume") {
    sections.Header = parsed[0].content.join("\n").trim();
    return sections;
  }

  parsed.forEach(({ title, content }) => {
    const canonical = normalizeTitle(title);
    if (!canonical) return;
    sections[canonical] = content.join("\n").trim();
  });

  return sections;
};

const reconstructResumeText = (sections) =>
  SECTION_ORDER
    .filter((key) => sections?.[key] && sections[key].trim())
    .map((key) => `${key}:\n${sections[key].trim()}`)
    .join("\n\n");

const extractOptimizedText = (response) => {
  if (!response) return "";
  if (typeof response === "string") return response;

  // 1. Extract the actual data payload if it's wrapped by Axios
  const data = response.data ? response.data : response;

  // 2. Fallback check against potential key formats
  return (
    response.optimizedText ||
    response.optimized_text ||
    response.text ||
    response.content ||
    response.optimizedSection ||
    response.optimized_content ||
    ""
  );
};

const countWords = (text = "") =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;

const buildSectionPrompt = (sectionKey, targetLabel, globalInstruction) => {
  const instruction = globalInstruction?.trim() || DEFAULT_INSTRUCTION;
  return `Rewrite the ${sectionKey} section for ${targetLabel}. ${instruction} Keep it ATS-friendly, professional, and truthful.`;
};

function LoadingChip({ label }) {
  return (
    <span className="ese-loading-chip">
      <Loader2 size={14} className="spin" />
      {label}
    </span>
  );
}

function SectionCard({
  sectionKey,
  value,
  originalValue,
  onChange,
  onOptimize,
  onReset,
  optimizing,
}) {
  const meta = SECTION_META[sectionKey];
  const dirty = value !== originalValue;
  const wordTotal = countWords(value);

  return (
    <motion.section
      className="ese-section-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="ese-section-head">
        <div>
          <div className="ese-section-title-row">
            <span className="ese-section-icon">{meta.icon}</span>
            <h3 className="ese-section-title">{sectionKey}</h3>
            {dirty && <span className="ese-dirty-chip">Edited</span>}
          </div>
          <p className="ese-section-desc">{meta.description}</p>
        </div>

        <div className="ese-section-meta">
          <span className="ese-metric">{wordTotal} words</span>
        </div>
      </div>

      <textarea
        className="ese-section-input"
        value={value}
        onChange={(e) => onChange(sectionKey, e.target.value)}
        placeholder={`Start editing ${sectionKey.toLowerCase()} here...`}
      />

      <div className="ese-section-actions">
        <button className="ese-btn ghost" onClick={() => onReset(sectionKey)} type="button" disabled={optimizing}>
          <RotateCcw size={15} />
          Reset
        </button>
        <button className="ese-btn primary" onClick={() => onOptimize(sectionKey)} type="button" disabled={optimizing}>
          {optimizing ? <LoadingChip label="Optimizing" /> : <><Sparkles size={15} /> AI Optimize</>}
        </button>
      </div>
    </motion.section>
  );
}

export default function ResumeSectionEditorPage() {
  const [searchParams] = useSearchParams();
  const reduceMotion = useReducedMotion();
  const uploadRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [customTarget, setCustomTarget] = useState("");
  const [globalInstruction, setGlobalInstruction] = useState("");
  const [originalSections, setOriginalSections] = useState(emptySections());
  const [editedSections, setEditedSections] = useState(emptySections());
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bulkOptimizing, setBulkOptimizing] = useState(false);
  const [optimizingSections, setOptimizingSections] = useState({});
  const [tempJobId, setTempJobId] = useState("");

  const activeResume = useMemo(
    () => resumes.find((resume) => String(resume.id) === String(selectedResumeId)) || null,
    [resumes, selectedResumeId]
  );

  const selectedJob = useMemo(
    () => jobs.find((job) => String(job.id) === String(selectedJobId)) || null,
    [jobs, selectedJobId]
  );

  const liveResumeText = reconstructResumeText(editedSections);
  const targetLabel =
    customTarget.trim() ||
    (selectedJob ? `${selectedJob.title} at ${selectedJob.company}` : DEFAULT_TARGET);

  useEffect(() => {
    const resumeParam = searchParams.get("resumeId");
    if (resumeParam) {
      setSelectedResumeId(resumeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedResumeId || !resumes.length) return;
    const resume = resumes.find((item) => String(item.id) === String(selectedResumeId));
    if (!resume) return;

    const next = sectionsFromResumeText(resume.extracted_text || "");
    setOriginalSections(next);
    setEditedSections(next);
    setError("");
    setSuccess(`Loaded ${resume.file_name}.`);
  }, [selectedResumeId, resumes]);

  async function loadData() {
    try {
      setLoading(true);
      const [resumeData, jobData] = await Promise.all([getResumes(), getJobDescriptions()]);
      setResumes(resumeData);
      setJobs(jobData);

      const selectedFromQuery = searchParams.get("resumeId");
      const initialResume = selectedFromQuery
        ? resumeData.find((item) => String(item.id) === String(selectedFromQuery))
        : resumeData[0];

      if (initialResume) {
        setSelectedResumeId(String(initialResume.id));
      }

      if (!selectedJobId && jobData.length > 0) {
        setSelectedJobId(String(jobData[0].id));
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load resumes or job descriptions.");
    } finally {
      setLoading(false);
    }
  }

  const handleFilePick = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF resume.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");
      await uploadResume(file);
      if (uploadRef.current) {
        uploadRef.current.value = "";
      }
      const refreshedResumes = await getResumes();
      setResumes(refreshedResumes);

      const latest =
        refreshedResumes.find((item) => item.file_name === file.name) ||
        refreshedResumes[0];

      if (latest) {
        setSelectedResumeId(String(latest.id));
      }

      setSuccess("Resume uploaded and loaded into the editor.");
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const ensureTargetJob = async () => {
    if (selectedJobId) return selectedJobId;
    if (tempJobId) return tempJobId;

    const description = customTarget.trim() || DEFAULT_TARGET;
    const title = customTarget.trim() ? "Custom Resume Target" : "General Resume Target";
    const created = await createJobDescription({
      title,
      company: "CareerLens",
      description,
    });

    const nextId = String(created.id);
    setTempJobId(nextId);
    setSelectedJobId(nextId);
    setJobs((prev) => [created, ...prev]);
    return nextId;
  };

  const handleSectionChange = (sectionKey, nextValue) => {
    setEditedSections((prev) => ({ ...prev, [sectionKey]: nextValue }));
  };

  const handleResetSection = (sectionKey) => {
    setEditedSections((prev) => ({
      ...prev,
      [sectionKey]: originalSections[sectionKey] || "",
    }));
  };

  const optimizeOneSection = async (sectionKey) => {
    if (!selectedResumeId) {
      setError("Upload and select a resume first.");
      return;
    }

    try {
      setOptimizingSections((prev) => ({ ...prev, [sectionKey]: true }));
      setError("");

      const prompt = buildSectionPrompt(sectionKey, targetLabel, globalInstruction);
      const jdText = customTarget.trim() || selectedJob?.description || "";
      const response = await optimizeSection(
        selectedResumeId,
        sectionKey,
        jdText,
        prompt,
        editedSections[sectionKey],
      );

      const optimizedText = extractOptimizedText(response);
      if (optimizedText) {
        setEditedSections((prev) => ({ ...prev, [sectionKey]: optimizedText }));
        setSuccess(`${sectionKey} optimized for the selected target.`);
      } else {
        setError(`No optimized text returned for ${sectionKey}.`);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || `Failed to optimize ${sectionKey}.`);
    } finally {
      setOptimizingSections((prev) => ({ ...prev, [sectionKey]: false }));
    }
  };

  const optimizeAllSections = async () => {
    if (!selectedResumeId) {
      setError("Upload and select a resume first.");
      return;
    }

    try {
      setBulkOptimizing(true);
      setError("");
      const jdText = customTarget.trim() || selectedJob?.description || "";

      for (const sectionKey of SECTION_ORDER) {
        setOptimizingSections((prev) => ({ ...prev, [sectionKey]: true }));
        const prompt = buildSectionPrompt(sectionKey, targetLabel, globalInstruction);
        const response = await optimizeSection(
          selectedResumeId,
          sectionKey,
          jdText,
          prompt,
          editedSections[sectionKey],
        );
        const optimizedText = extractOptimizedText(response);
        if (optimizedText) {
          setEditedSections((prev) => ({ ...prev, [sectionKey]: optimizedText }));
        }
        setOptimizingSections((prev) => ({ ...prev, [sectionKey]: false }));
      }

      setSuccess("All sections optimized.");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to optimize all sections.");
    } finally {
      setBulkOptimizing(false);
      setOptimizingSections(emptyOptimizationState());
    }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(liveResumeText);
    setCopySuccess(ok);
    if (ok) {
      setSuccess("Full resume copied to clipboard.");
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!liveResumeText.trim()) {
      setError("Nothing to download yet.");
      return;
    }

    try {
      setDownloading(true);
      const selectedResume = resumes.find((item) => String(item.id) === String(selectedResumeId));
      const selectedJob = jobs.find((item) => String(item.id) === String(selectedJobId));

      const isSectionsEmpty = !editedSections || Object.values(editedSections).every(v => !v || !v.trim());

      await generateResumePDF({
        resumeText: isSectionsEmpty ? liveResumeText : '',
        editedSections: isSectionsEmpty ? null : editedSections,
        fileName: selectedResume?.file_name || "resume",
        jobTitle: selectedJob ? `${selectedJob.title} at ${selectedJob.company}` : targetLabel,
        score: 0,
      });
      setSuccess("PDF download started.");
    } catch (err) {
      console.error(err);
      setError("Failed to generate PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="ese-page">
      <div className="ese-bg-orb ese-orb-a" />
      <div className="ese-bg-orb ese-orb-b" />

      <div className="ese-shell">
        <motion.section
          className="ese-hero"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="ese-hero-copy">
            <span className="ese-kicker">Resume AI Editor</span>
            <h1>Edit every resume section with AI, in place.</h1>
            <p>
              Upload a resume, split it into sections, and rewrite each part directly in the editor
              with AI assistance tailored to your target role.
            </p>
          </div>

          <div className="ese-hero-stats">
            <div className="ese-stat">
              <strong>{resumes.length}</strong>
              <span>Saved resumes</span>
            </div>
            <div className="ese-stat">
              <strong>{jobs.length}</strong>
              <span>Target roles</span>
            </div>
            <div className="ese-stat">
              <strong>{countWords(liveResumeText)}</strong>
              <span>Live words</span>
            </div>
          </div>
        </motion.section>

        <AnimatePresence>
          {error && (
            <motion.div
              className="ese-banner error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {success && (
            <motion.div
              className="ese-banner success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="ese-layout">
          <main className="ese-main">
            <section className="ese-panel">
              <div className="ese-panel-head">
                <div>
                  <span className="ese-panel-label">Upload</span>
                  <h2>Load a resume to start editing</h2>
                </div>
                <button
                  className="ese-btn primary"
                  type="button"
                  onClick={() => uploadRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <LoadingChip label="Uploading" /> : <><Upload size={15} /> Upload PDF</>}
                </button>
              </div>

              <label
                className="ese-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilePick(e.dataTransfer.files?.[0]);
                }}
              >
                <input
                  ref={uploadRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFilePick(e.target.files?.[0])}
                  hidden
                />
                <Upload size={26} />
                <strong>Drop a PDF resume here</strong>
                <span>or click upload to browse</span>
              </label>

              <div className="ese-toolbar">
                <PremiumDropdown
                  label="Resume"
                  icon="📄"
                  options={resumes}
                  value={selectedResumeId}
                  onChange={setSelectedResumeId}
                  placeholder="Choose a resume"
                  type="resume"
                />

                <PremiumDropdown
                  label="Target Role"
                  icon="🎯"
                  options={jobs}
                  value={selectedJobId}
                  onChange={(value) => {
                    setSelectedJobId(value);
                    setTempJobId("");
                  }}
                  placeholder="Pick an existing target"
                  type="job"
                />
              </div>

              <div className="ese-field">
                <label htmlFor="customTarget">Custom target instruction</label>
                <textarea
                  id="customTarget"
                  value={customTarget}
                  onChange={(e) => {
                    setCustomTarget(e.target.value);
                    if (e.target.value.trim()) {
                      setSelectedJobId("");
                      setTempJobId("");
                    }
                  }}
                  placeholder="Paste a job description or write the role you want this resume tailored for."
                />
              </div>

              <div className="ese-field">
                <label htmlFor="globalInstruction">Global AI instruction</label>
                <textarea
                  id="globalInstruction"
                  value={globalInstruction}
                  onChange={(e) => setGlobalInstruction(e.target.value)}
                  placeholder="Example: make it more senior, stronger on impact, and concise."
                />
              </div>

 <div className="ese-actions-row">
  <button
    className="ese-btn primary"
    type="button"
    onClick={optimizeAllSections}
    disabled={bulkOptimizing || !selectedResumeId}
  >
    {bulkOptimizing ? <LoadingChip label="Optimizing all" /> : <><Sparkles size={15} /> Optimize all sections</>}
  </button>
</div>
            </section>

            {loading ? (
              <section className="ese-panel">
                <div className="ese-empty">
                  <Loader2 size={24} className="spin" />
                  <p>Loading your saved resumes and target roles...</p>
                </div>
              </section>
            ) : (
              <section className="ese-sections-grid">
                {SECTION_ORDER.map((sectionKey) => (
                  <SectionCard
                    key={sectionKey}
                    sectionKey={sectionKey}
                    value={editedSections[sectionKey]}
                    originalValue={originalSections[sectionKey]}
                    onChange={handleSectionChange}
                    onOptimize={optimizeOneSection}
                    onReset={handleResetSection}
                    optimizing={bulkOptimizing || !!optimizingSections[sectionKey]}
                  />
                ))}
              </section>
            )}
          </main>

        <aside className="ese-side">
  <section className="ese-panel ese-sticky">
    <div className="ese-panel-head compact">
      <div>
        <span className="ese-panel-label">Live Preview</span>
        <h2>{activeResume?.file_name || "No resume selected"}</h2>
      </div>
      <span className="ese-preview-badge">
        {targetLabel === DEFAULT_TARGET ? "General" : "Targeted"}
      </span>
    </div>

    <div className="ese-preview-meta">
      <div>
        <span>Resume</span>
        <strong>{activeResume?.file_name || "Select a resume"}</strong>
      </div>
      <div>
        <span>Target</span>
        <strong>{targetLabel}</strong>
      </div>
    </div>

    <div className="ese-preview-box">
      {liveResumeText ? (
        liveResumeText.split("\n").map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={index} className="ese-preview-gap" />;
          if (/^[A-Za-z\s]+:$/.test(trimmed)) {
            return (
              <h4 key={index} className="ese-preview-section">
                {trimmed}
              </h4>
            );
          }
          if (/^[•-]/.test(trimmed)) {
            return <p key={index} className="ese-preview-bullet">{trimmed.replace(/^[•-]\s*/, "")}</p>;
          }
          return <p key={index} className="ese-preview-line">{trimmed}</p>;
        })
      ) : (
        <div className="ese-empty">
          <FileText size={24} />
          <p>Upload a resume to see the live editor here.</p>
        </div>
      )}
    </div>

    {/* Integrated Action Buttons */}
    <div className="ese-actions-row" style={{ marginTop: "18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
      <button 
        className="ese-btn primary" 
        type="button" 
        onClick={handleDownload} 
        disabled={downloading || !liveResumeText.trim()}
      >
        {downloading ? <LoadingChip label="Downloading" /> : <><Download size={15} /> Download PDF</>}
      </button>
      
      <button 
        className="ese-btn ghost" 
        type="button" 
        onClick={handleCopy} 
        disabled={!liveResumeText.trim()}
      >
        {copySuccess ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy resume</>}
      </button>
    </div>
  </section>

  <section className="ese-panel ese-tip-panel">
    <div className="ese-panel-head compact">
      <div>
        <span className="ese-panel-label">Workflow</span>
        <h2>How this page works</h2>
      </div>
    </div>

    <ul className="ese-tip-list">
      <li>Upload a PDF resume.</li>
      <li>Select or describe a target role.</li>
      <li>Edit section text directly in each card.</li>
      <li>Use AI Optimize on one section or all sections.</li>
      <li>Copy or download the final version from the preview panel.</li>
    </ul>
  </section>
</aside>
        </div>
      </div>
    </div>
  );
}

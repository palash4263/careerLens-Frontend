import { useState } from "react";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";
import { scoreBullet, computeProjectCoverage, computeOverallCoverage } from "../../utils/bulletQuality";

const scoreDot = (label) => ({
  strong: { color: "#34d399", glyph: "●" },
  okay: { color: "#fbbf24", glyph: "●" },
  weak: { color: "#f87171", glyph: "●" },
  empty: { color: "#475569", glyph: "○" },
}[label] || { color: "#475569", glyph: "○" });

export default function ProjectsStep({
  projects,
  jdSkillsExtracted,
  skills,
  aiLoading,
  docThemeColor,
  onUpdateProject,
  onDeleteProject,
  onAddProject,
  onAddBullet,
  onUpdateBullet,
  onDeleteBullet,
  onGenerateBullets,
  onWeaveJdSkills,
  onAddSkillToPrompt,
  onGenerateProjectFromJd,
  hasTargetJd = false,
}) {
  const targetSkills = jdSkillsExtracted.length > 0 ? jdSkillsExtracted : skills;
  const overall = computeOverallCoverage(projects, targetSkills);
  const [missingOpen, setMissingOpen] = useState(false);
  const barColor = overall.percent >= 70 ? "#34d399" : overall.percent >= 40 ? "#fbbf24" : "#f87171";

  return (
    <div>
      <div className="rb-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2>Projects</h2>
          <p>Showcase 2–4 projects that demonstrate your skills. Use <strong>🎯 Weave JD Skills</strong> to tailor each project to your target job.</p>
        </div>
        <button
          type="button"
          className="rb-ai-btn"
          onClick={onGenerateProjectFromJd}
          disabled={!hasTargetJd || aiLoading["proj_from_jd"]}
          title={hasTargetJd ? "Invent a new project grounded in the target JD's domain" : "Select a target Job Description in the Skills step first"}
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            border: "1px solid rgba(16, 185, 129, 0.5)",
            color: "#ffffff",
            fontWeight: 600,
            opacity: !hasTargetJd ? 0.5 : 1,
          }}
        >
          {aiLoading["proj_from_jd"] ? <Loader2 size={14} className="rb-ai-spin" /> : <Sparkles size={14} />}
          <span>{aiLoading["proj_from_jd"] ? "Generating..." : "🪄 Generate Project from JD"}</span>
        </button>
      </div>

      {targetSkills.length > 0 && (
        <div style={{
          background: "rgba(15, 23, 42, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "10px",
          padding: "10px 14px",
          marginBottom: "18px",
        }}>
          <button
            type="button"
            onClick={() => setMissingOpen(o => !o)}
            style={{
              width: "100%", background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "10px", padding: 0,
            }}
          >
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", whiteSpace: "nowrap" }}>
              JD coverage
            </span>
            <div style={{ flex: 1, height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${overall.percent}%`, borderRadius: "999px", background: barColor }} />
            </div>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: barColor, whiteSpace: "nowrap" }}>
              {overall.covered.length}/{targetSkills.length}
            </span>
            {overall.missing.length > 0 && (
              <ChevronDown
                size={14}
                style={{ color: "#64748b", transform: missingOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}
              />
            )}
          </button>

          {missingOpen && overall.missing.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
              {overall.missing.map(sk => (
                <button
                  key={sk}
                  type="button"
                  onClick={() => onAddSkillToPrompt(sk, null)}
                  title={`Not mentioned in any project — click to generate a new project covering "${sk}"`}
                  style={{
                    background: "rgba(248, 113, 113, 0.1)",
                    border: "1px solid rgba(248, 113, 113, 0.25)",
                    color: "#fca5a5",
                    fontSize: "0.72rem",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  + {sk}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rb-entries">
        {projects.map((proj, pi) => {
          const coverage = computeProjectCoverage(proj, targetSkills);
          return (
          <div key={proj.id} className="rb-entry-card">
            <div className="rb-entry-card-header">
              <span className="rb-entry-card-title">Project #{pi + 1}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="rb-ai-btn"
                  onClick={() => onGenerateBullets(proj.id)}
                  disabled={aiLoading[`proj_bullets_${proj.id}`] || !proj.name?.trim()}
                  style={{
                    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)",
                    border: "1px solid rgba(139, 92, 246, 0.4)",
                    color: "#c4b5fd",
                    fontWeight: 600,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (!aiLoading[`proj_bullets_${proj.id}`] && proj.name?.trim()) {
                      e.target.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.25) 100%)";
                      e.target.style.borderColor = "rgba(139, 92, 246, 0.6)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)";
                    e.target.style.borderColor = "rgba(139, 92, 246, 0.4)";
                  }}
                  title={proj.name?.trim() ? `Generate high-impact FAANG-style bullets for "${proj.name}"` : "Enter a project name first"}
                >
                  {aiLoading[`proj_bullets_${proj.id}`] ? <Loader2 size={13} className="rb-ai-spin" /> : <Sparkles size={13} />}
                  <span>{aiLoading[`proj_bullets_${proj.id}`] ? "Generating..." : "✨ Generate Bullets"}</span>
                </button>
                <button
                  type="button"
                  className="rb-ai-btn"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    border: "1px solid rgba(16, 185, 129, 0.5)",
                    color: "#ffffff",
                    fontWeight: 600,
                    transition: "all 0.2s"
                  }}
                  onClick={() => onWeaveJdSkills(proj.id, pi)}
                  disabled={aiLoading[`proj_${proj.id}`]}
                  onMouseEnter={(e) => {
                    if (!aiLoading[`proj_${proj.id}`]) {
                      e.target.style.boxShadow = "0 8px 16px rgba(16, 185, 129, 0.3)";
                      e.target.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = "none";
                    e.target.style.transform = "translateY(0)";
                  }}
                  title="Restructure project to showcase target JD skills for maximum ATS compatibility"
                >
                  {aiLoading[`proj_${proj.id}`] ? <Loader2 size={13} className="rb-ai-spin" /> : <Sparkles size={13} />}
                  <span>🎯 Weave JD Skills</span>
                </button>
                {projects.length > 1 && (
                  <button className="rb-entry-remove-btn" onClick={() => onDeleteProject(proj.id)}>×</button>
                )}
              </div>
            </div>

            {targetSkills.length > 0 && (
              <div
                title={coverage.covered.length > 0 ? `Covers: ${coverage.covered.join(", ")}` : undefined}
                style={{ fontSize: "0.72rem", color: "#64748b", padding: "8px 0 2px" }}
              >
                <span style={{ fontWeight: 600 }}>{coverage.covered.length}/{targetSkills.length} JD skills</span> covered
                {coverage.missing.length > 0 && (
                  <>
                    {" · "}
                    {coverage.missing.slice(0, 3).map((sk, i) => (
                      <span key={sk}>
                        {i > 0 && ", "}
                        <button
                          type="button"
                          onClick={() => onAddSkillToPrompt(sk, proj.id)}
                          title={`Re-weave this project to prominently feature "${sk}"`}
                          style={{ background: "none", border: "none", padding: 0, color: "#94a3b8", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px", fontSize: "inherit" }}
                        >+ {sk}</button>
                      </span>
                    ))}
                    {coverage.missing.length > 3 && ` +${coverage.missing.length - 3} more`}
                  </>
                )}
              </div>
            )}

            <div className="rb-field-grid">
              <div className="rb-field">
                <label className="rb-label">Project Name</label>
                <input
                  className="rb-input"
                  placeholder="CareerLens AI"
                  value={proj.name}
                  onChange={e => onUpdateProject(proj.id, "name", e.target.value)}
                />
              </div>
              <div className="rb-field">
                <label className="rb-label">URL / GitHub Link</label>
                <input
                  className="rb-input"
                  placeholder="github.com/you/project"
                  value={proj.url}
                  onChange={e => onUpdateProject(proj.id, "url", e.target.value)}
                />
              </div>
              <div className="rb-field full">
                <label className="rb-label">Technologies Used</label>
                <input
                  className="rb-input"
                  placeholder="React, Node.js, PostgreSQL, Groq AI"
                  value={proj.tech}
                  onChange={e => onUpdateProject(proj.id, "tech", e.target.value)}
                />
              </div>
              <div className="rb-field full">
                <label className="rb-label">Project Bullet Points</label>
                <p style={{ fontSize: "0.76rem", color: "#94a3b8", margin: "2px 0 8px", lineHeight: 1.4 }}>
                  Each bullet = one FAANG-style achievement. Start with a strong action verb + metric.
                </p>
                {(proj.bullets || [""]).map((b, bi) => {
                  const quality = scoreBullet(b);
                  const dot = scoreDot(quality.label);
                  const dotTitle = !b.trim()
                    ? "Empty bullet"
                    : quality.issues.length > 0
                    ? `${quality.label[0].toUpperCase()}${quality.label.slice(1)} bullet — ${quality.issues.join("; ")}`
                    : "Strong bullet";
                  return (
                    <div key={bi} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ color: docThemeColor || "#6366f1", marginTop: 10, fontWeight: 900, fontSize: "1rem", flexShrink: 0 }}>•</span>
                      <textarea
                        className="rb-textarea"
                        rows={2}
                        placeholder={bi === 0
                          ? "Architected a full-stack platform using React & Node.js, reducing load time by 40%..."
                          : bi === 1
                          ? "Implemented Redis caching layer that cut API response time from 800ms to 45ms..."
                          : "Add another achievement with metrics..."}
                        value={b}
                        onChange={e => onUpdateBullet(proj.id, bi, e.target.value)}
                        style={{ flex: 1, resize: "none" }}
                      />
                      <span
                        title={dotTitle}
                        style={{ color: dot.color, marginTop: 12, fontSize: "0.65rem", flexShrink: 0, cursor: "default" }}
                      >{dot.glyph}</span>
                      {(proj.bullets || [""]).length > 1 && (
                        <button
                          type="button"
                          className="rb-entry-remove-btn"
                          style={{ marginTop: 6, flexShrink: 0 }}
                          onClick={() => onDeleteBullet(proj.id, bi)}
                        >×</button>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="rb-add-entry-btn"
                  style={{ marginTop: 4, padding: "6px 14px", fontSize: "0.8rem" }}
                  onClick={() => onAddBullet(proj.id)}
                >
                  + Add Bullet Point
                </button>
              </div>
            </div>
          </div>
          );
        })}
        <button className="rb-add-entry-btn" onClick={onAddProject}>
          + Add Another Project
        </button>
      </div>
    </div>
  );
}

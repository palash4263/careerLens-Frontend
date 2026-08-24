import { Sparkles, Loader2 } from "lucide-react";

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
}) {
  return (
    <div>
      <div className="rb-section-heading">
        <div>
          <h2>Projects</h2>
          <p>Showcase 2–4 projects that demonstrate your skills. Use <strong>🎯 Weave JD Skills</strong> to tailor each project to your target job.</p>
        </div>
      </div>

      {(jdSkillsExtracted.length > 0 || skills.length > 0) && (
        <div style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
          border: "2px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "14px",
          padding: "16px",
          marginBottom: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#10b981", display: "flex", alignItems: "center", gap: "6px" }}>
                🎯 Target JD Skills to Weave Into Projects
              </span>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px", display: "block" }}>Click skills below to add them to your project prompts for better ATS matching</span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {(jdSkillsExtracted.length > 0 ? jdSkillsExtracted : skills.slice(0, 10)).map(sk => (
              <button
                key={sk}
                type="button"
                onClick={() => onAddSkillToPrompt(sk)}
                style={{
                  background: "rgba(16, 185, 129, 0.2)",
                  border: "1.5px solid rgba(16, 185, 129, 0.4)",
                  color: "#6ee7b7",
                  fontSize: "0.78rem",
                  padding: "6px 14px",
                  borderRadius: "22px",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(16, 185, 129, 0.3)";
                  e.target.style.borderColor = "rgba(16, 185, 129, 0.6)";
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(16, 185, 129, 0.2)";
                  e.target.style.borderColor = "rgba(16, 185, 129, 0.4)";
                  e.target.style.transform = "translateY(0)";
                }}
                title={`Click to add "${sk}" to your project AI prompt for better targeting`}
              >
                ✓ {sk}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rb-entries">
        {projects.map((proj, pi) => (
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
                {(proj.bullets || [""]).map((b, bi) => (
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
                    {(proj.bullets || [""]).length > 1 && (
                      <button
                        type="button"
                        className="rb-entry-remove-btn"
                        style={{ marginTop: 6, flexShrink: 0 }}
                        onClick={() => onDeleteBullet(proj.id, bi)}
                      >×</button>
                    )}
                  </div>
                ))}
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
        ))}
        <button className="rb-add-entry-btn" onClick={onAddProject}>
          + Add Another Project
        </button>
      </div>
    </div>
  );
}

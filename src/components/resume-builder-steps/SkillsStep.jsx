import { Sparkles, Loader2 } from "lucide-react";

const ROLE_SKILL_MAPPING = {
  "frontend": ["React", "Vue.js", "Next.js", "TypeScript", "CSS", "Tailwind", "UI/UX Design", "Jest & RTL", "Webpack", "Vite"],
  "backend": ["Node.js", "Python", "Java", "PostgreSQL", "MongoDB", "Redis", "GraphQL", "REST APIs", "Docker", "CI/CD Pipelines"],
  "full stack": ["React", "Node.js", "PostgreSQL", "Next.js", "TypeScript", "REST APIs", "Docker", "AWS", "System Design", "Git"],
  "devops": ["Docker", "Kubernetes", "CI/CD Pipelines", "AWS", "Google Cloud", "Terraform", "Jenkins", "Linux", "Networking", "Monitoring"],
  "data": ["Python", "SQL", "Pandas", "NumPy", "TensorFlow", "Machine Learning", "Data Analysis", "Visualization", "Scala", "Spark"],
  "qa": ["Testing", "Automation", "Selenium", "Jest", "Test Design", "Bug Tracking", "API Testing", "Performance Testing", "Communication", "Attention to Detail"],
  "product": ["Product Strategy", "User Research", "Data Analysis", "Communication", "Cross-Functional Collaboration", "SQL", "Analytics", "Roadmapping", "Leadership", "Stakeholder Management"],
  "default": ["React", "Node.js", "Python", "TypeScript", "System Design", "Git", "Communication", "Problem Solving", "Leadership", "Cross-Functional Collaboration"]
};

const generateDynamicSuggestions = (role, jdSkillsExtracted) => {
  const roleLower = (role || "").toLowerCase();
  let baseSkills = ROLE_SKILL_MAPPING["default"];

  for (const [roleKey, skills] of Object.entries(ROLE_SKILL_MAPPING)) {
    if (roleKey !== "default" && roleLower.includes(roleKey)) {
      baseSkills = skills;
      break;
    }
  }

  const combined = [...new Set([...jdSkillsExtracted, ...baseSkills])];
  return combined.slice(0, 15);
};

export default function SkillsStep({
  skills,
  skillInput,
  jobDescriptions,
  selectedJdId,
  customJdText,
  jdExtractSuccess,
  aiLoading,
  personal,
  jdSkillsExtracted = [],
  onSkillInputChange,
  onAddSkill,
  onRemoveSkill,
  onRemoveAllSkills,
  onQuickAddSkill,
  onGenerateSkills,
  onExtractJdSkills,
  onJobDescriptionChange,
  onCustomTextChange,
}) {
  return (
    <div>
      <div className="rb-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Skills</h2>
          <p>Add your technical and soft skills. Press Enter or click Add.</p>
        </div>
        <button
          className="rb-ai-btn"
          onClick={onGenerateSkills}
          disabled={aiLoading["skills"]}
        >
          {aiLoading["skills"] ? <Loader2 size={14} className="rb-ai-spin" /> : <Sparkles size={14} />}
          <span>{aiLoading["skills"] ? "Recommending..." : "AI Recommend Skills"}</span>
        </button>
      </div>

      <div style={{
        background: "rgba(15, 23, 42, 0.85)",
        border: "1px solid rgba(99, 102, 241, 0.3)",
        borderRadius: "14px",
        padding: "20px",
        marginTop: "20px",
        marginBottom: "28px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)"
      }}>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>🎯</span>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc" }}>Match Skills to Target Job</span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0, marginLeft: "34px" }}>Select an uploaded JD or paste job text to auto-extract matching ATS keywords.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "start", marginBottom: selectedJdId === "custom" ? "12px" : 0 }}>
          <select
            className="rb-input"
            value={selectedJdId}
            onChange={onJobDescriptionChange}
            style={{ background: "rgba(30, 41, 59, 0.9)", color: "#f8fafc", borderColor: "rgba(255, 255, 255, 0.15)" }}
          >
            {jobDescriptions.length > 0 ? (
              jobDescriptions.map((j) => (
                <option key={j.id} value={String(j.id)}>
                  📄 {j.title || j.role || "Job Description"} {j.company ? `(${j.company})` : ""}
                </option>
              ))
            ) : (
              <option value="">No uploaded JDs found</option>
            )}
            <option value="custom">✏️ Paste Custom Job Description Text</option>
          </select>

          <button
            type="button"
            className="rb-ai-btn"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", color: "#ffffff", padding: "9px 18px", borderRadius: "8px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
            onClick={onExtractJdSkills}
            disabled={aiLoading["jd_skills"]}
          >
            {aiLoading["jd_skills"] ? <Loader2 size={15} className="rb-ai-spin" /> : <Sparkles size={15} />}
            <span>{aiLoading["jd_skills"] ? "Extracting..." : "Extract Skills"}</span>
          </button>
        </div>

        {selectedJdId === "custom" && (
          <textarea
            className="rb-input"
            style={{ width: "100%", height: "75px", fontSize: "0.8rem", background: "rgba(30, 41, 59, 0.7)", color: "#f8fafc", resize: "none" }}
            placeholder="Paste target Job Description text here (responsibilities, required skills, tech stack)..."
            value={customJdText}
            onChange={onCustomTextChange}
          />
        )}

        {jdExtractSuccess && (
          <div style={{ marginTop: "12px", padding: "10px 14px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", color: "#10b981", fontSize: "0.75rem", fontWeight: 600 }}>
            ✓ {jdExtractSuccess}
          </div>
        )}
      </div>

      <div className="rb-skills-container">
        {/* Skills Display Section */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1" }}>Your Skills ({skills.length})</span>
            {skills.length > 0 && (
              <button
                type="button"
                className="rb-preset-btn"
                style={{ color: "#f87171", borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", fontSize: "0.75rem", padding: "4px 10px" }}
                onClick={onRemoveAllSkills}
              >
                🗑️ Clear All
              </button>
            )}
          </div>
          <div className="rb-tags-display" style={{ minHeight: "60px", padding: "12px", background: "rgba(30, 41, 59, 0.5)", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            {skills.length === 0 && <span style={{ color: "#475569", fontSize: "0.82rem" }}>No skills added yet. Add some below →</span>}
            {skills.map(sk => (
              <span key={sk} className="rb-tag">
                {sk}
                <span className="rb-tag-remove" onClick={() => onRemoveSkill(sk)}>×</span>
              </span>
            ))}
          </div>
        </div>

        {/* Add Skill Input */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "8px", display: "block" }}>Add a Skill</label>
          <div className="rb-tag-input-row" style={{ gap: "10px" }}>
            <input
              className="rb-input"
              placeholder="e.g. React, Node.js, Python, Leadership…"
              value={skillInput}
              onChange={e => onSkillInputChange(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAddSkill(); }}}
              style={{ flex: 1 }}
            />
            <button className="rb-tag-add-btn" onClick={onAddSkill}>+ Add</button>
          </div>
        </div>

        {/* AI Recommendation Hint */}
        <div className="rb-ai-hint" style={{ marginBottom: "20px", background: "rgba(59, 130, 246, 0.08)", borderLeft: "3px solid #3b82f6" }}>
          ✨ Click 'AI Recommend Skills' above to auto-suggest top skills for <strong>{personal.title || "your role"}</strong>.
        </div>

        {/* Quick Add Suggestions */}
        <div>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", display: "block", marginBottom: "10px" }}>
            💡 Suggested for <strong>{personal.title || "your role"}</strong>
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px" }}>
            {generateDynamicSuggestions(personal.title, jdSkillsExtracted).map(s => (
              !skills.includes(s) && (
                <button
                  key={s}
                  onClick={() => onQuickAddSkill(s)}
                  style={{
                    padding: "8px 12px", borderRadius: "8px",
                    border: "1px solid rgba(129, 140, 248, 0.3)",
                    background: "rgba(129, 140, 248, 0.08)",
                    color: "#a5b4fc", fontSize: "0.78rem", cursor: "pointer", transition: "all 0.2s",
                    textAlign: "center", fontWeight: 500
                  }}
                  onMouseEnter={(e) => { e.target.style.background = "rgba(129, 140, 248, 0.15)"; e.target.style.borderColor = "rgba(129, 140, 248, 0.5)"; }}
                  onMouseLeave={(e) => { e.target.style.background = "rgba(129, 140, 248, 0.08)"; e.target.style.borderColor = "rgba(129, 140, 248, 0.3)"; }}
                >+ {s}</button>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

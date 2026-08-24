import { useRef, useEffect } from "react";
import { Sparkles, Loader2, Trash2, Plus } from "lucide-react";
import CustomMonthPicker from "../CustomMonthPicker";
import CustomYearPicker from "../CustomYearPicker";

export default function ExperienceStep({
  experiences,
  aiLoading,
  onAddExperience,
  onDeleteExperience,
  onUpdateExperience,
  onUpdateBullet,
  onAddBullet,
  onDeleteBullet,
  onGenerateBullets,
  onAutofill,
}) {
  // New roles are appended to the end of a long list, so without scrolling the
  // user to them the click looks like it did nothing.
  const lastEntryRef = useRef(null);
  const prevCountRef = useRef(experiences.length);

  useEffect(() => {
    if (experiences.length > prevCountRef.current && lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      const firstInput = lastEntryRef.current.querySelector("input");
      if (firstInput) setTimeout(() => firstInput.focus(), 400);
    }
    prevCountRef.current = experiences.length;
  }, [experiences.length]);

  const addRoleBtnStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "9px 16px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#ffffff",
    border: "1px solid rgba(16,185,129,0.5)",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 700,
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  };

  return (
    <div>
      <div className="rb-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Work Experience</h2>
          <p>List your roles in reverse chronological order. Use bullet points to highlight impact.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="rb-ai-btn" onClick={onAutofill} disabled={aiLoading["experience"]}>
            {aiLoading["experience"] ? <Loader2 size={14} className="rb-ai-spin" /> : <Sparkles size={14} />}
            <span>{aiLoading["experience"] ? "Autofilling..." : "Autofill from Resume"}</span>
          </button>
          <button
            type="button"
            className="rb-add-btn"
            onClick={onAddExperience}
            style={addRoleBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(16,185,129,0.3)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Plus size={16} /> Add Role
          </button>
        </div>
      </div>

      {experiences.map((exp, idx) => (
        <div
          key={exp.id}
          ref={idx === experiences.length - 1 ? lastEntryRef : null}
          style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid rgba(99,102,241,0.2)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Experience #{idx + 1}</h3>
            {experiences.length > 1 && (
              <button
                type="button"
                className="rb-delete-btn"
                onClick={() => onDeleteExperience(exp.id)}
                style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, display: "flex", gap: "4px", alignItems: "center" }}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div className="rb-field">
              <label className="rb-label">Company Name</label>
              <input
                className="rb-input"
                type="text"
                placeholder="Acme Corp"
                value={exp.company}
                onChange={e => onUpdateExperience(exp.id, "company", e.target.value)}
              />
            </div>
            <div className="rb-field">
              <label className="rb-label">Job Title</label>
              <input
                className="rb-input"
                type="text"
                placeholder="Senior Full Stack Engineer"
                value={exp.role}
                onChange={e => onUpdateExperience(exp.id, "role", e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "auto auto auto", gap: "16px", marginBottom: "16px", alignItems: "flex-end" }}>
            <CustomMonthPicker
              label="Start Month"
              value={exp.startDate}
              onChange={val => onUpdateExperience(exp.id, "startDate", val)}
            />
            <CustomYearPicker
              label="Start Year"
              value={exp.startDate}
              onChange={val => onUpdateExperience(exp.id, "startDate", val)}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={exp.current}
                onChange={e => onUpdateExperience(exp.id, "current", e.target.checked)}
              />
              <span style={{ fontSize: "0.9rem", color: "#cbd5e1" }}>Currently Working</span>
            </div>
          </div>

          {!exp.current && (
            <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "16px", marginBottom: "16px", alignItems: "flex-end" }}>
              <CustomMonthPicker
                label="End Month"
                value={exp.endDate}
                onChange={val => onUpdateExperience(exp.id, "endDate", val)}
              />
              <CustomYearPicker
                label="End Year"
                value={exp.endDate}
                onChange={val => onUpdateExperience(exp.id, "endDate", val)}
              />
            </div>
          )}

          <button
            type="button"
            className="rb-ai-btn"
            onClick={() => onGenerateBullets(exp.id)}
            disabled={aiLoading[`exp_bullets_${exp.id}`]}
            style={{ marginBottom: "16px", width: "100%" }}
          >
            {aiLoading[`exp_bullets_${exp.id}`] ? <Loader2 size={14} className="rb-ai-spin" /> : <Sparkles size={14} />}
            <span>{aiLoading[`exp_bullets_${exp.id}`] ? "Generating..." : "AI Generate Bullets"}</span>
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {exp.bullets.map((bullet, bIdx) => (
              <div key={bIdx} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ marginTop: "8px", color: "#6366f1" }}>•</span>
                <input
                  className="rb-input"
                  type="text"
                  placeholder="Achievement or responsibility..."
                  value={bullet}
                  onChange={e => onUpdateBullet(exp.id, bIdx, e.target.value)}
                  style={{ flex: 1 }}
                />
                {exp.bullets.length > 1 && (
                  <button
                    type="button"
                    className="rb-delete-btn"
                    onClick={() => onDeleteBullet(exp.id, bIdx)}
                    style={{ padding: "6px 10px", background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="rb-add-btn"
            onClick={() => onAddBullet(exp.id)}
            style={{ marginTop: "12px", width: "100%", background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px dashed rgba(99,102,241,0.4)", borderRadius: "8px", padding: "10px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
          >
            + Add Bullet Point
          </button>
        </div>
      ))}

      <button
        type="button"
        className="rb-add-btn"
        onClick={onAddExperience}
        style={{ width: "100%", background: "rgba(16,185,129,0.1)", color: "#6ee7b7", border: "1px dashed rgba(16,185,129,0.4)", borderRadius: "8px", padding: "14px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700, transition: "all 0.2s" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(16,185,129,0.18)";
          e.currentTarget.style.borderColor = "rgba(16,185,129,0.7)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(16,185,129,0.1)";
          e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)";
        }}
      >
        + Add Another Role
      </button>
    </div>
  );
}

import { Sparkles, Loader2, Check } from "lucide-react";

export default function PersonalStep({
  personal,
  jobDescriptions,
  selectedJdId,
  aiLoading,
  isShaking,
  onUpdatePersonal,
  onAutoFill,
  onChangeTargetJd,
}) {
  const isNonEmpty = (val) => !!val?.toString().trim();
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");

  return (
    <div className={isShaking ? "rb-shake" : ""}>
      <div style={{
        background: "rgba(99, 102, 241, 0.1)",
        border: "1px solid rgba(99, 102, 241, 0.3)",
        borderRadius: "12px",
        padding: "12px 16px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.2rem" }}>🎯</span>
          <div>
            <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "#f8fafc" }}>
              Target Job: {selectedJdId !== "custom" && jobDescriptions.find(j => String(j.id) === String(selectedJdId)) ? jobDescriptions.find(j => String(j.id) === String(selectedJdId)).title : (personal.title || "Custom Job Description")}
            </span>
            <p style={{ fontSize: "0.74rem", color: "#94a3b8", margin: 0 }}>
              All resume sections, skills, and project points are tailored to this job description.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChangeTargetJd}
          style={{
            background: "rgba(99, 102, 241, 0.2)",
            border: "1px solid rgba(99, 102, 241, 0.4)",
            color: "#a5b4fc",
            fontSize: "0.78rem",
            padding: "6px 14px",
            borderRadius: "6px",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Change Target JD ⚙️
        </button>
      </div>

      <div className="rb-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Personal Information</h2>
          <p>Start with your contact details — floating labels & live validation.</p>
        </div>
        <button
          className="rb-ai-btn"
          onClick={onAutoFill}
          disabled={aiLoading}
        >
          {aiLoading ? <Loader2 size={14} className="rb-ai-spin" /> : <Sparkles size={14} />}
          <span>{aiLoading ? "Extracting..." : "Autofill from Resume"}</span>
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
              onChange={e => onUpdatePersonal(k, e.target.value)}
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
}

import { Sparkles, Loader2 } from "lucide-react";

export default function TargetJdStep({
  jobDescriptions,
  selectedJdId,
  customJdText,
  jdSkillsExtracted,
  aiLoading,
  onJobDescriptionChange,
  onCustomTextChange,
  onExtractSkills,
  onContinue,
  onSetPersonalTitle,
}) {
  return (
    <div>
      <div className="rb-section-heading">
        <h2>Target Job Description</h2>
        <p>Select your target Job Description first. All resume sections, skills, and project points will automatically adapt and tailor to this JD.</p>
      </div>

      <div style={{
        background: "rgba(15, 23, 42, 0.85)",
        border: "1px solid rgba(99, 102, 241, 0.35)",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "24px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)"
      }}>
        <div style={{ marginBottom: "16px" }}>
          <label className="rb-label" style={{ fontSize: "0.92rem", fontWeight: 700, color: "#f8fafc" }}>
            Select Uploaded Job Description
          </label>
          <select
            className="rb-input"
            value={selectedJdId}
            onChange={onJobDescriptionChange}
            style={{ width: "100%", marginTop: "8px", background: "rgba(30, 41, 59, 0.9)", color: "#f8fafc", padding: "12px", fontSize: "0.9rem", borderRadius: "8px" }}
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
        </div>

        {selectedJdId === "custom" && (
          <div style={{ marginBottom: "16px" }}>
            <label className="rb-label" style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
              Paste Target Job Description (Responsibilities, Required Skills, Tech Stack)
            </label>
            <textarea
              className="rb-textarea"
              rows={6}
              placeholder="Paste full job description text here..."
              value={customJdText}
              onChange={onCustomTextChange}
              style={{ width: "100%", marginTop: "8px", background: "rgba(30, 41, 59, 0.7)", color: "#f8fafc", fontSize: "0.85rem", resize: "none" }}
            />
          </div>
        )}

        <button
          type="button"
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#ffffff",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            cursor: "pointer",
            marginBottom: "12px"
          }}
          onClick={onExtractSkills}
          disabled={aiLoading || !selectedJdId}
        >
          {aiLoading ? <Loader2 size={16} className="rb-ai-spin" /> : <Sparkles size={16} />}
          <span>{aiLoading ? "Extracting Keywords..." : "🔍 Extract Keywords from Job Description"}</span>
        </button>

        <button
          type="button"
          className="rb-ai-btn"
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            color: "#ffffff",
            padding: "14px",
            borderRadius: "10px",
            fontSize: "0.95rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            border: "none",
            cursor: "pointer",
            marginTop: "12px"
          }}
          onClick={onContinue}
          disabled={aiLoading}
        >
          {aiLoading ? <Loader2 size={18} className="rb-ai-spin" /> : <Sparkles size={18} />}
          <span>{aiLoading ? "Analyzing Job & Extracting Skills..." : "🎯 Apply Job Description & Continue to Personal Details →"}</span>
        </button>
      </div>

      {jdSkillsExtracted.length > 0 && (
        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "12px", padding: "16px" }}>
          <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.9rem" }}>✓ Extracted Key Skills from Target JD:</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
            {jdSkillsExtracted.map(sk => (
              <span key={sk} style={{ background: "rgba(16, 185, 129, 0.2)", color: "#6ee7b7", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600 }}>
                ✓ {sk}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

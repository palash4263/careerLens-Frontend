import { Sparkles, Loader2 } from "lucide-react";

export default function SummaryStep({
  summary,
  aiLoading,
  onSummaryChange,
  onGenerateSummary,
}) {
  return (
    <div>
      <div className="rb-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Professional Summary</h2>
          <p>2–3 sentences that capture your experience, skills, and career goal.</p>
        </div>
        <button
          className="rb-ai-btn"
          onClick={onGenerateSummary}
          disabled={aiLoading}
        >
          {aiLoading ? <Loader2 size={14} className="rb-ai-spin" /> : <Sparkles size={14} />}
          <span>{aiLoading ? "AI Generating..." : "AI Generate Summary"}</span>
        </button>
      </div>

      <div className="rb-field full">
        <label className="rb-label">Summary</label>
        <textarea
          className="rb-textarea"
          rows={6}
          placeholder="Experienced full-stack engineer with 4+ years building scalable React + Node.js applications. Passionate about clean code, AI integrations, and shipping fast. Looking for a senior engineering role at a product-driven startup."
          value={summary}
          onChange={e => onSummaryChange(e.target.value)}
        />
      </div>
      <div className="rb-ai-hint">✨ Tip: Type a custom instruction in the Groq AI box above, or click 'AI Generate Summary' to generate tailored prose.</div>
    </div>
  );
}

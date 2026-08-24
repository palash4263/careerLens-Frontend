import { Sparkles, Loader2 } from "lucide-react";
import CustomMonthPicker from "../CustomMonthPicker";

export default function EducationStep({
  educations,
  aiLoading,
  onAddEducation,
  onDeleteEducation,
  onUpdateEducation,
  onAutofill,
}) {
  return (
    <div>
      <div className="rb-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Education</h2>
          <p>Add your degrees from most recent to oldest.</p>
        </div>
        <button
          className="rb-ai-btn"
          onClick={onAutofill}
          disabled={aiLoading}
        >
          {aiLoading ? <Loader2 size={14} className="rb-ai-spin" /> : <Sparkles size={14} />}
          <span>{aiLoading ? "Extracting..." : "Autofill from Resume"}</span>
        </button>
      </div>

      <div className="rb-entries">
        {educations.map((edu, ei) => (
          <div key={edu.id} className="rb-entry-card">
            <div className="rb-entry-card-header">
              <span className="rb-entry-card-title">Education #{ei + 1}</span>
              {educations.length > 1 && (
                <button
                  className="rb-entry-remove-btn"
                  onClick={() => onDeleteEducation(edu.id)}
                >
                  ×
                </button>
              )}
            </div>
            <div className="rb-field-grid">
              <div className="rb-field full">
                <label className="rb-label">School / University</label>
                <input
                  className="rb-input"
                  placeholder="IIT Bombay"
                  value={edu.school}
                  onChange={e => onUpdateEducation(edu.id, "school", e.target.value)}
                />
              </div>
              <div className="rb-field">
                <label className="rb-label">Degree</label>
                <input
                  className="rb-input"
                  placeholder="B.Tech"
                  value={edu.degree}
                  onChange={e => onUpdateEducation(edu.id, "degree", e.target.value)}
                />
              </div>
              <div className="rb-field">
                <label className="rb-label">Field of Study</label>
                <input
                  className="rb-input"
                  placeholder="Computer Science"
                  value={edu.field}
                  onChange={e => onUpdateEducation(edu.id, "field", e.target.value)}
                />
              </div>
              <div className="rb-field">
                <label className="rb-label">Start Date / Year</label>
                <CustomMonthPicker
                  value={edu.startYear}
                  onChange={val => onUpdateEducation(edu.id, "startYear", val)}
                  placeholder="Select Start Date"
                />
              </div>
              <div className="rb-field">
                <label className="rb-label">End Date / Year</label>
                <CustomMonthPicker
                  value={edu.endYear}
                  onChange={val => onUpdateEducation(edu.id, "endYear", val)}
                  placeholder="Select End Date"
                />
              </div>
              <div className="rb-field">
                <label className="rb-label">GPA / Percentage (optional)</label>
                <input
                  className="rb-input"
                  placeholder="8.5 / 10"
                  value={edu.gpa}
                  onChange={e => onUpdateEducation(edu.id, "gpa", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        <button className="rb-add-entry-btn" onClick={onAddEducation}>
          + Add Another Degree
        </button>
      </div>
    </div>
  );
}

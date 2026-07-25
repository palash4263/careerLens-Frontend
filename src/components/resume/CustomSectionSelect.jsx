// src/components/resume/CustomSectionSelect.jsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Sparkles } from "lucide-react";
import "./CustomSectionSelect.css";

const SECTION_DETAILS = {
  Header: { icon: "👤", title: "Personal Information", desc: "Contact details, location, and social links", color: "#38bdf8" },
  Summary: { icon: "📄", title: "Professional Summary", desc: "Executive overview & career objective", color: "#a855f7" },
  Experience: { icon: "💼", title: "Work Experience", desc: "Professional history, roles & metrics", color: "#a3e635" },
  Projects: { icon: "⚡", title: "Key Projects", desc: "Technical projects & architecture stack", color: "#fbbf24" },
  Skills: { icon: "🎯", title: "Core Skills & Tech", desc: "Categorized skills, frameworks & tools", color: "#34d399" },
  Education: { icon: "🎓", title: "Education & Academics", desc: "Degrees, universities & graduation years", color: "#f43f5e" },
  Certifications: { icon: "🏆", title: "Certifications & Awards", desc: "Professional licenses & certifications", color: "#e02424" },
};

export default function CustomSectionSelect({
  value,
  onChange,
  options = ["Header", "Summary", "Experience", "Projects", "Skills", "Education", "Certifications"],
  placeholder = "Select Section"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedMeta = SECTION_DETAILS[value] || {
    icon: "📝",
    title: `${value} Section`,
    desc: `Edit your ${value} section content`,
    color: "#38bdf8"
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="css-select-container" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`css-trigger-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="css-trigger-left">
          <span className="css-trigger-icon-badge" style={{ borderColor: `${selectedMeta.color}40`, background: `${selectedMeta.color}15` }}>
            {selectedMeta.icon}
          </span>
          <div className="css-trigger-text">
            <span className="css-trigger-title">{selectedMeta.title}</span>
            <span className="css-trigger-desc">{selectedMeta.desc}</span>
          </div>
        </div>
        <div className="css-trigger-right">
          <span className="css-pulse-dot" style={{ backgroundColor: selectedMeta.color }} />
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <ChevronDown size={16} className="css-chevron" />
          </motion.div>
        </div>
      </button>

      {/* Popover Dropdown Menu & Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="css-mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="css-popover-menu"
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
            <div className="css-popover-header">
              <span className="css-popover-header-title">
                <Sparkles size={12} style={{ color: "#38bdf8" }} />
                CHOOSE SECTION TO EDIT
              </span>
            </div>

            <div className="css-options-list">
              {options.map((key) => {
                const meta = SECTION_DETAILS[key] || {
                  icon: "📝",
                  title: `${key} Section`,
                  desc: `Edit your ${key} content`,
                  color: "#38bdf8"
                };
                const isSelected = value === key;

                return (
                  <button
                    key={key}
                    type="button"
                    className={`css-option-item ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      onChange(key);
                      setIsOpen(false);
                    }}
                  >
                    <div className="css-option-left">
                      <span
                        className="css-option-icon"
                        style={{
                          backgroundColor: `${meta.color}15`,
                          borderColor: isSelected ? meta.color : `${meta.color}30`
                        }}
                      >
                        {meta.icon}
                      </span>
                      <div className="css-option-text">
                        <span className="css-option-title" style={{ color: isSelected ? meta.color : "#ffffff" }}>
                          {meta.title}
                        </span>
                        <span className="css-option-desc">{meta.desc}</span>
                      </div>
                    </div>

                    {isSelected && (
                      <motion.div
                        className="css-check-wrapper"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <Check size={14} style={{ color: meta.color }} />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

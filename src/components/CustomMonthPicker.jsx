import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import "./CustomMonthPicker.css";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr",
  "May", "Jun", "Jul", "Aug",
  "Sep", "Oct", "Nov", "Dec"
];

const FULL_MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

export default function CustomMonthPicker({
  value = "",
  onChange,
  placeholder = "Select Month & Year",
  disabled = false,
  label = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse value (expected format "YYYY-MM" e.g. "2024-06" or "June 2024" or "")
  const parseVal = (valStr) => {
    if (!valStr || valStr.trim() === "") {
      return { year: new Date().getFullYear(), monthIdx: new Date().getMonth() };
    }
    if (valStr.includes("-")) {
      const [y, m] = valStr.split("-");
      return { year: parseInt(y, 10) || new Date().getFullYear(), monthIdx: Math.max(0, (parseInt(m, 10) || 1) - 1) };
    }
    const parts = valStr.split(" ");
    if (parts.length >= 2) {
      const mName = parts[0];
      const yNum = parseInt(parts[1], 10);
      const mIdx = FULL_MONTH_NAMES.findIndex(m => m.toLowerCase().startsWith(mName.toLowerCase().slice(0, 3)));
      if (mIdx !== -1 && yNum) {
        return { year: yNum, monthIdx: mIdx };
      }
    }
    return { year: new Date().getFullYear(), monthIdx: new Date().getMonth() };
  };

  const initialParsed = parseVal(value);
  const [viewYear, setViewYear] = useState(initialParsed.year);
  const [selectedMonth, setSelectedMonth] = useState(initialParsed.monthIdx);
  const [selectedYear, setSelectedYear] = useState(initialParsed.year);

  // Sync viewYear when value changes externally
  useEffect(() => {
    if (value) {
      const parsed = parseVal(value);
      setViewYear(parsed.year);
      setSelectedYear(parsed.year);
      setSelectedMonth(parsed.monthIdx);
    }
  }, [value]);

  const getDisplayText = () => {
    if (!value || value.trim() === "") return "";
    const p = parseVal(value);
    return `${FULL_MONTH_NAMES[p.monthIdx]} ${p.year}`;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectMonth = (mIdx) => {
    setSelectedMonth(mIdx);
    setSelectedYear(viewYear);
    const monthNum = String(mIdx + 1).padStart(2, "0");
    const formattedVal = `${viewYear}-${monthNum}`;
    onChange(formattedVal);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  return (
    <div className="cmp-wrapper" ref={containerRef}>
      <div
        className={`cmp-input-box ${isOpen ? "open" : ""} ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`cmp-value-text ${!value ? "placeholder" : ""}`}>
          {getDisplayText() || placeholder}
        </span>

        <div className="cmp-icon-area">
          {value && !disabled && (
            <button
              type="button"
              className="cmp-clear-btn"
              onClick={handleClear}
              title="Clear date"
            >
              <X size={13} />
            </button>
          )}
          <Calendar size={16} className="cmp-cal-icon" />
        </div>
      </div>

      {isOpen && (
        <div className="cmp-popover">
          {/* Header Year Navigation */}
          <div className="cmp-header">
            <button
              type="button"
              className="cmp-nav-btn"
              onClick={() => setViewYear(y => y - 1)}
              title="Previous Year"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="cmp-year-display">{viewYear}</span>
            <button
              type="button"
              className="cmp-nav-btn"
              onClick={() => setViewYear(y => y + 1)}
              title="Next Year"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 3x4 Month Grid */}
          <div className="cmp-month-grid">
            {MONTHS.map((mName, mIdx) => {
              const isSelected = selectedMonth === mIdx && selectedYear === viewYear && Boolean(value);
              const isCurrentThisYear = new Date().getMonth() === mIdx && new Date().getFullYear() === viewYear;

              return (
                <button
                  key={mName}
                  type="button"
                  className={`cmp-month-btn ${isSelected ? "selected" : ""} ${isCurrentThisYear ? "current" : ""}`}
                  onClick={() => handleSelectMonth(mIdx)}
                >
                  <span>{mName}</span>
                  {isSelected && <Check size={12} className="cmp-check" />}
                </button>
              );
            })}
          </div>

          {/* Quick Footer Shortcuts */}
          <div className="cmp-footer">
            <button
              type="button"
              className="cmp-footer-btn"
              onClick={() => {
                const now = new Date();
                setViewYear(now.getFullYear());
                handleSelectMonth(now.getMonth());
              }}
            >
              This Month
            </button>
            <button
              type="button"
              className="cmp-footer-btn clear"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

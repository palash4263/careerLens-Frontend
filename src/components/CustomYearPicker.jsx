import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import "./CustomYearPicker.css";

export default function CustomYearPicker({
  value = "",
  onChange,
  placeholder = "Select Year",
  disabled = false,
  minYear = 1970,
  maxYear = 2035
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const currentYr = new Date().getFullYear();
  const parsedVal = parseInt(value, 10) || null;

  // Base year for 12-year decade window
  const getStartYearForWindow = (yr) => {
    const target = yr || currentYr;
    return target - (target % 12);
  };

  const [startDecadeYear, setStartDecadeYear] = useState(getStartYearForWindow(parsedVal));

  useEffect(() => {
    if (parsedVal) {
      setStartDecadeYear(getStartYearForWindow(parsedVal));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectYear = (yr) => {
    onChange(String(yr));
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  // Generate 12 years array for current decade window
  const yearsGrid = Array.from({ length: 12 }, (_, i) => startDecadeYear + i);

  return (
    <div className="cyp-wrapper" ref={containerRef}>
      <div
        className={`cyp-input-box ${isOpen ? "open" : ""} ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`cyp-value-text ${!value ? "placeholder" : ""}`}>
          {value || placeholder}
        </span>

        <div className="cyp-icon-area">
          {value && !disabled && (
            <button
              type="button"
              className="cyp-clear-btn"
              onClick={handleClear}
              title="Clear year"
            >
              <X size={13} />
            </button>
          )}
          <Calendar size={16} className="cyp-cal-icon" />
        </div>
      </div>

      {isOpen && (
        <div className="cyp-popover">
          {/* Header Decade Navigation */}
          <div className="cyp-header">
            <button
              type="button"
              className="cyp-nav-btn"
              onClick={() => setStartDecadeYear(y => y - 12)}
              title="Previous 12 Years"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="cyp-year-display">
              {startDecadeYear} – {startDecadeYear + 11}
            </span>
            <button
              type="button"
              className="cyp-nav-btn"
              onClick={() => setStartDecadeYear(y => y + 12)}
              title="Next 12 Years"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 3x4 Year Grid */}
          <div className="cyp-year-grid">
            {yearsGrid.map((yr) => {
              const isSelected = parsedVal === yr;
              const isCurrentThisYear = currentYr === yr;

              return (
                <button
                  key={yr}
                  type="button"
                  className={`cyp-year-btn ${isSelected ? "selected" : ""} ${isCurrentThisYear ? "current" : ""}`}
                  onClick={() => handleSelectYear(yr)}
                >
                  <span>{yr}</span>
                  {isSelected && <Check size={12} className="cyp-check" />}
                </button>
              );
            })}
          </div>

          {/* Quick Footer Shortcuts */}
          <div className="cyp-footer">
            <button
              type="button"
              className="cyp-footer-btn"
              onClick={() => {
                setStartDecadeYear(getStartYearForWindow(currentYr));
                handleSelectYear(currentYr);
              }}
            >
              This Year ({currentYr})
            </button>
            <button
              type="button"
              className="cyp-footer-btn clear"
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

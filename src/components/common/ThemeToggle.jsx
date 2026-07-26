// src/components/common/ThemeToggle.jsx
import { useRef, useEffect } from "react";
import { animate } from "animejs";
import { useTheme } from "../../context/ThemeContext";
import "./ThemeToggle.css";

/**
 * ThemeToggle — Anime.js Powered Sun ↔ Moon Morph Button
 * -------------------------------------------------------
 * Clicking triggers:
 *  1. Button scale pop (outElastic spring)
 *  2. Icon rotation + opacity cross-fade
 *  3. Radial ripple burst using Anime.js
 */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const btnRef    = useRef(null);
  const rippleRef = useRef(null);
  const isDark    = theme === "dark";

  // Entrance animation
  useEffect(() => {
    if (!btnRef.current) return;
    animate(btnRef.current, {
      scale: [0, 1],
      opacity: [0, 1],
      ease: "outElastic(1, 0.5)",
      duration: 800,
    });
  }, []);

  const handleClick = () => {
    // 1. Button scale pop
    animate(btnRef.current, {
      scale: [1, 1.25, 1],
      ease: "outElastic(1, 0.4)",
      duration: 550,
    });

    // 2. Ripple burst
    if (rippleRef.current) {
      rippleRef.current.style.opacity = "1";
      animate(rippleRef.current, {
        scale: [0, 3.5],
        opacity: [0.35, 0],
        ease: "outExpo",
        duration: 700,
      });
    }

    toggle();
  };

  return (
    <div className="tt-wrapper" title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
      <div className="tt-ripple" ref={rippleRef} />
      <button
        ref={btnRef}
        className={`tt-btn ${isDark ? "tt-dark" : "tt-light"}`}
        onClick={handleClick}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {/* Track */}
        <span className="tt-track">
          <span className="tt-thumb">
            {isDark ? (
              /* Moon icon */
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            ) : (
              /* Sun icon */
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </span>
        </span>
      </button>
    </div>
  );
}

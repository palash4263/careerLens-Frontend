// src/components/common/AiNeuralTerminalConsole.jsx
import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import "./AiNeuralTerminalConsole.css";

/**
 * AiNeuralTerminalConsole (Powered by Anime.js)
 * -----------------------------------------------
 * Live Cyber-Style AI Neural Parser Log Console:
 * 1. Typewriter/scan animation lines for PDF parsing, keyword indexing, and ATS scoring.
 * 2. Blinking green terminal cursor.
 * 3. Animated log line entry using Anime.js stagger.
 */
const DEFAULT_LOGS = [
  { time: "0.1s", text: "INITIALIZING PDF BINARY STREAM PARSER...", status: "SUCCESS", color: "#38bdf8" },
  { time: "0.3s", text: "EXTRACTING WORK TIMELINE & SECTION HEADERS...", status: "DONE", color: "#38bdf8" },
  { time: "0.6s", text: "INDEXING HARD SKILLS: REACT, JAVA, SPRING, AWS...", status: "INDEXED", color: "#a78bfa" },
  { time: "0.9s", text: "QUANTIFYING BULLET METRICS WITH STAR STANDARD...", status: "VERIFIED", color: "#34d399" },
  { time: "1.2s", text: "PARSABILITY INDEX: 98% (HIGH COMPATIBILITY)", status: "READY", color: "#fbbf24" },
];

export default function AiNeuralTerminalConsole({ fileName }) {
  const containerRef = useRef(null);
  const [logs, setLogs] = useState(DEFAULT_LOGS);

  useEffect(() => {
    if (!containerRef.current) return;
    const logItems = containerRef.current.querySelectorAll(".antc-log-item");
    if (logItems.length === 0) return;

    // Anime.js Staggered Terminal Line Entry
    const animLogs = animate(logItems, {
      translateX: [-20, 0],
      opacity: [0, 1],
      delay: stagger(180, { from: "first" }),
      ease: "outExpo",
      duration: 800,
    });

    return () => animLogs.pause();
  }, [logs]);

  return (
    <div className="antc-container" ref={containerRef}>
      {/* Terminal Window Header */}
      <div className="antc-header">
        <div className="antc-dots">
          <span className="antc-dot red" />
          <span className="antc-dot yellow" />
          <span className="antc-dot green" />
        </div>
        <span className="antc-title">🤖 CL-NEURAL-PARSER // SYSTEM LOGS</span>
        <span className="antc-live-badge">● LIVE</span>
      </div>

      {/* Terminal Log Body */}
      <div className="antc-body">
        {fileName && (
          <div className="antc-file-target">
            <span className="antc-prompt">&gt; TARGET FILE:</span>
            <span className="antc-filename">{fileName}</span>
          </div>
        )}

        <div className="antc-log-list">
          {logs.map((log, idx) => (
            <div key={idx} className="antc-log-item" style={{ "--log-color": log.color }}>
              <span className="antc-arrow">&gt;</span>
              <span className="antc-time">[{log.time}]</span>
              <span className="antc-text">{log.text}</span>
              <span className="antc-status-tag">{log.status}</span>
            </div>
          ))}
        </div>

        {/* Blinking Terminal Cursor */}
        <div className="antc-cursor-line">
          <span className="antc-prompt">&gt; AI PARSER STATUS: OPTIMAL</span>
          <span className="antc-blinking-cursor">_</span>
        </div>
      </div>
    </div>
  );
}

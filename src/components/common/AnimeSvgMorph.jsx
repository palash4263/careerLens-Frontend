// src/components/common/AnimeSvgMorph.jsx
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import "./AnimeSvgMorph.css";

/**
 * AnimeSvgMorph (Powered by Anime.js)
 * -----------------------------------
 * Demonstrates:
 * 1. SVG Path Morphing (Document icon morphs into glowing ATS Shield on hover).
 * 2. SVG Orbit Path Motion (Tech badges flying along curved SVG orbit).
 */
export default function AnimeSvgMorph() {
  const [isShield, setIsShield] = useState(false);
  const pathRef = useRef(null);
  const orbitBadge1Ref = useRef(null);
  const orbitBadge2Ref = useRef(null);

  // SVG Paths
  // Path A: Document Icon shape
  const DOC_PATH = "M20 10 L60 10 L80 30 L80 90 L20 90 Z";
  // Path B: ATS Shield shape
  const SHIELD_PATH = "M50 10 L80 25 L80 60 C80 80 50 95 50 95 C50 95 20 80 20 60 L20 25 Z";

  useEffect(() => {
    // 1. Anime.js SVG Path Morphing
    if (pathRef.current) {
      animate(pathRef.current, {
        d: isShield ? SHIELD_PATH : DOC_PATH,
        fill: isShield ? "#8b5cf6" : "#38bdf8",
        ease: "inOutElastic(1, 0.5)",
        duration: 1400,
      });
    }
  }, [isShield]);

  useEffect(() => {
    // 2. Anime.js SVG Orbit Motion
    const animOrbit1 = animate(orbitBadge1Ref.current, {
      rotate: "360deg",
      ease: "linear",
      duration: 7000,
      loop: true,
    });

    const animOrbit2 = animate(orbitBadge2Ref.current, {
      rotate: "-360deg",
      ease: "linear",
      duration: 9000,
      loop: true,
    });

    return () => {
      animOrbit1.pause();
      animOrbit2.pause();
    };
  }, []);

  return (
    <div
      className="asm-container"
      onMouseEnter={() => setIsShield(true)}
      onMouseLeave={() => setIsShield(false)}
    >
      <div className="asm-orbit-wrapper">
        {/* Orbit Path Badge 1 */}
        <div className="asm-orbit-ring" ref={orbitBadge1Ref}>
          <div className="asm-badge b1">⚡ React</div>
        </div>

        {/* Orbit Path Badge 2 */}
        <div className="asm-orbit-ring" ref={orbitBadge2Ref}>
          <div className="asm-badge b2">🚀 AWS</div>
        </div>

        {/* Center Morphing SVG Canvas */}
        <svg viewBox="0 0 100 100" className="asm-svg">
          <defs>
            <filter id="asmGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            ref={pathRef}
            d={DOC_PATH}
            fill="#38bdf8"
            stroke="#ffffff"
            strokeWidth="2"
            filter="url(#asmGlow)"
          />
        </svg>

        <span className="asm-hint">
          {isShield ? "🛡️ ATS Shield Active" : "📄 Hover to Morph into ATS Shield"}
        </span>
      </div>
    </div>
  );
}

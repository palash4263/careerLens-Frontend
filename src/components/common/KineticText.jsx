// src/components/common/KineticText.jsx
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import "./KineticText.css";

/**
 * KineticText (Powered by Anime.js)
 * ---------------------------------
 * Splits text string into individual character spans and performs
 * cascading 3D character flips (rotateY, translateZ, opacity) with Anime.js stagger.
 */
export default function KineticText({ text, className = "", highlightWords = [] }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chars = containerRef.current.querySelectorAll(".kt-char");
    if (chars.length === 0) return;

    const anim = animate(chars, {
      rotateY: [90, 0],
      translateZ: [50, 0],
      opacity: [0, 1],
      delay: stagger(35, { from: "first" }),
      ease: "outExpo",
      duration: 1200,
    });

    return () => anim.pause();
  }, [text]);

  const words = text.split(" ");

  return (
    <span className={`kt-container ${className}`} ref={containerRef}>
      {words.map((word, wordIdx) => {
        const isHighlight = highlightWords.some(
          (hw) => hw.toLowerCase() === word.toLowerCase().replace(/[^a-z0-9]/gi, "")
        );

        return (
          <span
            key={wordIdx}
            className={`kt-word ${isHighlight ? "kt-highlight" : ""}`}
            style={{ display: "inline-block", whiteSpace: "nowrap", marginRight: "0.28em" }}
          >
            {word.split("").map((char, charIdx) => (
              <span
                key={charIdx}
                className="kt-char"
                style={{
                  display: "inline-block",
                  transformStyle: "preserve-3d",
                  willChange: "transform, opacity",
                }}
              >
                {char}
              </span>
            ))}
          </span>
        );
      })}
    </span>
  );
}

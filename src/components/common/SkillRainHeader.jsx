// src/components/common/SkillRainHeader.jsx
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import "./SkillRainHeader.css";

/**
 * SkillRainHeader (Powered by Anime.js)
 * --------------------------------------
 * Animates tech skill badges dropping down from the top of the page
 * with spring physics and settling next to the right side of the hero title.
 */
const DEFAULT_SKILLS = [
  { name: "React", color: "#38bdf8", icon: "⚛️" },
  { name: "Java", color: "#f59e0b", icon: "☕" },
  { name: "Spring Boot", color: "#34d399", icon: "🍃" },
  { name: "AWS", color: "#fbbf24", icon: "☁️" },
  { name: "Python", color: "#60a5fa", icon: "🐍" },
  { name: "PostgreSQL", color: "#a78bfa", icon: "🐘" },
  { name: "LLMs", color: "#ec4899", icon: "🤖" },
  { name: "Docker", color: "#38bdf8", icon: "🐳" },
];

export default function SkillRainHeader({ skills = DEFAULT_SKILLS }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const badges = containerRef.current.querySelectorAll(".srh-badge");
    if (badges.length === 0) return;

    // Anime.js Slower & Smoother Drop Down Animation from Top of Screen
    const animDrop = animate(badges, {
      translateY: [-280, 0],
      rotateX: [70, 0],
      rotateZ: [-35, 0],
      scale: [0.2, 1],
      opacity: [0, 1],
      delay: stagger(160, { from: "first" }),
      ease: "outElastic(1, 0.4)",
      duration: 2600,
    });

    return () => animDrop.pause();
  }, [skills]);

  return (
    <div className="srh-container" ref={containerRef}>
      {skills.map((skill, index) => (
        <span
          key={index}
          className="srh-badge"
          style={{
            "--badge-color": skill.color,
            borderColor: skill.color,
          }}
        >
          <span className="srh-icon">{skill.icon}</span>
          <span className="srh-name">{skill.name}</span>
        </span>
      ))}
    </div>
  );
}

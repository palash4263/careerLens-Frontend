// src/components/Form3dCompanion.jsx
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Award, CheckCircle2, Flame, Trophy, Star, Palette } from "lucide-react";

export default function Form3dCompanion({ currentStep, completionScore, aiTriggered }) {
  const canvasRef = useRef(null);
  const [bursting, setBursting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [active3dTheme, setActive3dTheme] = useState("purple");

  // 3D Theme presets
  const THEME_COLORS = {
    purple: "#a855f7",
    cyan: "#38bdf8",
    emerald: "#10b981",
    gold: "#fbbf24",
    ruby: "#f43f5e",
    mono: "#94a3b8"
  };

  // Level unlock titles
  const LEVELS = [
    { level: 1, name: "Contact Novice", xp: 150, icon: "👤" },
    { level: 2, name: "Storyteller", xp: 300, icon: "✍️" },
    { level: 3, name: "FAANG Veteran", xp: 550, icon: "💼" },
    { level: 4, name: "Scholar", xp: 700, icon: "🎓" },
    { level: 5, name: "Tech Titan", xp: 850, icon: "⚡" },
    { level: 6, name: "Project Architect", xp: 950, icon: "🚀" },
    { level: 7, name: "ATS Master Legend", xp: 1000, icon: "🏆" },
  ];

  const currentLevel = LEVELS[Math.min(currentStep, 6)];

  useEffect(() => {
    if (aiTriggered) {
      setBursting(true);
      setShowLevelUp(true);
      const timer1 = setTimeout(() => setBursting(false), 1600);
      const timer2 = setTimeout(() => setShowLevelUp(false), 2200);
      return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }
  }, [aiTriggered]);

  // Track mouse movement for interactive 3D parallax tilt
  useEffect(() => {
    const handleMouseMove = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setMousePos({
        x: (e.clientX - cx) / cx,
        y: (e.clientY - cy) / cy,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 3D Canvas Matrix & Kinetic Particle Audio-Visualizer Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;
    let width = (canvas.width = 320);
    let height = (canvas.height = 240);

    const particleCount = 55;
    const particles = [];
    const radius = 70;

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      particles.push({
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta),
        size: Math.random() * 2.4 + 1.2,
      });
    }

    let angleX = 0.01;
    let angleY = 0.015;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      let coreColor = THEME_COLORS[active3dTheme] || "#a855f7";
      if (bursting) coreColor = "#fbbf24";

      const centerX = width / 2 + mousePos.x * 15;
      const centerY = height / 2 - 10 + mousePos.y * 15;

      const sinX = Math.sin(angleX + mousePos.y * 0.02);
      const cosX = Math.cos(angleX + mousePos.y * 0.02);
      const sinY = Math.sin(angleY + mousePos.x * 0.02);
      const cosY = Math.cos(angleY + mousePos.x * 0.02);

      // Draw Base Kinetic Spectrum Wave Bar Visualizer
      const bars = 18;
      const barW = 8;
      const time = Date.now() * 0.003;
      for (let b = 0; b < bars; b++) {
        const h = Math.abs(Math.sin(time + b * 0.4)) * 28 + 6;
        const bx = (width - bars * (barW + 4)) / 2 + b * (barW + 4);
        const by = height - h - 10;
        ctx.fillStyle = coreColor;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.roundRect(bx, by, barW, h, 4);
        ctx.fill();
      }

      // Draw 3D Rotating Constellation
      ctx.lineWidth = 0.75;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        let y1 = p1.y * cosX - p1.z * sinX;
        let z1 = p1.z * cosX + p1.y * sinX;
        let x1 = p1.x * cosY + z1 * sinY;
        let finalZ1 = z1 * cosY - p1.x * sinY;

        p1.x = x1;
        p1.y = y1;
        p1.z = finalZ1;

        const scale = 220 / (220 + p1.z);
        const projX = centerX + p1.x * scale;
        const projY = centerY + p1.y * scale;

        // Draw node links
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const scale2 = 220 / (220 + p2.z);
          const projX2 = centerX + p2.x * scale2;
          const projY2 = centerY + p2.y * scale2;

          const dist = Math.hypot(projX - projX2, projY - projY2);
          if (dist < 46) {
            const alpha = (1 - dist / 46) * 0.4;
            ctx.strokeStyle = coreColor;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(projX, projY);
            ctx.lineTo(projX2, projY2);
            ctx.stroke();
          }
        }

        // Draw 3D Particle
        const alpha = Math.max(0.25, (p1.z + radius) / (2 * radius));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(projX, projY, p1.size * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;

      // Glow Core in center
      const gradient = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, 60);
      gradient.addColorStop(0, coreColor + "cc");
      gradient.addColorStop(0.6, coreColor + "33");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
      ctx.fill();

      angleX = 0.007;
      angleY = 0.01;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [currentStep, bursting, mousePos, active3dTheme]);

  return (
    <div className="rb-3d-companion-card gamified">
      
      {/* Top Gamification Header */}
      <div className="rb-companion-header">
        <div className="rb-companion-pill">
          <Sparkles size={13} className="ip-sparkle-spin" />
          <span>LEVEL {currentStep + 1} · {currentLevel.name.toUpperCase()}</span>
        </div>
        <div className="rb-xp-badge">
          <Flame size={14} color="#ff7043" />
          <span>{currentLevel.xp} XP</span>
        </div>
      </div>

      {/* 3D Theme Swatches */}
      <div className="rb-3d-theme-swatches">
        <span className="rb-theme-lbl"><Palette size={12} /> 3D Theme:</span>
        {Object.keys(THEME_COLORS).map(themeKey => (
          <button
            key={themeKey}
            className={`rb-3d-swatch ${active3dTheme === themeKey ? "active" : ""}`}
            style={{ backgroundColor: THEME_COLORS[themeKey] }}
            onClick={() => setActive3dTheme(themeKey)}
            title={`Set 3D Avatar to ${themeKey}`}
          />
        ))}
      </div>

      {/* 3D Kinetic Canvas Box */}
      <div className="rb-canvas-box">
        <canvas ref={canvasRef} className="rb-3d-canvas" />

        {/* Level Up Pop Banner */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              className="rb-levelup-banner"
              initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={{ scale: 1.1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Trophy size={18} color="#fbbf24" />
              <span>AI QUANTUM BURST! +150 XP</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay Score Ring */}
        <div className="rb-ring-overlay">
          <span className="rb-ring-num">{completionScore}%</span>
          <span className="rb-ring-lbl">ATS POWER</span>
        </div>
      </div>

      {/* Dynamic Achievement Badges */}
      <div className="rb-achievements-row">
        {LEVELS.map((lvl, i) => {
          const isUnlocked = i <= currentStep;
          return (
            <div
              key={lvl.level}
              className={`rb-achieve-badge ${isUnlocked ? "unlocked" : ""}`}
              title={`Level ${lvl.level}: ${lvl.name}`}
            >
              <span>{lvl.icon}</span>
            </div>
          );
        })}
      </div>

      {/* Dynamic Gamified Quest Tip */}
      <div className="rb-companion-hint gamified">
        <div className="rb-hint-header">
          <Star size={13} color="#f59e0b" />
          <span>CURRENT QUEST OBJECTIVE</span>
        </div>
        <p className="rb-hint-txt">
          {completionScore < 30 && "Complete Contact Details to unlock Level 2 Storyteller (+150 XP)!"}
          {completionScore >= 30 && completionScore < 60 && "Write your Executive Summary to boost ATS score past 60%!"}
          {completionScore >= 60 && completionScore < 85 && "Add 3 Work Experiences with quantifiable metrics for FAANG clearance!"}
          {completionScore >= 85 && "🎉 Legendary Resume Achieved! Ready to export & apply!"}
        </p>
      </div>

    </div>
  );
}

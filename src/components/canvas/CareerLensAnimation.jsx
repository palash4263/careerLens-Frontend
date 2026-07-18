// src/components/canvas/CareerLensAnimation.jsx
import { useEffect, useRef, useState } from "react";
import "./CareerLensAnimation.css";

const INTERSTELLAR_MODULES = [
  { id: "ats-lens", label: "ATS Event Horizon", icon: "🌌", stat: "99% Match", angle: 0 },
  { id: "singularity", label: "AI Resume Rewriter", icon: "✨", stat: "Warp Speed", angle: 1.04 },
  { id: "endurance", label: "Endurance Candidate", icon: "🛸", stat: "Top 0.1%", angle: 2.09 },
  { id: "wormhole", label: "Quantum Interview", icon: "🪐", stat: "Ready", angle: 3.14 },
  { id: "time-dation", label: "Gravitational Format", icon: "⏳", stat: "100% Parsed", angle: 4.18 },
  { id: "tesseract", label: "Tesseract Career AI", icon: "📐", stat: "Active", angle: 5.23 },
];

export default function CareerLensAnimation() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let rotationAngle = 0;
    let starField = [];
    let gravRipples = [];

    const resize = () => {
      width = container.clientWidth || 500;
      height = container.clientHeight || 800;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      // Create Interstellar Deep Space Starfield
      starField = Array.from({ length: 60 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.6 + 0.4,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
      }));
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    const onCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      gravRipples.push({ x, y, r: 5, alpha: 1 });
    };

    container.addEventListener("click", onCanvasClick);

    let frameId;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      rotationAngle += 0.004;

      const isMobile = width < 600 || height < 300;
      const cx = width / 2;
      const cy = isMobile ? height * 0.5 : height * 0.52;
      
      const rx = isMobile ? Math.min(width * 0.34, height * 0.32) : Math.min(width, height) * 0.36;
      const ry = rx * (isMobile ? 0.45 : 0.45);

      // 1. Stars
      starField.forEach(s => {
        s.alpha += Math.sin(Date.now() * s.twinkleSpeed) * 0.01;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(0.9, s.alpha))})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Accretion Disk Aura
      ctx.save();
      ctx.translate(cx, cy);

      const diskGrad = ctx.createRadialGradient(0, 0, rx * 0.2, 0, 0, rx * 1.3);
      diskGrad.addColorStop(0, "rgba(245, 158, 11, 0.35)");
      diskGrad.addColorStop(0.3, "rgba(163, 230, 53, 0.15)");
      diskGrad.addColorStop(0.7, "rgba(15, 23, 42, 0.05)");
      diskGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = diskGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 1.3, ry * 1.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Light Arc
      ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
      ctx.lineWidth = isMobile ? 1.5 : 3;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = isMobile ? 8 : 18;

      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 1.05, ry * 1.05, -0.1, 0, Math.PI * 2);
      ctx.stroke();

      // Scanner-Green Ring
      ctx.strokeStyle = "rgba(163, 230, 53, 0.5)";
      ctx.lineWidth = 1;
      ctx.shadowColor = "#a3e635";
      ctx.shadowBlur = isMobile ? 6 : 12;

      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 0.85, ry * 0.85, 0.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();

      // 3. Orbiting Modules
      INTERSTELLAR_MODULES.forEach((mod, idx) => {
        const currAngle = mod.angle + rotationAngle;
        const mx = cx + Math.cos(currAngle) * rx;
        const my = cy + Math.sin(currAngle) * ry;

        // Beam
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(mx, my);
        ctx.strokeStyle = idx === activeIdx ? "rgba(163, 230, 53, 0.4)" : "rgba(245, 158, 11, 0.12)";
        ctx.lineWidth = idx === activeIdx ? 1.5 : 1;
        ctx.stroke();

        ctx.save();
        ctx.translate(mx, my);

        const isActive = idx === activeIdx;

        if (isMobile) {
          // Sleek Compact Orbital Orb Badge for Mobile (prevents overlapping text boxes)
          const orbRadius = isActive ? 13 : 10;
          ctx.fillStyle = isActive ? "#0f172a" : "rgba(15, 23, 42, 0.9)";
          ctx.strokeStyle = isActive ? "#a3e635" : "rgba(245, 158, 11, 0.35)";
          ctx.lineWidth = isActive ? 1.5 : 1;

          if (isActive) {
            ctx.shadowColor = "#a3e635";
            ctx.shadowBlur = 10;
          }

          ctx.beginPath();
          ctx.arc(0, 0, orbRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.font = "11px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(mod.icon, 0, 0);
        } else {
          // Desktop Wide Pill Card
          ctx.font = "600 12px 'Fira Code', monospace";
          const labelText = `${mod.icon} ${mod.label}`;
          const tw = ctx.measureText(labelText).width;
          const mw = tw + 28;
          const mh = 32;

          if (isActive) {
            ctx.shadowColor = "#a3e635";
            ctx.shadowBlur = 20;
          }

          ctx.fillStyle = isActive ? "#0f172a" : "rgba(15, 23, 42, 0.88)";
          ctx.strokeStyle = isActive ? "#bef264" : "rgba(245, 158, 11, 0.25)";
          ctx.lineWidth = isActive ? 2 : 1;

          ctx.beginPath();
          ctx.roundRect(-mw / 2, -mh / 2, mw, mh, 16);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.fillStyle = isActive ? "#a3e635" : "#f8fafc";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(labelText, 0, 0);
        }

        ctx.restore();
      });

      // 4. Black Hole Singularity
      ctx.save();
      ctx.translate(cx, cy);

      const coreRadius = isMobile ? 18 : 36;
      ctx.fillStyle = "#020617";
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = isMobile ? 2 : 4;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = isMobile ? 10 : 24;

      ctx.beginPath();
      ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner Golden Compass Star
      ctx.strokeStyle = "#FBBF24";
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(0, 0, isMobile ? 8 : 16, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#FBBF24";
      ctx.beginPath();
      ctx.arc(0, 0, isMobile ? 2.5 : 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 5. Gravitational Wave Ripples
      gravRipples.forEach(r => {
        r.r += 3;
        r.alpha -= 0.025;

        if (r.alpha > 0) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(245, 158, 11, ${r.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
      gravRipples = gravRipples.filter(r => r.alpha > 0);

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    const interval = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % INTERSTELLAR_MODULES.length);
    }, 2800);

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(interval);
      resizeObserver.disconnect();
      container.removeEventListener("click", onCanvasClick);
    };
  }, [activeIdx]);

  const currentMod = INTERSTELLAR_MODULES[activeIdx];

  return (
    <div className="career-lens-anim-container" ref={containerRef}>
      {/* Brand Header (Desktop / Large Screens) */}
      <div className="anim-brand-header">
        <div className="brand-logo-container">
          <svg viewBox="0 0 100 100" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FBBF24" strokeWidth="4" />
            <circle cx="50" cy="50" r="24" fill="none" stroke="#FBBF24" strokeWidth="4" />
            <circle cx="50" cy="50" r="8" fill="#FBBF24" />
            <line x1="50" y1="2" x2="50" y2="98" stroke="#FBBF24" strokeWidth="4" />
            <line x1="2" y1="50" x2="98" y2="50" stroke="#FBBF24" strokeWidth="4" />
            <line x1="16" y1="16" x2="84" y2="84" stroke="#FBBF24" strokeWidth="4" />
            <line x1="16" y1="84" x2="84" y2="16" stroke="#FBBF24" strokeWidth="4" />
          </svg>
          <div className="brand-text-col">
            <span className="brand-title">Career Lens</span>
            <span className="brand-sub">QUANTUM CAREER INTELLIGENCE</span>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="career-lens-canvas" />

      {/* Cinematic Interstellar Status HUD */}
      <div className="cla-hud-overlay">
        <div className="cla-interstellar-hud">
          <span className="interstellar-badge">GARGANUTA ATS CORE</span>
          <div className="interstellar-content">
            <span className="interstellar-icon">{currentMod.icon}</span>
            <div className="interstellar-meta">
              <span className="interstellar-title">{currentMod.label}</span>
              <span className="interstellar-stat">QUANTUM STATUS: {currentMod.stat}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/components/canvas/CareerLensAnimation.jsx
import { useEffect, useRef, useState } from "react";
import "./CareerLensAnimation.css";

const SKILLS_DATA = [
  { id: "ats-match", name: "ATS Score Match", category: "Fullstack", weight: 98, role: ["Fullstack", "Product"] },
  { id: "optimizer", name: "Resume Optimizer", category: "Fullstack", weight: 95, role: ["Fullstack", "Product"] },
  { id: "ai-lens", name: "Career Lens AI", category: "Product", weight: 92, role: ["Product"] },
  { id: "keywords", name: "AI Keywords", category: "Data", weight: 96, role: ["Fullstack", "Data"] },
  { id: "react", name: "React Developer", category: "Fullstack", weight: 99, role: ["Fullstack"] },
  { id: "pm", name: "Product Manager", category: "Product", weight: 94, role: ["Product"] },
  { id: "data-eng", name: "Data Engineer", category: "Data", weight: 97, role: ["Data"] },
  { id: "sys-arch", name: "System Architecture", category: "Fullstack", weight: 96, role: ["Fullstack", "Data"] },
  { id: "figma", name: "Figma Design", category: "Product", weight: 88, role: ["Product"] },
  { id: "ats-verify", name: "ATS Verification", category: "Data", weight: 94, role: ["Fullstack", "Data"] },
  { id: "exec-sum", name: "Executive Summary", category: "Product", weight: 91, role: ["Product"] },
  { id: "interview", name: "Interview Ready", category: "Product", weight: 95, role: ["Product"] }
];

const ROLES = [
  { id: "Fullstack", label: "Fullstack Dev" },
  { id: "Data", label: "Data Engineer" },
  { id: "Product", label: "Product Lead" },
  { id: "all", label: "All Skills" }
];

export default function CareerLensAnimation() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedRole, setSelectedRole] = useState("Fullstack");
  const [activeSkills, setActiveSkills] = useState({});
  const [hoveredSkill, setHoveredSkill] = useState(null);

  const toggleSkill = (id) => {
    setActiveSkills(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const initial = {};
    SKILLS_DATA.forEach(s => {
      initial[s.id] = selectedRole === "all" || s.role.includes(selectedRole);
    });
    setActiveSkills(initial);
  }, [selectedRole]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      width = container.clientWidth || 500;
      height = container.clientHeight || 800;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    const mouse = { x: -1000, y: -1000, active: false };

    class SkillNode {
      constructor(data, index, total) {
        this.data = data;
        this.index = index;
        this.total = total;
        
        this.x = Math.random() * (width - 160) + 80;
        this.y = Math.random() * (height - 240) + 160;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        
        this.width = 120;
        this.height = 30;
        this.hovered = false;
        this.scale = 1;
      }

      update(isSelected) {
        let targetX = this.x;
        let targetY = this.y;

        if (isSelected) {
          const angle = (this.index / this.total) * Math.PI * 2;
          const rx = Math.min(width * 0.32, 160);
          const ry = Math.min(height * 0.22, 150);
          const centerX = width * 0.48;
          const centerY = height * 0.52;

          targetX = centerX + Math.cos(angle + Date.now() * 0.0003) * rx;
          targetY = centerY + Math.sin(angle + Date.now() * 0.0003) * ry;
          
          this.x += (targetX - this.x) * 0.04;
          this.y += (targetY - this.y) * 0.04;
        } else {
          this.x += this.vx;
          this.y += this.vy;

          if (this.x < 60 || this.x > width - 60) this.vx *= -1;
          if (this.y < 120 || this.y > height - 100) this.vy *= -1;
        }

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        this.hovered = dist < 45;
        this.scale = this.hovered ? 1.12 : isSelected ? 1.02 : 0.9;
      }

      draw(isSelected) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        ctx.font = "600 12px 'Fira Code', monospace";
        const textWidth = ctx.measureText(this.data.name).width;
        this.width = textWidth + 32;

        const w = this.width;
        const h = this.height;

        ctx.fillStyle = isSelected 
          ? (this.hovered ? "#1e293b" : "#0f172a") 
          : "rgba(15, 23, 42, 0.5)";
        ctx.strokeStyle = isSelected ? (this.hovered ? "#bef264" : "#a3e635") : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = isSelected ? 1.5 : 1;

        if (isSelected) {
          ctx.shadowColor = "rgba(163, 230, 53, 0.3)";
          ctx.shadowBlur = this.hovered ? 14 : 6;
        }

        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 6);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(-w / 2 + 12, 0, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "#a3e635" : "#64748b";
        ctx.fill();

        ctx.fillStyle = isSelected ? "#ffffff" : "#64748b";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(this.data.name, -w / 2 + 22, 0);

        ctx.restore();
      }
    }

    const totalNodes = SKILLS_DATA.length;
    const nodes = SKILLS_DATA.map((data, i) => new SkillNode(data, i, totalNodes));

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;

      const hovered = nodes.find(n => {
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        return Math.sqrt(dx * dx + dy * dy) < 40;
      });
      setHoveredSkill(hovered ? hovered.data : null);
    };

    const onMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
      setHoveredSkill(null);
    };

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      nodes.forEach(n => {
        const dx = clickX - n.x;
        const dy = clickY - n.y;
        if (Math.sqrt(dx * dx + dy * dy) < 40) {
          toggleSkill(n.data.id);
        }
      });
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("click", onClick);

    let frameId;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const activeNodes = nodes.filter(n => activeSkills[n.data.id]);

      ctx.lineWidth = 1;
      for (let i = 0; i < activeNodes.length; i++) {
        for (let j = i + 1; j < activeNodes.length; j++) {
          const n1 = activeNodes[i];
          const n2 = activeNodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 200) {
            const alpha = (1 - dist / 200) * 0.35;
            ctx.strokeStyle = `rgba(163, 230, 53, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach(n => {
        const isSel = !!activeSkills[n.data.id];
        n.update(isSel);
        n.draw(isSel);
      });

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("click", onClick);
    };
  }, [selectedRole, activeSkills]);

  const matchedCount = SKILLS_DATA.filter(s => activeSkills[s.id]).length;
  const scorePct = Math.round((matchedCount / SKILLS_DATA.length) * 100);

  return (
    <div className="career-lens-anim-container" ref={containerRef}>
      {/* Brand Header */}
      <div className="anim-brand-header">
        <div className="brand-logo-container">
          <svg className="login-mark-svg" viewBox="0 0 100 100" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#a3e635" strokeWidth="6" />
            <circle cx="50" cy="50" r="22" fill="none" stroke="#a3e635" strokeWidth="4" />
            <circle cx="50" cy="50" r="8" fill="#a3e635" />
          </svg>
          <span className="brand-title">CareerLens AI</span>
        </div>

        {/* Role Selector Pills */}
        <div className="role-selector-overlay">
          <span className="role-selector-title">TARGET ATS ROLE GRAPH:</span>
          <div className="role-pills-row">
            {ROLES.map(role => (
              <button
                key={role.id}
                className={`role-pill ${selectedRole === role.id ? "active" : ""}`}
                onClick={() => setSelectedRole(role.id)}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="career-lens-canvas" />

      {/* Live ATS Score & Skill Info Tooltip HUD */}
      <div className="cla-hud-overlay">
        {hoveredSkill ? (
          <div className="cla-skill-tooltip-hud">
            <span className="cla-hud-skill-name">{hoveredSkill.name}</span>
            <span className="cla-hud-skill-weight">ATS Weight: {hoveredSkill.weight}%</span>
          </div>
        ) : (
          <div className="cla-score-hud">
            <span className="cla-score-label">CONSTELLATION MATCH:</span>
            <span className="cla-score-val">{scorePct}% ({matchedCount}/{SKILLS_DATA.length} Skills Active)</span>
          </div>
        )}
      </div>
    </div>
  );
}

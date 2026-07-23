import { useEffect, useRef, useState } from "react";
import "./CareerLensAnimation.css";

export default function CareerLensAnimation() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, radius: 150 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles = [];
    let shockwaves = [];
    let animationFrameId;

    const initParticles = () => {
      particles = [];
      const numParticles = Math.floor((width * height) / 12000); // Responsive particle count
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          baseX: Math.random() * width,
          baseY: Math.random() * height,
          size: Math.random() * 2 + 0.5,
          color: Math.random() > 0.5 ? '#a3e635' : '#60a5fa', // Brand colors
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
        });
      }
    };

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      initParticles();
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    const drawParticles = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(163, 230, 53, ${0.15 - distance / 800})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.closePath();
          }
        }
      }

      // Draw and update particles
      particles.forEach((p) => {
        // Mouse interaction (repel and spring back)
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouseRef.current.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouseRef.current.radius - distance) / mouseRef.current.radius;
          const pushX = forceDirectionX * force * 5;
          const pushY = forceDirectionY * force * 5;
          
          p.x -= pushX;
          p.y -= pushY;
        } else {
          // Spring back to base position slowly
          p.x -= (p.x - p.baseX) * 0.02;
          p.y -= (p.y - p.baseY) * 0.02;
        }

        // Float randomly
        p.baseX += p.vx;
        p.baseY += p.vy;

        // Bounce off edges
        if (p.baseX < 0 || p.baseX > width) p.vx *= -1;
        if (p.baseY < 0 || p.baseY > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();

        // Mouse connection beam
        if (distance < 200) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(96, 165, 250, ${0.4 - distance / 500})`;
          ctx.lineWidth = 1.2;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          ctx.stroke();
          ctx.closePath();
        }
      });

      // Draw mouse cursor glow
      if (mouseRef.current.x > 0 && mouseRef.current.y > 0) {
        const gradient = ctx.createRadialGradient(
          mouseRef.current.x, mouseRef.current.y, 0,
          mouseRef.current.x, mouseRef.current.y, 100
        );
        gradient.addColorStop(0, 'rgba(163, 230, 53, 0.15)');
        gradient.addColorStop(1, 'rgba(163, 230, 53, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouseRef.current.x, mouseRef.current.y, 100, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw and update shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += 8;
        sw.alpha -= 0.03;
        
        if (sw.alpha <= 0) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(163, 230, 53, ${sw.alpha * 0.5})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
      }

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    drawParticles();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    const handleMouseClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      shockwaves.push({ x: clickX, y: clickY, radius: 0, alpha: 1 });
      
      // Blast particles away
      particles.forEach(p => {
        const dx = p.x - clickX;
        const dy = p.y - clickY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 250) {
          const force = (250 - distance) / 10;
          p.vx += (dx / distance) * force;
          p.vy += (dy / distance) * force;
        }
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("click", handleMouseClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("click", handleMouseClick);
    };
  }, []);

  return (
    <div className="career-lens-anim-container interactive" ref={containerRef}>
      {/* Brand Header */}
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
            <span className="brand-sub">INTERACTIVE INTELLIGENCE</span>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="career-lens-canvas interactive-canvas" />

      {/* Floating Interactive HUD */}
      <div className="interactive-hud">
        <div className="hud-card">
          <div className="hud-header">
            <span className="hud-dot"></span>
            <span className="hud-title">Neural Network Active</span>
          </div>
          <p className="hud-desc">Hover around to interact with the AI matchmaking core.</p>
        </div>
      </div>
    </div>
  );
}

// src/components/common/CustomCursor.jsx
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import "./CustomCursor.css";

/**
 * CustomCursor (Powered by Anime.js)
 * -----------------------------------
 * Futuristic Kinetic Cursor System:
 * 1. Inner precision dot + trailing Anime.js spring-lag outer neon ring.
 * 2. Magnetic scaling & reticle expansion on interactive element hover.
 * 3. 6-Particle spring burst on mouse click.
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const trailContainerRef = useRef(null);

  const [isHovered, setIsHovered] = useState(false);
  const [hoverText, setHoverText] = useState("");
  const [isClicking, setIsClicking] = useState(false);
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Track mouse position
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Check hover states on interactive elements
      const target = e.target.closest("button, a, input, select, textarea, .jobs-job-card, .nvo-ai-card, .asm-container, canvas");
      if (target) {
        setIsHovered(true);
        if (target.tagName === "BUTTON" || target.classList.contains("jobs-job-action-btn")) {
          setHoverText("ACTION");
        } else if (target.tagName === "CANVAS") {
          setHoverText("3D ROTATE");
        } else {
          setHoverText("SELECT");
        }
      } else {
        setIsHovered(false);
        setHoverText("");
      }
    };

    const handleMouseDown = (e) => {
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 200);

      // Trigger Anime.js 6-Particle Click Burst
      if (!trailContainerRef.current) return;
      const burstContainer = document.createElement("div");
      burstContainer.className = "cursor-burst-group";
      burstContainer.style.left = `${e.clientX}px`;
      burstContainer.style.top = `${e.clientY}px`;

      const particleCount = 6;
      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement("div");
        p.className = "cursor-particle";
        burstContainer.appendChild(p);
      }
      trailContainerRef.current.appendChild(burstContainer);

      const particles = burstContainer.querySelectorAll(".cursor-particle");
      const angleStep = (Math.PI * 2) / particleCount;

      particles.forEach((p, idx) => {
        const angle = idx * angleStep;
        const dist = 32 + Math.random() * 20;
        const targetX = Math.cos(angle) * dist;
        const targetY = Math.sin(angle) * dist;

        animate(p, {
          translateX: [0, targetX],
          translateY: [0, targetY],
          scale: [1.2, 0],
          opacity: [1, 0],
          ease: "outExpo",
          duration: 600,
        });
      });

      setTimeout(() => {
        if (trailContainerRef.current && trailContainerRef.current.contains(burstContainer)) {
          trailContainerRef.current.removeChild(burstContainer);
        }
      }, 650);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);

    // Anime.js Ring Smooth Lag Interpolation Loop
    let animId;
    const render = () => {
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.18;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.18;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* Particle Click Burst Container */}
      <div className="cursor-trail-layer" ref={trailContainerRef} />

      {/* Inner Precision Dot */}
      <div
        className={`custom-cursor-dot ${isClicking ? "clicking" : ""}`}
        ref={dotRef}
      />

      {/* Outer Magnetic Ring */}
      <div
        className={`custom-cursor-ring ${isHovered ? "hovered" : ""} ${isClicking ? "clicking" : ""}`}
        ref={ringRef}
      >
        {hoverText && <span className="cursor-label">{hoverText}</span>}
      </div>
    </>
  );
}

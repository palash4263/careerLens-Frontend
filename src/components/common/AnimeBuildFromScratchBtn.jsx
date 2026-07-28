import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { animate } from "animejs";
import { Sparkles, ArrowRight } from "lucide-react";
import "./AnimeBuildFromScratchBtn.css";

export default function AnimeBuildFromScratchBtn({ onClick }) {
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const glowRef = useRef(null);
  const sparkleRef = useRef(null);

  useEffect(() => {
    // 1. Continuous subtle breathing glow using Anime.js animate
    const breathAnim = animate(glowRef.current, {
      opacity: [0.4, 0.9],
      scale: [0.96, 1.08],
      duration: 2200,
      ease: "easeInOutSine",
      alternate: true,
      loop: true,
    });

    // 2. Continuous rotating sparkle star icon using Anime.js animate
    const iconAnim = animate(sparkleRef.current, {
      rotate: "360deg",
      duration: 8000,
      ease: "linear",
      loop: true,
    });

    return () => {
      if (breathAnim && breathAnim.pause) breathAnim.pause();
      if (iconAnim && iconAnim.pause) iconAnim.pause();
    };
  }, []);

  const handleMouseEnter = () => {
    // Anime.js Elastic Scale & Glow Expand
    animate(btnRef.current, {
      scale: 1.04,
      translateY: -2,
      duration: 400,
      ease: "easeOutQuad",
    });

    animate(glowRef.current, {
      scale: 1.15,
      opacity: 1,
      duration: 350,
      ease: "easeOutQuad",
    });
  };

  const handleMouseLeave = () => {
    animate(btnRef.current, {
      scale: 1,
      translateY: 0,
      duration: 350,
      ease: "easeOutQuad",
    });

    animate(glowRef.current, {
      scale: 1,
      opacity: 0.5,
      duration: 350,
      ease: "easeOutQuad",
    });
  };

  const handleClick = (e) => {
    // Anime.js Click bounce feedback
    animate(btnRef.current, {
      scale: [0.95, 1],
      duration: 200,
      ease: "easeOutQuad",
      onComplete: () => {
        if (onClick) onClick(e);
        else navigate("/resume-builder");
      },
    });
  };

  return (
    <div className="anime-scratch-btn-wrapper">
      <div className="anime-scratch-glow" ref={glowRef} />
      <button
        ref={btnRef}
        className="anime-scratch-btn"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div className="anime-scratch-content">
          <div className="anime-scratch-badge">
            <span ref={sparkleRef} className="anime-scratch-sparkle">
              <Sparkles size={16} />
            </span>
            <span className="anime-scratch-ai-tag">AI Builder</span>
          </div>

          <div className="anime-scratch-body">
            <span className="anime-scratch-title">Build from Scratch</span>
            <span className="anime-scratch-sub">Interactive Step-by-Step AI</span>
          </div>

          <div className="anime-scratch-arrow">
            <ArrowRight size={18} />
          </div>
        </div>
      </button>
    </div>
  );
}

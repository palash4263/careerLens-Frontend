import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import './FeatureCard.css';

const FeatureCard = ({ title, description, icon, gradient, delay, path, index = 0 }) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [hovered, setHovered] = useState(false);

  const num = String(index + 1).padStart(2, '0');

  const onMove = (e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setMouse({
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top)  / r.height,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      className={`fc-root${hovered ? ' fc-hovered' : ''}`}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMouse({ x: 0.5, y: 0.5 }); }}
      style={{
        '--mx': mouse.x,
        '--my': mouse.y,
        '--grad': gradient,
      }}
    >
      {/* Mouse-tracking spotlight */}
      <div className="fc-spotlight" />

      {/* Top gradient bar */}
      <div className="fc-topbar" style={{ background: gradient }} />

      {/* Card number */}
      <span className="fc-num">{num}</span>

      {/* Icon */}
      <div className="fc-icon-wrap">
        <div className="fc-icon-glow" style={{ background: gradient }} />
        <span className="fc-icon">{icon}</span>
      </div>

      {/* Text */}
      <div className="fc-body">
        <h3 className="fc-title">{title}</h3>
        <p className="fc-desc">{description}</p>
      </div>

      {/* Footer CTA */}
      <div className="fc-footer">
        <div className="fc-cta-line" style={{ background: gradient }} />
        <button className="fc-cta" onClick={() => path && navigate(path)}>
          <span>Get Started</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
             <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

export default FeatureCard;
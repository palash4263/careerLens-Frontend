// src/components/common/NeuralPipelineVisualizer.jsx
import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import "./NeuralPipelineVisualizer.css";

/**
 * NeuralPipelineVisualizer (Powered by Anime.js)
 * ------------------------------------------------
 * Interactive 4-step AI Neural Pipeline:
 * 1. Structural PDF Parser
 * 2. High-Value Keyword Indexer
 * 3. Neural Bullet Transformer
 * 4. 95%+ ATS Score Guarantee
 */
const PIPELINE_STEPS = [
  {
    id: 1,
    icon: "📄",
    title: "Structural PDF Parser",
    subtitle: "Extracts contact, skills & work timeline",
    badge: "100% Parsed",
    color: "#38bdf8",
  },
  {
    id: 2,
    icon: "🔍",
    title: "Keyword Indexer",
    subtitle: "Surfaces missing hard skills & frameworks",
    badge: "+18 Skills Indexed",
    color: "#a78bfa",
  },
  {
    id: 3,
    icon: "⚡",
    title: "Neural Bullet Transformer",
    subtitle: "Quantifies achievements with STAR metrics",
    badge: "STAR Formatted",
    color: "#34d399",
  },
  {
    id: 4,
    icon: "🏆",
    title: "95%+ ATS Guarantee",
    subtitle: "Crushes recruiter filters & gets interview",
    badge: "95% Match Score",
    color: "#fbbf24",
  },
];

export default function NeuralPipelineVisualizer() {
  const containerRef = useRef(null);
  const [activeStep, setActiveStep] = useState(2);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll(".npv-step-card");
    const connectors = containerRef.current.querySelectorAll(".npv-connector-line");

    // 1. Anime.js Step Cards Staggered Entry
    const animCards = animate(cards, {
      translateX: [40, 0],
      opacity: [0, 1],
      scale: [0.92, 1],
      delay: stagger(140, { from: "first" }),
      ease: "outExpo",
      duration: 1000,
    });

    // 2. Anime.js Connector Laser Line Waves
    const animConnectors = animate(connectors, {
      scaleY: [0, 1],
      opacity: [0.2, 0.9],
      delay: stagger(180, { from: "first" }),
      ease: "inOutSine",
      duration: 1200,
    });

    return () => {
      animCards.pause();
      animConnectors.pause();
    };
  }, []);

  return (
    <div className="npv-container" ref={containerRef}>
      <div className="npv-header">
        <span className="npv-header-icon">🧠</span>
        <span className="npv-header-title">AI Neural Optimization Pipeline</span>
        <span className="npv-pulse-dot" />
      </div>

      <div className="npv-pipeline-list">
        {PIPELINE_STEPS.map((step, idx) => {
          const isActive = activeStep === idx;
          const isPassed = idx <= activeStep;

          return (
            <div key={step.id} className="npv-step-wrapper">
              {/* Step Card */}
              <div
                className={`npv-step-card ${isActive ? "active" : ""} ${isPassed ? "passed" : ""}`}
                onMouseEnter={() => setActiveStep(idx)}
                style={{ "--step-color": step.color }}
              >
                <div className="npv-step-icon-col">
                  <span className="npv-step-icon">{step.icon}</span>
                  <span className="npv-step-num">0{step.id}</span>
                </div>

                <div className="npv-step-info">
                  <div className="npv-step-top">
                    <h4 className="npv-step-title">{step.title}</h4>
                    <span className="npv-step-badge">{step.badge}</span>
                  </div>
                  <p className="npv-step-sub">{step.subtitle}</p>
                </div>
              </div>

              {/* Connecting Laser Connector Line */}
              {idx < PIPELINE_STEPS.length - 1 && (
                <div className="npv-connector-wrapper">
                  <div
                    className="npv-connector-line"
                    style={{ "--step-color": step.color }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

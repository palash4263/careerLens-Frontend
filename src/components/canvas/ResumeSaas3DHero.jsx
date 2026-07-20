// src/components/canvas/ResumeSaas3DHero.jsx
import { useState } from "react";

export default function ResumeSaas3DHero() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // normalized between -0.5 and 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  // Base 3D tilting variables
  const rotateX = isHovered ? coords.y * -20 : 0;
  const rotateY = isHovered ? coords.x * 20 : 0;

  return (
    <div 
      className="hero-3d-scene"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "visible",
        perspective: "1200px"
      }}
    >
      <style>{`
        .hero-3d-stage {
          position: relative;
          width: 250px;
          height: 330px;
          transform-style: preserve-3d;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ── BACK CARD (PAPER DARK EXECUTIVE) ── */
        .res-card-back {
          position: absolute;
          width: 205px;
          height: 268px;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.4);
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease, border-color 0.4s ease;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }

        .res-card-back.default {
          left: -10px;
          top: 35px;
          z-index: 1;
          transform: translateZ(40px) rotateY(-10deg) rotateX(6deg) scale(0.95);
          opacity: 0;
        }

        .res-card-back.shuffled {
          left: -10px;
          top: 35px;
          z-index: 5;
          transform: translateZ(120px) rotateY(8deg) rotateX(-4deg);
          opacity: 1;
          border-color: rgba(163, 230, 53, 0.4);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
        }

        /* ── FRONT CARD (PAPER NEUTRAL CREAM) ── */
        .res-card-front {
          position: absolute;
          width: 205px;
          height: 268px;
          background: #f8fafc;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 4px;
          padding: 16px 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04);
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease;
          display: flex;
          gap: 10px;
          pointer-events: none;
        }

        .res-card-front.default {
          right: -10px;
          top: 35px;
          z-index: 2;
          transform: translateZ(120px) rotateY(8deg) rotateX(-4deg);
          opacity: 1;
        }

        .res-card-front.shuffled {
          right: -10px;
          top: 35px;
          z-index: 1;
          transform: translateZ(40px) rotateY(-10deg) rotateX(6deg) scale(0.95);
          opacity: 0;
        }

        /* Resume Content mock items */
        .res-line-name {
          height: 10px;
          border-radius: 1px;
        }
        .res-card-back .res-line-name { background: #a3e635; width: 60%; }
        .res-card-front .res-line-name { background: #0f172a; width: 70%; }

        .res-line-title {
          height: 5px;
          border-radius: 1px;
          margin-top: -5px;
        }
        .res-card-back .res-line-title { background: #64748b; width: 35%; }
        .res-card-front .res-line-title { background: #a3e635; width: 45%; }

        .res-divider {
          height: 1px;
          width: 100%;
          background: #e2e8f0;
          margin: 3px 0;
        }
        .res-card-back .res-divider { background: rgba(255, 255, 255, 0.1); }

        .res-block-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .res-line-text {
          height: 3.5px;
          border-radius: 1px;
        }
        .res-card-back .res-line-text { background: rgba(255, 255, 255, 0.15); }
        .res-card-front .res-line-text { background: #cbd5e1; }

        .res-col-left {
          flex: 1.5;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .res-col-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-left: 1px solid #e2e8f0;
          padding-left: 6px;
        }

        /* ── FLOATING WIDGETS ── */
        .widget-fonts {
          position: absolute;
          left: -70px;
          top: 100px;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          width: 80px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
          transform: translateZ(160px);
          font-family: 'Fira Code', monospace;
        }

        .widget-fonts-header {
          font-size: 7px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          font-weight: 700;
          margin-bottom: 1px;
        }

        .font-row {
          font-size: 8px;
          font-weight: 500;
          color: #94a3b8;
          padding: 2.5px 5px;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .font-row.active {
          color: #a3e635;
          background: rgba(163, 230, 53, 0.1);
        }

        .widget-controls {
          position: absolute;
          left: -30px;
          bottom: 15px;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 145px;
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.35);
          transform: translateZ(200px) rotateX(2deg) rotateY(-4deg);
          font-family: 'Fira Code', monospace;
        }

        .control-slider-group {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .slider-label {
          display: flex;
          justify-content: space-between;
          font-size: 7px;
          font-weight: 700;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 0.02em;
        }

        .slider-bar-wrap {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .slider-bar-bg {
          flex: 1;
          height: 2.5px;
          background: #334155;
          border-radius: 2px;
          position: relative;
        }

        .slider-bar-fill {
          height: 100%;
          background: #a3e635;
          border-radius: 2px;
        }

        .slider-handle {
          position: absolute;
          top: -2px;
          width: 6.5px;
          height: 6.5px;
          border-radius: 50%;
          background: #a3e635;
          box-shadow: 0 0 4px rgba(163, 230, 53, 0.5);
        }

        .slider-sign {
          font-size: 8px;
          font-weight: bold;
          color: #64748b;
        }

        /* Scale down the whole 3D visual on mobile devices */
        @media (max-width: 768px) {
          .hero-3d-scene {
            transform: scale(0.7);
          }
        }
      `}</style>

      {/* 3D STAGE CONTAINER */}
      <div 
        className="hero-3d-stage"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
        }}
      >
        
        {/* 1. BACK CARD (DARK COMPONENT) */}
        <div className={`res-card-back ${isHovered ? 'shuffled' : 'default'}`}>
          <div className="res-line-name" />
          <div className="res-line-title" />
          <div className="res-divider" />
          
          <div className="res-block-text">
            <div className="res-line-text" style={{ width: "90%" }} />
            <div className="res-line-text" style={{ width: "95%" }} />
            <div className="res-line-text" style={{ width: "80%" }} />
          </div>

          <div className="res-divider" />

          <div className="res-block-text">
            <div className="res-line-text" style={{ width: "85%" }} />
            <div className="res-line-text" style={{ width: "60%" }} />
          </div>
        </div>

        {/* 2. FRONT CARD (WHITE COMPONENT) */}
        <div className={`res-card-front ${isHovered ? 'shuffled' : 'default'}`}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "3px", background: "#10b981", borderRadius: "10px 10px 0 0" }} />
          
          {/* Left Column */}
          <div className="res-col-left">
            <div>
              <div className="res-line-name" />
              <div className="res-line-title" style={{ marginTop: "4px" }} />
            </div>
            
            <div className="res-divider" />
            
            <div className="res-block-text">
              <div className="res-line-text" style={{ width: "95%" }} />
              <div className="res-line-text" style={{ width: "90%" }} />
              <div className="res-line-text" style={{ width: "85%" }} />
            </div>

            <div className="res-block-text" style={{ marginTop: "4px" }}>
              <div className="res-line-text" style={{ width: "40%", height: "6px", background: "#0f172a" }} />
              <div className="res-line-text" style={{ width: "95%" }} />
              <div className="res-line-text" style={{ width: "80%" }} />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="res-col-right">
            <div className="res-block-text">
              <div className="res-line-text" style={{ width: "60%", height: "6px", background: "#10b981" }} />
              <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                <div style={{ width: "18px", height: "6px", background: "rgba(16, 185, 129, 0.12)", border: "0.5px solid rgba(16, 185, 129, 0.3)", borderRadius: "1.5px" }} />
                <div style={{ width: "24px", height: "6px", background: "rgba(16, 185, 129, 0.12)", border: "0.5px solid rgba(16, 185, 129, 0.3)", borderRadius: "1.5px" }} />
                <div style={{ width: "20px", height: "6px", background: "rgba(16, 185, 129, 0.12)", border: "0.5px solid rgba(16, 185, 129, 0.3)", borderRadius: "1.5px" }} />
              </div>
            </div>

            <div className="res-block-text" style={{ marginTop: "8px" }}>
              <div className="res-line-text" style={{ width: "70%", height: "6px", background: "#0f172a" }} />
              <div className="res-line-text" style={{ width: "90%" }} />
              <div className="res-line-text" style={{ width: "80%" }} />
            </div>
          </div>
        </div>

        {/* 3. FLOATING FONTS LIST WIDGET */}
        <div className="widget-fonts">
          <span className="widget-fonts-header">Font</span>
          <div className="font-row active">
            <span>Rubik</span>
            <span style={{ fontSize: "6px" }}>●</span>
          </div>
          <div className="font-row">Lato</div>
          <div className="font-row">Raleway</div>
          <div className="font-row">Exo</div>
          <div className="font-row">Chivo</div>
        </div>

        {/* 4. FLOATING SLIDERS CONTROLS WIDGET */}
        <div className="widget-controls">
          <div className="control-slider-group">
            <div className="slider-label">
              <span>Page Margins</span>
              <span style={{ color: "#10b981" }}>{isHovered ? "2" : "1"}</span>
            </div>
            <div className="slider-bar-wrap">
              <span className="slider-sign">-</span>
              <div className="slider-bar-bg">
                <div className="slider-bar-fill" style={{ width: isHovered ? "50%" : "30%" }} />
                <div className="slider-handle" style={{ left: isHovered ? "50%" : "30%" }} />
              </div>
              <span className="slider-sign">+</span>
            </div>
          </div>

          <div className="control-slider-group">
            <div className="slider-label">
              <span>Section Spacing</span>
              <span style={{ color: "#10b981" }}>{isHovered ? "4" : "3"}</span>
            </div>
            <div className="slider-bar-wrap">
              <span className="slider-sign">-</span>
              <div className="slider-bar-bg">
                <div className="slider-bar-fill" style={{ width: isHovered ? "80%" : "65%" }} />
                <div className="slider-handle" style={{ left: isHovered ? "80%" : "65%" }} />
              </div>
              <span className="slider-sign">+</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
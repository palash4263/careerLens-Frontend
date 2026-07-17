// src/pages/TemplatesPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Grid, Eye, Check, AlertCircle, Award } from "lucide-react";
import "./TemplatesPage.css";

const CATEGORIES = ["All", "Top Picks", "ATS-Friendly", "Modern", "Single Column", "Double Column"];
const COLORS = [
  { name: "Royal Blue", hex: "#1761c7" },
  { name: "Emerald Teal", hex: "#0f9f6e" },
  { name: "Amethyst Violet", hex: "#7c3aed" },
  { name: "Amber Orange", hex: "#d97706" },
  { name: "Crimson Rose", hex: "#e02424" },
  { name: "Charcoal Slate", hex: "#475569" },
];

const TEMPLATES = [
  {
    id: "modern-split",
    name: "Modern Split",
    description: "Features a compact, two-column layout with solid badge tags for skills and detailed margins. Favored by tech and start-up recruiters.",
    layout: "two-column",
    tags: ["Top Picks", "Modern", "Double Column"],
  },
  {
    id: "classic-navy",
    name: "Classic Navy",
    description: "A clean, timeless single-column template with centered headers and horizontal rules. Ideal for high density parsing compliance.",
    layout: "single-column",
    tags: ["ATS-Friendly", "Single Column"],
  },
  {
    id: "executive-charcoal",
    name: "Executive Charcoal",
    description: "Structured double-column layout optimized for senior executives. Fits extensive career history while maintaining absolute legibility.",
    layout: "two-column",
    tags: ["Executive", "Double Column"],
  },
  {
    id: "elegant-teal",
    name: "Elegant Teal",
    description: "Timeless single-column layout featuring solid header accent panels. Highlights your career narrative with strong reading typography.",
    layout: "single-column",
    tags: ["Elegant", "Single Column", "Modern"],
  },
  {
    id: "creative-ruby",
    name: "Creative Ruby",
    description: "Vibrant two-column split featuring left solid colored bars. Creates a powerful visual footprint while staying clean and readable.",
    layout: "two-column",
    tags: ["Modern", "Double Column"],
  },
  {
    id: "ivy-league",
    name: "Ivy League",
    description: "Traditional high-density academic and finance format. Prioritizes raw achievements and educational prestige with zero visual fluff.",
    layout: "single-column",
    tags: ["ATS-Friendly", "Single Column"],
  },
  {
    id: "minimalist-slate",
    name: "Minimalist Slate",
    description: "Ultra-clean minimalist layout focusing on whitespace and high contrast. Perfect for designers, minimalists, and recruiters who hate clutter.",
    layout: "single-column",
    tags: ["ATS-Friendly", "Single Column", "Modern"],
  },
  {
    id: "portfolio-emerald",
    name: "Portfolio Emerald",
    description: "Modern two-column layout with a prominent header banner. Ideal for developers and designers displaying portfolio projects and links.",
    layout: "two-column",
    tags: ["Top Picks", "Double Column", "Modern"],
  },
  {
    id: "traditional-serif",
    name: "Traditional Serif",
    description: "Elegant classic academic style layout featuring refined serif styling. Tailored for law, medicine, academia, and executive boardrooms.",
    layout: "single-column",
    tags: ["ATS-Friendly", "Single Column"],
  },
];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedColor, setSelectedColor] = useState("#1761c7"); // default Royal Blue
  const [selectedColumns, setSelectedColumns] = useState("All"); // All, Single, Double
  const [hoveredCard, setHoveredCard] = useState(null);

  // Filters application
  const filteredTemplates = TEMPLATES.filter(tmpl => {
    // 1. Category Filter
    if (selectedCategory !== "All") {
      if (selectedCategory === "Single Column" && tmpl.layout !== "single-column") return false;
      if (selectedCategory === "Double Column" && tmpl.layout !== "two-column") return false;
      if (selectedCategory === "ATS-Friendly" && !tmpl.tags.includes("ATS-Friendly")) return false;
      if (selectedCategory === "Top Picks" && !tmpl.tags.includes("Top Picks")) return false;
      if (selectedCategory === "Modern" && !tmpl.tags.includes("Modern")) return false;
    }
    // 2. Columns Filter
    if (selectedColumns === "Single" && tmpl.layout !== "single-column") return false;
    if (selectedColumns === "Double" && tmpl.layout !== "two-column") return false;
    
    return true;
  });

  const handleSelectTemplate = (layout) => {
    navigate(`/resume-optimizer?template=${layout}&color=${encodeURIComponent(selectedColor)}`);
  };

  return (
    <div className="tp-container">
      {/* Grid Dot background layer */}
      <div className="tp-grid-dots" />

      {/* Shifting radial glow background blobs */}
      <div className="tp-glow-blob tp-blob-1" />
      <div className="tp-glow-blob tp-blob-2" />

      <div className="tp-content-wrap">
        {/* Header Hero Area */}
        <section className="tp-hero">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="tp-hero-header"
          >
            <h1>RESUME <span className="tp-gradient-text">TEMPLATES</span></h1>
            <p>
              Start with a recruiter-approved, ATS-friendly template, then let CareerLens help you fill it with optimized, keywords-rich content that lands interviews in minutes.
            </p>
          </motion.div>

          <div className="tp-hero-ctas">
            <button className="tp-btn-primary" onClick={() => navigate("/resume-optimizer")}>
              <Sparkles size={16} /> Open Optimizer Studio
            </button>
            <button className="tp-btn-secondary" onClick={() => navigate("/resumes")}>
              Manage Resumes
            </button>
          </div>

          <div className="tp-reviews">
            <span className="tp-reviews-label">Excellent</span>
            <div className="tp-stars">
              {"★".repeat(5)}
            </div>
            <span className="tp-reviews-count">5,297 Reviews</span>
          </div>
        </section>

        {/* Interactive Filter Panels */}
        <section className="tp-filters-section">
          {/* Category Tabs */}
          <div className="tp-category-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`tp-cat-btn ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sub Filters Row (Color / Photo / Columns) */}
          <div className="tp-sub-filters">
            {/* Color Filter */}
            <div className="tp-filter-group">
              <span className="tp-filter-title">Color</span>
              <div className="tp-color-row">
                {COLORS.map(c => (
                  <button
                    key={c.hex}
                    className={`tp-color-circle ${selectedColor === c.hex ? "active" : ""}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setSelectedColor(c.hex)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Column Layout Filter */}
            <div className="tp-filter-group">
              <span className="tp-filter-title">Columns</span>
              <div className="tp-column-selector">
                {["All", "Single", "Double"].map(col => (
                  <button
                    key={col}
                    className={`tp-col-btn ${selectedColumns === col ? "active" : ""}`}
                    onClick={() => setSelectedColumns(col)}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Templates Grid Cards */}
        <section className="tp-grid-section">
          <motion.div 
            className="tp-templates-grid"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((tmpl, index) => (
                <motion.div
                  key={tmpl.id}
                  className="tp-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredCard(tmpl.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  layout
                >
                  {/* Visual Mockup Card */}
                  <div className="tp-card-preview">
                    {/* Real CSS-rendered Resume Mockup */}
                    <div className="tp-mock-resume" style={{ fontFamily: "Rubik, sans-serif" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "3px", backgroundColor: selectedColor }} />
                      
                      {tmpl.layout === "two-column" ? (
                        <div className="tp-mock-twocol">
                          {/* Mock Left Column */}
                          <div className="tp-mock-left">
                            <div style={{ height: "6px", width: "70%", background: "#111", borderRadius: "1px", marginBottom: "3px" }}></div>
                            <div style={{ height: "3px", width: "40%", background: selectedColor, borderRadius: "1px", marginBottom: "6px" }}></div>
                            <div style={{ height: "1px", width: "100%", background: "#eee", marginBottom: "6px" }}></div>
                            {/* Experiences */}
                            <div style={{ height: "3px", width: "80%", background: "#444", marginBottom: "2px" }}></div>
                            <div style={{ height: "1px", width: "90%", background: "#ddd", marginBottom: "1px" }}></div>
                            <div style={{ height: "1px", width: "85%", background: "#ddd", marginBottom: "5px" }}></div>
                            <div style={{ height: "3px", width: "75%", background: "#444", marginBottom: "2px" }}></div>
                            <div style={{ height: "1px", width: "90%", background: "#ddd", marginBottom: "1px" }}></div>
                            <div style={{ height: "1px", width: "80%", background: "#ddd" }}></div>
                          </div>
                          {/* Mock Right Sidebar */}
                          <div className="tp-mock-right" style={{ borderLeft: "0.5px solid #eee", paddingLeft: "5px" }}>
                            <div style={{ height: "3px", width: "50%", background: selectedColor, marginBottom: "5px" }}></div>
                            {/* Badges */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", marginBottom: "6px" }}>
                              <div style={{ height: "4px", width: "12px", background: selectedColor, borderRadius: "1px" }}></div>
                              <div style={{ height: "4px", width: "14px", background: selectedColor, borderRadius: "1px" }}></div>
                              <div style={{ height: "4px", width: "10px", background: selectedColor, borderRadius: "1px" }}></div>
                            </div>
                            <div style={{ height: "3px", width: "60%", background: selectedColor, marginBottom: "4px" }}></div>
                            <div style={{ height: "1px", width: "100%", background: "#ddd", marginBottom: "1px" }}></div>
                            <div style={{ height: "1px", width: "80%", background: "#ddd" }}></div>
                          </div>
                        </div>
                      ) : (
                        <div className="tp-mock-onecol">
                          {/* Centered Header */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "6px" }}>
                            <div style={{ height: "6px", width: "50%", background: "#111", borderRadius: "1px", marginBottom: "2px" }}></div>
                            <div style={{ height: "3px", width: "35%", background: "#777", borderRadius: "1px", marginBottom: "3px" }}></div>
                            <div style={{ display: "flex", gap: "2px" }}>
                              <div style={{ height: "2px", width: "10px", background: "#aaa" }}></div>
                              <div style={{ height: "2px", width: "10px", background: "#aaa" }}></div>
                            </div>
                          </div>
                          {/* Full-width Divider */}
                          <div style={{ height: "0.75px", width: "100%", background: selectedColor, marginBottom: "6px" }}></div>
                          {/* Summary */}
                          <div style={{ height: "2px", width: "20%", background: selectedColor, marginBottom: "3px" }}></div>
                          <div style={{ height: "1px", width: "100%", background: "#ddd", marginBottom: "1px" }}></div>
                          <div style={{ height: "1px", width: "95%", background: "#ddd", marginBottom: "6px" }}></div>
                          {/* Experience */}
                          <div style={{ height: "2px", width: "25%", background: selectedColor, marginBottom: "3px" }}></div>
                          <div style={{ height: "3px", width: "60%", background: "#444", marginBottom: "2px" }}></div>
                          <div style={{ height: "1px", width: "100%", background: "#ddd", marginBottom: "1px" }}></div>
                          <div style={{ height: "1px", width: "90%", background: "#ddd" }}></div>
                        </div>
                      )}
                    </div>

                    {/* Hover Card Overlay (CTAs) */}
                    <AnimatePresence>
                      {hoveredCard === tmpl.id && (
                        <motion.div
                          className="tp-card-overlay"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.button
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            transition={{ delay: 0.05, duration: 0.2 }}
                            className="tp-select-btn"
                            onClick={() => handleSelectTemplate(tmpl.layout)}
                          >
                            <Check size={16} /> Use Template
                          </motion.button>
                          <motion.button
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 10, opacity: 0 }}
                            transition={{ delay: 0.1, duration: 0.2 }}
                            className="tp-preview-btn"
                            onClick={() => navigate(`/resume-optimizer?template=${tmpl.layout}&color=${encodeURIComponent(selectedColor)}`)}
                          >
                            <Eye size={14} /> Open in Studio
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Card Info footer */}
                  <div className="tp-card-info">
                    <div className="tp-card-info-header">
                      <h3>{tmpl.name}</h3>
                      <span className="tp-layout-badge">{tmpl.layout === "two-column" ? "Double Column" : "Single Column"}</span>
                    </div>
                    <p>{tmpl.description}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          {filteredTemplates.length === 0 && (
            <div className="tp-empty-state">
              <AlertCircle size={24} />
              <h4>No Templates Found</h4>
              <p>Try resetting your filters or selecting a different category.</p>
              <button className="tp-reset-btn" onClick={() => { setSelectedCategory("All"); setSelectedColumns("All"); }}>
                Reset Filters
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

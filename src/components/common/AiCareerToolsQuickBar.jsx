import { useNavigate } from "react-router-dom";
import { Target, Zap, Bot, Layout, ArrowUpRight, Sparkles } from "lucide-react";
import "./AiCareerToolsQuickBar.css";

export default function AiCareerToolsQuickBar() {
  const navigate = useNavigate();

  const tools = [
    {
      id: "ats",
      title: "ATS Score Calculator",
      description: "Compare resume against target job descriptions & get instant keyword score.",
      tag: "99% Accuracy",
      icon: Target,
      route: "/ats-score",
      theme: "cyan",
    },
    {
      id: "optimizer",
      title: "AI Resume Optimizer",
      description: "Auto-tailor work bullets and executive summary with Groq AI.",
      tag: "Groq Llama-3.3",
      icon: Zap,
      route: "/optimizer",
      theme: "violet",
    },
    {
      id: "interview",
      title: "AI Mock Interview Prep",
      description: "Practice role-specific technical & behavioral interview questions.",
      tag: "Interactive Prep",
      icon: Bot,
      route: "/interview-prep",
      theme: "emerald",
    },
    {
      id: "templates",
      title: "ATS Resume Templates",
      description: "Explore recruiter-approved single and multi-column resume layouts.",
      tag: "100% ATS Safe",
      icon: Layout,
      route: "/templates",
      theme: "amber",
    },
  ];

  return (
    <div className="quick-bar-wrapper">
      <div className="quick-bar-header">
        <div className="quick-bar-title-group">
          <span className="quick-bar-badge">
            <Sparkles size={13} />
            <span>AI Suite</span>
          </span>
          <h2 className="quick-bar-title">AI Career Tools</h2>
          <p className="quick-bar-subtitle">Accelerate your job search with powered AI tools</p>
        </div>
      </div>

      <div className="quick-bar-grid">
        {tools.map((tool) => {
          const IconComp = tool.icon;
          return (
            <div
              key={tool.id}
              className={`quick-card quick-card-${tool.theme}`}
              onClick={() => navigate(tool.route)}
            >
              <div className="quick-card-glow" />
              <div className="quick-card-content">
                <div className="quick-card-top">
                  <div className="quick-card-icon-box">
                    <IconComp size={20} />
                  </div>
                  <span className="quick-card-tag">{tool.tag}</span>
                </div>

                <div className="quick-card-main">
                  <h3 className="quick-card-title">{tool.title}</h3>
                  <p className="quick-card-desc">{tool.description}</p>
                </div>

                <div className="quick-card-footer">
                  <span className="quick-card-action-text">Launch Tool</span>
                  <div className="quick-card-arrow">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React from "react";
import { useNavigate } from "react-router-dom";

export const WorkspaceItem = ({ icon, color, bg, title, desc, badge, progress, path, highlight }) => {
  const navigate = useNavigate();

  return (
    <div
      className={`db-workspace-item${highlight ? " highlighted" : ""}`}
      onClick={() => navigate(path)}
      role="button"
      tabIndex={0}
    >
      <div className="db-ws-icon" style={{ background: bg, color }}>
        {icon}
      </div>
      <div className="db-ws-text">
        <div className="db-ws-row">
          <h4>{title}</h4>
          <span className="db-ws-badge" style={{ color, background: bg }}>
            {badge}
          </span>
        </div>
        <p>{desc}</p>
        <div className="db-ws-progress">
          <div
            className="db-ws-progress-fill"
            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
          />
        </div>
      </div>
      <span className="db-ws-arrow" aria-hidden="true" />
    </div>
  );
};

export default WorkspaceItem;

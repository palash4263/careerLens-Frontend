import React from "react";

export const MockupCard = ({ icon, badge, badgeColor, title, subtitle, extra }) => (
  <div className={`db-mockup-card ${badgeColor}`}>
    <div className={`db-mockup-badge ${badgeColor}`}>{badge}</div>
    <div className="db-mockup-row">
      <span className="db-mockup-icon">{icon}</span>
      <div className="db-mockup-details">
        <span className="db-mockup-title">{title}</span>
        <span className="db-mockup-meta">{subtitle}</span>
      </div>
    </div>
    {extra}
  </div>
);

export default MockupCard;

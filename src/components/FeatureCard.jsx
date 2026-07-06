// src/components/FeatureCard.jsx
import React from 'react';
import { motion } from 'motion/react';

const FeatureCard = ({ title, description, icon, gradient, delay }) => {
  return (
    <motion.div
      className="feature-card-wrapper"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut", delay }}
    >
      {/* Outer Glow - Visible on hover */}
      <div 
        className="feature-card-outer-glow"
        style={{ 
          background: gradient,
          opacity: 0,
        }}
      />
      
      {/* Card Container */}
      <div className="feature-card-container">
        {/* Inner Glow - Always visible subtle glow */}
        <div 
          className="feature-card-inner-glow"
          style={{ background: gradient }}
        />
        
        {/* Card Content */}
        <div className="feature-card-content">
          <div className="feature-card-icon-wrapper">
            <span className="feature-card-icon">{icon}</span>
          </div>
          <h3 className="feature-card-title">{title}</h3>
          <p className="feature-card-desc">{description}</p>
          
          {/* Learn More Link */}
          <div className="feature-card-link">
            <span>Learn More</span>
            <svg className="feature-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FeatureCard;
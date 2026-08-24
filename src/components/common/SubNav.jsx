import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './SubNav.css';

export default function SubNav({ type }) {
  const location = useLocation();
  const [hoveredPath, setHoveredPath] = useState(null);

  const resumeLinks = [
    { path: "/resumes", label: "My Resumes", icon: "📄", desc: "Manage your resumes and check their core parsability." },
    { path: "/resume-builder", label: "Build from Scratch", icon: "⚡", desc: "Create a new resume with AI-powered step-by-step guidance." },
    { path: "/templates", label: "Templates", icon: "🎨", desc: "Choose an ATS-friendly, professional design layout." },
    { path: "/ats-calculator", label: "ATS Score", icon: "📊", desc: "Audit your resume against a specific job description." },
  ];

  const careerLinks = [
    { path: "/jobs", label: "Job Tracker", icon: "💼", desc: "Organize and extract key requirements from job postings." },
    { path: "/interview-prep", label: "AI Tutor & Interview", icon: "🤖", desc: "Practice mock interviews and learn core concepts." },
    { path: "/skill-roadmap", label: "Skill Roadmap", icon: "🗺️", desc: "Generate a custom learning path based on your missing skills." },
  ];

  const links = type === 'resume' ? resumeLinks : careerLinks;
  
  const activeLink = links.find(l => location.pathname === l.path) || links[0];
  const activeDesc = hoveredPath ? links.find(l => l.path === hoveredPath)?.desc : activeLink?.desc;

  return (
    <div className="subnav-container scroll-reveal">
      <div className="subnav-track">
        {links.map((link) => {
          const isActive = location.pathname === link.path || (link.path === '/resumes' && location.pathname === '/resume-builder');
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`subnav-tab ${location.pathname === link.path ? 'active' : ''}`}
              onMouseEnter={() => setHoveredPath(link.path)}
              onMouseLeave={() => setHoveredPath(null)}
            >
              <span className="subnav-icon">{link.icon}</span>
              <span className="subnav-label">{link.label}</span>
              {location.pathname === link.path && <div className="subnav-indicator" />}
            </Link>
          );
        })}
      </div>
      
      <div className="subnav-desc-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDesc}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="subnav-desc-text"
          >
            {activeDesc}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

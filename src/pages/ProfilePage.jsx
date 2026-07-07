// src/pages/ProfilePage.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Award,
  Star,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  Camera,
  Edit2,
  Check,
  X,
  Phone,
  Clock,
  Target,
  BarChart3
} from "lucide-react";
import "./ProfilePage.css";

export default function ProfilePage({ onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // User data
  const user = {
    name: "John Doe",
    email: "john.doe@careerlens.com",
    role: "Product Manager",
    location: "San Francisco, CA",
    joinDate: "January 2024",
    phone: "+1 (555) 123-4567",
    bio: "Passionate product leader with 8+ years of experience in AI-driven products. Specialized in building user-centric solutions that drive business growth.",
    skills: ["Product Strategy", "AI/ML", "User Research", "Agile", "Data Analysis", "UX Design", "Leadership", "Growth"],
    stats: {
      resumesAnalyzed: 147,
      interviewsPracticed: 89,
      atsScore: 94,
      successRate: 78,
      jobApplications: 56,
      interviews: 23,
    },
    recentActivity: [
      { action: "Resume optimized for Google", date: "2 hours ago", icon: "📄" },
      { action: "Completed behavioral interview", date: "5 hours ago", icon: "🎯" },
      { action: "ATS score improved to 94%", date: "1 day ago", icon: "📈" },
      { action: "Applied for Senior PM role", date: "2 days ago", icon: "💼" },
      { action: "AI interview simulation", date: "3 days ago", icon: "🤖" },
    ],
    achievements: [
      { title: "ATS Master", desc: "Achieved 90%+ ATS score", icon: "🏆", color: "#f59e0b" },
      { title: "Interview Pro", desc: "Completed 50+ practice sessions", icon: "🎯", color: "#10b981" },
      { title: "Resume Expert", desc: "Optimized 100+ resumes", icon: "📄", color: "#7c3aed" },
      { title: "Top Performer", desc: "In top 10% of users", icon: "⭐", color: "#3b82f6" },
    ]
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'activity', label: 'Activity', icon: <Clock size={16} /> },
    { id: 'achievements', label: 'Achievements', icon: <Award size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return <OverviewTab user={user} />;
      case 'activity':
        return <ActivityTab user={user} />;
      case 'achievements':
        return <AchievementsTab user={user} />;
      case 'settings':
        return <SettingsTab user={user} />;
      default:
        return <OverviewTab user={user} />;
    }
  };

  return (
    <motion.div 
      className="profile-page-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="profile-page-modal"
        initial={{ scale: 0.9, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 30, opacity: 0 }}
        transition={{ type: "spring", damping: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="profile-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-header-bg"></div>
          <div 
            className="profile-avatar-wrapper"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="profile-avatar">
              <span>JD</span>
              {isHovering && (
                <motion.div 
                  className="profile-avatar-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Camera size={20} />
                  <span>Change</span>
                </motion.div>
              )}
            </div>
            <div className="profile-status">
              <span className="status-dot"></span>
              <span className="status-text">Active</span>
            </div>
          </div>

          <div className="profile-info">
            <div className="profile-name-wrapper">
              <h1 className="profile-name">{user.name}</h1>
              <button className="profile-edit-btn" onClick={() => setIsEditing(!isEditing)}>
                <Edit2 size={14} />
              </button>
            </div>
            <p className="profile-role">{user.role}</p>
            <div className="profile-meta">
              <span className="profile-meta-item">
                <MapPin size={14} />
                {user.location}
              </span>
              <span className="profile-meta-item">
                <Calendar size={14} />
                Joined {user.joinDate}
              </span>
            </div>
          </div>

          {/* Social Links - Using simple text/emoji instead of icons */}
          <div className="profile-social">
            <a href="#" className="social-link">in</a>
            <a href="#" className="social-link">git</a>
            <a href="#" className="social-link">tw</a>
            <a href="#" className="social-link">web</a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon purple">
              <FileText size={18} />
            </div>
            <div className="stat-card-info">
              <span className="stat-number">{user.stats.resumesAnalyzed}</span>
              <span className="stat-label">Resumes Analyzed</span>
            </div>
            <div className="stat-trend up">
              <TrendingUp size={14} />
              12%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon green">
              <Target size={18} />
            </div>
            <div className="stat-card-info">
              <span className="stat-number">{user.stats.interviewsPracticed}</span>
              <span className="stat-label">Interviews Practiced</span>
            </div>
            <div className="stat-trend up">
              <TrendingUp size={14} />
              8%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon orange">
              <Award size={18} />
            </div>
            <div className="stat-card-info">
              <span className="stat-number">{user.stats.atsScore}%</span>
              <span className="stat-label">ATS Score</span>
            </div>
            <div className="stat-trend up">
              <TrendingUp size={14} />
              5%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon blue">
              <Star size={18} />
            </div>
            <div className="stat-card-info">
              <span className="stat-number">{user.stats.successRate}%</span>
              <span className="stat-label">Success Rate</span>
            </div>
            <div className="stat-trend up">
              <TrendingUp size={14} />
              3%
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="profile-tab-content">
          {renderContent()}
        </div>

        {/* Footer Actions */}
        <div className="profile-footer-actions">
          <button className="profile-footer-btn primary">
            <Settings size={16} />
            Account Settings
          </button>
          <button className="profile-footer-btn danger">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ====== TAB COMPONENTS ======

function OverviewTab({ user }) {
  return (
    <div className="tab-content-overview">
      <div className="overview-bio">
        <h3>About</h3>
        <p>{user.bio}</p>
      </div>

      <div className="overview-skills">
        <h3>Skills</h3>
        <div className="skills-grid">
          {user.skills.map((skill, index) => (
            <motion.span 
              key={index} 
              className="skill-tag"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              {skill}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="overview-quick-stats">
        <div className="quick-stat">
          <span className="quick-stat-icon">📄</span>
          <span className="quick-stat-value">{user.stats.jobApplications}</span>
          <span className="quick-stat-label">Applications</span>
        </div>
        <div className="quick-stat-divider"></div>
        <div className="quick-stat">
          <span className="quick-stat-icon">🎯</span>
          <span className="quick-stat-value">{user.stats.interviews}</span>
          <span className="quick-stat-label">Interviews</span>
        </div>
        <div className="quick-stat-divider"></div>
        <div className="quick-stat">
          <span className="quick-stat-icon">💼</span>
          <span className="quick-stat-value">12</span>
          <span className="quick-stat-label">Job Matches</span>
        </div>
      </div>
    </div>
  );
}

function ActivityTab({ user }) {
  return (
    <div className="tab-content-activity">
      <div className="activity-list">
        {user.recentActivity.map((activity, index) => (
          <motion.div 
            key={index} 
            className="activity-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="activity-icon">{activity.icon}</span>
            <div className="activity-info">
              <span className="activity-action">{activity.action}</span>
              <span className="activity-date">{activity.date}</span>
            </div>
            <span className="activity-arrow">→</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AchievementsTab({ user }) {
  return (
    <div className="tab-content-achievements">
      <div className="achievements-grid">
        {user.achievements.map((achievement, index) => (
          <motion.div 
            key={index} 
            className="achievement-card"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            style={{ borderColor: achievement.color + '40' }}
          >
            <div className="achievement-icon" style={{ background: achievement.color + '20', color: achievement.color }}>
              {achievement.icon}
            </div>
            <div className="achievement-info">
              <span className="achievement-title">{achievement.title}</span>
              <span className="achievement-desc">{achievement.desc}</span>
            </div>
            <div className="achievement-check" style={{ color: achievement.color }}>
              <Check size={16} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab({ user }) {
  return (
    <div className="tab-content-settings">
      <div className="settings-group">
        <h3>Profile Settings</h3>
        <div className="settings-item">
          <div className="settings-item-left">
            <User size={18} />
            <span>Display Name</span>
          </div>
          <div className="settings-item-right">
            <span>{user.name}</span>
            <button className="settings-edit-btn">Edit</button>
          </div>
        </div>
        <div className="settings-item">
          <div className="settings-item-left">
            <Mail size={18} />
            <span>Email</span>
          </div>
          <div className="settings-item-right">
            <span>{user.email}</span>
            <button className="settings-edit-btn">Edit</button>
          </div>
        </div>
        <div className="settings-item">
          <div className="settings-item-left">
            <Phone size={18} />
            <span>Phone</span>
          </div>
          <div className="settings-item-right">
            <span>{user.phone}</span>
            <button className="settings-edit-btn">Edit</button>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h3>Preferences</h3>
        <div className="settings-toggle">
          <span className="toggle-label">Email Notifications</span>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="settings-toggle">
          <span className="toggle-label">AI Recommendations</span>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="settings-toggle">
          <span className="toggle-label">Dark Mode</span>
          <label className="toggle-switch">
            <input type="checkbox" />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-group">
        <h3>Danger Zone</h3>
        <button className="settings-danger-btn">
          Delete Account
        </button>
      </div>
    </div>
  );
}
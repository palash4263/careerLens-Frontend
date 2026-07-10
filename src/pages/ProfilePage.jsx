// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Settings,
  LogOut,
  Edit2,
  Check,
  X,
  ShieldAlert,
  Sparkles,
  Activity,
  FileText,
  Target,
  Trophy,
  Star,
  Trash2
} from "lucide-react";
import "./ProfilePage.css";

// ====== HELPER FUNCTIONS ======
const getUserData = () => {
  let location = localStorage.getItem('userLocation');
  if (!location || location === 'San Francisco, CA') {
    location = 'Noida, IN';
    localStorage.setItem('userLocation', 'Noida, IN');
  }

  let joinDate = localStorage.getItem('userJoinDate');
  if (!joinDate || joinDate === 'January 2024') {
    joinDate = 'January 2026';
    localStorage.setItem('userJoinDate', 'January 2026');
  }

  return {
    name: localStorage.getItem('userName') || 'Palash Mishra',
    email: localStorage.getItem('userEmail') || 'palashmishra47@gmail.com',
    role: localStorage.getItem('userRole') || 'Software Developer',
    location,
    joinDate,
    phone: localStorage.getItem('userPhone') || '+91-7428477219',
    bio: localStorage.getItem('userBio') || 'Full Stack Developer with 2+ years of experience building scalable REST APIs and intelligent web applications using Java, Spring Boot, and React.js.',
    avatar: localStorage.getItem('userAvatar') || 'PM',
    recentActivity: [
      { action: "Optimized Resume: Software Engineer Target", date: "2 hours ago", icon: <FileText size={14} /> },
      { action: "Evaluated ATS Score: Senior Developer Target", date: "1 day ago", icon: <Activity size={14} /> },
      { action: "Created Job Target: Cloud Architect", date: "3 days ago", icon: <Target size={14} /> },
      { action: "Updated Profile details", date: "5 days ago", icon: <User size={14} /> }
    ],
    achievements: [
      { title: "ATS Champion", desc: "Achieved an ATS score above 90%", icon: <Trophy size={16} />, color: "#fbbf24" },
      { title: "Mock Graduate", desc: "Completed 5 mock interview rounds", icon: <Target size={16} />, color: "#3b82f6" },
      { title: "Fast Matcher", desc: "Applied to 10 matched jobs", icon: <Sparkles size={16} />, color: "#10b981" },
      { title: "Profile Star", desc: "Completed full profile details", icon: <Star size={16} />, color: "#a855f7" }
    ]
  };
};

const getInitials = (name) => {
  if (!name) return 'PM';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(getUserData());
  
  // Inline edit state
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");

  // Update user when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getUserData());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const userSkills = [
    "Java", 
    "Spring Boot", 
    "React.js", 
    "JavaScript", 
    "Python", 
    "SQL", 
    "REST APIs", 
    "AI Integrations"
  ];

  const userStats = {
    resumesAnalyzed: 147,
    interviewsPracticed: 89,
    atsScore: 94,
    successRate: 78,
    jobApplications: 56,
    interviews: 23,
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User size={15} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={15} /> },
    { id: 'achievements', label: 'Achievements', icon: <Award size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
  ];

  const handleEdit = (field, val) => {
    setEditingField(field);
    setTempValue(val);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handleSave = (field) => {
    let key = "";
    if (field === 'name') key = 'userName';
    else if (field === 'email') key = 'userEmail';
    else if (field === 'phone') key = 'userPhone';
    else if (field === 'bio') key = 'userBio';
    else if (field === 'location') key = 'userLocation';
    else if (field === 'role') key = 'userRole';

    if (key) {
      localStorage.setItem(key, tempValue);
      // Dispatch a storage event manually so local handlers catch it
      window.dispatchEvent(new Event('storage'));
      setUser(getUserData());
    }
    setEditingField(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userLocation");
    localStorage.removeItem("userJoinDate");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userLinkedin");
    localStorage.removeItem("userBio");
    localStorage.removeItem("userAvatar");
    navigate("/login");
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return <OverviewTab user={user} skills={userSkills} stats={userStats} />;
      case 'activity':
        return <ActivityTab user={user} />;
      case 'achievements':
        return <AchievementsTab user={user} />;
      case 'settings':
        return (
          <SettingsTab 
            user={user} 
            editingField={editingField} 
            tempValue={tempValue}
            setTempValue={setTempValue}
            handleEdit={handleEdit}
            handleSave={handleSave}
            handleCancelEdit={handleCancelEdit}
          />
        );
      default:
        return <OverviewTab user={user} skills={userSkills} stats={userStats} />;
    }
  };

  const userInitials = getInitials(user.name);

  return (
    <div className="profile-page-wrapper">
      <div className="profile-page-container">
        <motion.button 
          className="profile-back-btn" 
          onClick={() => navigate(-1)}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowLeft size={14} /> Back
        </motion.button>

        <motion.div 
          className="profile-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, cubicBezier: [0.16, 1, 0.3, 1] }}
        >
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-header-bg"></div>

            <div className="profile-avatar-wrapper">
              <div 
                className="profile-avatar-outer"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <span>{userInitials}</span>
                {isHovering && (
                  <div className="avatar-hover-overlay">
                    <span>📷</span>
                    <span>Change</span>
                  </div>
                )}
              </div>
              <div className="profile-status-badge">
                <span className="status-pulse-dot"></span>
                <span>Active</span>
              </div>
            </div>

            <div className="profile-info">
              <div className="profile-name-row">
                <h1 className="profile-name">{user.name}</h1>
                <button 
                  className="profile-edit-btn"
                  onClick={() => setActiveTab('settings')}
                >
                  <Edit2 size={12} />
                </button>
              </div>
              <p className="profile-role">{user.role}</p>
              <div className="profile-meta-row">
                <span className="profile-meta-item">
                  <MapPin size={12} style={{ color: 'var(--purple)' }} /> {user.location}
                </span>
                <span className="profile-meta-item">
                  <Calendar size={12} style={{ color: 'var(--blue)' }} /> Joined {user.joinDate}
                </span>
              </div>
            </div>

            <div className="profile-socials">
              <a href="#" className="social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
              <a href="#" className="social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </a>
              <a href="#" className="social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
              <a href="#" className="social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              </a>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="profile-stats-grid">
            <div className="profile-stat-item">
              <div className="profile-stat-icon purple">
                <FileText size={18} />
              </div>
              <div className="profile-stat-details">
                <span className="profile-stat-value">{userStats.resumesAnalyzed}</span>
                <span className="profile-stat-label">Resumes</span>
              </div>
              <div className="profile-stat-badge">+12%</div>
            </div>
            
            <div className="profile-stat-item">
              <div className="profile-stat-icon blue">
                <Target size={18} />
              </div>
              <div className="profile-stat-details">
                <span className="profile-stat-value">{userStats.interviewsPracticed}</span>
                <span className="profile-stat-label">Mock Rounds</span>
              </div>
              <div className="profile-stat-badge">+8%</div>
            </div>

            <div className="profile-stat-item">
              <div className="profile-stat-icon orange">
                <Award size={18} />
              </div>
              <div className="profile-stat-details">
                <span className="profile-stat-value">{userStats.atsScore}%</span>
                <span className="profile-stat-label">Avg. ATS</span>
              </div>
              <div className="profile-stat-badge">+5%</div>
            </div>

            <div className="profile-stat-item">
              <div className="profile-stat-icon green">
                <Star size={18} />
              </div>
              <div className="profile-stat-details">
                <span className="profile-stat-value">{userStats.successRate}%</span>
                <span className="profile-stat-label">Success</span>
              </div>
              <div className="profile-stat-badge">+3%</div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="profile-tabs-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`profile-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setEditingField(null); // Clear editing states on tab swap
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="profile-tab-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="profile-footer-actions">
            <button 
              className="btn-profile-footer account"
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={14} /> Settings
            </button>
            <button 
              className="btn-profile-footer logout"
              onClick={handleLogout}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ====== TAB COMPONENTS ======

function OverviewTab({ user, skills, stats }) {
  return (
    <div className="overview-tab-container">
      <div>
        <h3 className="overview-section-title">
          <FileText size={13} style={{ color: 'var(--purple)' }} /> About Me
        </h3>
        <p className="overview-bio">{user.bio}</p>
      </div>

      <div>
        <h3 className="overview-section-title">
          <Settings size={13} style={{ color: 'var(--blue)' }} /> Core Skills
        </h3>
        <div className="skills-container">
          {skills.map((skill, index) => (
            <span key={index} className="skill-pill">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="overview-sub-grid">
        <div className="sub-grid-item">
          <span className="sub-grid-icon">📄</span>
          <div>
            <span className="sub-grid-value">{stats.jobApplications}</span>
            <span className="sub-grid-label">Applications</span>
          </div>
        </div>
        <div className="sub-grid-divider"></div>
        <div className="sub-grid-item">
          <span className="sub-grid-icon">🎯</span>
          <div>
            <span className="sub-grid-value">{stats.interviews}</span>
            <span className="sub-grid-label">Interviews</span>
          </div>
        </div>
        <div className="sub-grid-divider"></div>
        <div className="sub-grid-item">
          <span className="sub-grid-icon">💼</span>
          <div>
            <span className="sub-grid-value">12</span>
            <span className="sub-grid-label">Matches</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTab({ user }) {
  return (
    <div className="timeline-list">
      {user.recentActivity.map((activity, index) => (
        <div key={index} className="timeline-item">
          <div className="timeline-icon-dot">
            {activity.icon}
          </div>
          <div className="timeline-details">
            <span className="timeline-action">{activity.action}</span>
            <span className="timeline-time">{activity.date}</span>
          </div>
          <span className="timeline-arrow">→</span>
        </div>
      ))}
    </div>
  );
}

function AchievementsTab({ user }) {
  return (
    <div className="achievements-grid">
      {user.achievements.map((achievement, index) => (
        <div key={index} className="achievement-card">
          <div 
            className="achievement-icon-wrapper"
            style={{
              background: `${achievement.color}15`,
              color: achievement.color,
              border: `1px solid ${achievement.color}30`
            }}
          >
            {achievement.icon}
          </div>
          <div className="achievement-info">
            <span className="achievement-title">{achievement.title}</span>
            <span className="achievement-desc">{achievement.desc}</span>
          </div>
          <div 
            className="achievement-check"
            style={{
              background: `${achievement.color}15`,
              color: achievement.color
            }}
          >
            ✓
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsTab({ 
  user, 
  editingField, 
  tempValue, 
  setTempValue, 
  handleEdit, 
  handleSave, 
  handleCancelEdit 
}) {
  const editableFields = [
    { id: 'name', label: 'Display Name', value: user.name, icon: <User size={14} /> },
    { id: 'role', label: 'Job Role', value: user.role, icon: <Sparkles size={14} /> },
    { id: 'email', label: 'Email Address', value: user.email, icon: <Mail size={14} /> },
    { id: 'phone', label: 'Phone Number', value: user.phone, icon: <Phone size={14} /> },
    { id: 'location', label: 'Location', value: user.location, icon: <MapPin size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="settings-section">
        <h3 className="settings-section-title">
          <User size={12} /> Profile Details
        </h3>
        
        {editableFields.map((field) => (
          <div key={field.id} className="settings-field">
            <div className="settings-field-left">
              {field.icon}
              <span>{field.label}</span>
            </div>
            <div className="settings-field-right">
              {editingField === field.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  <button 
                    onClick={() => handleSave(field.id)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.25)',
                      color: '#34d399',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Check size={12} />
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      color: '#f87171',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <span style={{ color: '#94a3b8', fontWeight: '500' }}>{field.value}</span>
                  <button 
                    className="settings-field-edit-btn"
                    onClick={() => handleEdit(field.id, field.value)}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">
          <Settings size={12} /> Preferences
        </h3>
        
        <div className="settings-field">
          <div className="settings-field-left">
            <span>Email Alerts</span>
          </div>
          <label className="settings-toggle-label">
            <input type="checkbox" className="settings-toggle-input" defaultChecked />
            <span className="settings-toggle-slider"></span>
          </label>
        </div>

        <div className="settings-field">
          <div className="settings-field-left">
            <span>AI Suggestions</span>
          </div>
          <label className="settings-toggle-label">
            <input type="checkbox" className="settings-toggle-input" defaultChecked />
            <span className="settings-toggle-slider"></span>
          </label>
        </div>

        <div className="settings-field">
          <div className="settings-field-left">
            <span>Compact View</span>
          </div>
          <label className="settings-toggle-label">
            <input type="checkbox" className="settings-toggle-input" />
            <span className="settings-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-section" style={{ borderColor: 'rgba(239, 68, 68, 0.12)' }}>
        <h3 className="settings-section-title" style={{ color: '#f87171' }}>
          <ShieldAlert size={12} /> Danger Zone
        </h3>
        <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 12px 0', lineHeight: 1.5 }}>
          Permanently delete your CareerLens account and purge all optimized resumes and job targets. This action is irreversible.
        </p>
        <button className="btn-profile-footer delete">
          <Trash2 size={13} /> Delete Account
        </button>
      </div>
    </div>
  );
}
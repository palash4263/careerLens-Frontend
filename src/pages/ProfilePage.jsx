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
  Trash2,
  Layers,
  Sparkle
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
  
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");

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
    { id: 'overview', label: 'Overview', icon: <User size={14} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={14} /> },
    { id: 'achievements', label: 'Achievements', icon: <Award size={14} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
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
      window.dispatchEvent(new Event('storage'));
      setUser(getUserData());
    }
    setEditingField(null);
  };

  const handleLogout = () => {
    localStorage.clear();
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
    <div className="profile-page-wrapper" style={{ minHeight: "100vh", background: "#090d16", padding: "40px 20px", fontFamily: "Inter, sans-serif", color: "#e2e8f0" }}>
      <div className="profile-page-container" style={{ maxWidth: "1000px", margin: "0 auto", position: "relative" }}>
        
        {/* Decorative Background Glow Blurs */}
        <div style={{ position: "absolute", top: "-10%", left: "5%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, rgba(0,0,0,0) 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(0,0,0,0) 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

        {/* Back Button */}
        <motion.button 
          className="profile-back-btn" 
          onClick={() => navigate(-1)}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "8px 16px", borderRadius: "99px", color: "#94a3b8", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", marginBottom: "24px", backdropFilter: "blur(8px)", transition: "all 0.2s" }}
          whileHover={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}
        >
          <ArrowLeft size={14} /> Back
        </motion.button>

        {/* Main Glass Profile Card Container */}
        <motion.div 
          className="profile-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: "rgba(17, 24, 39, 0.45)", backdropFilter: "blur(20px)", border: "1px solid rgba(124, 58, 237, 0.15)", borderRadius: "24px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.05)" }}
        >
          {/* Profile Header Canvas Banner */}
          <div className="profile-header" style={{ position: "relative", padding: "40px 40px 30px 40px", display: "flex", alignItems: "flex-end", gap: "30px", flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="profile-header-bg" style={{ position: "absolute", top: 0, left: 0, right: 0, height: "140px", background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.15) 100%)", zIndex: 0 }} />

            {/* Avatar Cluster */}
            <div className="profile-avatar-wrapper" style={{ position: "relative", zIndex: 1 }}>
              <div 
                className="profile-avatar-outer"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                style={{ width: "120px", height: "120px", borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: "800", color: "#fff", border: "4px solid #0d121f", boxShadow: "0 10px 25px rgba(0,0,0,0.4)", cursor: "pointer", overflow: "hidden", position: "relative", fontFamily: "Outfit, sans-serif" }}
              >
                {user.avatar && user.avatar.startsWith("http") ? (
                  <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <span>{userInitials}</span>
                )}
                {isHovering && (
                  <div className="avatar-hover-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", fontSize: "0.75rem", color: "#cbd5e1" }}>
                    <span>📷</span>
                    <span>Change</span>
                  </div>
                )}
              </div>
              <div className="profile-status-badge" style={{ position: "absolute", bottom: "4px", right: "4px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "4px 12px", borderRadius: "99px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", fontWeight: "700", color: "#34d399", backdropFilter: "blur(6px)" }}>
                <span className="status-pulse-dot" style={{ width: "6px", height: "6px", background: "#10b981", borderRadius: "50%", boxShadow: "0 0 8px #10b981" }} />
                <span>Active</span>
              </div>
            </div>

            {/* Profile Info Details Block */}
            <div className="profile-info" style={{ flex: 1, minWidth: "260px", zIndex: 1 }}>
              <div className="profile-name-row" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                <h1 className="profile-name" style={{ fontSize: "1.75rem", fontWeight: "800", color: "#f8fafc", margin: 0, fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>{user.name}</h1>
                <button 
                  className="profile-edit-btn"
                  onClick={() => setActiveTab('settings')}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", width: "28px", height: "24px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                >
                  <Edit2 size={12} />
                </button>
              </div>
              <p className="profile-role" style={{ fontSize: "0.95rem", color: "#a78bfa", fontWeight: "600", margin: "0 0 12px 0", letterSpacing: "0.02em" }}>{user.role}</p>
              <div className="profile-meta-row" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <span className="profile-meta-item" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#94a3b8", fontWeight: "500" }}>
                  <MapPin size={13} style={{ color: '#a855f7' }} /> {user.location}
                </span>
                <span className="profile-meta-item" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#94a3b8", fontWeight: "500" }}>
                  <Calendar size={13} style={{ color: '#3b82f6' }} /> Joined {user.joinDate}
                </span>
              </div>
            </div>

            {/* Social Action Deck Links */}
            <div className="profile-socials" style={{ display: "flex", gap: "8px", zIndex: 1, marginLeft: "auto" }}>
              {['linkedin', 'github', 'twitter'].map((platform, sIdx) => (
                <a key={sIdx} href="#" className="social-link" style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", transition: "all 0.2s" }}>
                  {platform === 'linkedin' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>}
                  {platform === 'github' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>}
                  {platform === 'twitter' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>}
                </a>
              ))}
            </div>
          </div>

          {/* Stats Display Dashboard Grid */}
          <div className="profile-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", padding: "24px 40px", background: "rgba(15, 23, 42, 0.25)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            {[
              { val: userStats.resumesAnalyzed, label: "Resumes", color: "purple", icon: <FileText size={16} />, trend: "+12%" },
              { val: userStats.interviewsPracticed, label: "Mock Rounds", color: "blue", icon: <Target size={16} />, trend: "+8%" },
              { val: userStats.atsScore + "%", label: "Avg. ATS", color: "orange", icon: <Award size={16} />, trend: "+5%" },
              { val: userStats.successRate + "%", label: "Success Rate", color: "green", icon: <Star size={16} />, trend: "+3%" }
            ].map((stat, sIdx) => (
              <div key={sIdx} className="profile-stat-item" style={{ background: "rgba(30, 41, 59, 0.3)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "14px", padding: "16px", display: "flex", alignItems: "center", gap: "14px", position: "relative" }}>
                <div className={`profile-stat-icon ${stat.color}`} style={{ width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyValue: "center", justifyContent: "center",
                  background: stat.color === 'purple' ? 'rgba(124,58,237,0.15)' : stat.color === 'blue' ? 'rgba(59,130,246,0.15)' : stat.color === 'orange' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                  color: stat.color === 'purple' ? '#a855f7' : stat.color === 'blue' ? '#3b82f6' : stat.color === 'orange' ? '#f59e0b' : '#10b981',
                  border: `1px solid ${stat.color === 'purple' ? 'rgba(124,58,237,0.2)' : stat.color === 'blue' ? 'rgba(59,130,246,0.2)' : stat.color === 'orange' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`
                }}>
                  {stat.icon}
                </div>
                <div className="profile-stat-details" style={{ display: "flex", flexDirection: "column" }}>
                  <span className="profile-stat-value" style={{ fontSize: "1.25rem", fontWeight: "800", color: "#f1f5f9", fontFamily: "Outfit, sans-serif" }}>{stat.val}</span>
                  <span className="profile-stat-label" style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "1px" }}>{stat.label}</span>
                </div>
                <span className="profile-stat-badge" style={{ position: "absolute", top: "12px", right: "12px", fontSize: "0.7rem", fontWeight: "700", padding: "2px 6px", borderRadius: "4px", 
                  background: stat.color === 'purple' ? 'rgba(124,58,237,0.1)' : stat.color === 'blue' ? 'rgba(59,130,246,0.1)' : stat.color === 'orange' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                  color: stat.color === 'purple' ? '#c084fc' : stat.color === 'blue' ? '#60a5fa' : stat.color === 'orange' ? '#fbbf24' : '#34d399'
                }}>{stat.trend}</span>
              </div>
            ))}
          </div>

          {/* Capsule Slider Navigation Tabs */}
          <div className="profile-tabs-nav" style={{ display: "flex", gap: "6px", padding: "16px 40px", background: "rgba(10, 15, 30, 0.2)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`profile-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setEditingField(null);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "8px", border: "none", color: isActive ? "#fff" : "#64748b", background: isActive ? "rgba(124, 58, 237, 0.15)" : "transparent", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)", boxShadow: isActive ? "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(124,58,237,0.1)" : "none" }}
                >
                  <span style={{ color: isActive ? "#a855f7" : "inherit" }}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Core Content Shell Box */}
          <div className="profile-tab-content" style={{ padding: "32px 40px" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation Panels */}
          <div className="profile-footer-actions" style={{ padding: "20px 40px", background: "rgba(10, 14, 26, 0.4)", borderTop: "1px solid rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button 
              className="btn-profile-footer account"
              onClick={() => setActiveTab('settings')}
              style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", transition: "color 0.2s" }}
            >
              <Settings size={14} /> System Studio Settings
            </button>
            <button 
              className="btn-profile-footer logout"
              onClick={handleLogout}
              style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)", color: "#f87171", fontSize: "0.82rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s" }}
            >
              <LogOut size={14} /> Terminate Session
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ====== SUB-TAB RENDER VIEWS ======

function OverviewTab({ user, skills, stats }) {
  return (
    <div className="overview-tab-container" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <h3 className="overview-section-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", margin: "0 0 12px 0" }}>
          <FileText size={14} style={{ color: '#a855f7' }} /> Professional Profile Summary
        </h3>
        <p className="overview-bio" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "16px", borderRadius: "12px", color: "#cbd5e1", fontSize: "0.9rem", lineHeight: "1.6", margin: 0 }}>{user.bio}</p>
      </div>

      <div>
        <h3 className="overview-section-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", margin: "0 0 12px 0" }}>
          <Layers size={14} style={{ color: '#3b82f6' }} /> Technical Framework Inventory
        </h3>
        <div className="skills-container" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {skills.map((skill, index) => (
            <span key={index} className="skill-pill" style={{ background: "rgba(124, 58, 237, 0.08)", border: "1px solid rgba(124, 58, 237, 0.15)", color: "#c084fc", padding: "6px 14px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "600" }}>
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="overview-sub-grid" style={{ display: "flex", background: "rgba(15, 23, 42, 0.2)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "14px", padding: "16px 0", justifyContent: "space-around", flexWrap: "wrap", gap: "16px" }}>
        {[
          { icon: "💼", val: stats.jobApplications, label: "Applications" },
          { icon: "🎯", val: stats.interviews, label: "Interviews Secured" },
          { icon: "⚡", val: "12", label: "AI Matches" }
        ].map((item, idx) => (
          <React.Fragment key={idx}>
            <div className="sub-grid-item" style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "left", padding: "0 20px" }}>
              <span className="sub-grid-icon" style={{ fontSize: "1.4rem", background: "rgba(255,255,255,0.03)", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="sub-grid-value" style={{ fontSize: "1.2rem", fontWeight: "800", color: "#f8fafc", fontFamily: "Outfit, sans-serif" }}>{item.val}</span>
                <span className="sub-grid-label" style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "500" }}>{item.label}</span>
              </div>
            </div>
            {idx < 2 && <div className="sub-grid-divider" style={{ width: "1px", background: "rgba(255,255,255,0.05)", alignSelf: "stretch" }} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ActivityTab({ user }) {
  return (
    <div className="timeline-list" style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
      <div style={{ position: "absolute", top: "12px", bottom: "12px", left: "21px", width: "2px", background: "linear-gradient(to bottom, rgba(124,58,237,0.3) 0%, rgba(59,130,246,0.05) 100%)", zIndex: 0 }} />
      {user.recentActivity.map((activity, index) => (
        <div key={index} className="timeline-item" style={{ background: "rgba(30, 41, 59, 0.15)", border: "1px solid rgba(255,255,255,0.03)", padding: "14px 20px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "16px", position: "relative", zIndex: 1 }}>
          <div className="timeline-icon-dot" style={{ width: "44px", height: "32px", borderRadius: "8px", background: "rgba(124,58,237,0.12)", color: "#c084fc", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {activity.icon}
          </div>
          <div className="timeline-details" style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
            <span className="timeline-action" style={{ fontSize: "0.88rem", fontWeight: "600", color: "#e2e8f0" }}>{activity.action}</span>
            <span className="timeline-time" style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "500" }}>{activity.date}</span>
          </div>
          <span className="timeline-arrow" style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.9rem" }}>→</span>
        </div>
      ))}
    </div>
  );
}

function AchievementsTab({ user }) {
  return (
    <div className="achievements-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
      {user.achievements.map((achievement, index) => (
        <div key={index} className="achievement-card" style={{ background: "rgba(20, 27, 45, 0.3)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", position: "relative", overflow: "hidden" }}>
          <div 
            className="achievement-icon-wrapper"
            style={{
              width: "42px", height: "42px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
              background: `${achievement.color}12`,
              color: achievement.color,
              border: `1px solid ${achievement.color}25`
            }}
          >
            {achievement.icon}
          </div>
          <div className="achievement-info" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span className="achievement-title" style={{ fontSize: "0.9rem", fontWeight: "700", color: "#f1f5f9", fontFamily: "Outfit, sans-serif" }}>{achievement.title}</span>
            <span className="achievement-desc" style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: "1.4" }}>{achievement.desc}</span>
          </div>
          <div 
            className="achievement-check"
            style={{
              marginLeft: "auto", width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "bold",
              background: `${achievement.color}15`,
              color: achievement.color,
              border: `1px solid ${achievement.color}20`
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
    { id: 'role', label: 'Job Role', value: user.role, icon: <Sparkle size={14} /> },
    { id: 'email', label: 'Email Address', value: user.email, icon: <Mail size={14} /> },
    { id: 'phone', label: 'Phone Number', value: user.phone, icon: <Phone size={14} /> },
    { id: 'location', label: 'Location', value: user.location, icon: <MapPin size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="settings-section" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 className="settings-section-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
          <User size={14} style={{ color: '#a855f7' }} /> Core Profile Parameters
        </h3>
        
        {editableFields.map((field) => (
          <div key={field.id} className="settings-field" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: "rgba(15, 23, 42, 0.2)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "12px", flexWrap: "wrap", gap: "12px" }}>
            <div className="settings-field-left" style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: "600", color: "#94a3b8" }}>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>{field.icon}</span>
              <span>{field.label}</span>
            </div>
            <div className="settings-field-right" style={{ display: "flex", alignItems: "center", gap: "14px", marginLeft: "auto" }}>
              {editingField === field.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: '8px', padding: '6px 12px', color: 'white', fontSize: '0.85rem', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                    autoFocus
                  />
                  <button onClick={() => handleSave(field.id)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={14} />
                  </button>
                  <button onClick={handleCancelEdit} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <span style={{ color: '#f1f5f9', fontWeight: '600', fontSize: "0.9rem" }}>{field.value}</span>
                  <button 
                    className="settings-field-edit-btn"
                    onClick={() => handleEdit(field.id, field.value)}
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#a78bfa", padding: "4px 12px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
                  >
                    Modify
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preferences Selection Column */}
      <div className="settings-section" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 className="settings-section-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
          <Settings size={14} style={{ color: '#3b82f6' }} /> Notification Preferences
        </h3>
        
        {['Email Position Alerts', 'AI Document Generation Suggestions', 'Compact Grid Layout'].map((pref, pIdx) => (
          <div key={pIdx} className="settings-field" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: "rgba(15, 23, 42, 0.15)", border: "1px solid rgba(255,255,255,0.02)", borderRadius: "12px" }}>
            <span style={{ fontSize: "0.88rem", fontWeight: "600", color: "#cbd5e1" }}>{pref}</span>
            <label className="settings-toggle-label" style={{ position: "relative", display: "inline-block", width: "40px", height: "22px" }}>
              <input type="checkbox" className="settings-toggle-input" defaultChecked={pIdx < 2} style={{ opacity: 0, width: 0, height: 0 }} />
              <span className="settings-toggle-slider" style={{ position: "absolute", cursor: "pointer", inset: 0, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "34px", transition: "0.2s" }}></span>
            </label>
          </div>
        ))}
      </div>

      {/* Isolation Danger Zone Panel */}
      <div className="settings-section" style={{ border: '1px solid rgba(239, 68, 68, 0.15)', background: "rgba(239, 68, 68, 0.02)", borderRadius: "16px", padding: "24px" }}>
        <h3 className="settings-section-title" style={{ display: "flex", alignItems: "center", gap: "8px", color: '#ef4444', fontSize: "0.88rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px 0" }}>
          <ShieldAlert size={14} /> Critical Security Actions
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          Permanently delete your CareerLens account profile and safely purge all indexed resumes and job alignment data records. This procedure cannot be undone.
        </p>
        <button className="btn-profile-footer delete" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "10px 20px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", transition: "all 0.2s" }}>
          <Trash2 size={14} /> Purge Account Profile
        </button>
      </div>
    </div>
  );
}
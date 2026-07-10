import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useState, useEffect } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [userName, setUserName] = useState("John Doe");
  const [userRole, setUserRole] = useState("Product Manager");
  const [userInitials, setUserInitials] = useState("JD");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Your resume score improved by 17 points!", time: "2 hours ago", read: false, type: "success" },
    { id: 2, text: "Mock interview feedback from AI is ready", time: "1 day ago", read: false, type: "info" },
    { id: 3, text: "New Job Match: React Developer at Oracle", time: "3 days ago", read: true, type: "job" }
  ]);

  useEffect(() => {
    const loadUser = () => {
      const name = localStorage.getItem("userName") || "John Doe";
      const role = localStorage.getItem("userRole") || "Product Manager";
      setUserName(name);
      setUserRole(role);
      const parts = name.trim().split(" ");
      setUserInitials(
        parts.length >= 2
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : name.substring(0, 2).toUpperCase()
      );
    };
    loadUser();
    const onStorage = (e) => {
      if (e.key === "userName" || e.key === "userRole") loadUser();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    if (!notifOpen) return;
    const handleClose = (e) => {
      if (!e.target.closest('.nb-notif-wrapper')) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [notifOpen]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const removeNotif = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const logout = () => {
    ["token","userName","userEmail","userRole","userLocation",
     "userJoinDate","userPhone","userLinkedin","userBio","userAvatar"]
      .forEach((k) => localStorage.removeItem(k));
    navigate("/login");
  };

  const navLinks = [
    { path: "/dashboard",       label: "Dashboard", icon: "⊞" },
    { path: "/resumes",         label: "Resumes",   icon: "◧" },
    { path: "/jobs",            label: "Jobs",      icon: "◈" },
    { path: "/resume-optimizer",label: "Optimizer", icon: "⚡" },
    { path: "/interview",       label: "Interview", icon: "◎" },
  ];

  return (
    <nav className={`nb-root${scrolled ? " nb-scrolled" : ""}`}>
      <div className="nb-wrap">

        {/* ── Logo ── */}
        <Link to="/dashboard" className="nb-logo">
          <div className="nb-logo-orb">
            <span className="nb-logo-icon">✦</span>
            <div className="nb-logo-ring" />
          </div>
          <span className="nb-logo-text">
            Career<span className="nb-logo-accent">Lens</span>
          </span>
          <span className="nb-logo-badge">AI</span>
        </Link>

        {/* ── Nav links ── */}
        <div className="nb-links">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`nb-link${active ? " nb-active" : ""}`}
              >
                <span className="nb-link-icon">{link.icon}</span>
                <span className="nb-link-label">{link.label}</span>
                {active && <span className="nb-active-dot" />}
              </Link>
            );
          })}
        </div>

        {/* ── Right cluster ── */}
        <div className="nb-right">

          {/* Notification */}
          <div className="nb-notif-wrapper">
            <button 
              className={`nb-icon-btn${notifOpen ? " active" : ""}`}
              onClick={() => setNotifOpen(!notifOpen)}
              title="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              {unreadCount > 0 && <span className="nb-notif-dot" />}
            </button>

            {notifOpen && (
              <div className="nb-notif-dropdown">
                <div className="nb-notif-header">
                  <span className="nb-notif-title">Notifications</span>
                  {unreadCount > 0 && (
                    <button className="nb-notif-clear-btn" onClick={markAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="nb-notif-body">
                  {notifications.length === 0 ? (
                    <div className="nb-notif-empty">
                      <span className="nb-notif-empty-icon">🎉</span>
                      <span className="nb-notif-empty-text">All caught up!</span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`nb-notif-item ${n.read ? 'read' : 'unread'}`}
                        onClick={() => toggleRead(n.id)}
                      >
                        <div className="nb-notif-item-left">
                          <span className={`nb-notif-type-dot ${n.type}`} />
                          <div className="nb-notif-item-content">
                            <span className="nb-notif-item-text">{n.text}</span>
                            <span className="nb-notif-item-time">{n.time}</span>
                          </div>
                        </div>
                        <button 
                          className="nb-notif-item-close"
                          onClick={(e) => removeNotif(n.id, e)}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="nb-divider" />

          {/* User pill */}
          <Link to="/profile" className="nb-user">
            <div className="nb-avatar">
              <span>{userInitials}</span>
              <div className="nb-online" />
            </div>
            <div className="nb-user-info">
              <span className="nb-user-name">{userName}</span>
              <span className="nb-user-role">{userRole}</span>
            </div>
            <svg className="nb-chevron" width="12" height="12" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </Link>

          {/* Logout */}
          <button className="nb-logout" onClick={logout} title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
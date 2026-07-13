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
  const [userAvatar, setUserAvatar] = useState("");
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
      const avatar = localStorage.getItem("userAvatar") || "";
      setUserName(name);
      setUserRole(role);
      setUserAvatar(avatar);
      const parts = name.trim().split(" ");
      setUserInitials(
        parts.length >= 2
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : name.substring(0, 2).toUpperCase()
      );
    };
    loadUser();
    const onStorage = (e) => {
      if (e.key === "userName" || e.key === "userRole" || e.key === "userAvatar") loadUser();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 16;
      setScrolled((prev) => (prev === next ? prev : next));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
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
    { path: "/templates",       label: "Templates", icon: "🎨" },
    { path: "/summary-generator",label: "Summary",   icon: "📝" },
    { path: "/jobs",            label: "Jobs",      icon: "◈" },
    { path: "/resume-optimizer",label: "Optimizer", icon: "⚡" },
  ];

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <nav className={`nb-root${scrolled ? " nb-scrolled" : ""}`}>
        <div className="nb-wrap">

          {/* Hamburger toggle button (visible on mobile/tablet) */}
          <button 
            className={`nb-mobile-toggle${sidebarOpen ? ' active' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={sidebarOpen}
          >
            <span className="nb-toggle-line line-1"></span>
            <span className="nb-toggle-line line-2"></span>
            <span className="nb-toggle-line line-3"></span>
          </button>

          {/* ── Logo ── */}
          <Link to="/dashboard" className="nb-logo" onClick={() => setSidebarOpen(false)}>
            <div className="nb-logo-orb-custom">
              <svg viewBox="0 0 100 100" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#FBBF24" strokeWidth="4" />
                <circle cx="50" cy="50" r="24" fill="none" stroke="#FBBF24" strokeWidth="4" />
                <circle cx="50" cy="50" r="8" fill="#FBBF24" />
                <line x1="50" y1="2" x2="50" y2="98" stroke="#FBBF24" strokeWidth="4" />
                <line x1="2" y1="50" x2="98" y2="50" stroke="#FBBF24" strokeWidth="4" />
                <line x1="16" y1="16" x2="84" y2="84" stroke="#FBBF24" strokeWidth="4" />
                <line x1="16" y1="84" x2="84" y2="16" stroke="#FBBF24" strokeWidth="4" />
              </svg>
            </div>
            <div className="nb-logo-text-col">
              <span className="nb-logo-text-custom">CareerLens</span>
              <span className="nb-logo-badge-custom">AI</span>
            </div>
          </Link>

          {/* ── Nav links (Desktop) ── */}
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

          {/* ── Right cluster (Desktop/Tablet) ── */}
          <div className="nb-right">

            {/* Notification */}
            <div className="nb-notif-wrapper">
              <button 
                className={`nb-icon-btn${notifOpen ? " active" : ""}`}
                onClick={() => setNotifOpen(!notifOpen)}
                title="Notifications"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                aria-expanded={notifOpen}
                aria-haspopup="menu"
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
                            aria-label={`Dismiss notification: ${n.text}`}
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
                {userAvatar && userAvatar.startsWith("http") ? (
                  <img src={userAvatar} alt="avatar" className="nb-avatar-img" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <span>{userInitials}</span>
                )}
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

      {/* ── Mobile Sidebar Drawer Overlay & Side Panel ── */}
      <div 
        className={`nb-sidebar-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`nb-sidebar${sidebarOpen ? ' active' : ''}`}>
        <div className="nb-sidebar-header">
          {/* User profile details in header */}
          <Link to="/profile" className="nb-sidebar-user" onClick={() => setSidebarOpen(false)}>
            <div className="nb-sidebar-avatar">
              {userAvatar && userAvatar.startsWith("http") ? (
                <img src={userAvatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span>{userInitials}</span>
              )}
              <div className="nb-sidebar-online" />
            </div>
            <div className="nb-sidebar-user-info">
              <span className="nb-sidebar-user-name">{userName}</span>
              <span className="nb-sidebar-user-role">{userRole}</span>
            </div>
          </Link>
          <button 
            className="nb-sidebar-close" 
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {/* Navigation list */}
        <div className="nb-sidebar-body">
          <nav className="nb-sidebar-links">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nb-sidebar-link${active ? " active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="nb-sidebar-link-icon">{link.icon}</span>
                  <span className="nb-sidebar-link-label">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer logout */}
        <div className="nb-sidebar-footer">
          <button className="nb-sidebar-logout" onClick={() => { setSidebarOpen(false); logout(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: '8px' }}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

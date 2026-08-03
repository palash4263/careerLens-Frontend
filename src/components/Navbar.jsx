import { Link, useLocation, useNavigate } from "react-router-dom";
import PricingModal from "./common/PricingModal";
import { getProStatus } from "../services/paymentService";
import "./Navbar.css";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [scrolled,     setScrolled]     = useState(false);
  const [userName,     setUserName]     = useState("John Doe");
  const [userRole,     setUserRole]     = useState("Product Manager");
  const [userInitials, setUserInitials] = useState("JD");
  const [userAvatar,   setUserAvatar]   = useState("");
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [time,         setTime]         = useState("");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [pricingOpen,  setPricingOpen]  = useState(false);
  const [proStatus,    setProStatus]    = useState({ isPro: false });
  const notifRef = useRef(null);

  useEffect(() => {
    const updatePro = () => setProStatus(getProStatus());
    updatePro();
    window.addEventListener("pro_status_updated", updatePro);
    return () => window.removeEventListener("pro_status_updated", updatePro);
  }, []);

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Your resume score improved by 17 points!", time: "2h ago",  read: false, type: "success" },
    { id: 2, text: "Mock interview feedback from AI is ready",  time: "1d ago",  read: false, type: "info"    },
    { id: 3, text: "New Job Match: React Developer at Oracle",  time: "3d ago",  read: true,  type: "job"     },
  ]);

  // ── Live clock ──
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── User data ──
  useEffect(() => {
    const loadUser = () => {
      const name   = localStorage.getItem("userName")   || "John Doe";
      const role   = localStorage.getItem("userRole")   || "Product Manager";
      const avatar = localStorage.getItem("userAvatar") || "";
      setUserName(name);
      setUserRole(role);
      setUserAvatar(avatar);
      const parts = name.trim().split(" ");
      setUserInitials(
        parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase()
      );
    };
    loadUser();
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  // ── Scroll ──
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Close notif on outside click ──
  useEffect(() => {
    if (!notifOpen) return;
    const close = (e) => { if (!notifRef.current?.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [notifOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, read: true })));
  const toggleRead  = (id) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: !n.read } : n));
  const removeNotif = (id, e) => { e.stopPropagation(); setNotifications(p => p.filter(n => n.id !== id)); };

  const logout = () => {
    ["token","userName","userEmail","userRole","userLocation","userJoinDate","userPhone","userLinkedin","userBio","userAvatar"]
      .forEach(k => localStorage.removeItem(k));
    navigate("/login");
  };

  const navLinks = [
    { path: "/dashboard",        label: "Dashboard" },
    { path: "/resumes",          label: "Resumes"   },
    { path: "/resume-optimizer", label: "Optimizer" },
    { path: "/templates",        label: "Templates" },
    { path: "/ats-calculator",   label: "ATS Score" },
    { path: "/jobs",             label: "Jobs"      },
    { path: "/interview-prep",   label: "AI Tutor & Interview" },
    { path: "/skill-roadmap",    label: "Roadmap"   },
  ];

  return (
    <>
      <nav className={`nb-root${scrolled ? " nb-scrolled" : ""}`}>

        {/* Holographic scan line */}
        <div className="nb-scanline" />

        <div className="nb-wrap">

          {/* ── Mobile hamburger ── */}
          <button
            className={`nb-mobile-toggle${sidebarOpen ? " active" : ""}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <span className="nb-toggle-line line-1" />
            <span className="nb-toggle-line line-2" />
            <span className="nb-toggle-line line-3" />
          </button>

          {/* ── Logo ── */}
          <Link to="/dashboard" className="nb-logo" onClick={() => setSidebarOpen(false)}>
            {/* Animated AI sigil */}
            <div className="nb-sigil">
              <svg viewBox="0 0 100 100" width="34" height="34" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#sigilGrad)" strokeWidth="3" className="nb-sigil-ring-1" />
                <circle cx="50" cy="50" r="26" fill="none" stroke="url(#sigilGrad)" strokeWidth="2" className="nb-sigil-ring-2" />
                <circle cx="50" cy="50" r="8"  fill="url(#sigilGrad)" />
                <line x1="50" y1="2"  x2="50" y2="98" stroke="url(#sigilGrad)" strokeWidth="1.5" />
                <line x1="2"  y1="50" x2="98" y2="50" stroke="url(#sigilGrad)" strokeWidth="1.5" />
                <line x1="16" y1="16" x2="84" y2="84" stroke="url(#sigilGrad)" strokeWidth="1.5" />
                <line x1="16" y1="84" x2="84" y2="16" stroke="url(#sigilGrad)" strokeWidth="1.5" />
                <defs>
                  <linearGradient id="sigilGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%"   stopColor="#f59e0b" />
                    <stop offset="50%"  stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#fde68a" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="nb-sigil-glow" />
            </div>

            <div className="nb-logo-text-col">
              <span className="nb-logo-wordmark">CareerLens</span>
              <span className="nb-logo-sub">
                <span className="nb-logo-sub-dot" />
                AI · v4.1
              </span>
            </div>
          </Link>

          {/* ── Nav links ── */}
          <div className="nb-links">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link key={link.path} to={link.path} className={`nb-link${active ? " nb-active" : ""}`}>
                  <span className="nb-link-label">{link.label}</span>
                  {active && <span className="nb-active-bar" />}
                </Link>
              );
            })}
          </div>

          {/* ── Right cluster ── */}
          <div className="nb-right">

            {/* Notifications */}
            <div className="nb-notif-wrapper" ref={notifRef}>
              <button
                className={`nb-icon-btn${notifOpen ? " active" : ""}`}
                onClick={() => setNotifOpen(!notifOpen)}
                title="Notifications"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                {unreadCount > 0 && <span className="nb-notif-badge">{unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="nb-notif-dropdown">
                  <div className="nb-notif-scan" />
                  <div className="nb-notif-header">
                    <span className="nb-notif-title">Neural Alerts</span>
                    {unreadCount > 0 && (
                      <button className="nb-notif-clear-btn" onClick={markAllRead}>Mark all read</button>
                    )}
                  </div>
                  <div className="nb-notif-body">
                    {notifications.length === 0 ? (
                      <div className="nb-notif-empty">
                        <span className="nb-notif-empty-icon">✦</span>
                        <span>No new signals</span>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`nb-notif-item ${n.read ? "read" : "unread"}`} onClick={() => toggleRead(n.id)}>
                          <span className={`nb-notif-type-dot ${n.type}`} />
                          <div className="nb-notif-item-content">
                            <span className="nb-notif-item-text">{n.text}</span>
                            <span className="nb-notif-item-time">{n.time}</span>
                          </div>
                          <button className="nb-notif-item-close" onClick={e => removeNotif(n.id, e)}>×</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pro Upgrade Button */}
            <button
              className={`nb-pro-btn ${proStatus.isPro ? "is-pro" : ""}`}
              onClick={() => setPricingOpen(true)}
            >
              {proStatus.isPro ? "👑 Pro Active" : "💎 Upgrade to Pro"}
            </button>

            {/* Divider */}
            <div className="nb-divider" />

            {/* User avatar — compact, links to profile */}
            <Link to="/profile" className="nb-user-compact" title={userName}>
              <div className="nb-hex-avatar">
                <div className="nb-hex-inner">
                  {userAvatar?.startsWith("http") ? (
                    <img
                      src={userAvatar}
                      alt="avatar"
                      className="nb-avatar-img"
                      referrerPolicy="no-referrer"
                      onError={() => setUserAvatar("")}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
                    />
                  ) : (
                    <span>{userInitials}</span>
                  )}
                </div>
                <div className="nb-online-dot" />
              </div>
            </Link>

            {/* Logout */}
            <button className="nb-logout" onClick={logout} title="Logout">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Sidebar ── */}
      <div className={`nb-sidebar-overlay${sidebarOpen ? " active" : ""}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`nb-sidebar${sidebarOpen ? " active" : ""}`}>
        <div className="nb-sidebar-header">
          <Link to="/profile" className="nb-sidebar-user" onClick={() => setSidebarOpen(false)}>
            <div className="nb-sidebar-avatar">
              {userAvatar?.startsWith("http") ? (
                <img
                  src={userAvatar}
                  alt="avatar"
                  referrerPolicy="no-referrer"
                  onError={() => setUserAvatar("")}
                  style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }}
                />
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
          <button className="nb-sidebar-close" onClick={() => setSidebarOpen(false)}>×</button>
        </div>
        <div className="nb-sidebar-body">
          <nav className="nb-sidebar-links">
            {navLinks.map(link => {
              const active = location.pathname === link.path;
              return (
                <Link key={link.path} to={link.path} className={`nb-sidebar-link${active ? " active" : ""}`} onClick={() => setSidebarOpen(false)}>
                  <span className="nb-sidebar-link-icon">{link.icon}</span>
                  <span className="nb-sidebar-link-label">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="nb-sidebar-footer">
          <button className="nb-sidebar-logout" onClick={() => { setSidebarOpen(false); logout(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: "8px" }}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <PricingModal isOpen={pricingOpen} onClose={() => setPricingOpen(false)} />
    </>
  );
}
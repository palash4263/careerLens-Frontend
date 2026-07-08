import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useState, useEffect } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/resumes", label: "Resumes", icon: "📄" },
    { path: "/jobs", label: "Jobs", icon: "💼" },
    { path: "/resume-optimizer", label: "Optimizer", icon: "⚡" },
    { path: "/interview", label: "Interview", icon: "🎯" },
  ];

  return (
    <nav className={`navbar-premium ${isScrolled ? "scrolled" : ""}`}>
      <div className="navbar-premium-container">
        {/* LEFT - Premium Logo with AI Badge */}
        <Link to="/dashboard" className="navbar-premium-logo">
          <div className="logo-icon-wrapper">
            <span className="logo-icon">🔍</span>
            <div className="logo-ring"></div>
          </div>
          <span className="logo-text">Career<span className="logo-highlight">Lens</span></span>
          <span className="logo-badge">AI</span>
        </Link>

        {/* CENTER - Navigation Links */}
        <div className="navbar-premium-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              className={`nav-link-premium ${location.pathname === link.path ? "active" : ""}`}
              to={link.path}
            >
              <span className="nav-link-icon">{link.icon}</span>
              <span className="nav-link-label">{link.label}</span>
              {location.pathname === link.path && <span className="nav-link-indicator"></span>}
            </Link>
          ))}
        </div>

        {/* RIGHT - User & Actions */}
        <div className="navbar-premium-right">
          {/* User Profile - navigates to /profile route */}
          <Link to="/profile" className="user-profile-premium">
            <div className="user-avatar-premium">
              <span>JD</span>
              <div className="user-status-dot"></div>
            </div>
            <div className="user-info-premium">
              <span className="user-name-premium">John Doe</span>
              <span className="user-role-premium">Product Manager</span>
            </div>
          </Link>

          {/* Actions */}
          <button className="action-btn-premium" title="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="notification-badge">3</span>
          </button>

          <button className="logout-btn-premium" onClick={logout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
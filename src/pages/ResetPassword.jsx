// src/pages/ResetPassword.jsx
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../api/axiosConfig";
import "./Login.css"; // Uses the premium redesigned login shell styles

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [focusedPass, setFocusedPass] = useState(false);
  const [focusedConf, setFocusedConf] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is missing or invalid");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password,
      });
      setSuccess(response.data.message || "Password reset successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      {/* Brand Side Panel */}
      <aside className="login-brand">
        <div className="login-brand-inner">
          <span className="login-mark">✦</span>
          <p className="login-quote">
            "Unlock the hidden potential of your professional story."
          </p>
          <span className="login-quote-attr">CareerLens AI</span>
        </div>
      </aside>

      {/* Reset Password Form Panel */}
      <main className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <header className="login-header">
            <span className="login-eyebrow">Security</span>
            <h1>New Password</h1>
            <p className="login-sub">Create and confirm your new secure account password.</p>
          </header>

          {error && <div className="login-alert" role="alert" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>{error}</div>}
          {success && <div className="login-alert" role="alert" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}>{success}</div>}

          <div className={`field ${focusedPass ? "is-focused" : ""}`}>
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedPass(true)}
              onBlur={() => setFocusedPass(false)}
              required
            />
            <span className="field-line" />
          </div>

          <div className={`field ${focusedConf ? "is-focused" : ""}`}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedConf(true)}
              onBlur={() => setFocusedConf(false)}
              required
            />
            <span className="field-line" />
          </div>

          <button type="submit" className="login-submit" disabled={loading || success}>
            <span>{loading ? "Saving Password…" : "Save Password"}</span>
          </button>

          <footer className="login-footer">
            <p>
              Back to{" "}
              <Link to="/login" className="login-signup-link">
                Log In
              </Link>
            </p>
          </footer>
        </form>
      </main>
    </div>
  );
}

export default ResetPassword;

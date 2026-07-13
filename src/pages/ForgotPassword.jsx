// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosConfig";
import "./Login.css"; // Uses the premium redesigned login shell styles

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", { email });
      setSuccess(response.data.message || "Reset link generated. Check the backend console logs.");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to submit request.");
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

      {/* Forgot Password Form Panel */}
      <main className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <header className="login-header">
            <span className="login-eyebrow">Security</span>
            <h1>Reset Password</h1>
            <p className="login-sub">Enter your email and we'll send you a password reset link.</p>
          </header>

          {error && <div className="login-alert" role="alert" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>{error}</div>}
          {success && <div className="login-alert" role="alert" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}>{success}</div>}

          <div className={`field ${focused ? "is-focused" : ""}`}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              required
            />
            <span className="field-line" />
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            <span>{loading ? "Sending Link…" : "Send Reset Link"}</span>
          </button>

          <footer className="login-footer">
            <p>
              Remembered your password?{" "}
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

export default ForgotPassword;

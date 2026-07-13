// src/pages/ResetPassword.jsx
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../api/axiosConfig";
import "./Login.css"; // Reuse premium login card styles

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
      // Redirect to login after 3 seconds
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
    <div className="auth-container">
      {/* Glow Orbs */}
      <div className="auth-orb purple" />
      <div className="auth-orb pink" />

      <div className="auth-card-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Create New Password</h1>
            <p className="auth-subtitle">
              Enter and confirm your new secure password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error-alert">{error}</div>}
            {success && <div className="auth-success-alert">{success}</div>}

            <div className={`auth-input-group ${focusedPass ? "focused" : ""}`}>
              <span className="auth-input-icon">🔒</span>
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedPass(true)}
                onBlur={() => setFocusedPass(false)}
                required
              />
            </div>

            <div className={`auth-input-group ${focusedConf ? "focused" : ""}`}>
              <span className="auth-input-icon">🔒</span>
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedConf(true)}
                onBlur={() => setFocusedConf(false)}
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading || success}>
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Saving Password...
                </>
              ) : (
                "Save Password"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Back to{" "}
              <Link to="/login" className="auth-link">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
// 

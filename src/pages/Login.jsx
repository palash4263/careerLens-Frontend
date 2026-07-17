// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { login, googleSignIn } from "../services/authService";
import CareerLensAnimation from "../components/canvas/CareerLensAnimation";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) next.email = "Enter a valid email";
    if (!formData.password) next.password = "Enter your password";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = await login(formData);
      
      // Store token
      const token = data.access_token || data.token;
      if (!token) {
        setFormError('Login failed: No token received');
        return;
      }
      
      localStorage.setItem('token', token);
      
      // Store user data
      localStorage.setItem('userName', data.user?.name || 'User');
      localStorage.setItem('userEmail', data.user?.email || '');
      localStorage.setItem('userAvatar', data.user?.avatar || '');
      localStorage.setItem('userRole', data.user?.role || 'Product Manager');
      localStorage.setItem('userLocation', data.user?.location || 'Noida, IN');
      localStorage.setItem('userJoinDate', data.user?.joinDate || 'January 2026');
      
      navigate('/dashboard');
    } catch (error) {
      setFormError(
        error?.response?.data?.detail || 
        error?.response?.data?.message || 
        "Invalid email or password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setFormError("");
    setSubmitting(true);
    try {
      const data = await googleSignIn(credentialResponse.credential);
      const token = data.access_token || data.token;
      if (!token) {
        setFormError('Google Login failed: No token received');
        return;
      }
      
      localStorage.setItem('token', token);
      
      // Store user data
      localStorage.setItem('userName', data.user?.name || 'User');
      localStorage.setItem('userEmail', data.user?.email || '');
      localStorage.setItem('userAvatar', data.user?.avatar || '');
      localStorage.setItem('userRole', data.user?.role || 'Product Manager');
      localStorage.setItem('userLocation', data.user?.location || 'Noida, IN');
      localStorage.setItem('userJoinDate', data.user?.joinDate || 'January 2026');
      
      navigate('/dashboard');
    } catch (error) {
      setFormError(
        error?.response?.data?.detail || 
        error?.response?.data?.message || 
        "Google authentication failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setFormError("Google Sign-In was unsuccessful. Please try again.");
  };

  return (
    <div className="login-shell">
      <aside className="login-brand">
        <CareerLensAnimation />
      </aside>

      <main className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <header className="login-header">
            <span className="login-eyebrow">Membership</span>
            <h1>Log in</h1>
            <p className="login-sub">Enter your details to continue.</p>
          </header>

          {formError && <div className="login-alert" role="alert">{formError}</div>}

          <div className={`field ${focused === "email" ? "is-focused" : ""} ${errors.email ? "has-error" : ""}`}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            <span className="field-line" />
            {errors.email && <span className="field-error" id="email-error">{errors.email}</span>}
          </div>

          <div className={`field ${focused === "password" ? "is-focused" : ""} ${errors.password ? "has-error" : ""}`}>
            <div className="field-label-row">
               <label htmlFor="password">Password</label>
               <Link to="/forgot-password" className="field-aside-link">Forgot?</Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <span className="field-line" />
            {errors.password && <span className="field-error" id="password-error">{errors.password}</span>}
          </div>

          <button type="submit" className="login-submit" disabled={submitting}>
            <span>{submitting ? "Logging in…" : "Log in"}</span>
          </button>

          <div className="auth-divider">or sign in with</div>

          <div className="google-signin-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_dark"
              shape="pill"
              size="large"
              width="100%"
            />
          </div>

          <p className="login-footnote">
            New here? <a href="/register">Create an account</a>
          </p>
        </form>
      </main>
    </div>
  );
}

export default Login;
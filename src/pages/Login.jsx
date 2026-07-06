// Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";
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
      const response = await login(formData);
      localStorage.setItem("token", response.token);
      navigate("/dashboard");
    } catch (error) {
      setFormError(
        error?.response?.data?.message || "Invalid email or password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <aside className="login-brand">
        <div className="login-brand-inner">
          <span className="login-mark">✦</span>
          <p className="login-quote">
            "Unlock the hidden potential of your professional story."
          </p>
          <span className="login-quote-attr">CareerLens AI</span>
        </div>
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
              <a href="/forgot-password" className="field-aside-link">Forgot?</a>
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
            <span>{submitting ? "Signing in…" : "Sign in"}</span>
          </button>

          <p className="login-footnote">
            New here? <a href="/register">Create an account</a>
          </p>
        </form>
      </main>
    </div>
  );
}

export default Login;
// src/pages/Register.jsx
import { useState } from "react";
import { register } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const FIELDS = [
  { name: "name", label: "Full name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email address", type: "email", autoComplete: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
];

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
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
    if (!formData.name.trim()) next.name = "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) next.email = "Enter a valid email";
    if (formData.password.length < 8) next.password = "At least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await register(formData);
      
      // Check for token
      const token = response.access_token || response.token;
      if (token) {
        localStorage.setItem('token', token);
      }
      
      // Store user data
      const userData = response.user || response.data?.user || {};
      localStorage.setItem('userName', userData.name || formData.name || 'User');
      localStorage.setItem('userEmail', userData.email || formData.email || '');
      localStorage.setItem('userRole', userData.role || 'Product Manager');
      localStorage.setItem('userLocation', userData.location || 'Noida, IN');
      localStorage.setItem('userJoinDate', userData.joinDate || 'January 2026');
      localStorage.setItem('userPhone', userData.phone || '+91 98765 43210');
      localStorage.setItem('userLinkedin', userData.linkedin || 'linkedin.com/in/username');
      localStorage.setItem('userBio', userData.bio || 'Passionate professional with years of experience.');
      localStorage.setItem('userAvatar', userData.avatar || (formData.name ? formData.name.charAt(0) : 'U'));
      
      navigate("/dashboard");
    } catch (error) {
      setFormError(
        error?.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-shell">
      <aside className="register-brand">
        <div className="register-brand-inner">
          <span className="register-mark">✦</span>
          <p className="register-quote">
            "Every career milestone begins with a single optimized page."
          </p>
          <span className="register-quote-attr">CareerLens AI</span>
        </div>
      </aside>

      <main className="register-panel">
        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <header className="register-header">
            <span className="register-eyebrow">Membership</span>
            <h1>Create your account</h1>
            <p className="register-sub">Set up access in under a minute.</p>
          </header>

          {formError && <div className="register-alert" role="alert">{formError}</div>}

          {FIELDS.map(({ name, label, type, autoComplete }) => (
            <div
              key={name}
              className={`field ${focused === name ? "is-focused" : ""} ${errors[name] ? "has-error" : ""}`}
            >
              <label htmlFor={name}>{label}</label>
              <input
                id={name}
                name={name}
                type={type}
                autoComplete={autoComplete}
                value={formData[name]}
                onChange={handleChange}
                onFocus={() => setFocused(name)}
                onBlur={() => setFocused(null)}
                aria-invalid={!!errors[name]}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
              />
              <span className="field-line" />
              {errors[name] && (
                <span className="field-error" id={`${name}-error`}>{errors[name]}</span>
              )}
            </div>
          ))}

          <button type="submit" className="register-submit" disabled={submitting}>
            <span>{submitting ? "Creating account…" : "Create account"}</span>
          </button>

          <p className="register-footnote">
            Already a member? <a href="/login">Sign in</a>
          </p>
        </form>
      </main>
    </div>
  );
}

export default Register;
// src/pages/Login.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { login, googleSignIn } from "../services/authService";
import CareerLensAnimation from "../components/canvas/CareerLensAnimation";
import "./Login.css";

// ─── Animated login overlay ───────────────────────────────────────────────────
const LOGIN_STEPS = [
  "Initialising secure handshake…",
  "Verifying credentials…",
  "Calibrating career intelligence core…",
  "Launching Career Lens…",
];

function LoginOverlay() {
  const [step, setStep]       = useState(0);
  const [progress, setProgress] = useState(0);
  const [isColdStart, setIsColdStart] = useState(false);
  const canvasRef             = useRef(null);
  const rafRef                = useRef(null);

  // Cycle through steps faster (300ms per step)
  useEffect(() => {
    const total = LOGIN_STEPS.length;
    const interval = setInterval(() => {
      setStep(s => Math.min(s + 1, total - 1));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Animate progress bar 0 → 95 % while waiting for backend promise
  useEffect(() => {
    let v = 0;
    const tick = () => {
      v = Math.min(v + 1.2, 95);
      setProgress(v);
      if (v >= 95) {
        setIsColdStart(true);
      }
      if (v < 95) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = canvas.getContext("2d");
    let W = canvas.width  = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    const count = 60;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      a: Math.random() * 0.6 + 0.2,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(163,230,53,${p.a})`;
        ctx.fill();
      });
      // Draw connecting lines between close particles
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(163,230,53,${0.12 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <div className="login-overlay" aria-live="polite" role="status">
      {/* Particle field */}
      <canvas ref={canvasRef} className="login-overlay__canvas" />

      {/* Scanline sweep */}
      <div className="login-overlay__scanline" />

      {/* Central card */}
      <div className="login-overlay__card">
        {/* Spinning quantum ring */}
        <div className="login-overlay__ring">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="36" stroke="rgba(163,230,53,0.12)" strokeWidth="2" />
            <circle
              cx="40" cy="40" r="36"
              stroke="#a3e635"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="60 165"
              className="login-overlay__arc"
            />
            <circle cx="40" cy="40" r="24" stroke="rgba(96,165,250,0.15)" strokeWidth="1.5" />
            <circle
              cx="40" cy="40" r="24"
              stroke="#60a5fa"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="30 120"
              className="login-overlay__arc-inner"
            />
            <circle cx="40" cy="40" r="5" fill="#a3e635" opacity="0.9" />
          </svg>
        </div>

        {/* Status label */}
        <p className="login-overlay__step" key={step}>
          {isColdStart ? "⚡ Cloud backend server starting (Render free tier wake-up)… Almost there!" : LOGIN_STEPS[step]}
        </p>

        {/* Progress bar */}
        <div className="login-overlay__bar-track">
          <div className="login-overlay__bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="login-overlay__pct">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// ─── Main Login component ─────────────────────────────────────────────────────
function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors]     = useState({});
  const [focused, setFocused]   = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
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
      const token = data.access_token || data.token;
      if (!token) { setFormError("Login failed: No token received"); return; }

      localStorage.setItem("token",        token);
      localStorage.setItem("userName",     data.user?.name      || "User");
      localStorage.setItem("userEmail",    data.user?.email     || "");
      localStorage.setItem("userAvatar",   data.user?.avatar    || "");
      localStorage.setItem("userRole",     data.user?.role      || "Product Manager");
      localStorage.setItem("userLocation", data.user?.location  || "Noida, IN");
      localStorage.setItem("userJoinDate", data.user?.joinDate  || "January 2026");

      navigate("/dashboard");
    } catch (error) {
      setFormError(
        error?.response?.data?.detail  ||
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
      const data  = await googleSignIn(credentialResponse.credential);
      const token = data.access_token || data.token;
      if (!token) { setFormError("Google Login failed: No token received"); return; }

      localStorage.setItem("token",        token);
      localStorage.setItem("userName",     data.user?.name      || "User");
      localStorage.setItem("userEmail",    data.user?.email     || "");
      localStorage.setItem("userAvatar",   data.user?.avatar    || "");
      localStorage.setItem("userRole",     data.user?.role      || "Product Manager");
      localStorage.setItem("userLocation", data.user?.location  || "Noida, IN");
      localStorage.setItem("userJoinDate", data.user?.joinDate  || "January 2026");

      navigate("/dashboard");
    } catch (error) {
      setFormError(
        error?.response?.data?.detail  ||
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
      {/* Full-screen interactive loading overlay */}
      {submitting && <LoginOverlay />}

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
              id="email" name="email" type="email" autoComplete="email"
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
              id="password" name="password" type="password" autoComplete="current-password"
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
            {submitting ? (
              <span className="login-submit__inner">
                <span className="login-submit__spinner" />
                Authenticating…
              </span>
            ) : (
              <span>Log in</span>
            )}
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
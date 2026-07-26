// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { animate } from "animejs";

const ThemeContext = createContext(null);

/**
 * Interpolate between two hex colour strings using Anime.js
 * and write the result directly to a CSS variable on :root.
 */
function interpolateVar(varName, fromHex, toHex, duration, ease) {
  // Parse hex → {r,g,b}
  const parse = (hex) => {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  };
  const from = parse(fromHex);
  const to   = parse(toHex);
  const obj  = { ...from };

  animate(obj, {
    r: to.r, g: to.g, b: to.b,
    duration,
    ease,
    onUpdate: () => {
      const r = Math.round(obj.r);
      const g = Math.round(obj.g);
      const b = Math.round(obj.b);
      document.documentElement.style.setProperty(varName, `rgb(${r},${g},${b})`);
    },
  });
}

// ── Theme Token Maps ─────────────────────────────────────────────────────────
const TOKENS = {
  dark: {
    "--cl-bg-base":        "#080f1a",
    "--cl-bg-surface":     "#0f172a",
    "--cl-bg-card":        "#111827",
    "--cl-bg-elevated":    "#1e293b",
    "--cl-border":         "#1e293b",
    "--cl-text-primary":   "#f1f5f9",
    "--cl-text-secondary": "#94a3b8",
    "--cl-text-muted":     "#475569",
    "--cl-accent-cyan":    "#38bdf8",
    "--cl-accent-violet":  "#8b5cf6",
    "--cl-accent-emerald": "#34d399",
    "--cl-navbar-bg":      "#0a1628",
    "--cl-navbar-border":  "#1e293b",
  },
  light: {
    "--cl-bg-base":        "#f0f4ff",
    "--cl-bg-surface":     "#ffffff",
    "--cl-bg-card":        "#f8faff",
    "--cl-bg-elevated":    "#eef2ff",
    "--cl-border":         "#c7d2fe",
    "--cl-text-primary":   "#0f172a",
    "--cl-text-secondary": "#334155",
    "--cl-text-muted":     "#64748b",
    "--cl-accent-cyan":    "#0ea5e9",
    "--cl-accent-violet":  "#7c3aed",
    "--cl-accent-emerald": "#059669",
    "--cl-navbar-bg":      "#ffffff",
    "--cl-navbar-border":  "#e0e7ff",
  },
};

const DURATION = 700;
const EASE     = "outCubic";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("cl_theme") || "dark"
  );

  // Apply tokens immediately on first paint (no animation)
  useEffect(() => {
    const tokens = TOKENS[theme];
    Object.entries(tokens).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });
    document.documentElement.setAttribute("data-theme", theme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next       = prev === "dark" ? "light" : "dark";
      const fromTokens = TOKENS[prev];
      const toTokens   = TOKENS[next];

      // Animate every CSS variable
      Object.keys(toTokens).forEach((varName) => {
        interpolateVar(varName, fromTokens[varName], toTokens[varName], DURATION, EASE);
      });

      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("cl_theme", next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

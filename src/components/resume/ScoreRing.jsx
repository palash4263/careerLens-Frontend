import { motion } from "framer-motion";

export default function ScoreRing({
  label,
  value = 0,
  tone = "primary",
  animate = true,
  delay = 0,
}) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const percentage = Math.min(Math.max(value, 0), 100);

  const offset =
    circumference -
    (percentage / 100) * circumference;

  const gradients = {
    primary: "url(#blueGradient)",
    positive: "url(#purpleGradient)",
    success: "url(#greenGradient)",
    warning: "url(#orangeGradient)",
    muted: "url(#grayGradient)",
  };

  const colors = {
    primary: "#60a5fa",
    positive: "#a855f7",
    success: "#10b981",
    warning: "#f59e0b",
    muted: "#94a3b8",
  };

  return (
    <motion.div
      className="score-ring-premium"
      initial={{
        scale: 0.8,
        opacity: 0,
      }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      transition={{
        delay,
        duration: 0.6,
      }}
    >
      <div className="score-ring-container">
        <svg
          className="ring-svg-premium"
          viewBox="0 0 120 120"
        >
          <defs>
            <linearGradient
              id="blueGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>

            <linearGradient
              id="purpleGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>

            <linearGradient
              id="greenGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <linearGradient
              id="orangeGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            <linearGradient
              id="grayGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>

          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,.08)"
            strokeWidth="10"
          />

          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={gradients[tone]}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={
              animate
                ? offset
                : circumference
            }
            transform="rotate(-90 60 60)"
            style={{
              transition:
                "stroke-dashoffset .9s ease",
            }}
          />
        </svg>

        <div className="ring-text-premium">
          <span
            className="ring-value-premium"
            style={{
              color: colors[tone],
            }}
          >
            {value}
          </span>

          <span className="ring-unit-premium">
            /100
          </span>
        </div>
      </div>

      <p
        className="ring-label-premium"
        style={{
          color: colors[tone],
        }}
      >
        {label}
      </p>
    </motion.div>
  );
}
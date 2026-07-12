import React, { useRef } from "react";
import { motion } from "framer-motion";
import "./PricingSection.css";

// Helper component: MIcon
export const MIcon = ({
  name,
  size = 20,
  weight = 400,
  fill = 0,
  grade = 0,
  opticalSize = 24,
  className
}) => {
  return (
    <span
      className={`material-symbols-outlined select-none leading-none ${className || ""}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
      }}
    >
      {name}
    </span>
  );
};

// Helper component: FadeUp
export const FadeUp = ({ children, delay = 0, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Helper component: SpotlightBorder
export const SpotlightBorder = ({
  children,
  className,
  radius = "2xl",
  size = 520,
  intensity = 0.5
}) => {
  const containerRef = useRef(null);

  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    containerRef.current.style.setProperty("--spot-x", `${x}px`);
    containerRef.current.style.setProperty("--spot-y", `${y}px`);
  };

  const handlePointerLeave = () => {
    if (!containerRef.current) return;
    containerRef.current.style.setProperty("--spot-x", `-9999px`);
    containerRef.current.style.setProperty("--spot-y", `-9999px`);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`spotlight-border ${className || ""}`}
      style={{
        "--size": `${size}px`,
        "--intensity": intensity,
        "--spot-x": "-9999px",
        "--spot-y": "-9999px"
      }}
    >
      <div className="spotlight-inner-content">
        {children}
      </div>
    </div>
  );
};

// Animated Text Helper
const AnimatedText = ({ text }) => {
  return (
    <div className="animated-text-container">
      <div className="animated-text-slide">
        <span className="animated-text-line">{text}</span>
        <span className="animated-text-line">{text}</span>
      </div>
    </div>
  );
};

// Primary & Secondary Buttons
export const PrimaryButton = ({ href, children }) => {
  return (
    <button 
      onClick={() => window.open(href, "_self")}
      className="pricing-btn pricing-btn-primary"
    >
      <AnimatedText text={children} />
    </button>
  );
};

export const SecondaryButton = ({ href, children }) => {
  return (
    <button 
      onClick={() => window.open(href, "_self")}
      className="pricing-btn pricing-btn-secondary"
    >
      <AnimatedText text={children} />
    </button>
  );
};

const plans = [
  {
    name: "Professional Plan",
    price: "250",
    originalPrice: "499",
    description: "Ideal for polishing your resume for a specific target role.",
    bg: "#161616",
    features: [
      { text: "10+ AI Resume Optimizations", included: true },
      { text: "ATS Match Rating & Analysis", included: true },
      { text: "Real AI Job Fetching from URL", included: true },
      { text: "Premium PDF Generation & Downloads", included: true },
      { text: "Unlimited AI Mock Interviews", included: false },
    ],
  },
  {
    name: "Elite Pro Plan",
    price: "600",
    originalPrice: "1199",
    description: "For active job seekers targetting multiple roles.",
    bg: "#252525",
    features: [
      { text: "Unlimited AI Resume Optimizations", included: true },
      { text: "ATS Match Rating & Analysis", included: true },
      { text: "Real AI Job Fetching from URL", included: true },
      { text: "Premium PDF Generation & Downloads", included: true },
      { text: "Unlimited AI Mock Interviews", included: true },
    ],
    featured: true,
    badge: "Best Value",
  },
];

const PricingCard = ({ plan }) => {
  return (
    <SpotlightBorder 
      radius="2xl" 
      size={460} 
      intensity={0.5}
      className="relative h-full p-2 sm:p-3"
    >
      <div
        className="pricing-card-inner"
        style={{ backgroundColor: plan.bg }}
      >
        {plan.badge && (
          <div className="pricing-badge">
            {plan.badge}
          </div>
        )}

        <FadeUp delay={0}>
          <div className="pricing-eyebrow">
            {plan.name}
          </div>
        </FadeUp>
        <div className="pricing-divider" />

        <FadeUp delay={0.1}>
          <div className="pricing-price-row">
            <span className="pricing-price">₹{plan.price}</span>
            {plan.originalPrice && (
              <span className="pricing-original-price">₹{plan.originalPrice}</span>
            )}
          </div>
        </FadeUp>

        <FadeUp delay={0.2}>
          <p className="pricing-card-description">{plan.description}</p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div className="pricing-card-btn-wrap">
            {plan.featured ? (
              <PrimaryButton href="/resume-optimizer">Get Started</PrimaryButton>
            ) : (
              <SecondaryButton href="/resume-optimizer">Get Started</SecondaryButton>
            )}
          </div>
        </FadeUp>

        <FadeUp delay={0.4}>
          <ul className="pricing-features-list">
            {plan.features.map((f, i) => (
              <li 
                key={f.text}
                className={`pricing-feature-item ${i === 0 ? 'first' : ''} ${f.included ? 'included' : 'excluded'}`}
              >
                <span className={`pricing-feature-circle ${f.included ? 'included' : 'excluded'}`}>
                  {f.included ? (
                    <MIcon name="check" size={12} className="text-foreground" />
                  ) : (
                    <MIcon name="close" size={12} className="text-foreground/50" />
                  )}
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </FadeUp>
      </div>
    </SpotlightBorder>
  );
};

const PricingSection = () => {
  return (
    <section id="pricing" className="pricing-section">
      <div className="pricing-container">
        {/* CARDS */}
        <div className="pricing-grid">
          {plans.map((p) => (
            <PricingCard key={p.name} plan={p} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

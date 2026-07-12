import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import api from "../api/axiosConfig";
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

// Animated Text Helper — Fixed to correctly support children and text prop
const AnimatedText = ({ text, children }) => {
  const displayText = text || children;
  return (
    <div className="animated-text-container">
      <div className="animated-text-slide">
        <span className="animated-text-line">{displayText}</span>
        <span className="animated-text-line">{displayText}</span>
      </div>
    </div>
  );
};

const plans = [
  {
    key: "pro",
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
    key: "elite",
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

const PricingCard = ({ plan, onCheckout, processing }) => {
  return (
    <SpotlightBorder 
      radius="2xl" 
      size={460} 
      intensity={0.5}
      className="relative h-full p-2 sm:p-3"
    >
      <div
        className={`pricing-card-inner ${plan.featured ? 'featured' : ''}`}
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
            <button 
              disabled={processing}
              onClick={() => onCheckout(plan.key)}
              className={`pricing-btn ${plan.featured ? 'pricing-btn-primary' : 'pricing-btn-secondary'}`}
            >
              <AnimatedText>
                {processing ? "Processing..." : "Get Started"}
              </AnimatedText>
            </button>
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
  const [loading, setLoading] = useState(false);

  const simulateMockPayment = async (planKey, order_id) => {
    const confirmPayment = window.confirm(
      "💻 Local Dev Mode Detected:\n\nWould you like to simulate a successful payment upgrade to " + 
      (planKey === "pro" ? "Professional" : "Elite Pro") + "?"
    );

    if (!confirmPayment) {
      setLoading(false);
      return;
    }

    try {
      const verification = await api.post("/payments/verify-payment", {
        razorpay_order_id: order_id,
        razorpay_payment_id: "pay_mock_" + Date.now(),
        razorpay_signature: "mock_signature",
        plan: planKey
      });

      if (verification.data.status === "success") {
        localStorage.setItem("userRole", planKey);
        alert(`🎉 Mock Payment Successful! Upgraded to ${planKey === "pro" ? "Professional" : "Elite Pro"} plan.`);
        window.location.href = "/dashboard";
      } else {
        alert("Mock payment verification failed.");
      }
    } catch (err) {
      console.error("Mock verification error:", err);
      alert("Error simulating mock payment verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planKey) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to upgrade your subscription!");
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    try {
      // 1. Create order on FastAPI Backend
      const response = await api.post("/payments/create-order", { plan: planKey });
      const { order_id, amount, currency, key_id, is_mock } = response.data;

      // 2. Check if local developer mock flow is returned
      if (is_mock || order_id.startsWith("order_mock_")) {
        await simulateMockPayment(planKey, order_id);
        return;
      }

      // 3. Setup Razorpay options (For real test/live orders)
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: "CareerLens AI",
        description: planKey === "pro" ? "Professional Plan Upgrade" : "Elite Pro Plan Upgrade",
        order_id: order_id,
        handler: async function (paymentResponse) {
          try {
            // 4. Verify payment signature on FastAPI Backend
            const verification = await api.post("/payments/verify-payment", {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature || "mock_signature",
              plan: planKey
            });

            if (verification.data.status === "success") {
              // Update local state role
              localStorage.setItem("userRole", planKey);
              alert(`🎉 Payment Successful! Upgraded to ${planKey === "pro" ? "Professional" : "Elite Pro"} plan.`);
              window.location.href = "/dashboard";
            } else {
              alert("Payment verification failed. Please try again or contact support.");
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Error verifying payment signature. Please contact support.");
          }
        },
        prefill: {
          name: localStorage.getItem("userName") || "",
          email: localStorage.getItem("userEmail") || "",
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      // 3. Launch Razorpay native modal
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Order creation failed:", error);
      alert("Failed to initiate checkout. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="pricing" className="pricing-section">
      <div className="pricing-container">
        {/* CARDS */}
        <div className="pricing-grid">
          {plans.map((p) => (
            <PricingCard 
              key={p.name} 
              plan={p} 
              onCheckout={handleCheckout} 
              processing={loading} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

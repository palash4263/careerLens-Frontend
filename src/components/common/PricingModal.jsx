import { useState, useEffect } from "react";
import { Sparkles, Check, Zap, X, ShieldCheck, Crown } from "lucide-react";
import { animate } from "animejs";
import { processRazorpayPayment, getProStatus } from "../../services/paymentService";
import "./PricingModal.css";

export default function PricingModal({ isOpen, onClose }) {
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "annual"
  const [loading, setLoading] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);
  const [proStatus, setProStatus] = useState(getProStatus());

  useEffect(() => {
    if (isOpen) {
      setProStatus(getProStatus());
      setSuccessDetails(null);
      // Anime.js entrance for modal cards
      setTimeout(() => {
        const modalEl = document.querySelector(".pricing-modal-container");
        if (modalEl) {
          animate(modalEl, {
            scale: [0.92, 1],
            opacity: [0, 1],
            duration: 350,
            ease: "outQuad",
          });
        }
      }, 20);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const plans = {
    monthly: {
      id: "pro_monthly",
      title: "Pro Monthly",
      price: 299,
      period: "/month",
      badge: "Popular",
      features: [
        "Unlimited Groq AI Bullet & Summary Generations",
        "Unlimited High-Resolution A4 Vector PDF Exports",
        "Full ATS Score Calculator & Keyword Matching",
        "Access to All 6 Executive ATS Resume Templates",
        "AI Mock Interview Practice",
      ],
    },
    annual: {
      id: "pro_annual",
      title: "Pro Annual",
      price: 1999,
      period: "/year",
      badge: "Save 45%",
      features: [
        "Everything in Pro Monthly",
        "Save ₹1,589 per year (Only ₹166/month)",
        "Priority FAANG AI Prompt Engines",
        "1-on-1 AI ATS Resume Audit Reports",
        "VIP Priority Support",
      ],
    },
    single: {
      id: "pass_single",
      title: "Single ATS Pass",
      price: 49,
      period: "one-time",
      badge: "Quick",
      features: [
        "1 High-Resolution Vector PDF Export",
        "Instant ATS Keyword Scan & Score",
        "Watermark Removal",
      ],
    },
  };

  const currentPlan = plans[billingCycle];

  const handleCheckout = (selectedPlan) => {
    setLoading(true);
    processRazorpayPayment({
      planTitle: selectedPlan.title,
      amount: selectedPlan.price,
      planId: selectedPlan.id,
      onSuccess: (details) => {
        setLoading(false);
        setSuccessDetails(details);
        setProStatus(details);
      },
      onError: (msg) => {
        setLoading(false);
      },
    });
  };

  return (
    <div className="pricing-modal-overlay" onClick={onClose}>
      <div className="pricing-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="pricing-modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        {successDetails ? (
          <div className="pricing-success-view">
            <div className="success-icon-box">
              <Crown size={36} />
            </div>
            <h2>Pro Upgrade Unlocked! 🎉</h2>
            <p className="success-sub">
              Thank you for upgrading to <strong>{successDetails.planTitle}</strong>. Your full AI suite and unlimited ATS exports are active!
            </p>
            <div className="success-meta-card">
              <span>Payment ID: <code>{successDetails.paymentId}</code></span>
              <span>Activated: {new Date(successDetails.activatedAt).toLocaleDateString()}</span>
            </div>
            <button className="pricing-success-btn" onClick={onClose}>
              Continue to App 🚀
            </button>
          </div>
        ) : (
          <>
            <div className="pricing-modal-header">
              <span className="pricing-badge">
                <Sparkles size={14} />
                <span>CareerLens Pro</span>
              </span>
              <h2>Supercharge Your Career with AI</h2>
              <p>Unlock unlimited AI resume optimization, ATS scoring, and recruiter templates.</p>

              {/* Billing Toggle */}
              <div className="pricing-toggle-group">
                <button
                  className={`pricing-toggle-btn ${billingCycle === "monthly" ? "active" : ""}`}
                  onClick={() => setBillingCycle("monthly")}
                >
                  Monthly Billing
                </button>
                <button
                  className={`pricing-toggle-btn ${billingCycle === "annual" ? "active" : ""}`}
                  onClick={() => setBillingCycle("annual")}
                >
                  Annual Billing <span className="discount-tag">Save 45%</span>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="pricing-plans-grid">
              {/* Selected Plan Featured Card */}
              <div className="pricing-plan-card featured">
                <div className="plan-badge-top">{currentPlan.badge}</div>
                <h3 className="plan-title">{currentPlan.title}</h3>
                <div className="plan-price-row">
                  <span className="plan-currency">₹</span>
                  <span className="plan-amount">{currentPlan.price}</span>
                  <span className="plan-period">{currentPlan.period}</span>
                </div>

                <ul className="plan-features-list">
                  {currentPlan.features.map((feat, idx) => (
                    <li key={idx}>
                      <Check size={16} className="check-icon" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className="plan-checkout-btn"
                  disabled={loading || proStatus.isPro}
                  onClick={() => handleCheckout(currentPlan)}
                >
                  {loading ? (
                    <span>Processing Payment...</span>
                  ) : proStatus.isPro ? (
                    <span>Pro Active ✅</span>
                  ) : (
                    <>
                      <Zap size={18} />
                      <span>Upgrade to {currentPlan.title}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Single Pass Alternative */}
              <div className="pricing-plan-card secondary">
                <div className="plan-badge-top secondary">{plans.single.badge}</div>
                <h3 className="plan-title">{plans.single.title}</h3>
                <div className="plan-price-row">
                  <span className="plan-currency">₹</span>
                  <span className="plan-amount">{plans.single.price}</span>
                  <span className="plan-period">{plans.single.period}</span>
                </div>

                <ul className="plan-features-list">
                  {plans.single.features.map((feat, idx) => (
                    <li key={idx}>
                      <Check size={16} className="check-icon" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className="plan-checkout-btn secondary"
                  disabled={loading}
                  onClick={() => handleCheckout(plans.single)}
                >
                  Buy Single Pass (₹49)
                </button>
              </div>
            </div>

            <div className="pricing-footer-security">
              <ShieldCheck size={16} />
              <span>100% Secure Payment via Razorpay Checkout • Instant Access</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

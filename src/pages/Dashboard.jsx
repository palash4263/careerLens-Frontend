// Dashboard.jsx — Refactored into modular components
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CtaFooter from "../components/CtaFooter";
import { getResumes } from "../services/resumeService";
import { getJobDescriptions } from "../services/jobDescriptionService";
import api from "../api/axiosConfig";
import { useGsapFloatingDock } from "../hooks/useGsap";
import "../assets/Dashboard.css";

// Modular Dashboard Subcomponents
import DashboardHero from "../components/dashboard/DashboardHero";
import ResumeOptimizationFlow from "../components/dashboard/ResumeOptimizationFlow";
import DashboardInsight from "../components/dashboard/DashboardInsight";
import DashboardStatsCircles from "../components/dashboard/DashboardStatsCircles";
import DashboardFeatures from "../components/dashboard/DashboardFeatures";
import DashboardWorkspace from "../components/dashboard/DashboardWorkspace";
import DashboardWidget from "../components/dashboard/DashboardWidget";

function Dashboard() {
  const [stats, setStats] = useState({ resumes: 0, jobs: 0, ats: 0, strength: 0 });
  const [time, setTime] = useState({ current: "", date: "" });
  const [user, setUser] = useState("John");
  const [scoreBar, setScoreBar] = useState(0);
  const [greeting, setGreeting] = useState("Good Morning");

  // ── GSAP floating dock entrance ──
  useGsapFloatingDock();

  // Initialize user & greeting
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : hour < 20 ? "Good Evening" : "Good Night"
    );
    const userName = localStorage.getItem("userName") || "John";
    setUser(userName);
    window.addEventListener("storage", (e) => e.key === "userName" && setUser(e.newValue || "John"));
  }, []);

  // Update clock every second
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime({
        current: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
        date: now.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }),
      });
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  // Fetch stats & animate
  useEffect(() => {
    (async () => {
      try {
        const [resumes, jobs] = await Promise.all([getResumes(), getJobDescriptions()]);
        const resumeCount = resumes?.length || 0;
        const jobCount = jobs?.length || 0;

        let totalScore = 0, scoreCount = 0;
        for (const res of resumes || []) {
          try {
            const hist = await api.get(`/ats/history/${res.id}`);
            if (hist.data?.length) {
              totalScore += hist.data.reduce((sum, item) => sum + item.score, 0);
              scoreCount += hist.data.length;
            }
          } catch (e) {
            console.error(`Failed to fetch history for resume ${res.id}`, e);
          }
        }

        const atsMatch = resumeCount === 0 ? 0 : scoreCount > 0 ? Math.round(totalScore / scoreCount) : 78;
        const strength = resumeCount === 0 ? 0 : scoreCount > 0 ? Math.min(atsMatch + 5, 95) : 85;

        // Animate numbers
        animateValue("resumes", resumeCount);
        animateValue("jobs", jobCount);
        animateValue("ats", atsMatch);
        animateValue("strength", strength);
        setTimeout(() => setScoreBar(24), 800);
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      }
    })();
  }, []);

  const animateValue = (key, target) => {
    const duration = 1600, steps = 60;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setStats((prev) => ({ ...prev, [key]: Math.round(ease * target) }));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
  };

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("revealed")),
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".scroll-reveal, .scroll-reveal-3d, .scroll-reveal-left, .scroll-reveal-right").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      className="db-page-wrapper"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="db-root">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`db-orb db-orb-${i}`} />
        ))}
        <div className="db-content">
          {/* Hero Section */}
          <DashboardHero user={user} greeting={greeting} stats={stats} />

          {/* Step-by-Step Flow */}
          <ResumeOptimizationFlow />

          {/* AI Insight Banner */}
          <DashboardInsight scoreBar={scoreBar} />

          {/* Stats Circles */}
          <DashboardStatsCircles stats={stats} />

          {/* Features Grid */}
          <DashboardFeatures />

          {/* Bottom Row: Workspace & Widget */}
          <div className="db-bottom">
            <DashboardWorkspace />
            <DashboardWidget time={time} />
          </div>
        </div>
      </div>
      <CtaFooter />
    </motion.div>
  );
}

export default Dashboard;
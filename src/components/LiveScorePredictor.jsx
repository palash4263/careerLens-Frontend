// src/components/ATS/LiveScorePredictor.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Sparkles,
  Target,
  Award,
  Gauge,
  Clock
} from "lucide-react";

const LiveScorePredictor = ({ resumeText, jobDescription }) => {
  const [score, setScore] = useState(0);
  const [previousScore, setPreviousScore] = useState(0);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [scoreFactors, setScoreFactors] = useState({
    keywordMatch: 0,
    formatScore: 0,
    contentQuality: 0,
    experienceMatch: 0,
    educationMatch: 0
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef(null);

  // Simulate real-time prediction
  useEffect(() => {
    if (resumeText && resumeText.length > 50) {
      setIsTyping(true);
      
      // Debounce the prediction
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      
      typingTimerRef.current = setTimeout(() => {
        performPrediction(resumeText, jobDescription);
        setIsTyping(false);
      }, 800);
    }
    
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [resumeText, jobDescription]);

  const performPrediction = (text, job) => {
    setIsPredicting(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const factors = analyzeFactors(text, job);
      const totalScore = calculateTotalScore(factors);
      
      setPreviousScore(score);
      setScore(totalScore);
      setScoreFactors(factors);
      setSuggestions(generateSuggestions(factors));
      
      // Add to history
      setPredictionHistory(prev => [...prev, {
        score: totalScore,
        timestamp: new Date().toLocaleTimeString(),
        factors: factors
      }].slice(-10));
      
      setIsPredicting(false);
    }, 300);
  };

  const analyzeFactors = (text, job) => {
    // Simulated analysis
    const keywordMatch = Math.min(Math.floor(Math.random() * 40) + 60, 95);
    const formatScore = Math.min(Math.floor(Math.random() * 30) + 65, 90);
    const contentQuality = Math.min(Math.floor(Math.random() * 35) + 55, 92);
    const experienceMatch = Math.min(Math.floor(Math.random() * 30) + 50, 88);
    const educationMatch = Math.min(Math.floor(Math.random() * 30) + 40, 85);
    
    return { keywordMatch, formatScore, contentQuality, experienceMatch, educationMatch };
  };

  const calculateTotalScore = (factors) => {
    const weights = {
      keywordMatch: 0.35,
      formatScore: 0.15,
      contentQuality: 0.25,
      experienceMatch: 0.15,
      educationMatch: 0.10
    };
    
    const total = Object.keys(weights).reduce((sum, key) => {
      return sum + factors[key] * weights[key];
    }, 0);
    
    return Math.round(total);
  };

  const generateSuggestions = (factors) => {
    const suggestions = [];
    
    if (factors.keywordMatch < 70) {
      suggestions.push("Add more keywords from the job description");
    }
    if (factors.formatScore < 70) {
      suggestions.push("Improve resume formatting with clear sections");
    }
    if (factors.contentQuality < 65) {
      suggestions.push("Add quantifiable achievements to your experience");
    }
    if (factors.experienceMatch < 60) {
      suggestions.push("Highlight relevant experience for this role");
    }
    if (factors.educationMatch < 55) {
      suggestions.push("Emphasize certifications and relevant courses");
    }
    
    return suggestions;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#f97316";
    return "#ef4444";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Work";
    return "Poor";
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <Award size={24} />;
    if (score >= 60) return <Target size={24} />;
    return <AlertCircle size={24} />;
  };

  const calculateChange = () => {
    if (previousScore === 0) return 0;
    return score - previousScore;
  };

  const change = calculateChange();

  return (
    <div className="live-score-predictor">
      {/* Header */}
      <div className="predictor-header">
        <div className="header-left">
          <span className="predictor-icon">🔮</span>
          <h3>Live ATS Score Predictor</h3>
          <span className="predictor-badge">
            <span className="badge-dot"></span>
            {isTyping ? 'Analyzing...' : 'Active'}
          </span>
        </div>
        <div className="header-right">
          <span className="predictor-info">
            <Clock size={14} />
            Real-time
          </span>
        </div>
      </div>

      {/* Main Score Display */}
      <div className="score-display-container">
        {/* Score Ring */}
        <div className="score-ring-wrapper">
          <div className="score-ring">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r="58"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="10"
              />
              <circle
                cx="70"
                cy="70"
                r="58"
                fill="none"
                stroke={getScoreColor(score)}
                strokeWidth="10"
                strokeDasharray="364.42"
                strokeDashoffset={364.42 - (score / 100) * 364.42}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                className="score-ring-progress"
              />
            </svg>
            <div className="score-ring-content">
              <motion.span 
                key={score}
                className="score-number"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 10 }}
              >
                {score}%
              </motion.span>
              <span className="score-label">{getScoreLabel(score)}</span>
            </div>
          </div>
          {isPredicting && (
            <div className="predicting-overlay">
              <span className="predicting-spinner"></span>
              <span>Analyzing...</span>
            </div>
          )}
        </div>

        {/* Score Metrics */}
        <div className="score-metrics">
          <div className="metric-change">
            <span className="metric-label">Change</span>
            <motion.span 
              className={`metric-value ${change >= 0 ? 'positive' : 'negative'}`}
              animate={{ scale: change !== 0 ? [1, 1.2, 1] : 1 }}
            >
              {change >= 0 ? '+' : ''}{change}%
            </motion.span>
          </div>
          <div className="metric-status">
            <span className="metric-label">Status</span>
            <span className="metric-value" style={{ color: getScoreColor(score) }}>
              {getScoreIcon(score)}
            </span>
          </div>
          <div className="metric-suggestions">
            <span className="metric-label">Issues Found</span>
            <span className="metric-value">{suggestions.length}</span>
          </div>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="factor-breakdown">
        <h4 className="factor-title">
          <Gauge size={16} />
          Score Factors
        </h4>
        <div className="factor-grid">
          {Object.entries(scoreFactors).map(([key, value]) => (
            <div key={key} className="factor-item">
              <div className="factor-header">
                <span className="factor-name">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="factor-value">{value}%</span>
              </div>
              <div className="factor-bar">
                <motion.div 
                  className="factor-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.8 }}
                  style={{ background: getScoreColor(value) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div 
            className="predictor-suggestions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h4 className="suggestions-title">
              <Sparkles size={16} />
              Quick Wins
            </h4>
            <div className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <motion.div 
                  key={index} 
                  className="suggestion-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="suggestion-icon">💡</span>
                  <span className="suggestion-text">{suggestion}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score History Mini */}
      {predictionHistory.length > 1 && (
        <div className="score-history-mini">
          <div className="history-header">
            <span className="history-title">📊 Recent Scores</span>
          </div>
          <div className="history-bars">
            {predictionHistory.slice(-6).map((item, index) => (
              <div key={index} className="history-bar-wrapper">
                <div 
                  className="history-bar"
                  style={{ height: `${item.score}%` }}
                >
                  <span className="history-value">{item.score}%</span>
                </div>
                <span className="history-label">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveScorePredictor;
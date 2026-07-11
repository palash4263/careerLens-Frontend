// InterviewPage.jsx - Playable AI Interview Simulator Dashboard
import React, { useState, useEffect, useRef } from 'react';
import { useScrollReveal } from "../hooks/useScrollReveal";
import "../assets/InterviewPage.css";

const questionsBank = {
  technical: [
    "Tell me about a project where you had to optimize performance. What was the bottleneck, and how did you solve it?",
    "How would you explain the differences between relational databases (like PostgreSQL) and NoSQL databases (like MongoDB) to a non-technical stakeholder?",
    "Explain how React's virtual DOM reconciliation works, and when you would use useMemo or useCallback."
  ],
  behavioral: [
    "Describe a time you had a conflict with a team member. How did you resolve it?",
    "Tell me about a time you failed to meet a deadline. What did you do, and what did you learn?",
    "Can you share an experience where you had to lead a project with ambiguous requirements?"
  ],
  architectural: [
    "How would you design a real-time notification service like WhatsApp's delivery tick for 10 million concurrent users?",
    "What are the major trade-offs of choosing a Microservices architecture over a Monolithic architecture?",
    "Explain the concept of Horizontal Scaling vs Vertical Scaling, and how caching layers (like Redis) help database load."
  ],
  hr: [
    "Why do you want to join our company, and what unique value do you bring to the team?",
    "Tell me about your career aspirations. Where do you see yourself in five years?",
    "How do you handle high-pressure environments, and what motivates you to do your best work?"
  ],
  coding: [
    "Write a function in JavaScript to check if a string is a palindrome. Walk through your logic.",
    "Explain how you would reverse a linked list in-place. What is the time and space complexity?",
    "How would you find the first non-repeating character in a string in O(n) time complexity?"
  ]
};

const InterviewPage = () => {
  const [selectedType, setSelectedType] = useState('technical');
  const [isSimulating, setIsSimulating] = useState(false);
  const [step, setStep] = useState(0); // 0 = idle, 1 = Q1, 2 = Q2, 3 = Q3, 4 = complete
  const [chatHistory, setChatHistory] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [answersSaved, setAnswersSaved] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionResult, setSessionResult] = useState(null);
  const [toast, setToast] = useState(null);
  
  const chatEndRef = useRef(null);

  const [recentSessions, setRecentSessions] = useState([
    { role: 'Senior Frontend Developer Assessment', score: 82, duration: '32 min', area: 'System Design', date: '02 Jul 2026' },
    { role: 'Backend Developer Assessment', score: 71, duration: '28 min', area: 'Communication', date: '30 Jun 2026' },
    { role: 'Full Stack Developer Assessment', score: 88, duration: '35 min', area: 'Behavioral', date: '28 Jun 2026' },
  ]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const interviewTypes = [
    { id: 'technical', title: 'Technical Runtime', icon: '💻', desc: 'Data structures, algorithms, and system engineering deep-dives.', color: '#7C3AED' },
    { id: 'behavioral', title: 'Behavioral Radar', icon: '🧠', desc: 'STAR methodology evaluation, leadership, and conflict resolution.', color: '#3B82F6' },
    { id: 'architectural', title: 'Architectural Core', icon: '🌐', desc: 'System design, scalability, and architecture trade-off analysis.', color: '#F59E0B' },
    { id: 'hr', title: 'HR Whisperer', icon: '💬', desc: 'Culture fit, motivation, and career aspiration alignment.', color: '#10B981' },
    { id: 'coding', title: 'Coding Challenge', icon: '⚡', desc: 'Live coding, debugging, and problem-solving sessions.', color: '#EC4899' },
  ];

  // Auto-scroll chat terminal to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isThinking]);

  useScrollReveal([isSimulating, selectedType]);

  // Calculate dynamic stats from sessions
  const totalSessions = recentSessions.length;
  const avgScore = Math.round(recentSessions.reduce((acc, s) => acc + s.score, 0) / (totalSessions || 1));
  const totalQuestionsPracticed = totalSessions * 3;
  const confidenceMetric = Math.round(Math.min(98, 70 + (totalSessions * 4)));

  const performanceMetrics = [
    { label: 'Technical', value: Math.min(95, avgScore + 3), color: '#7C3AED' },
    { label: 'Communication', value: Math.min(95, avgScore - 2), color: '#3B82F6' },
    { label: 'Problem Solving', value: Math.min(95, avgScore + 1), color: '#F59E0B' },
    { label: 'Confidence', value: confidenceMetric, color: '#10B981' },
  ];

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setStep(1);
    setAnswersSaved([]);
    setSessionResult(null);
    const firstQuestion = questionsBank[selectedType][0];
    setChatHistory([{ sender: 'ai', text: firstQuestion, time: '00:01' }]);
    showToast("AI Interrogator engine successfully initialized!", "success");
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
    setStep(0);
    setChatHistory([]);
    setAnswersSaved([]);
    setSessionResult(null);
    showToast("Simulation runtime terminated.", "info");
  };

  const handleUserSubmit = () => {
    if (!userAnswer.trim()) return;
    
    const userMsg = userAnswer.trim();
    const updatedHistory = [...chatHistory, { sender: 'user', text: userMsg, time: '00:02' }];
    setChatHistory(updatedHistory);
    setAnswersSaved([...answersSaved, userMsg]);
    setUserAnswer('');
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);
      const nextStep = step + 1;
      
      if (nextStep <= 3) {
        setStep(nextStep);
        const nextQuestion = questionsBank[selectedType][nextStep - 1];
        setChatHistory(prev => [...prev, { sender: 'ai', text: nextQuestion, time: '00:03' }]);
      } else {
        // Complete state!
        setStep(4);
        
        // Evaluate user answers to formulate a score
        const allText = [...answersSaved, userMsg].join(' ');
        const words = allText.split(/\s+/).filter(Boolean);
        const totalWords = words.length;
        
        // Keywords scan
        const buzzwords = ["optimized", "scale", "performance", "caching", "star", "conflict", "experience", "bottleneck", "redis", "designed", "react", "lead", "indexed", "postgres", "mongodb"];
        let matchedCount = 0;
        buzzwords.forEach(word => {
          if (allText.toLowerCase().includes(word)) matchedCount++;
        });

        // Dynamic score calculation
        const baseScore = 65;
        const lengthBonus = Math.min(20, Math.floor(totalWords / 4));
        const keywordBonus = Math.min(15, matchedCount * 3);
        const finalScore = Math.min(98, baseScore + lengthBonus + keywordBonus);

        const targetTypeInfo = interviewTypes.find(t => t.id === selectedType);
        
        const result = {
          role: `${targetTypeInfo.title} Assessment`,
          score: finalScore,
          duration: `${3 + Math.floor(Math.random() * 4)} min`,
          area: selectedType === 'technical' || selectedType === 'architectural' ? 'System Scaling' : selectedType === 'coding' ? 'Time Complexity' : 'STAR Methodology',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };
        
        setSessionResult(result);
        showToast("AI Evaluation complete! Check score card.", "success");
      }
    }, 1800);
  };

  const handleSaveSession = () => {
    if (!sessionResult) return;
    setRecentSessions([sessionResult, ...recentSessions]);
    setIsSimulating(false);
    setStep(0);
    setChatHistory([]);
    setAnswersSaved([]);
    setSessionResult(null);
    showToast("Session report saved to registry!", "success");
  };

  const handleRestart = () => {
    handleStartSimulation();
  };

  return (
    <div className="interview-wrapper">
      <div className="interview-page-content">
        {/* Header */}
        <div className="interview-header-premium">
          <div className="header-badge-premium">
            <span className="badge-dot"></span>
            <span className="badge-icon">◆</span>
            AI NEXUS CONSOLE
          </div>
          <h1 className="interview-title">AI Interview Simulator</h1>
          <p className="interview-subtitle">
            Deploy custom real-time adaptive audio or text conversational environments 
            to iron out critical communication blockages.
          </p>
        </div>

        {/* Main Grid */}
        <div className="interview-main-grid">
          {/* Left Panel - Config */}
          <div className="config-panel-premium scroll-reveal-left">
            <div className="config-header">
              <h3>⚙️ Simulation Parameters</h3>
              <p className="config-sub">Select your target assessment vertical:</p>
            </div>

            <div className="type-stack-premium">
              {interviewTypes.map((type) => (
                <div 
                  key={type.id}
                  className={`type-card-premium ${selectedType === type.id ? 'active-type' : ''}`}
                  onClick={() => !isSimulating && setSelectedType(type.id)}
                  style={{ cursor: isSimulating ? 'not-allowed' : 'pointer' }}
                >
                  <div className="type-card-left">
                    <span className="type-icon-premium" style={{ background: `${type.color}20`, color: type.color }}>
                      {type.icon}
                    </span>
                    <div className="type-details-premium">
                      <h4>{type.title}</h4>
                      <p>{type.desc}</p>
                    </div>
                  </div>
                  {selectedType === type.id && (
                    <span className="type-check" style={{ color: type.color }}>✓</span>
                  )}
                </div>
              ))}
            </div>

            <button 
              className={`simulate-btn-premium ${isSimulating ? 'stop-state' : 'start-state'}`}
              onClick={isSimulating ? handleStopSimulation : handleStartSimulation}
            >
              <span className="btn-icon">{isSimulating ? '⏹' : '▶'}</span>
              {isSimulating ? 'Terminate Simulation Runtime' : 'Initialize AI Interrogator Engine'}
            </button>

            {/* Performance Overview */}
            <div className="performance-overview">
              <h4>📊 Dashboard Performance Averages</h4>
              <div className="performance-grid">
                {performanceMetrics.map((metric, idx) => (
                  <div key={idx} className="performance-item">
                    <div className="performance-circle">
                      <svg viewBox="0 0 60 60">
                        <circle className="perf-bg" cx="30" cy="30" r="26" />
                        <circle 
                          className="perf-progress" 
                          cx="30" 
                          cy="30" 
                          r="26"
                          style={{ 
                            stroke: metric.color,
                            strokeDasharray: 163.36, 
                            strokeDashoffset: 163.36 * (1 - metric.value / 100) 
                          }}
                        />
                      </svg>
                      <span className="perf-value">{metric.value}%</span>
                    </div>
                    <span className="perf-label">{metric.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Terminal */}
          <div className="terminal-panel-premium scroll-reveal-right">
            <div className="terminal-topbar-premium">
              <div className="terminal-dots-premium">
                <span className="dot red" onClick={handleStopSimulation}></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <span className="terminal-title-premium">
                {isSimulating ? `LIVE_STREAM//${selectedType.toUpperCase()}_ENV` : 'STANDBY//ENGINE_IDLE'}
              </span>
              <span className="terminal-time">
                {step > 0 && step <= 3 ? `Q${step} / 3` : step === 4 ? 'COMPLETE' : '00:00'}
              </span>
            </div>

            <div className="terminal-body-premium">
              {step === 0 && (
                <div className="idle-terminal-premium">
                  <div className="idle-icon">🤖</div>
                  <h4>Ready to initialize.</h4>
                  <p>The AI engine will custom-generate questions derived specifically from your uploaded resumes and current tracked job targets.</p>
                  <button 
                    onClick={handleStartSimulation} 
                    className="simulate-btn-premium start-state" 
                    style={{ marginTop: '1.5rem', width: 'auto', padding: '10px 24px', fontSize: '13px' }}
                  >
                    ⚡ Initialize AI Interrogator
                  </button>
                </div>
              )}

              {step > 0 && step <= 3 && (
                <div className="active-terminal-wrapper">
                  <div className="active-chat-scroller">
                    {chatHistory.map((msg, i) => (
                      <div 
                        key={i} 
                        className={msg.sender === 'ai' ? 'ai-message-premium' : 'user-message-premium'}
                      >
                        <div className={`speaker-tag-premium ${msg.sender === 'ai' ? 'system' : 'user'}`}>
                          <span className="speaker-icon">{msg.sender === 'ai' ? '🤖' : '👤'}</span>
                          {msg.sender === 'ai' ? 'AI Interviewer' : 'You'}
                        </div>
                        <p className={msg.sender === 'ai' ? 'glowing-text-premium' : ''}>
                          {msg.text}
                        </p>
                        <span className="message-time">{msg.time}</span>
                      </div>
                    ))}
                    
                    {isThinking && (
                      <div className="ai-thinking-premium">
                        <div className="thinking-dots">
                          <span></span><span></span><span></span>
                        </div>
                        <span className="thinking-label">AI is evaluating response...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="terminal-input-wrapper">
                    <input 
                      type="text"
                      placeholder="Type your structured reply here..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUserSubmit(); }}
                      className="terminal-text-input"
                      disabled={isThinking}
                    />
                    <button 
                      onClick={handleUserSubmit} 
                      className="terminal-submit-btn"
                      disabled={isThinking || !userAnswer.trim()}
                    >
                      🚀 Send Response
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && sessionResult && (
                <div className="simulation-complete-card">
                  <span>🏆</span>
                  <h3>Simulation Complete</h3>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0, textTransform: 'uppercase', fontWeight: 800 }}>Evaluation Rating</p>
                  
                  <div className="sim-overall-score">
                    <div className="sim-score-ring">
                      <span className="sim-score-val">{sessionResult.score}%</span>
                    </div>
                  </div>

                  <p className="sim-feedback">
                    "Solid technical explanation depth. You successfully utilized key domain keywords. Work on structuring your response using the STAR format for behavioral questions."
                  </p>

                  <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>VERTICAL</span>
                      <span style={{ fontSize: '12px', color: '#fff', fontWeight: '700' }}>{selectedType.toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>DURATION</span>
                      <span style={{ fontSize: '12px', color: '#fff', fontWeight: '700' }}>{sessionResult.duration}</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>FOCUS</span>
                      <span style={{ fontSize: '12px', color: '#fff', fontWeight: '700' }}>{sessionResult.area}</span>
                    </div>
                  </div>

                  <div className="sim-action-grp">
                    <button onClick={handleSaveSession} className="sim-action-btn save">
                      💾 Save Session Report
                    </button>
                    <button onClick={handleRestart} className="sim-action-btn restart">
                      🔄 Retry Simulation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - Stats & Sessions */}
        <div className="interview-bottom-grid">
          {/* Stats Cards */}
          <div className="stats-premium-grid">
            <div className="stat-premium-card card-glow-purple">
              <div className="stat-premium-icon">📊</div>
              <div className="stat-premium-info">
                <span className="stat-premium-value">{totalSessions}</span>
                <span className="stat-premium-label">Sessions Taken</span>
                <span className="stat-premium-trend">↑ Active</span>
              </div>
            </div>

            <div className="stat-premium-card card-glow-blue">
              <div className="stat-premium-icon">🎯</div>
              <div className="stat-premium-info">
                <span className="stat-premium-value">{avgScore}%</span>
                <span className="stat-premium-label">Avg. Score</span>
                <span className="stat-premium-trend">↑ Calibrated</span>
              </div>
            </div>

            <div className="stat-premium-card card-glow-green">
              <div className="stat-premium-icon">❓</div>
              <div className="stat-premium-info">
                <span className="stat-premium-value">{totalQuestionsPracticed}</span>
                <span className="stat-premium-label">Questions Practiced</span>
                <span className="stat-premium-trend">↑ 3 per run</span>
              </div>
            </div>

            <div className="stat-premium-card card-glow-orange">
              <div className="stat-premium-icon">💪</div>
              <div className="stat-premium-info">
                <span className="stat-premium-value">{confidenceMetric}%</span>
                <span className="stat-premium-label">Confidence</span>
                <span className="stat-premium-trend">↑ Building</span>
              </div>
            </div>
          </div>

          {/* Live Transcript & Tips */}
          <div className="transcript-tips-premium">
            <div className="transcript-premium" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4>🎙️ Active Simulation Transcript</h4>
              <div className="transcript-content" style={{ flex: 1, minHeight: '80px' }}>
                {answersSaved.length > 0 ? (
                  answersSaved.map((ans, i) => (
                    <p key={i} className="transcript-text" style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', borderLeft: '2px solid rgba(124, 59, 237, 0.3)', paddingLeft: '8px' }}>
                      "{ans}"
                    </p>
                  ))
                ) : (
                  <p className="transcript-text highlight" style={{ fontStyle: 'italic', fontSize: '11px', color: '#64748b' }}>
                    Transcript will load in real-time as you type and submit replies in the console.
                  </p>
                )}
              </div>
              <div className="transcript-tips" style={{ marginTop: 'auto' }}>
                <span className="tips-icon">💡</span>
                <span className="tips-text">Speak/Type clearly and provide specific examples to showcase your business impact.</span>
              </div>
            </div>

            <div className="settings-premium" style={{ background: 'rgba(18, 18, 26, 0.65)', padding: '1.25rem' }}>
              <div className="settings-header">
                <h4>🎯 Objective Guidance</h4>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 1rem 0' }}>
                Choose a vertical on the left. Hit "Launch Simulator", reply to the questions, and click "Save Session" to register your report.
              </p>
              <div className="settings-actions" style={{ display: 'flex', gap: '10px' }}>
                <button className="settings-btn primary" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} style={{ flex: 1 }}>
                  <span>📋</span> View Recent Registry
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions Table */}
        <section className="sessions-premium">
          <div className="sessions-header">
            <h3>📋 Recent Sessions</h3>
            <span className="sessions-count">{recentSessions.length} sessions</span>
          </div>
          <div className="sessions-table-wrapper">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Score</th>
                  <th>Duration</th>
                  <th>Weakest Area</th>
                  <th>Date</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session, idx) => (
                  <tr key={idx}>
                    <td className="session-role">{session.role}</td>
                    <td className="session-score">
                      <span className={`score-badge ${session.score >= 80 ? 'high' : session.score >= 70 ? 'medium' : 'low'}`}>
                        {session.score}%
                      </span>
                    </td>
                    <td>{session.duration}</td>
                    <td>
                      <span className="session-area">
                        <span className="area-dot" style={{ background: 
                          session.area.includes('System') ? '#7C3AED' : 
                          session.area.includes('Time') ? '#EC4899' : '#3B82F6' 
                        }}></span>
                        {session.area}
                      </span>
                    </td>
                    <td>{session.date}</td>
                    <td>
                      <button className="report-btn" onClick={() => showToast(`Report details for ${session.role} loaded! Score: ${session.score}%`, "success")}>📊 View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className={`toast-premium ${toast.type}`}>
          <span className="toast-icon">{toast.type === "success" ? "✓" : "ℹ"}</span>
          <p className="toast-message">{toast.message}</p>
        </div>
      )}
    </div>
  );
};

export default InterviewPage;
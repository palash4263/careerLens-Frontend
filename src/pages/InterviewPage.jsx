// InterviewPage.jsx - Ultra Premium Design (No Navbar)
import React, { useState } from 'react';
import "../assets/InterviewPage.css";

const InterviewPage = () => {
  const [selectedType, setSelectedType] = useState('technical');
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState('console');

  const interviewTypes = [
    { id: 'technical', title: 'Technical Runtime', icon: '💻', desc: 'Data structures, algorithms, and system engineering deep-dives.', color: '#7C3AED' },
    { id: 'behavioral', title: 'Behavioral Radar', icon: '🧠', desc: 'STAR methodology evaluation, leadership, and conflict resolution.', color: '#3B82F6' },
    { id: 'architectural', title: 'Architectural Core', icon: '🌐', desc: 'System design, scalability, and architecture trade-off analysis.', color: '#F59E0B' },
    { id: 'hr', title: 'HR Whisperer', icon: '💬', desc: 'Culture fit, motivation, and career aspiration alignment.', color: '#10B981' },
    { id: 'coding', title: 'Coding Challenge', icon: '⚡', desc: 'Live coding, debugging, and problem-solving sessions.', color: '#EC4899' },
  ];

  const performanceMetrics = [
    { label: 'Technical', value: 82, color: '#7C3AED' },
    { label: 'Communication', value: 76, color: '#3B82F6' },
    { label: 'Problem Solving', value: 81, color: '#F59E0B' },
    { label: 'Confidence', value: 86, color: '#10B981' },
  ];

  const recentSessions = [
    { role: 'Senior Frontend Developer', score: 82, duration: '32 min', area: 'System Design', date: '02 Jul 2026' },
    { role: 'Backend Developer', score: 71, duration: '28 min', area: 'Communication', date: '30 Jun 2026' },
    { role: 'Full Stack Developer', score: 88, duration: '35 min', area: 'Behavioral', date: '28 Jun 2026' },
  ];

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
          <div className="config-panel-premium">
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
                    <span className="type-check">✓</span>
                  )}
                </div>
              ))}
            </div>

            <button 
              className={`simulate-btn-premium ${isSimulating ? 'stop-state' : 'start-state'}`}
              onClick={() => setIsSimulating(!isSimulating)}
            >
              <span className="btn-icon">{isSimulating ? '⏹' : '▶'}</span>
              {isSimulating ? 'Terminate Simulation Runtime' : 'Initialize AI Interrogator Engine'}
            </button>

            {/* Performance Overview */}
            <div className="performance-overview">
              <h4>📊 Performance Overview</h4>
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
          <div className="terminal-panel-premium">
            <div className="terminal-topbar-premium">
              <div className="terminal-dots-premium">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <span className="terminal-title-premium">
                {isSimulating ? `LIVE_STREAM//${selectedType.toUpperCase()}_ENV` : 'STANDBY//ENGINE_IDLE'}
              </span>
              <span className="terminal-time">00:09</span>
            </div>

            <div className="terminal-body-premium">
              {!isSimulating ? (
                <div className="idle-terminal-premium">
                  <div className="idle-icon">🤖</div>
                  <h4>Ready to initialize.</h4>
                  <p>The AI engine will custom-generate questions derived specifically from your uploaded resumes and current tracked job targets.</p>
                </div>
              ) : (
                <div className="active-terminal-premium">
                  <div className="ai-message-premium">
                    <div className="speaker-tag-premium system">
                      <span className="speaker-icon">🤖</span>
                      AI Interviewer
                    </div>
                    <p className="glowing-text-premium">
                      "Tell me about a project where you had to optimize performance. 
                      What was the bottleneck, and how did you solve it?"
                    </p>
                    <span className="message-time">00:09</span>
                  </div>

                  <div className="user-message-premium">
                    <div className="speaker-tag-premium user">
                      <span className="speaker-icon">👤</span>
                      You
                    </div>
                    <p>
                      In my previous role, our e-commerce platform was facing slow load times 
                      during peak traffic. I identified database queries as the bottleneck and 
                      optimized them by adding indexes and implementing caching...
                    </p>
                    <span className="message-time">00:24</span>
                  </div>

                  <div className="ai-thinking-premium">
                    <div className="thinking-dots">
                      <span></span><span></span><span></span>
                    </div>
                    <span className="thinking-label">AI is thinking...</span>
                  </div>

                  <div className="recording-indicator-premium">
                    <div className="recording-wave">
                      <span className="bar"></span>
                      <span className="bar delay-1"></span>
                      <span className="bar delay-2"></span>
                      <span className="bar delay-3"></span>
                      <span className="bar delay-4"></span>
                    </div>
                    <span className="recording-text">🎙️ Streaming Audio Vector / Mic Active...</span>
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
                <span className="stat-premium-value">12</span>
                <span className="stat-premium-label">Sessions Taken</span>
                <span className="stat-premium-trend">↑ 3 this week</span>
              </div>
            </div>

            <div className="stat-premium-card card-glow-blue">
              <div className="stat-premium-icon">🎯</div>
              <div className="stat-premium-info">
                <span className="stat-premium-value">78%</span>
                <span className="stat-premium-label">Avg. Score</span>
                <span className="stat-premium-trend">↑ 8% this week</span>
              </div>
            </div>

            <div className="stat-premium-card card-glow-green">
              <div className="stat-premium-icon">❓</div>
              <div className="stat-premium-info">
                <span className="stat-premium-value">156</span>
                <span className="stat-premium-label">Questions Practiced</span>
                <span className="stat-premium-trend">↑ 24 this week</span>
              </div>
            </div>

            <div className="stat-premium-card card-glow-orange">
              <div className="stat-premium-icon">💪</div>
              <div className="stat-premium-info">
                <span className="stat-premium-value">86%</span>
                <span className="stat-premium-label">Confidence</span>
                <span className="stat-premium-trend">↑ 6% this week</span>
              </div>
            </div>
          </div>

          {/* Live Transcript & Tips */}
          <div className="transcript-tips-premium">
            <div className="transcript-premium">
              <h4>📝 Live Transcript</h4>
              <div className="transcript-content">
                <p className="transcript-text">
                  In my previous role, our e-commerce platform was facing slow load times during peak traffic...
                </p>
                <p className="transcript-text highlight">
                  I identified database queries as the bottleneck and optimized them by adding indexes...
                </p>
              </div>
              <div className="voice-level">
                <span className="voice-label">Voice Level</span>
                <div className={`voice-bars ${isSimulating ? 'is-simulating' : ''}`}>
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className={`voice-bar ${i < 15 ? 'active' : ''}`}></div>
                  ))}
                </div>
              </div>
              <div className="transcript-tips">
                <span className="tips-icon">💡</span>
                <span className="tips-text">Speak clearly and provide specific examples to showcase your impact.</span>
              </div>
            </div>

            <div className="settings-premium">
              <div className="settings-header">
                <h4>⚙️ Settings</h4>
              </div>
              <div className="settings-actions">
                <button className="settings-btn primary">
                  <span>📋</span> View All Sessions
                </button>
                <button className="settings-btn secondary">
                  <span>📊</span> Report
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
                          session.area === 'System Design' ? '#7C3AED' : 
                          session.area === 'Communication' ? '#3B82F6' : '#F59E0B' 
                        }}></span>
                        {session.area}
                      </span>
                    </td>
                    <td>{session.date}</td>
                    <td>
                      <button className="report-btn">📊 View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InterviewPage;
import { useState, useEffect } from 'react';

interface LandingPhaseProps {
  onGoLogin: (mode?: 'student' | 'admin' | 'register') => void;
  onGoApp: () => void;
}

export default function LandingPhase({ onGoLogin, onGoApp }: LandingPhaseProps) {
  // Simulator State
  const [simTab, setSimTab] = useState<'overview' | 'academic' | 'tasks' | 'focus' | 'ai'>('overview');
  const [simTasks, setSimTasks] = useState([
    { id: 1, text: 'Review STQA Module 3 (Automated Testing)', done: false },
    { id: 2, text: 'Submit Artificial Intelligence Lab 4', done: true },
    { id: 3, text: 'Check October exam venue allocation (Hall 4A)', done: false },
    { id: 4, text: 'Prepare Cyber Security presentation slides', done: false },
  ]);
  const [simNewTask, setSimNewTask] = useState('');
  const [simTimerSeconds, setSimTimerSeconds] = useState(1500);
  const [bunkPresent, setBunkPresent] = useState(20);
  const [bunkTotal, setBunkTotal] = useState(24);
  const [simTimerRunning, setSimTimerRunning] = useState(false);

  // Simulator Pomodoro Timer
  useEffect(() => {
    let interval: any = null;
    if (simTimerRunning && simTimerSeconds > 0) {
      interval = setInterval(() => {
        setSimTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (simTimerSeconds === 0) {
      setSimTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [simTimerRunning, simTimerSeconds]);

  const toggleSimTask = (id: number) => {
    setSimTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const addSimTask = () => {
    if (!simNewTask.trim()) return;
    setSimTasks((prev) => [
      ...prev,
      { id: Date.now(), text: simNewTask.trim(), done: false },
    ]);
    setSimNewTask('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="phase active" id="phase-landing">
      {/* Landing Navigation */}
      <nav className="lp-nav landing-nav" aria-label="Main navigation">
        <div className="lp-wrap">
          <a className="lp-brand" href="#phase-landing" aria-label="Integrum home">
            <span className="lp-mark" aria-hidden="true">i</span>Integrum
          </a>
          <div className="lp-links">
            <a href="#features">The workspace</a>
            <a href="#how">How it works</a>
            <a href="#roadmap">Platform roadmap</a>
            <a href="#faq">FAQ</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="lp-button secondary"
              onClick={() => onGoLogin('student')}
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              Sign In
            </button>
            <button
              className="lp-button secondary"
              onClick={() => onGoLogin('register')}
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              Get Started
            </button>
            <button className="lp-button" onClick={() => onGoLogin('student')}>
              Launch Workspace <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="lp-hero hero">
          <div className="lp-wrap">
            <div className="lp-hero-grid">
              <div>
                <div className="lp-pill">Student success, thoughtfully connected</div>
                <h1>
                  Unified Student Success Platform<br />
                  Less scattered. More focused.<br />
                  <em>Your next chapter.</em>
                </h1>
                <p className="lp-lead">
                  Bring your university subjects, examination timetable, attendance health, and everyday tasks into one calm workspace. Make room for the work that moves you forward.
                </p>
                <div className="lp-actions">
                  <button className="lp-button" onClick={() => onGoLogin('student')}>
                    Launch your workspace <span aria-hidden="true">→</span>
                  </button>
                  <a className="lp-button secondary" href="#features">Take a closer look</a>
                </div>
                <p className="lp-note">Built for modern university students · Open Source & Privacy-First</p>
              </div>

              {/* Live Interactive Workspace Window */}
              <div>
                <div className="lp-window" aria-label="Interactive student workspace window">
                  <div className="lp-window-bar">
                    <div className="lp-window-dots">
                      <i style={{ background: '#EF4444' }}></i>
                      <i style={{ background: '#F59E0B' }}></i>
                      <i style={{ background: '#10B981' }}></i>
                    </div>
                    <span>INTEGRUM / STUDENT WORKSPACE</span>
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={onGoApp}
                      style={{ fontSize: '10px', padding: '3px 8px' }}
                    >
                      Open Full Workspace ↗
                    </button>
                  </div>

                  <div className="lp-workspace">
                    {/* Mini Nav */}
                    <aside className="lp-mini-nav">
                      <strong>i / integrum</strong>
                      <div
                        className={`sim-nav-btn ${simTab === 'overview' ? 'active' : ''}`}
                        id="simNavOverview"
                        onClick={() => setSimTab('overview')}
                      >
                        ◫ Overview
                      </div>
                      <div
                        className={`sim-nav-btn ${simTab === 'academic' ? 'active' : ''}`}
                        id="simNavAcademic"
                        onClick={() => setSimTab('academic')}
                      >
                        ▤ Academic
                      </div>
                      <div
                        className={`sim-nav-btn ${simTab === 'tasks' ? 'active' : ''}`}
                        id="simNavTasks"
                        onClick={() => setSimTab('tasks')}
                      >
                        ✓ Tasks
                      </div>
                      <div
                        className={`sim-nav-btn ${simTab === 'focus' ? 'active' : ''}`}
                        id="simNavFocus"
                        onClick={() => setSimTab('focus')}
                      >
                        ◷ Focus
                      </div>
                      <div
                        className={`sim-nav-btn ${simTab === 'ai' ? 'active' : ''}`}
                        id="simNavAI"
                        onClick={() => setSimTab('ai')}
                      >
                        🤖 AI Advisor
                      </div>
                    </aside>

                    {/* Mini Content Area */}
                    <div className="lp-mini-main">
                      {/* Overview Tab */}
                      {simTab === 'overview' && (
                        <div className="sim-pane active" id="simPaneOverview">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div>
                              <strong style={{ fontSize: '13px', color: 'var(--text-1)' }}>Good morning, Alex</strong>
                              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-3)' }}>Semester 5 (Fall 2026) · CS & Engineering</p>
                            </div>
                            <span className="badge badge-success" style={{ fontSize: '10px', padding: '3px 8px' }}>Active Sprint</span>
                          </div>

                          <div className="lp-mini-kpis">
                            <div className="lp-kpi-card">
                              <small>SGPA Standing</small>
                              <strong>8.92</strong>
                              <span style={{ color: 'var(--success)', fontSize: '10px' }}>Top 5%</span>
                            </div>
                            <div className="lp-kpi-card">
                              <small>Attendance</small>
                              <strong>85.2%</strong>
                              <span style={{ color: 'var(--success)', fontSize: '10px' }}>+6 Safe Bunks</span>
                            </div>
                            <div className="lp-kpi-card">
                              <small>Focus Sprint</small>
                              <strong id="simMiniFocusDisplay">{formatTime(simTimerSeconds)}</strong>
                              <span style={{ color: 'var(--info)', fontSize: '10px' }}>18.5h / 25h</span>
                            </div>
                          </div>

                          <div className="lp-panel-box" style={{ marginTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <strong style={{ fontSize: '11px', color: 'var(--text-2)' }}>TODAY'S PRIORITY TASKS</strong>
                              <small style={{ fontSize: '10px', color: 'var(--text-3)' }}>Click to mark done</small>
                            </div>
                            {simTasks.slice(0, 3).map((task) => (
                              <div
                                key={task.id}
                                className="sim-task-row"
                                onClick={() => toggleSimTask(task.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '6px 8px',
                                  borderBottom: '1px solid var(--border)',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                }}
                              >
                                <span className={`tcheck ${task.done ? 'done' : ''}`}>
                                  {task.done ? '✓' : ''}
                                </span>
                                <span className={task.done ? 'done-txt' : ''} style={{ flex: 1 }}>
                                  {task.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Academic Tab */}
                      {simTab === 'academic' && (
                        <div className="sim-pane active" id="simPaneAcademic">
                          <strong style={{ fontSize: '12px' }}>Semester 5 Enrolled Courses</strong>
                          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="sim-course-row">
                              <div>
                                <b>1105111 · Artificial Intelligence</b>
                                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Theory Exam: Oct 15 · Hall 4A</div>
                              </div>
                              <span className="badge badge-success" style={{ fontSize: '10px' }}>91.7% Attend</span>
                            </div>
                            <div className="sim-course-row">
                              <div>
                                <b>1105112 · Cyber & Info Security</b>
                                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Theory Exam: Oct 17 · Hall 3B</div>
                              </div>
                              <span className="badge badge-success" style={{ fontSize: '10px' }}>83.3% Attend</span>
                            </div>
                            <div className="sim-course-row">
                              <div>
                                <b>1105116 · Software Testing & QA</b>
                                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Theory Exam: Oct 22 · Hall 2C</div>
                              </div>
                              <span className="badge badge-warning" style={{ fontSize: '10px' }}>72.7% Recovery Needed</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tasks Tab */}
                      {simTab === 'tasks' && (
                        <div className="sim-pane active" id="simPaneTasks">
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                            <input
                              className="form-input"
                              id="simQuickTaskInput"
                              placeholder="Add quick study item..."
                              value={simNewTask}
                              onChange={(e) => setSimNewTask(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addSimTask()}
                              style={{ fontSize: '11px', padding: '5px 8px' }}
                            />
                            <button className="btn btn-sm btn-primary" onClick={addSimTask} style={{ fontSize: '11px' }}>
                              +
                            </button>
                          </div>
                          <div id="simTaskListContainer">
                            {simTasks.map((t) => (
                              <div
                                key={t.id}
                                className="sim-task-row"
                                onClick={() => toggleSimTask(t.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '5px 8px',
                                  borderBottom: '1px solid var(--border)',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                }}
                              >
                                <span className={`tcheck ${t.done ? 'done' : ''}`}>
                                  {t.done ? '✓' : ''}
                                </span>
                                <span className={t.done ? 'done-txt' : ''} style={{ flex: 1 }}>
                                  {t.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Focus Tab */}
                      {simTab === 'focus' && (
                        <div className="sim-pane active" id="simPaneFocus" style={{ textAlign: 'center', padding: '16px 8px' }}>
                          <small style={{ fontSize: '11px', color: 'var(--text-3)' }}>Pomodoro Sprint · 25 Minutes</small>
                          <div id="simTimerDisplay" style={{ fontSize: '38px', fontWeight: 900, color: 'var(--primary)', margin: '12px 0' }}>
                            {formatTime(simTimerSeconds)}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              className="btn btn-sm btn-primary"
                              id="simTimerBtn"
                              onClick={() => setSimTimerRunning(!simTimerRunning)}
                            >
                              {simTimerRunning ? '⏸ Pause' : '▶ Start Focus'}
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setSimTimerRunning(false);
                                setSimTimerSeconds(1500);
                              }}
                            >
                              ↺ Reset
                            </button>
                          </div>
                        </div>
                      )}

                      {/* AI Advisor Tab */}
                      {simTab === 'ai' && (
                        <div className="sim-pane active" id="simPaneAI" style={{ fontSize: '11px' }}>
                          <div style={{ background: 'var(--bg-3)', padding: '8px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                            <b>🤖 Integrum Advisor:</b> "Oct 15 AI Theory paper is 3 days away. Focus on Neural Architecture search & Heuristic Search algorithms."
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button className="btn btn-xs btn-outline" onClick={onGoApp} style={{ textAlign: 'left', fontSize: '10px' }}>
                              ⚡ Get 3-day revision plan for AI Exam
                            </button>
                            <button className="btn btn-xs btn-outline" onClick={onGoApp} style={{ textAlign: 'left', fontSize: '10px' }}>
                              📍 Find exam room & seating allocation
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Sections */}
        <section className="lp-section" id="features">
          <div className="lp-wrap">
            <div className="lp-section-hdr">
              <span className="lp-pill">Core Features</span>
              <h2>One coherent system for every academic priority</h2>
              <p>Everything you need to excel in university without the scattered tabs.</p>
            </div>

            <div className="lp-features-grid">
              <div className="lp-feat-card">
                <div className="lp-feat-icon">📚</div>
                <h3>Academic & Exam Timetable</h3>
                <p>Complete course management for Semester 5 with official October examination dates, hall ticket integration, and seating details.</p>
              </div>
              <div className="lp-feat-card">
                <div className="lp-feat-icon">🛡️</div>
                <h3>Smart Safe-Bunk Calculator</h3>
                <p>Know exactly how many classes you can afford to miss without dropping below the 75% university requirement.</p>
              </div>
              <div className="lp-feat-card">
                <div className="lp-feat-icon">🎯</div>
                <h3>Resume ATS Audit & Skills Gap</h3>
                <p>Tailored resume tracking with keyword match dials, score analysis, and targeted gap breakdowns for SWE and Cyber Security.</p>
              </div>
              <div className="lp-feat-card">
                <div className="lp-feat-icon">🤖</div>
                <h3>Context-Aware AI Assistant</h3>
                <p>Ask syllabus questions, build customized study plans, and generate sample code tailored directly to your enrolled courses.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="lp-section" id="how" style={{ background: 'var(--bg-2)' }}>
          <div className="lp-wrap">
            <div className="lp-section-hdr">
              <span className="lp-pill">Architecture</span>
              <h2>Designed with precision and academic integrity</h2>
              <p>Local-First Browser Persistence paired with Supabase PostgreSQL and Render Cloud Sync.</p>
            </div>

            <div className="lp-steps-grid">
              <div className="lp-step-card">
                <div className="lp-step-num">01</div>
                <h4>Dual-Portal Isolation</h4>
                <p>Independent interfaces for students and administrators ensure sensitive academic circulars and records remain protected.</p>
              </div>
              <div className="lp-step-card">
                <div className="lp-step-num">02</div>
                <h4>Unified Deadlines Engine</h4>
                <p>Assignments, semester tests, laboratory submissions, and final exams combined into a single chronological agenda.</p>
              </div>
              <div className="lp-step-card">
                <div className="lp-step-num">03</div>
                <h4>Atomic Task Completion</h4>
                <p>Instant row-level locking ensures seamless task updates and accurate productivity metric tracking.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="lp-section" id="roadmap">
          <div className="lp-wrap">
            <div className="lp-section-hdr">
              <span className="lp-pill">Roadmap</span>
              <h2>What's next for Integrum</h2>
              <p>Continuously evolving to support modern engineering students.</p>
            </div>

            <div className="lp-roadmap-timeline">
              <div className="lp-rm-item done">
                <strong>Phase 1 · Core Foundation (Shipped)</strong>
                <p>Authentication, PostgreSQL schema, Academic courses, Assignments, and Reminders processor.</p>
              </div>
              <div className="lp-rm-item done">
                <strong>Phase 2 · Career & Analytics (Shipped)</strong>
                <p>ATS Resume scanner, Skills matrix, Safe-bunk calculator, and SGPA/CGPA grade simulator.</p>
              </div>
              <div className="lp-rm-item active">
                <strong>Phase 3 · Production Deployment (Live)</strong>
                <p>Supabase Mumbai database, Render backend, Vercel frontend, and real-browser automated test closure.</p>
              </div>
            </div>
          </div>
        </section>

                {/* Interactive Safe-Bunk Calculator Widget */}
        <section className="lp-section" id="safe-bunk-calculator" style={{ padding: '60px 0', background: 'var(--bg-2)' }}>
          <div className="lp-wrap" style={{ maxWidth: '800px' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span className="badge badge-primary" style={{ marginBottom: '8px' }}>Interactive Math Engine</span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '8px 0' }}>Calculate Your Safe Bunks Live</h2>
              <p style={{ color: 'var(--text-2)', fontSize: '0.95rem' }}>
                Test your course attendance standing against the mandatory 75% university policy right now.
              </p>
            </div>

            <div className="card" style={{ padding: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
                    Lectures Attended:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={bunkTotal}
                    value={bunkPresent}
                    onChange={(e) => setBunkPresent(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="form-input"
                    style={{ fontSize: '16px', fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
                    Total Lectures Conducted:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bunkTotal}
                    onChange={(e) => setBunkTotal(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="form-input"
                    style={{ fontSize: '16px', fontWeight: 800 }}
                  />
                </div>
              </div>

              {(() => {
                const pct = bunkTotal > 0 ? (bunkPresent / bunkTotal) * 100 : 0;
                const isSafe = pct >= 75.0;
                const maxMiss = Math.max(0, Math.floor(bunkPresent / 0.75 - bunkTotal));
                const needed = Math.max(1, Math.ceil((0.75 * bunkTotal - bunkPresent) / 0.25));

                return (
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: 'var(--radius-md)',
                      background: isSafe ? 'var(--success-light)' : 'var(--warning-light)',
                      borderLeft: `5px solid ${isSafe ? 'var(--success)' : 'var(--warning)'}`,
                      color: 'var(--text-1)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '1.2rem', color: isSafe ? 'var(--success)' : '#B45309' }}>
                        {isSafe ? '✓ Safe Attendance Standing' : '⚠️ Attendance Warning'}
                      </strong>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{pct.toFixed(1)}%</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                      {isSafe
                        ? `You can safely miss up to ${maxMiss} more ${maxMiss === 1 ? 'class' : 'classes'} while maintaining >= 75% attendance.`
                        : `You are below the 75% threshold. You must attend the next ${needed} consecutive ${needed === 1 ? 'class' : 'classes'} without absence to restore eligibility.`}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="lp-section" id="faq" style={{ background: 'var(--bg-2)' }}>
          <div className="lp-wrap">
            <div className="lp-section-hdr">
              <span className="lp-pill">Questions</span>
              <h2>Frequently Asked Questions</h2>
            </div>

            <div className="lp-faq-container">
              <details className="lp-faq-item">
                <summary>How does the Safe-Bunk Calculator compute safe missed classes?</summary>
                <p>It takes your total attended classes and total held classes, comparing them against the university's 75% cutoff threshold. It calculates (Present / 0.75) - Total to find the exact margin.</p>
              </details>
              <details className="lp-faq-item">
                <summary>Is the ATS Resume score accurate for tech recruitment?</summary>
                <p>Yes. It scans standard keyword frequencies, format readability, action verbs, and technical competency against industry job descriptions.</p>
              </details>
              <details className="lp-faq-item">
                <summary>Can faculty and students access the same portal?</summary>
                <p>Integrum features role-based portal separation. Students can access their coursework and career hub, while faculty can access the university directory and campus circular broadcaster.</p>
              </details>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Integrum</strong> · Student Success Platform
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)' }}>Built for modern university students · Department of Computer Science & Engineering</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
            <button className="btn btn-sm btn-outline" onClick={() => onGoLogin('student')}>Student Sign In</button>
            <button className="btn btn-sm btn-primary" onClick={() => onGoLogin('admin')}>Faculty Portal</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import ThreeHeroCanvas from './ThreeHeroCanvas';
import IntegrumLogo from './IntegrumLogo';
import { DesignTweaks, ThemeToggle } from './DesignTweaks';

interface LandingPhaseProps {
  onGoLogin: (mode?: 'student' | 'admin' | 'register') => void;
  onGoApp: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function LandingPhase({ onGoLogin, darkMode, onToggleDarkMode }: LandingPhaseProps) {
  // Mobile Nav Drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FAQ Accordion State (open FAQ index)
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Demo Request Modal State
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoOrg, setDemoOrg] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  // Core Product Capabilities (Clean 6-card symmetrical grid)
  const productPillars = [
    {
      icon: '📊',
      title: 'Attendance Health & Course Standing',
      description:
        'Continuous attendance tracking against university 75% statutory policies. Computes real-time clearance buffers and exact consecutive recovery sessions needed to protect exam eligibility.',
    },
    {
      icon: '📚',
      title: 'Coursework & Deliverables Hub',
      description:
        'Comprehensive syllabus and submission tracking. Organize theory assignments, lab journals, and semester projects with atomic task status and deadline notifications.',
    },
    {
      icon: '⏱️',
      title: 'Study Sprints & Focus Timer',
      description:
        'Built-in Pomodoro sprint timers, active study logs, and progress metrics designed to keep your revision blocks disciplined and distraction-free.',
    },
    {
      icon: '🗓️',
      title: 'Unified Academic Calendar',
      description:
        'Consolidated schedule reconciling examination dates, assignment due dates, lecture timetables, and college calendar milestones in a single synchronized timeline.',
    },
    {
      icon: '💼',
      title: 'Career Hub & ATS Resume Audit',
      description:
        'Build and audit engineering resumes with real-time ATS keyword matching against tech industry job profiles, paired with a full campus placement kanban tracker.',
    },
    {
      icon: '🤖',
      title: 'Contextual AI Academic Advisor',
      description:
        'Personalized AI advisor grounded in your active course roster. Delivers algorithm explanations, runnable code snippets, and structured 3-day exam revision blueprints.',
    },
  ];

  // Platform FAQ questions
  const faqs = [
    {
      q: 'How does Integrum compute course attendance health and standing?',
      a: 'Integrum applies official statutory attendance formulas: if your attendance percentage is at or above 75%, it calculates your safe clearance margin above the cutoff. If below 75%, it computes the exact consecutive lectures you must attend to restore examination eligibility without guesswork.',
    },
    {
      q: 'How does Integrum organize assignment deadlines and academic schedules?',
      a: 'Integrum merges your course syllabus, internal assessments, and examination dates into a single unified ledger. Milestones are tracked with row-level transaction safety so coursework and deadlines never clash silently.',
    },
    {
      q: 'Is student academic data secure and private?',
      a: 'Yes. Every student profile is isolated behind encrypted HttpOnly session cookies, cryptographic JWT tokens, and strict PostgreSQL foreign-key ownership constraints. Students cannot view or modify other peers\' tasks or coursework.',
    },
    {
      q: 'Does the application work reliably on mobile devices and offline?',
      a: 'Integrum is designed mobile-first with responsive fluid scaling and local-first resilient persistence. All tasks, attendance logs, and study sessions are saved locally and synchronize seamlessly.',
    },
    {
      q: 'What tools does the Faculty & Institutional Administration Portal provide?',
      a: 'Department heads, deans, and academic coordinators access cohort-wide attendance analytics, review condonation requests, publish official academic circulars, and manage institutional records.',
    },
  ];

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoEmail.trim()) return;
    setDemoSubmitted(true);
    setTimeout(() => {
      setDemoSubmitted(false);
      setIsDemoModalOpen(false);
      setDemoOrg('');
      setDemoEmail('');
    }, 2200);
  };

  return (
    <div className="phase active" id="phase-landing">
      {/* ── 1. Landing Navigation (Student Only on Header) ─────────── */}
      <nav className="lp-nav landing-nav" aria-label="Main navigation">
        <div className="lp-wrap">
          <a className="lp-brand" href="#phase-landing" aria-label="Integrum home" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <IntegrumLogo size={32} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.025em' }}>
              Integrum
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <div className="lp-links" style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
            <a href="#features" style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none' }}>Features</a>
            <a href="#faq" style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none' }}>Platform FAQ</a>
            <a href="#governance" style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none' }}>Faculty &amp; Admin</a>
            <a href="#about" style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none' }}>About</a>
          </div>

          {/* Header Action Buttons (Student Login & Register ONLY - NO Admin on Header) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DesignTweaks align="right" id="lpTweaksToggleBtn" />
            {onToggleDarkMode && (
              <ThemeToggle darkMode={!!darkMode} onToggleDarkMode={onToggleDarkMode} id="lpDarkModeToggle" />
            )}
            <button
              className="lp-button secondary nav-btn-signin"
              onClick={() => onGoLogin('student')}
              style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 700 }}
            >
              Sign In
            </button>
            <button
              className="lp-button"
              onClick={() => onGoLogin('register')}
              style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 700 }}
            >
              Get Started
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="lp-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                color: 'var(--text-1)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lp-mobile-drawer" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)' }}>Appearance &amp; Palette</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <DesignTweaks align="left" id="lpMobileTweaksToggleBtn" />
                  {onToggleDarkMode && (
                    <ThemeToggle darkMode={!!darkMode} onToggleDarkMode={onToggleDarkMode} id="lpMobileDarkModeToggle" />
                  )}
                </div>
              </div>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', textDecoration: 'none' }}>Platform Capabilities</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', textDecoration: 'none' }}>FAQ</a>
              <a href="#governance" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', textDecoration: 'none' }}>Faculty Portal</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', textDecoration: 'none' }}>About</a>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  className="lp-button secondary"
                  onClick={() => { setMobileMenuOpen(false); onGoLogin('student'); }}
                  style={{ flex: 1, padding: '10px 0', fontSize: '13px', fontWeight: 700 }}
                >
                  Student Sign In
                </button>
                <button
                  className="lp-button"
                  onClick={() => { setMobileMenuOpen(false); onGoLogin('register'); }}
                  style={{ flex: 1, padding: '10px 0', fontSize: '13px', fontWeight: 700 }}
                >
                  Register Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── 2. Hero Section with 3D WebGL (Three.js) & Aurora Blobs ── */}
      <header className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Drifting Aurora Blobs */}
        <div className="aurora-container" aria-hidden="true">
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
        </div>

        <div className="lp-wrap" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-split-grid">
            {/* Left Content Column */}
            <div>
              <div className="chip chip-apricot" style={{ marginBottom: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 800 }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--apricot)', boxShadow: '0 0 6px var(--apricot)' }} />
                Academic Operations &amp; Intelligence Ledger · v2
              </div>

              <h1 className="display" style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.025em', color: 'var(--text-1)', margin: '0 0 20px 0' }}>
                Unified Student <em>Success.</em>
              </h1>

              <p style={{ fontSize: '16.5px', lineHeight: 1.65, color: 'var(--text-2)', maxWidth: '560px', margin: '0 0 32px 0' }}>
                An artistic, fluid academic operating system. Compute course attendance health under university statutory regulations, track syllabus deliverables, power study sprints, and optimize technical career artifacts.
              </p>

              <div className="hero-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                <button
                  className="lp-button"
                  onClick={() => onGoLogin('register')}
                  style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 700 }}
                >
                  Create Student Profile →
                </button>
                <button
                  className="lp-button secondary"
                  onClick={() => onGoLogin('student')}
                  style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 700 }}
                >
                  Student Workspace Sign In
                </button>
              </div>

              {/* Verified Metrics Highlights */}
              <div className="hero-metrics-grid">
                <div>
                  <div className="display" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--action)', fontVariantNumeric: 'tabular-nums' }}>75.0%</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, marginTop: '2px' }}>Ordinance Policy</div>
                </div>
                <div>
                  <div className="display" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--apricot)', fontVariantNumeric: 'tabular-nums' }}>Row-Lock</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, marginTop: '2px' }}>ACID Task Safety</div>
                </div>
                <div>
                  <div className="display" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>ATS-Ready</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, marginTop: '2px' }}>Career Resume Engine</div>
                </div>
              </div>
            </div>

            {/* Right Interactive 3D WebGL Canvas */}
            <div className="hero-3d-wrapper">
              <ThreeHeroCanvas />
              <div className="hero-3d-caption">
                <span>✦ Interactive 3D Academic Crystal</span>
                <span className="hero-3d-hint">Drag to Rotate · Scroll to Inertia</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tilted Marquee Ribbon ── */}
      <div className="marquee-ribbon-wrap" aria-hidden="true">
        <div className="marquee-ribbon">
          <span className="marquee-item"><span className="spark-dot" /> 75% Statutory Attendance Protection</span>
          <span className="marquee-item"><span className="spark-dot" /> Pomodoro Study Focus Timers</span>
          <span className="marquee-item"><span className="spark-dot" /> ATS Resume Match Engine</span>
          <span className="marquee-item"><span className="spark-dot" /> University Ordinance 6086 Verified</span>
          <span className="marquee-item"><span className="spark-dot" /> ACID Row-Level Task Safety</span>
          <span className="marquee-item"><span className="spark-dot" /> Synchronized Academic Timetable</span>
          <span className="marquee-item"><span className="spark-dot" /> Periwinkle &amp; Plum Aesthetic v2</span>
          {/* Loop repeat */}
          <span className="marquee-item"><span className="spark-dot" /> 75% Statutory Attendance Protection</span>
          <span className="marquee-item"><span className="spark-dot" /> Pomodoro Study Focus Timers</span>
          <span className="marquee-item"><span className="spark-dot" /> ATS Resume Match Engine</span>
          <span className="marquee-item"><span className="spark-dot" /> University Ordinance 6086 Verified</span>
          <span className="marquee-item"><span className="spark-dot" /> ACID Row-Level Task Safety</span>
          <span className="marquee-item"><span className="spark-dot" /> Synchronized Academic Timetable</span>
          <span className="marquee-item"><span className="spark-dot" /> Periwinkle &amp; Plum Aesthetic v2</span>
        </div>
      </div>

      {/* ── 3. Core Capabilities & Explanations ───────────────────── */}
      <section className="lp-section" id="features" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div className="lp-wrap">
          <div className="lp-section-header">
            <div className="chip chip-primary" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
              PLATFORM ARCHITECTURE
            </div>
            <h2 className="display" style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '12px' }}>
              Engineered for <em>Real Academic Workflows</em>
            </h2>
            <p style={{ fontSize: '15.5px', color: 'var(--text-2)', lineHeight: 1.65 }}>
              Integrum equips university students with dedicated academic instruments designed specifically for degree rigor, course compliance, and engineering career outcomes.
            </p>
          </div>

          <div className="lp-features-grid auto-grid">
            {productPillars.map((p, idx) => (
              <div key={idx} className="card glass lp-feature-card">
                <div style={{ fontSize: '28px', marginBottom: '16px', lineHeight: 1 }}>
                  {p.icon}
                </div>
                <h3 className="display" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-1)' }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Platform & Academic FAQ Accordion ───────────────────── */}
      <section className="lp-section" id="faq" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        <div className="lp-wrap">
          <div className="lp-faq-header">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              QUESTIONS &amp; POLICIES
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: '12px' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: '15px', lineHeight: 1.6 }}>
              Everything you need to know about attendance standing formulas, coursework sync, data privacy, and institutional access.
            </p>
          </div>

          <div className="lp-faq-container">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="card"
                  style={{
                    padding: '22px 26px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease, background 0.2s ease',
                    borderColor: isOpen ? 'var(--primary)' : 'var(--border)',
                    background: 'var(--bg)',
                  }}
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <h3 style={{ fontSize: '15.5px', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
                      {faq.q}
                    </h3>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', flexShrink: 0 }}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </div>
                  {isOpen && (
                    <p style={{ fontSize: '13.5px', lineHeight: 1.7, color: 'var(--text-2)', margin: '14px 0 0 0', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Faculty Administration Governance (Near Ending) ─────── */}
      <section className="lp-section" id="governance" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div className="lp-wrap">
          <div className="admin-split-grid">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '4px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '11px', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                INSTITUTIONAL ADMINISTRATION
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: '14px' }}>
                University Faculty &amp; Controller Governance
              </h2>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-2)', marginBottom: '24px' }}>
                Equip university deans, examination controllers, and academic committees with institutional oversight. Monitor student cohort attendance trends, review medical condonation requests, broadcast official circulars, and grant examination hall ticket clearance.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                <button
                  className="lp-button"
                  onClick={() => setIsDemoModalOpen(true)}
                  style={{ padding: '11px 24px', fontSize: '13.5px', fontWeight: 700 }}
                >
                  Request Institutional Demo →
                </button>
                <button
                  className="lp-button secondary"
                  onClick={() => onGoLogin('admin')}
                  style={{ padding: '11px 24px', fontSize: '13.5px', fontWeight: 700 }}
                >
                  Faculty &amp; Admin Sign In
                </button>
              </div>
            </div>

            {/* Governance Capability Card */}
            <div className="card" style={{ padding: '28px', background: 'var(--bg-2)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-1)' }}>
                Administrative Capabilities
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', lineHeight: 1.8, color: 'var(--text-2)' }}>
                <li>Cohort-wide attendance health monitoring &amp; detention rosters</li>
                <li>Statutory condonation registry under Regulation 6086</li>
                <li>Official examination seating and hall clearance verification</li>
                <li>Department circular broadcasts with auditable logging</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. About Integrum & Institutional References Footer ─── */}
      <footer className="lp-footer" id="about" role="contentinfo">
        <div className="lp-wrap">
          <div className="lp-footer-grid">
            {/* About Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <IntegrumLogo size={28} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                  Integrum
                </span>
              </div>
              <p style={{ fontSize: '13.5px', lineHeight: 1.7, color: 'var(--text-2)', maxWidth: '440px', margin: 0 }}>
                A modern academic intelligence and student operations platform. Built for university cohorts with real-time course attendance tracking, unified calendar scheduling, and acid-compliant task execution.
              </p>
            </div>

            {/* Quick Links Column */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                Platform Navigation
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                <a href="#features" style={{ color: 'var(--text-2)', textDecoration: 'none' }}>Platform Capabilities</a>
                <a href="#faq" style={{ color: 'var(--text-2)', textDecoration: 'none' }}>Platform FAQ</a>
                <a href="#governance" style={{ color: 'var(--text-2)', textDecoration: 'none' }}>Faculty Governance</a>
                <button
                  type="button"
                  onClick={() => onGoLogin('admin')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-2)', textAlign: 'left', padding: 0, font: 'inherit', cursor: 'pointer' }}
                >
                  Faculty &amp; Admin Sign In
                </button>
              </div>
            </div>

            {/* References & GitHub Repositories */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                Code &amp; Documentation
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                <a
                  href="https://github.com/addyosmani/agent-skills"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}
                >
                  GitHub Repository →
                </a>
                <a href="#governance" onClick={() => setIsDemoModalOpen(true)} style={{ color: 'var(--text-2)', textDecoration: 'none' }}>
                  Request Institutional Demo
                </a>
                <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>MIT License · Node 22+ · PostgreSQL 16</span>
              </div>
            </div>
          </div>

          <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: 'var(--text-3)' }}>
            <div>© 2026 Integrum Academic Systems. All rights reserved.</div>
            <div>Computer Science &amp; Engineering Department · Regulation 6086 Compliant</div>
          </div>
        </div>
      </footer>

      {/* ── 7. Request Institutional Demo Modal (Centered Backdrop) ─ */}
      {isDemoModalOpen && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDemoModalOpen(false);
          }}
        >
          <div className="modal-box" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-1)' }}>
                Request Institutional Demo
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsDemoModalOpen(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {demoSubmitted ? (
              <div className="modal-body" style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>
                  ✓
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
                  Request Received
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
                  Thank you! Our academic coordinator will contact your institution to schedule the demo walkthrough.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit}>
                <div className="modal-body">
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
                    Schedule a personalized walkthrough of Integrum for your college, department, or academic council.
                  </p>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px' }}>
                      University / Institution Name
                    </label>
                    <input
                      className="form-input form-input-underline"
                      type="text"
                      placeholder="e.g. Metropolitan Institute of Technology"
                      value={demoOrg}
                      onChange={(e) => setDemoOrg(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px' }}>
                      Official Faculty Email
                    </label>
                    <input
                      className="form-input form-input-underline"
                      type="email"
                      placeholder="dean@university.edu"
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Modal Footer: Cancel on Left, Submit on Right */}
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsDemoModalOpen(false)}
                    style={{ padding: '8px 18px', fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '8px 22px', fontSize: '13px', fontWeight: 700 }}
                  >
                    Submit Request →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

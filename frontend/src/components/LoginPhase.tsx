import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';

interface LoginPhaseProps {
  initialMode?: 'student' | 'admin' | 'register';
  onStudentLogin: (email: string, pass: string) => Promise<void>;
  onAdminLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (firstName: string, lastName: string, email: string, pass: string) => Promise<void>;
  onGoLanding: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function LoginPhase({
  initialMode = 'student',
  onStudentLogin,
  onAdminLogin,
  onRegister,
  onGoLanding,
  showToast,
}: LoginPhaseProps) {
  const [portal, setPortal] = useState<'student' | 'admin' | 'register'>(initialMode);

  // Student credentials
  const [studentEmail, setStudentEmail] = useState('sufiyan.shaikh@example.com');
  const [studentPass, setStudentPass] = useState('password123');

  // Admin credentials
  const [adminEmail, setAdminEmail] = useState('admin.cse@university.edu');
  const [adminPass, setAdminPass] = useState('adminSecret2026');

  // Register credentials (e.g. Ahmed Khan in tests)
  const [regFirstName, setRegFirstName] = useState('Ahmed');
  const [regLastName, setRegLastName] = useState('Khan');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('Password123!');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPortal(initialMode);
  }, [initialMode]);

  const handleStudentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onStudentLogin(studentEmail, studentPass);
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdminLogin(adminEmail, adminPass);
    } catch (err: any) {
      showToast(err.message || 'Admin login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim()) {
      showToast('Please enter a valid email', 'error');
      return;
    }
    setLoading(true);
    try {
      await onRegister(regFirstName, regLastName, regEmail, regPass);
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phase active" id="phase-login">
      <div className="login-wrapper">
        {/* Left Brand Column */}
        <div className="login-brand">
          <div className="lb-logo">
            <div className="lb-icon">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M50 5C25.1 5 5 25.1 5 50s20.1 45 45 45 45-20.1 45-45S74.9 5 50 5z"
                  stroke="#fff"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray="255"
                  strokeDashoffset="45"
                />
                <circle cx="54" cy="30" r="5.5" fill="#fff" />
                <rect x="49" y="40" width="10" height="32" rx="5" fill="#fff" />
              </svg>
            </div>
            <span className="lb-name">Integrum</span>
          </div>
          <h2>Your entire student journey, unified.</h2>
          <p>
            Academics, examination preparation, attendance health, career artifacts, and AI intelligence—all organized around your academic context.
          </p>
          <ul className="lb-features">
            <li><span className="check">✓</span> Role-based portal separation (Student vs. Administrator)</li>
            <li><span className="check">✓</span> October 2026 Examination timetable & venue mapping</li>
            <li><span className="check">✓</span> Smart attendance threshold & safe-bunk recovery engine</li>
            <li><span className="check">✓</span> Resume ATS optimization & skill gap analysis</li>
          </ul>
          <div style={{ marginTop: 'auto', paddingTop: '24px', fontSize: '0.75rem', opacity: 0.85 }}>
            Workspace of <strong>Sufiyan Shaikh</strong> · Computer Science & Engineering
          </div>
        </div>

        {/* Right Login Forms Panel */}
        <div className="login-form-panel">
          {/* Portal Selector Tabs */}
          <div className="portal-switch">
            <div
              className={`portal-tab ${portal === 'student' ? 'active' : ''}`}
              id="tabPortalStudent"
              onClick={() => setPortal('student')}
            >
              🎓 Student Portal
            </div>
            <div
              className={`portal-tab ${portal === 'admin' ? 'active' : ''}`}
              id="tabPortalAdmin"
              onClick={() => setPortal('admin')}
            >
              🏛️ Administrator Portal
            </div>
            <div
              className={`portal-tab ${portal === 'register' ? 'active' : ''}`}
              onClick={() => setPortal('register')}
            >
              ✨ Register
            </div>
          </div>

          {/* Student Sign In Form */}
          {portal === 'student' && (
            <div id="form-portal-student">
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '6px' }}>Student Sign In</h2>
              <p className="login-sub" style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '22px' }}>
                Access your Semester 5 coursework, October exam schedule, and placement pipeline.
              </p>

              <form onSubmit={handleStudentSubmit}>
                <div className="form-group">
                  <label className="form-label">Student University Email</label>
                  <input
                    className="form-input"
                    type="email"
                    id="loginStudentEmail"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={studentPass}
                    onChange={(e) => setStudentPass(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <label><input type="checkbox" defaultChecked /> Remember this device</label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      showToast('Password reset instructions sent to registered email', 'info');
                    }}
                  >
                    Forgot password?
                  </a>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary login-btn"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In to Student Workspace →'}
                </button>
              </form>

              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '12px' }}>
                Don't have an account yet?{' '}
                <a
                  href="#register"
                  onClick={(e) => {
                    e.preventDefault();
                    setPortal('register');
                  }}
                  style={{ color: 'var(--primary)', fontWeight: 700 }}
                >
                  Register new student profile
                </a>
              </div>
            </div>
          )}

          {/* Administrator Form */}
          {portal === 'admin' && (
            <div id="form-portal-admin">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Faculty & Admin Sign In</h2>
                <span className="admin-badge">Faculty Access</span>
              </div>
              <p className="login-sub" style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '22px' }}>
                University administrative access for department heads, faculty, and campus deans.
              </p>

              <form onSubmit={handleAdminSubmit}>
                <div className="form-group">
                  <label className="form-label">Administrator Account Email</label>
                  <input
                    className="form-input"
                    type="email"
                    id="loginAdminEmail"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Administrative Key / Password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <label><input type="checkbox" defaultChecked /> Secure faculty session</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>MFA Enforced</span>
                </div>
                <button
                  type="submit"
                  className="btn login-btn"
                  style={{ background: '#442C43', color: '#fff' }}
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Sign In as Administrator →'}
                </button>
              </form>

              <div
                style={{
                  marginTop: '16px',
                  padding: '10px',
                  background: 'var(--warning-light)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '3px solid var(--warning)',
                  fontSize: '0.75rem',
                  color: '#92400E',
                  lineHeight: 1.4,
                }}
              >
                🔒 Administration features (student directory, circular broadcasts, department logs) are isolated from student accounts.
              </div>
            </div>
          )}

          {/* New Student Registration Form */}
          {portal === 'register' && (
            <div id="form-portal-register">
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '6px' }}>Student Registration</h2>
              <p className="login-sub" style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '22px' }}>
                Create your student profile to access assignments, calendar, and attendance tracking.
              </p>

              <form onSubmit={handleRegisterSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Ahmed"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Khan"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="ahmed.khan@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input"
                    type="password"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-btn"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </form>

              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '12px' }}>
                Already registered?{' '}
                <a
                  href="#login"
                  onClick={(e) => {
                    e.preventDefault();
                    setPortal('student');
                  }}
                  style={{ color: 'var(--primary)', fontWeight: 700 }}
                >
                  Sign in to existing account
                </a>
              </div>
            </div>
          )}

          <div className="login-back">
            <a href="#back" onClick={(e) => { e.preventDefault(); onGoLanding(); }}>
              ← Back to Integrum Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

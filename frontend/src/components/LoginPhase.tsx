import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import IntegrumLogo from './IntegrumLogo';

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
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPass, setStudentPass] = useState('');
  const [showStudentPass, setShowStudentPass] = useState(false);

  // Admin credentials
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Register credentials (clean, empty defaults)
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPortal(initialMode);
  }, [initialMode]);

  const handleStudentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!studentEmail.trim() || !studentPass.trim()) {
      showToast('Please provide your university email and password', 'error');
      return;
    }
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
    if (!adminEmail.trim() || !adminPass.trim()) {
      showToast('Please provide administrative email and credentials', 'error');
      return;
    }
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
    if (!regFirstName.trim() || !regLastName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    if (!regEmail.trim()) {
      showToast('Please enter a valid university email', 'error');
      return;
    }
    if (!regPass || regPass.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }
    if (regConfirmPass && regPass !== regConfirmPass) {
      showToast('Passwords do not match. Please re-enter identical passwords.', 'error');
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

  const passMismatch = regConfirmPass.length > 0 && regPass !== regConfirmPass;
  const passMatch = regConfirmPass.length > 0 && regPass === regConfirmPass;

  return (
    <div className="phase active" id="phase-login">
      <div className="login-wrapper">
        {/* Left Brand Editorial Column */}
        <div className="login-brand">
          <div className="lb-logo">
            <div className="lb-icon">
              <IntegrumLogo size={36} style={{ color: '#fff' }} />
            </div>
            <span className="lb-name">Integrum</span>
          </div>

          <h2>Your entire student journey, unified.</h2>
          <p>
            Academics, examination preparation, attendance health, career artifacts, and AI intelligence—all organized around your verified academic context.
          </p>

          <ul className="lb-features">
            <li><span className="check">•</span> University Ordinance 6086 Attendance &amp; Standing Tracker</li>
            <li><span className="check">•</span> Semester 5 Examination timetable &amp; hall allocations</li>
            <li><span className="check">•</span> Atomic task execution with row-level transaction safety</li>
            <li><span className="check">•</span> Academic ledger with clean data privacy isolation</li>
          </ul>

          <div style={{ marginTop: 'auto', paddingTop: '24px', fontSize: '0.8rem', opacity: 0.85 }}>
            Computer Science &amp; Engineering Academic Ledger
          </div>
        </div>

        {/* Right Forms Column */}
        <div className="login-form-panel">
          {/* Top Back Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={onGoLanding}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--primary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 0',
              }}
            >
              ← Return to Integrum Home
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>
              {portal === 'admin' ? 'Faculty Portal' : portal === 'register' ? 'Registration' : 'Student Access'}
            </span>
          </div>

          {/* Tab Switcher */}
          <div className="portal-switch">
            <div
              className={`portal-tab ${portal === 'student' ? 'active' : ''}`}
              id="tabPortalStudent"
              onClick={() => setPortal('student')}
            >
              Student Sign In
            </div>
            <div
              className={`portal-tab ${portal === 'register' ? 'active' : ''}`}
              onClick={() => setPortal('register')}
            >
              Student Registration
            </div>
            <div
              className={`portal-tab ${portal === 'admin' ? 'active' : ''}`}
              id="tabPortalAdmin"
              onClick={() => setPortal('admin')}
            >
              Faculty &amp; Admin
            </div>
          </div>

          {/* 1. Student Sign In Form */}
          {portal === 'student' && (
            <div id="form-portal-student">
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-1)' }}>
                Student Sign In
              </h2>
              <p className="login-sub" style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '24px' }}>
                Access your academic dashboard, course attendance ledger, and deliverables hub.
              </p>

              <form onSubmit={handleStudentSubmit}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>
                    Student University Email
                  </label>
                  <input
                    className="form-input form-input-underline"
                    type="email"
                    name="email"
                    id="loginStudentEmail"
                    placeholder="student@institution.edu"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      className="form-input form-input-underline"
                      type={showStudentPass ? 'text' : 'password'}
                      name="password"
                      id="loginStudentPassword"
                      placeholder="••••••••••••"
                      value={studentPass}
                      onChange={(e) => setStudentPass(e.target.value)}
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPass(!showStudentPass)}
                      title={showStudentPass ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-3)',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showStudentPass ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-2)' }}>
                    <input type="checkbox" defaultChecked /> Remember session
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      showToast('Password reset link sent to institutional email.', 'info');
                    }}
                    style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-btn"
                  disabled={loading}
                  style={{ width: '100%', padding: '12px 18px', fontSize: '14px', fontWeight: 700 }}
                >
                  {loading ? 'Authenticating...' : 'Sign In to Student Workspace →'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '14px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentEmail('sufiyan.shaikh@example.com');
                      setStudentPass('password123');
                      showToast('Pre-filled student credentials', 'info');
                    }}
                    style={{ fontSize: '12px', color: 'var(--text-3)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}
                  >
                    Fill student demo credentials
                  </button>
                </div>
              </form>

              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-3)', marginTop: '16px' }}>
                New student?{' '}
                <button
                  type="button"
                  onClick={() => setPortal('register')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Create your profile →
                </button>
              </div>
            </div>
          )}

          {/* 2. Student Registration Form */}
          {portal === 'register' && (
            <div id="form-portal-register">
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-1)' }}>
                Student Registration
              </h2>
              <p className="login-sub" style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '24px' }}>
                Create a fresh, private student profile. All data will be saved securely to the database.
              </p>

              <form onSubmit={handleRegisterSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>
                      First Name
                    </label>
                    <input
                      className="form-input form-input-underline"
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>
                      Last Name
                    </label>
                    <input
                      className="form-input form-input-underline"
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>
                    Student University Email
                  </label>
                  <input
                    className="form-input form-input-underline"
                    type="email"
                    name="email"
                    placeholder="student@institution.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      className="form-input form-input-underline"
                      type={showRegPass ? 'text' : 'password'}
                      name="password"
                      placeholder="••••••••••••"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass(!showRegPass)}
                      title={showRegPass ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-3)',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showRegPass ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '22px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      className="form-input form-input-underline"
                      type={showRegConfirmPass ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="••••••••••••"
                      value={regConfirmPass}
                      onChange={(e) => setRegConfirmPass(e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPass(!showRegConfirmPass)}
                      title={showRegConfirmPass ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-3)',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showRegConfirmPass ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passMismatch && (
                    <div style={{ fontSize: '11px', color: 'var(--error)', marginTop: '4px', fontWeight: 600 }}>
                      Passwords do not match
                    </div>
                  )}
                  {passMatch && (
                    <div style={{ fontSize: '11px', color: 'var(--success)', marginTop: '4px', fontWeight: 600 }}>
                      ✓ Passwords match
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-btn"
                  disabled={loading || passMismatch}
                  style={{ width: '100%', padding: '12px 18px', fontSize: '14px', fontWeight: 700 }}
                >
                  {loading ? 'Registering...' : 'Complete Registration'}
                </button>
              </form>

              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-3)', marginTop: '16px' }}>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setPortal('student')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Sign in to existing account →
                </button>
              </div>
            </div>
          )}

          {/* 3. Administrator Form */}
          {portal === 'admin' && (
            <div id="form-portal-admin">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-1)' }}>
                  Faculty &amp; Administration
                </h2>
                <span className="admin-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                  Faculty Portal
                </span>
              </div>
              <p className="login-sub" style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '24px' }}>
                Authorized university access for examination controllers, department chairs, and academic deans.
              </p>

              <form onSubmit={handleAdminSubmit}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>
                    Administrator Email
                  </label>
                  <input
                    className="form-input form-input-underline"
                    type="email"
                    name="adminEmail"
                    id="loginAdminEmail"
                    placeholder="admin@institution.edu"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>
                    Administrative Secret Key
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      className="form-input form-input-underline"
                      type={showAdminPass ? 'text' : 'password'}
                      name="adminPassword"
                      placeholder="••••••••••••"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      title={showAdminPass ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-3)',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showAdminPass ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-2)' }}>
                    <input type="checkbox" defaultChecked /> University MFA token verified
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-btn"
                  disabled={loading}
                  style={{ width: '100%', padding: '12px 18px', fontSize: '14px', fontWeight: 700 }}
                >
                  {loading ? 'Authenticating...' : 'Sign In as Administrator →'}
                </button>
              </form>

              <div
                style={{
                  marginTop: '20px',
                  padding: '12px 16px',
                  background: 'var(--primary-50)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--primary)',
                  fontSize: '0.8rem',
                  color: 'var(--text-2)',
                  lineHeight: 1.5,
                }}
              >
                Administrative actions (hall ticket clearance, circular broadcasts, condonation logs) are audited and restricted to authenticated faculty accounts.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

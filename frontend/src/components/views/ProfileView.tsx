import type { FormEvent } from 'react';
import { useState } from 'react';
import type { StudentInfo } from '../../types';

interface ProfileProps {
  studentInfo: StudentInfo;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenPasswordModal: () => void;
  onSaveProfile: (name: string, email: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ProfileView({
  studentInfo,
  darkMode,
  onToggleDarkMode,
  onOpenPasswordModal,
  onSaveProfile,
  showToast,
}: ProfileProps) {
  const [name, setName] = useState(studentInfo.name);
  const [email, setEmail] = useState(studentInfo.email);

  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [bunkWarnEnabled, setBunkWarnEnabled] = useState(true);
  const [aiDigestEnabled, setAiDigestEnabled] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    onSaveProfile(name, email);
    showToast('Profile credentials updated successfully!', 'success');
  };

  const downloadHallTicket = () => {
    showToast('📄 Downloading verified October 2026 Examination Hall Ticket (PDF)...', 'success');
  };

  return (
    <div className="view active" id="v-profile">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Student Profile & Settings</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Manage identity credentials, examination seat verification, security, and notification preferences.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Academic Credentials Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Academic Identity & Venue</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                fontSize: '24px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {studentInfo.avatar}
            </div>
            <div>
              <strong style={{ fontSize: '1.2rem', display: 'block' }}>{studentInfo.name}</strong>
              <small style={{ color: 'var(--text-3)' }}>Roll: <b>{studentInfo.roll}</b> · {studentInfo.year}</small>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-3)' }}>Department / Branch:</span>
              <b>{studentInfo.branch}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-3)' }}>Current Semester:</span>
              <b>{studentInfo.sem}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-3)' }}>Exam Centre Allocated:</span>
              <b>Hall 4A · Centre Code 042</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-3)' }}>Seating Row & Bench:</span>
              <b>Row 3 · Bench B-14</b>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={downloadHallTicket}
            style={{ width: '100%', marginTop: '20px' }}
          >
            Download Hall Ticket
          </button>
        </div>

        {/* Profile Credentials Form */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Profile Credentials</h3>

          <form onSubmit={handleSave}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                id="profNameInput"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">University Email Address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save Profile Details
            </button>
          </form>

          {/* Security & Password */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 800 }}>Security & Password</h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-2)' }}>
              Multi-factor authentication is active on student university sessions.
            </p>
            <button className="btn btn-outline" onClick={onOpenPasswordModal} style={{ width: '100%' }}>
              Change Password
            </button>
          </div>
        </div>

        {/* Notification Preferences & Theme */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Preferences & Theme</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '13px', display: 'block' }}>Examination & Deadline Alerts</strong>
                <small style={{ color: 'var(--text-3)' }}>In-app and reminder popups</small>
              </div>
              <input
                type="checkbox"
                checked={alertsEnabled}
                onChange={() => {
                  setAlertsEnabled(!alertsEnabled);
                  showToast(`Examination alerts ${!alertsEnabled ? 'enabled' : 'disabled'}`, 'info');
                }}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '13px', display: 'block' }}>Safe-Bunk Attendance Warnings</strong>
                <small style={{ color: 'var(--text-3)' }}>Alerts when course falls below 75%</small>
              </div>
              <input
                type="checkbox"
                checked={bunkWarnEnabled}
                onChange={() => {
                  setBunkWarnEnabled(!bunkWarnEnabled);
                  showToast(`Attendance warnings ${!bunkWarnEnabled ? 'enabled' : 'disabled'}`, 'info');
                }}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '13px', display: 'block' }}>AI Study Digest</strong>
                <small style={{ color: 'var(--text-3)' }}>Daily morning revision recommendations</small>
              </div>
              <input
                type="checkbox"
                checked={aiDigestEnabled}
                onChange={() => {
                  setAiDigestEnabled(!aiDigestEnabled);
                  showToast(`AI Study digest ${!aiDigestEnabled ? 'enabled' : 'disabled'}`, 'info');
                }}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
            </div>

            <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '13px', display: 'block' }}>Dark Mode Theme</strong>
                <small style={{ color: 'var(--text-3)' }}>Toggle high-contrast dark theme</small>
              </div>
              <button
                className="btn btn-sm btn-outline"
                onClick={onToggleDarkMode}
              >
                {darkMode ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

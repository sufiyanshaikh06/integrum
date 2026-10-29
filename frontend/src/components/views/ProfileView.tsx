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
  onExportBackup?: () => void;
  onImportBackup?: (data: any) => void;
}

export default function ProfileView({
  studentInfo,
  darkMode,
  onToggleDarkMode,
  onOpenPasswordModal,
  onSaveProfile,
  showToast,
  onExportBackup,
  onImportBackup,
}: ProfileProps) {
  const [name, setName] = useState(studentInfo.name);
  const [email, setEmail] = useState(studentInfo.email);

  // Interface & Notification Settings
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [attendWarnEnabled, setAttendWarnEnabled] = useState(true);
  const [aiDigestEnabled, setAiDigestEnabled] = useState(false);
  const [compactDensity, setCompactDensity] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Name and email cannot be empty', 'error');
      return;
    }
    onSaveProfile(name.trim(), email.trim());
    showToast('Profile credentials saved successfully!', 'success');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImportBackup?.(json);
        showToast('Workspace backup restored successfully!', 'success');
      } catch {
        showToast('Invalid JSON backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="view active" id="v-profile">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800 }}>Profile & Workspace Settings</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Manage account credentials, display preferences, notifications, and local workspace data portability.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* 1. Student Profile & Credentials Form */}
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                color: '#fff',
                fontSize: '26px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(15, 76, 66, 0.25)',
                flexShrink: 0,
              }}
            >
              {studentInfo.avatar || name.charAt(0) || 'S'}
            </div>
            <div>
              <strong style={{ fontSize: '1.25rem', display: 'block', color: 'var(--text-1)' }}>{name}</strong>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px', fontWeight: 600 }}>
                Roll / PRN: <span style={{ color: 'var(--text-1)' }}>{studentInfo.roll || 'CS2026-042'}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '1px' }}>
                {studentInfo.branch || 'Computer Science & Engineering'} · Semester {studentInfo.sem || '5'}
              </div>
            </div>
          </div>

          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-1)' }}>
            Edit Account Credentials
          </h3>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px' }}>
                Full Student Name
              </label>
              <input
                className="form-input form-input-underline"
                id="profNameInput"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sufiyan Shaikh"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px' }}>
                University Email Address
              </label>
              <input
                className="form-input form-input-underline"
                id="profEmailInput"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@university.edu"
                required
              />
            </div>

            <div style={{ marginTop: '10px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 700 }}
              >
                Save Profile Details
              </button>
            </div>
          </form>
        </div>

        {/* 2. Display & Interface Settings */}
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 18px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
            Display &amp; Interface Settings
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Theme Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div>
                <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-1)' }}>Appearance Theme</strong>
                <small style={{ color: 'var(--text-3)', fontSize: '12px' }}>
                  Current: <b>{darkMode ? 'High-Contrast Dark' : 'Academic Light'}</b>
                </small>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={onToggleDarkMode}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
              >
                {darkMode ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
              </button>
            </div>

            {/* Layout Density */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div>
                <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-1)' }}>Compact Table Density</strong>
                <small style={{ color: 'var(--text-3)', fontSize: '12px' }}>Reduces padding in tables &amp; lists</small>
              </div>
              <input
                type="checkbox"
                checked={compactDensity}
                onChange={() => {
                  setCompactDensity(!compactDensity);
                  showToast(`Compact density ${!compactDensity ? 'enabled' : 'disabled'}`, 'info');
                }}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Notification Toggles */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Notification Preferences
              </h4>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-1)' }}>Coursework &amp; Deadline Alerts</strong>
                  <small style={{ color: 'var(--text-3)', fontSize: '11px' }}>In-app alerts for pending assignments</small>
                </div>
                <input
                  type="checkbox"
                  checked={alertsEnabled}
                  onChange={() => {
                    setAlertsEnabled(!alertsEnabled);
                    showToast(`Deadline alerts ${!alertsEnabled ? 'enabled' : 'disabled'}`, 'info');
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-1)' }}>Attendance Minimum Standing Warnings</strong>
                  <small style={{ color: 'var(--text-3)', fontSize: '11px' }}>Notify when attendance nears the 75% cutoff</small>
                </div>
                <input
                  type="checkbox"
                  checked={attendWarnEnabled}
                  onChange={() => {
                    setAttendWarnEnabled(!attendWarnEnabled);
                    showToast(`Attendance alerts ${!attendWarnEnabled ? 'enabled' : 'disabled'}`, 'info');
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-1)' }}>AI Study Recommendations</strong>
                  <small style={{ color: 'var(--text-3)', fontSize: '11px' }}>Daily morning revision suggestions</small>
                </div>
                <input
                  type="checkbox"
                  checked={aiDigestEnabled}
                  onChange={() => {
                    setAiDigestEnabled(!aiDigestEnabled);
                    showToast(`AI study recommendations ${!aiDigestEnabled ? 'enabled' : 'disabled'}`, 'info');
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Account Security & Password Card */}
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
            Account Security &amp; Access
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
            University authentication sessions are safeguarded by cryptographic token verification, HttpOnly browser security cookies, and row-level database ownership.
          </p>

          <div style={{ padding: '16px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
              <span>🛡️</span> Active Authenticated Session
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
              Protected by isolated student session keys and PostgreSQL tenant constraints.
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={onOpenPasswordModal}
            style={{ padding: '10px 20px', alignSelf: 'flex-start', fontWeight: 700 }}
          >
            Change Account Password
          </button>
        </div>

        {/* 4. Local Data Portability & Workspace Storage */}
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
            Workspace Backup &amp; Data Portability
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
            Export your entire workspace (tasks, attendance history, notes, and study sprints) to a portable JSON backup file, or restore an existing backup on any device.
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onExportBackup}
              style={{ fontWeight: 700 }}
            >
              Export Backup (.json)
            </button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0, fontWeight: 700 }}>
              Import Backup (.json)
              <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

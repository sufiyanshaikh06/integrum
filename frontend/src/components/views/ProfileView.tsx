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
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [bunkWarnEnabled, setBunkWarnEnabled] = useState(true);
  const [aiDigestEnabled, setAiDigestEnabled] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    onSaveProfile(name, email);
    showToast('Profile credentials updated successfully!', 'success');
  };

  const downloadHallTicket = () => {
    setIsTicketModalOpen(true);
    showToast('📄 Opened October 2026 Examination Hall Ticket preview', 'success');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImportBackup?.(json);
      } catch {
        showToast('Invalid JSON backup file', 'error');
      }
    };
    reader.readAsText(file);
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
              <b>Auditorium Hall 4A · Metropolitan Centre 042</b>
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
        {/* Data Portability & Backup */}
        <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 800 }}>Workspace Backup & Portability</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-2)' }}>
            Integrum stores your curriculum and progress locally. Export your full workspace to a JSON backup file to transfer between devices or restore anytime.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={onExportBackup}>
              📥 Export Backup (.json)
            </button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
              📤 Import Backup (.json)
              <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

      {/* Official Hall Ticket Modal Preview */}
      {isTicketModalOpen && (
        <div className="modal-overlay open" onClick={() => setIsTicketModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>University Examination Hall Ticket</h3>
              <button className="modal-close" onClick={() => setIsTicketModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '24px', background: '#ffffff', color: '#111827', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Metropolitan University · Faculty of Technology
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#4b5563' }}>
                  Semester 5 (Fall 2026) Official Examination Admit Card
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', marginBottom: '16px', background: '#f9fafb', padding: '12px', borderRadius: '6px' }}>
                <div>Candidate Name: <b>{studentInfo.name}</b></div>
                <div>Seat Number: <b>INT2024001</b></div>
                <div>PRN / Roll No: <b>{studentInfo.roll}</b></div>
                <div>Centre Code: <b>042 · Auditorium Hall 4A</b></div>
                <div style={{ gridColumn: '1 / -1' }}>Examination Venue: <b>Metropolitan Institute Examination Centre (Hall 4A, Row 3)</b></div>
              </div>

              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ background: '#e5e7eb', borderBottom: '1px solid #9ca3af' }}>
                    <th style={{ padding: '6px 8px' }}>Date</th>
                    <th style={{ padding: '6px 8px' }}>Course Code</th>
                    <th style={{ padding: '6px 8px' }}>Course Title</th>
                    <th style={{ padding: '6px 8px' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 8px' }}>Oct 19, 2026</td>
                    <td style={{ padding: '6px 8px' }}>1105111</td>
                    <td style={{ padding: '6px 8px' }}>Artificial Intelligence</td>
                    <td style={{ padding: '6px 8px' }}>02:30 PM</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 8px' }}>Oct 21, 2026</td>
                    <td style={{ padding: '6px 8px' }}>1105112</td>
                    <td style={{ padding: '6px 8px' }}>Cyber & Information Security</td>
                    <td style={{ padding: '6px 8px' }}>02:30 PM</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 8px' }}>Oct 22, 2026</td>
                    <td style={{ padding: '6px 8px' }}>1105115</td>
                    <td style={{ padding: '6px 8px' }}>IKS in Computational Systems</td>
                    <td style={{ padding: '6px 8px' }}>02:30 PM</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 8px' }}>Oct 23, 2026</td>
                    <td style={{ padding: '6px 8px' }}>1105116</td>
                    <td style={{ padding: '6px 8px' }}>Software Testing & Quality Assurance</td>
                    <td style={{ padding: '6px 8px' }}>02:30 PM</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 8px' }}>Oct 28, 2026</td>
                    <td style={{ padding: '6px 8px' }}>1105118</td>
                    <td style={{ padding: '6px 8px' }}>Regression Analysis in R (Practical)</td>
                    <td style={{ padding: '6px 8px' }}>09:00 AM</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ fontSize: '10px', color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                * Verified digitally by Controller of Examinations. Carry original College Photo Identity card.
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-secondary" onClick={() => setIsTicketModalOpen(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
            </div>
          </div>
        </div>
      )}
}

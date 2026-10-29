import { useState } from 'react';
import type { StudentDirectoryItem, AnnouncementItem } from '../../types';

interface AdminProps {
  students?: StudentDirectoryItem[];
  announcements?: AnnouncementItem[];
  onOpenAnnounceModal: () => void;
  onSwitchToStudentView?: () => void;
  onOpenDemoModal?: () => void;
}

export default function AdminView({
  students = [],
  announcements = [],
  onOpenAnnounceModal,
  onSwitchToStudentView: _onSwitchToStudentView,
  onOpenDemoModal,
}: AdminProps) {
  const [studentSearch, setStudentSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');

  const safeStudents = Array.isArray(students) ? students : [];
  const safeAnnouncements = Array.isArray(announcements) ? announcements : [];

  const filteredStudents = safeStudents.filter((s) => {
    if (!s) return false;
    const branch = s.branch || (s as any).dept || 'Computer Science';
    if (branchFilter !== 'ALL' && !branch.toLowerCase().includes(branchFilter.toLowerCase())) {
      return false;
    }
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      const name = (s.name || '').toLowerCase();
      const roll = (s.roll || '').toLowerCase();
      return name.includes(q) || roll.includes(q);
    }
    return true;
  });

  return (
    <div className="view active" id="v-admin">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>University Administration Portal</h2>
            <span className="admin-badge">Faculty Access</span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Administrative management of engineering department records, circulars, and student standing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-outline"
            id="btnAdminSupport"
            onClick={() => {
              if (onOpenDemoModal) {
                onOpenDemoModal();
              } else {
                alert('University Enterprise Support: Connect directly at enterprise@integrum.ac.in or request a guided administrative walkthrough.');
              }
            }}
          >
            Institutional Support & Demo
          </button>
          <button className="btn btn-primary" onClick={onOpenAnnounceModal}>
            + Post Circular
          </button>
        </div>
      </div>

      {/* Admin KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <small style={{ color: 'var(--text-3)', fontWeight: 700 }}>ENROLLED STUDENTS</small>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', margin: '4px 0' }}>248</div>
          <span style={{ fontSize: '11px', color: 'var(--success)' }}>CSE Department</span>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <small style={{ color: 'var(--text-3)', fontWeight: 700 }}>ACTIVE COURSEWORKS</small>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--info)', margin: '4px 0' }}>18</div>
          <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Semester 5</span>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <small style={{ color: 'var(--text-3)', fontWeight: 700 }}>FACULTY CIRCULARS</small>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)', margin: '4px 0' }}>{safeAnnouncements.length}</div>
          <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Broadcast to Portal</span>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <small style={{ color: 'var(--text-3)', fontWeight: 700 }}>EXAM CENTRES</small>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--success)', margin: '4px 0' }}>6 Halls</div>
          <span style={{ fontSize: '11px', color: 'var(--success)' }}>October Seating Ready</span>
        </div>
      </div>

      {/* Campus Circulars Broadcaster */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Campus Circulars & Announcements</h3>
          <span className="badge badge-primary">Broadcast Stream</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {safeAnnouncements.length === 0 ? (
            <div style={{ padding: '16px', color: 'var(--text-3)', textAlign: 'center', fontSize: '13px' }}>
              No circulars posted yet. Click "+ Post Circular" above to broadcast an official announcement.
            </div>
          ) : (
            safeAnnouncements.map((a) => (
              <div key={a.id} style={{ padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px' }}>{a.title}</strong>
                  <span className="badge badge-secondary" style={{ fontSize: '10px' }}>{a.category || (a as any).cat || 'General'}</span>
                </div>
                <p style={{ margin: '6px 0 8px 0', fontSize: '12px', color: 'var(--text-2)' }}>{a.content || (a as any).body || ''}</p>
                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                  Published on {a.date || 'Today'} · By {a.author || 'Office of the Dean'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Student Directory */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Student Directory & Academic Health</h3>
            <small style={{ color: 'var(--text-3)' }}>Directory for Computer Science & Engineering</small>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="form-input"
              placeholder="Search by name or roll..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              style={{ fontSize: '12px', padding: '6px 10px', width: '220px' }}
            />
            <select
              className="form-select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              style={{ fontSize: '12px', padding: '6px 10px' }}
            >
              <option value="ALL">All Branches</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Tech">Information Tech</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="tbl" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-3)' }}>
                <th style={{ padding: '10px 12px' }}>Roll Number</th>
                <th style={{ padding: '10px 12px' }}>Student Name</th>
                <th style={{ padding: '10px 12px' }}>Branch & Sem</th>
                <th style={{ padding: '10px 12px' }}>CGPA</th>
                <th style={{ padding: '10px 12px' }}>Attendance</th>
                <th style={{ padding: '10px 12px' }}>Standing</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)' }}>
                    No student records matching current filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const cgpaVal = typeof s.cgpa === 'number' ? s.cgpa : parseFloat((s as any).cgpa) || 8.5;
                  const attVal = typeof s.attendance === 'number' ? s.attendance : parseFloat(String((s as any).attendance || (s as any).att || '85')) || 85;
                  const branchVal = s.branch || (s as any).dept || 'Computer Science';
                  const semVal = s.sem || 'Semester 5';
                  const statusVal = s.status || (attVal >= 75 ? 'Regular' : 'Academic Caution');

                  return (
                    <tr key={s.roll} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{s.roll}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 800 }}>{s.name}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)' }}>
                        {branchVal} · {semVal}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{cgpaVal.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: attVal >= 75 ? 'var(--success)' : 'var(--error)' }}>
                        {attVal}%
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          className={`badge ${
                            statusVal === 'Dean List' ? 'badge-primary' : statusVal === 'Regular' ? 'badge-success' : 'badge-warning'
                          }`}
                        >
                          {statusVal}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

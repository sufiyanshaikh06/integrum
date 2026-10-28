import { useState } from 'react';
import type { AttendanceRecord } from '../../types';

interface AttendanceProps {
  attendance: Record<string, AttendanceRecord>;
  onLogToday: (code: string, status: 'present' | 'absent' | 'late') => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AttendanceView({ attendance, onLogToday, showToast }: AttendanceProps) {
  const [selectedCalcCode, setSelectedCalcCode] = useState('1105116');

  // Deduplicate by course code to handle any alias keys gracefully
  const attendMap = new Map<string, AttendanceRecord>();
  Object.values(attendance).forEach((rec) => {
    if (rec && rec.code && !attendMap.has(rec.code)) {
      attendMap.set(rec.code, rec);
    }
  });
  const attendList = Array.from(attendMap.values());
  const totalPres = attendList.reduce((acc, c) => acc + c.present, 0);
  const totalHeld = attendList.reduce((acc, c) => acc + c.total, 0);
  const overallAvg = totalHeld > 0 ? ((totalPres / totalHeld) * 100).toFixed(1) : '85.2';

  // Strict Threshold Math against 75% cutoff requirement
  const selectedCourse = attendList.find((c) => c.code === selectedCalcCode) || attendance[selectedCalcCode] || attendList[0];
  const currentPct = selectedCourse && selectedCourse.total > 0 ? (selectedCourse.present / selectedCourse.total) * 100 : 0;
  const isAboveThreshold = currentPct >= 75.0;

  let calcResult = '';
  if (selectedCourse) {
    if (isAboveThreshold) {
      const maxMissable = Math.max(0, Math.floor(selectedCourse.present / 0.75 - selectedCourse.total));
      calcResult = `✅ Safe Bunk Buffer (${currentPct.toFixed(1)}%): You can safely miss up to ${maxMissable} more ${maxMissable === 1 ? 'class' : 'classes'} while maintaining >= 75% attendance.`;
    } else {
      const needed = Math.max(1, Math.ceil((0.75 * selectedCourse.total - selectedCourse.present) / (1 - 0.75)));
      calcResult = `⚠️ Attendance Deficit (${currentPct.toFixed(1)}%): You cannot safely miss any classes! You must attend the next ${needed} consecutive ${needed === 1 ? 'class' : 'classes'} without absence to recover to 75% standing.`;
    }
  }

  return (
    <div className="view active" id="v-attend">
      {/* Banner */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Attendance Tracker & Safe-Bunk Calculator</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
              Real-time attendance standing across Semester 5 courses against the mandatory 75% university policy.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)' }}>
              {overallAvg}%
            </div>
            <small style={{ color: 'var(--text-2)', fontWeight: 700 }}>Overall Semester Average</small>
          </div>
        </div>
      </div>

      {/* Courses Attendance Table with Quick Logger */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px', overflowX: 'auto' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800 }}>Course Attendance Records & Today's Logger</h3>
        <table className="tbl" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-3)' }}>
              <th style={{ padding: '12px 14px' }}>Course</th>
              <th style={{ padding: '12px 14px' }}>Attended / Held</th>
              <th style={{ padding: '12px 14px' }}>Percentage</th>
              <th style={{ padding: '12px 14px' }}>Status</th>
              <th style={{ padding: '12px 14px' }}>Log Today's Class</th>
            </tr>
          </thead>
          <tbody>
            {attendList.map((c) => {
              const pct = Math.round((c.present / c.total) * 100);
              const isSafe = pct >= 75;
              return (
                <tr key={c.code} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <strong style={{ fontSize: '13px' }}>{c.code} · {c.name}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Absent: {c.absent} · Late: {c.late}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 700 }}>
                    {c.present} / {c.total} classes
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: isSafe ? 'var(--success)' : 'var(--error)' }}>
                      {pct}%
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={`badge ${isSafe ? 'badge-success' : 'badge-warning'}`}>
                      {isSafe ? 'Eligible' : 'Caution'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => {
                          onLogToday(c.code, 'present');
                          showToast(`Logged Present for ${c.code}`, 'success');
                        }}
                      >
                        + Present
                      </button>
                      <button
                        className="btn btn-xs btn-secondary"
                        onClick={() => {
                          onLogToday(c.code, 'absent');
                          showToast(`Logged Absent for ${c.code}`, 'info');
                        }}
                      >
                        + Absent
                      </button>
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => {
                          onLogToday(c.code, 'late');
                          showToast(`Logged Late for ${c.code}`, 'info');
                        }}
                      >
                        + Late
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Smart Safe-Bunk Recovery Calculator */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 800 }}>Smart Safe-Bunk & Recovery Calculator</h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-2)' }}>
          Select any course to calculate your exact safe bunk buffer or consecutive attendance requirement.
        </p>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px', fontWeight: 700 }}>Select Course:</label>
          <select
            className="form-select"
            value={selectedCalcCode}
            onChange={(e) => setSelectedCalcCode(e.target.value)}
            style={{ maxWidth: '340px' }}
          >
            {attendList.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.name} ({Math.round((c.present / c.total) * 100)}%)
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            padding: '16px',
            background: isAboveThreshold ? 'var(--success-light)' : 'var(--warning-light)',
            borderLeft: `4px solid ${isAboveThreshold ? 'var(--success)' : 'var(--warning)'}`,
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            color: 'var(--text-1)',
            fontWeight: 600,
          }}
        >
          {calcResult}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { AttendanceRecord } from '../../types';

interface AttendanceProps {
  attendance: Record<string, AttendanceRecord>;
  onLogToday: (code: string, status: 'present' | 'absent' | 'late') => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AttendanceView({ attendance, onLogToday, showToast }: AttendanceProps) {
  // Deduplicate courses by normalized code
  const attendMap = new Map<string, AttendanceRecord>();
  Object.values(attendance || {}).forEach((rec) => {
    if (rec && rec.code) {
      const normalizedCode = String(rec.code).trim();
      if (!attendMap.has(normalizedCode)) {
        attendMap.set(normalizedCode, { ...rec, code: normalizedCode });
      }
    }
  });

  const attendList = Array.from(attendMap.values());
  const [selectedCalcCode, setSelectedCalcCode] = useState<string>(() => {
    // Default to Software Testing if present, or first course
    const stqa = attendList.find((c) => String(c.code).includes('1105116') || c.name.toLowerCase().includes('software testing'));
    return stqa ? String(stqa.code) : attendList[0]?.code ? String(attendList[0].code) : '1105116';
  });

  const totalPres = attendList.reduce((acc, c) => acc + (c.present || 0), 0);
  const totalHeld = attendList.reduce((acc, c) => acc + (c.total || 0), 0);
  const overallAvg = totalHeld > 0 ? ((totalPres / totalHeld) * 100).toFixed(1) : '85.2';

  // Strict Threshold Math against 75% cutoff requirement
  const selectedCourse =
    attendList.find((c) => String(c.code) === String(selectedCalcCode)) ||
    attendList.find((c) => c.name.toLowerCase().includes(String(selectedCalcCode).toLowerCase())) ||
    attendList[0];

  const presentCount = selectedCourse?.present ?? 0;
  const totalCount = selectedCourse?.total ?? 1;
  const currentPct = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
  const isAboveThreshold = currentPct >= 75.0;

  let calcResult = '';
  let maxMissable = 0;
  let neededClasses = 0;

  const MAX_SEMESTER_LECTURES = 40;
  const remainingInSemester = Math.max(0, MAX_SEMESTER_LECTURES - totalCount);

  if (selectedCourse) {
    if (isAboveThreshold) {
      maxMissable = Math.max(0, Math.floor(presentCount / 0.75 - totalCount));
      calcResult = `Attendance Clearance Buffer (${currentPct.toFixed(1)}%): You maintain a safe clearance margin of ${maxMissable} ${maxMissable === 1 ? 'class' : 'classes'} while remaining at or above the 75% requirement.`;
    } else {
      neededClasses = Math.max(1, Math.ceil((0.75 * totalCount - presentCount) / 0.25));
      if (totalCount >= MAX_SEMESTER_LECTURES || neededClasses > remainingInSemester) {
        calcResult = `Attendance Recovery Impossible This Semester (${currentPct.toFixed(1)}%): Reaching 75% would require attending ${neededClasses} consecutive classes, but only ${remainingInSemester} ${remainingInSemester === 1 ? 'lecture remains' : 'lectures remain'} in the semester (${MAX_SEMESTER_LECTURES} total limit). Please contact your faculty advisor immediately regarding condonation.`;
      } else {
        calcResult = `Attendance Deficit (${currentPct.toFixed(1)}%): You must attend the next ${neededClasses} consecutive ${neededClasses === 1 ? 'class' : 'classes'} (out of ${remainingInSemester} remaining this semester) without absence to restore 75% standing.`;
      }
    }
  }

  return (
    <div className="view active" id="v-attend">
      {/* Banner */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Attendance Health & Course Standing</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
              Real-time attendance standing across Semester 5 courses against the mandatory 75% university policy.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: Number(overallAvg) >= 75 ? 'var(--success)' : 'var(--error)' }}>
              {overallAvg}%
            </div>
            <small style={{ color: 'var(--text-2)', fontWeight: 700 }}>Overall Semester Average</small>
          </div>
        </div>
      </div>

      {/* Course Attendance List */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px', overflowX: 'auto' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800 }}>Enrolled Course Attendance Summary</h3>
        <table className="tbl" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-3)' }}>
              <th style={{ padding: '12px 14px' }}>Course Code & Title</th>
              <th style={{ padding: '12px 14px' }}>Attended / Held</th>
              <th style={{ padding: '12px 14px' }}>Percentage</th>
              <th style={{ padding: '12px 14px' }}>Status</th>
              <th style={{ padding: '12px 14px' }}>Quick Log Attendance</th>
            </tr>
          </thead>
          <tbody>
            {attendList.map((c) => {
              const pct = c.total > 0 ? Math.round((c.present / c.total) * 100) : 0;
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

      {/* Attendance Standing & Recovery Calculator */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 800 }}>Course Attendance Standing & Recovery Calculator</h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-2)' }}>
          Select any course to calculate your exact attendance clearance margin or consecutive recovery requirement.
        </p>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px', fontWeight: 700 }}>Select Course:</label>
          <select
            className="form-select"
            value={selectedCalcCode}
            onChange={(e) => setSelectedCalcCode(e.target.value)}
            style={{ maxWidth: '380px', fontSize: '13px', fontWeight: 600 }}
          >
            {attendList.map((c) => {
              const p = c.total > 0 ? Math.round((c.present / c.total) * 100) : 0;
              return (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.name} ({p}%) — {c.present}/{c.total} classes
                </option>
              );
            })}
          </select>
        </div>

        <div
          style={{
            padding: '16px',
            background: isAboveThreshold ? 'var(--success-light)' : 'var(--warning-light)',
            borderLeft: `4px solid ${isAboveThreshold ? 'var(--success)' : '#B45309'}`,
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            color: 'var(--text-1)',
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          {calcResult}
        </div>
      </div>
    </div>
  );
}

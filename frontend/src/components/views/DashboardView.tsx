import type { StudentInfo, AttendanceRecord, AssignmentItem, TaskItem, ReminderItem, NoteItem, ActiveView } from '../../types';

interface DashboardProps {
  studentInfo: StudentInfo;
  attendance: Record<string, AttendanceRecord>;
  assignments: AssignmentItem[];
  tasks: TaskItem[];
  reminders: ReminderItem[];
  notes: NoteItem[];
  studyLogged: number;
  studyTarget: number;
  onNavigate: (view: ActiveView) => void;
  onOpenTaskModal: () => void;
  onOpenRemModal: () => void;
  onSnoozeRem: (id: string) => void;
  onDismissRem: (id: string) => void;
}

export default function DashboardView({
  studentInfo,
  attendance,
  assignments,
  tasks,
  reminders,
  notes,
  studyLogged,
  studyTarget,
  onNavigate,
  onOpenTaskModal,
  onOpenRemModal,
  onSnoozeRem,
  onDismissRem,
}: DashboardProps) {
  const attendList = Object.values(attendance);
  const totalPres = attendList.reduce((acc, c) => acc + c.present, 0);
  const totalHeld = attendList.reduce((acc, c) => acc + c.total, 0);
  const avgAttend = totalHeld > 0 ? ((totalPres / totalHeld) * 100).toFixed(1) : '85.2';
  const overallBunks = Math.floor(totalPres / 0.75 - totalHeld);

  const pendingAsgns = assignments.filter((a) => a.status === 'Pending');
  const activeRems = reminders.filter((r) => r.status === 'active');
  const studyPct = Math.round((studyLogged / studyTarget) * 100);

  return (
    <div className="view active" id="v-dashboard">
      {/* Welcome Banner */}
      <div className="welcome-banner welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)' }}>
            Welcome back, {studentInfo.name} 👋
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            {studentInfo.branch} · {studentInfo.sem} · Roll: <strong>{studentInfo.roll}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-primary" onClick={() => onNavigate('study')}>
            + Start 25m Focus Sprint
          </button>
          <button className="btn btn-sm btn-outline" onClick={onOpenTaskModal}>
            + Add Task
          </button>
        </div>
      </div>

      {/* 4 Vital Metric Cards */}
      <div className="dash-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '20px 0' }}>
        <div className="stat-card card">
          <div className="stat-lbl">SGPA Standing</div>
          <div className="stat-val" style={{ color: 'var(--primary)', fontSize: '1.8rem', fontWeight: 800 }}>
            8.92 <span style={{ fontSize: '0.9rem', color: 'var(--text-3)' }}>/ 10.0</span>
          </div>
          <small style={{ color: 'var(--success)', fontWeight: 700 }}>+0.28 vs Semester 4 · Top 5%</small>
        </div>

        <div className="stat-card card">
          <div className="stat-lbl">Attendance Average</div>
          <div className="stat-val" style={{ color: 'var(--success)', fontSize: '1.8rem', fontWeight: 800 }}>
            {avgAttend}%
          </div>
          <small style={{ color: overallBunks >= 0 ? 'var(--text-2)' : 'var(--error)' }}>Safe bunk margin: <strong>{overallBunks >= 0 ? `+${overallBunks} classes` : `${overallBunks} classes (Recovery required)`}</strong></small>
        </div>

        <div className="stat-card card">
          <div className="stat-lbl">Active Courseworks</div>
          <div className="stat-val" style={{ color: 'var(--info)', fontSize: '1.8rem', fontWeight: 800 }}>
            5 Subjects
          </div>
          <small style={{ color: 'var(--warning)', fontWeight: 700 }}>{pendingAsgns.length} Pending Submissions</small>
        </div>

        <div className="stat-card card">
          <div className="stat-lbl">Weekly Focus Sprint</div>
          <div className="stat-val" style={{ color: 'var(--accent)', fontSize: '1.8rem', fontWeight: 800 }}>
            {studyLogged.toFixed(1)}h <span style={{ fontSize: '0.9rem', color: 'var(--text-3)' }}>/ {studyTarget}h</span>
          </div>
          <small style={{ color: 'var(--success)', fontWeight: 700 }}>{studyPct}% of sprint goal met</small>
        </div>
      </div>

      {/* 3-Column Action Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Today's Action Focus */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Today's Action Focus</h3>
            <span className="badge badge-primary">Oct 15 Focus</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--error)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '13px' }}>Artificial Intelligence Midterm Exam</strong>
                <span className="badge badge-error">Today 10:30 AM</span>
              </div>
              <small style={{ color: 'var(--text-2)' }}>Hall 4A · Closed Book Theory Examination</small>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '13px' }}>STQA Automated Selenium Test Suite</strong>
                <span className="badge badge-warning">Due in 2 days</span>
              </div>
              <small style={{ color: 'var(--text-2)' }}>Coursework submission on University LMS</small>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '13px' }}>R Programming Lab Mini-Project</strong>
                <span className="badge badge-success">Completed</span>
              </div>
              <small style={{ color: 'var(--text-2)' }}>Regression model on student performance datasets</small>
            </div>
          </div>
        </div>

        {/* October Examination Schedule */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>October 2026 Examination Timetable</h3>
            <button className="btn btn-xs btn-outline" onClick={() => onNavigate('cal')}>
              Full Calendar →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <strong style={{ fontSize: '12px' }}>1105111 · Artificial Intelligence</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Venue: Hall 4A · Seating Row 3</div>
              </div>
              <span className="badge badge-primary" style={{ height: 'fit-content' }}>Oct 15</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <strong style={{ fontSize: '12px' }}>1105112 · Cyber & Info Security</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Venue: Hall 3B · Seating Row 5</div>
              </div>
              <span className="badge badge-secondary" style={{ height: 'fit-content' }}>Oct 17</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <strong style={{ fontSize: '12px' }}>1105115 · IKS in Computational Systems</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Venue: Hall 4A · Seating Row 2</div>
              </div>
              <span className="badge badge-secondary" style={{ height: 'fit-content' }}>Oct 20</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <strong style={{ fontSize: '12px' }}>1105116 · Software Testing & QA</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Venue: Hall 2C · Seating Row 4</div>
              </div>
              <span className="badge badge-secondary" style={{ height: 'fit-content' }}>Oct 22</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <strong style={{ fontSize: '12px' }}>1105118 · R Programming Practical</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Venue: Computer Lab 1</div>
              </div>
              <span className="badge badge-secondary" style={{ height: 'fit-content' }}>Oct 26</span>
            </div>
          </div>
        </div>

        {/* Active Reminders & Alerts */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Active Reminders & Alerts</h3>
            <button className="btn btn-xs btn-primary" onClick={onOpenRemModal}>
              + Schedule Alert
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeRems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)', fontSize: '12px' }}>
                No active alerts right now
              </div>
            ) : (
              activeRems.slice(0, 4).map((rem) => (
                <div
                  key={rem.id}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '12px', color: 'var(--text-1)' }}>{rem.title}</strong>
                    <span className="badge badge-warning" style={{ fontSize: '10px' }}>{rem.time}</span>
                  </div>
                  <p style={{ margin: '4px 0 8px 0', fontSize: '11px', color: 'var(--text-2)' }}>{rem.desc}</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => onSnoozeRem(rem.id)}
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                    >
                      Snooze 24h
                    </button>
                    <button
                      className="btn btn-xs btn-secondary"
                      onClick={() => onDismissRem(rem.id)}
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Secondary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Attendance Health Progress */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Course Attendance Standing</h3>
              <small style={{ color: 'var(--text-3)' }}>University 75% Cutoff Threshold</small>
            </div>
            <button className="btn btn-xs btn-outline" onClick={() => onNavigate('attend')}>
              Open Calculator →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {attendList.map((c) => {
              const pct = Math.round((c.present / c.total) * 100);
              const isSafe = pct >= 75;
              return (
                <div key={c.code}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <strong>{c.code} · {c.name}</strong>
                    <span style={{ fontWeight: 800, color: isSafe ? 'var(--success)' : 'var(--error)' }}>
                      {pct}% ({c.present}/{c.total})
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-3)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: isSafe ? 'var(--success)' : 'var(--error)',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Study Hours & Timetable Focus */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Weekly Study Sprint</h3>
              <small style={{ color: 'var(--text-3)' }}>Goal: {studyTarget} hours / week</small>
            </div>
            <button className="btn btn-xs btn-primary" onClick={() => onNavigate('study')}>
              ▶ Launch Pomodoro
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* SVG Circular Ring */}
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--bg-3)"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3.8"
                  strokeDasharray={`${studyPct}, 100`}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <strong style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary)' }}>{studyPct}%</strong>
                <small style={{ fontSize: '10px', color: 'var(--text-3)' }}>COMPLETED</small>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div>
                <strong style={{ color: 'var(--text-1)' }}>{studyLogged.toFixed(1)} Hours Logged</strong>
                <p style={{ margin: 0, color: 'var(--text-3)' }}>{(studyTarget - studyLogged).toFixed(1)} hours remaining this week</p>
              </div>
              <div style={{ padding: '8px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
                <b>Recommended Sprint:</b> 2x 25m Focus on STQA automated test suites today.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3rd Row: Priority Tasks & Recent Study Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Productivity Tasks Snapshot */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Productivity Tasks</h3>
              <small style={{ color: 'var(--text-3)' }}>Immediate Focus Items</small>
            </div>
            <button className="btn btn-xs btn-outline" onClick={() => onNavigate('tasks')}>
              All Tasks →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasks.slice(0, 4).map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--bg-3)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '12px' }} className={t.status === 'DONE' ? 'done-txt' : ''}>
                    {t.title}
                  </strong>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{t.subject || 'General'}</div>
                </div>
                <span className={`badge ${t.status === 'DONE' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10px' }}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Study Notes */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Recent Study Notes</h3>
              <small style={{ color: 'var(--text-3)' }}>Curriculum Markdown Summaries</small>
            </div>
            <button className="btn btn-xs btn-outline" onClick={() => onNavigate('notes')}>
              Notes Manager →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notes.slice(0, 3).map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-3)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '12px', color: 'var(--text-1)' }}>{n.title}</strong>
                  <span className="badge badge-secondary" style={{ fontSize: '10px' }}>{n.code}</span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-2)' }}>
                  {n.excerpt || n.content.slice(0, 80) + '...'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

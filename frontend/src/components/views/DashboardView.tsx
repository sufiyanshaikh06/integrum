import type { StudentInfo, AttendanceRecord, AssignmentItem, TaskItem, ReminderItem, NoteItem, ActiveView, CalendarEventItem } from '../../types';

interface DashboardProps {
  studentInfo: StudentInfo;
  attendance: Record<string, AttendanceRecord>;
  assignments: AssignmentItem[];
  tasks: TaskItem[];
  reminders: ReminderItem[];
  notes: NoteItem[];
  calendarEvents?: Record<string, CalendarEventItem[]>;
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
  attendance = {},
  assignments = [],
  tasks = [],
  reminders = [],
  notes = [],
  calendarEvents = {},
  studyLogged = 0,
  studyTarget = 25,
  onNavigate,
  onOpenTaskModal,
  onOpenRemModal,
  onSnoozeRem,
  onDismissRem,
}: DashboardProps) {
  const attendList = Object.values(attendance || {});
  const totalPres = attendList.reduce((acc, c) => acc + (c.present || 0), 0);
  const totalHeld = attendList.reduce((acc, c) => acc + (c.total || 0), 0);
  const avgAttend = totalHeld > 0 ? ((totalPres / totalHeld) * 100).toFixed(1) : '0.0';
  const attendanceBuffer = totalHeld > 0 ? Math.floor(totalPres / 0.75 - totalHeld) : 0;

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const safeReminders = Array.isArray(reminders) ? reminders : [];
  const safeNotes = Array.isArray(notes) ? notes : [];

  const completedTasks = safeTasks.filter((t) => t.status === 'DONE');
  const pendingTasks = safeTasks.filter((t) => t.status !== 'DONE');
  const taskCompletionPct = safeTasks.length > 0 ? Math.round((completedTasks.length / safeTasks.length) * 100) : 0;

  const pendingAsgns = safeAssignments.filter((a) => a.status === 'Pending');
  const activeRems = safeReminders.filter((r) => r.status === 'active');
  const studyPct = studyTarget > 0 ? Math.min(100, Math.round((studyLogged / studyTarget) * 100)) : 0;

  // Flatten calendar events
  const allEvents: Array<CalendarEventItem & { day: string }> = [];
  Object.entries(calendarEvents || {}).forEach(([day, evList]) => {
    if (Array.isArray(evList)) {
      evList.forEach((ev) => allEvents.push({ ...ev, day }));
    }
  });

  return (
    <div className="view active" id="v-dashboard">
      {/* Welcome Banner */}
      <div className="welcome-banner welcome card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '24px 28px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span className="chip chip-apricot" style={{ fontSize: '11px', fontWeight: 800 }}>
              ✦ ACADEMIC COHORT v2
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>
              {studentInfo.branch ? `${studentInfo.branch} · ` : ''}{studentInfo.sem ? `${studentInfo.sem}` : ''}
            </span>
          </div>
          <h2 className="display" style={{ margin: '0 0 6px 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-1)' }}>
            Welcome back, <em>{studentInfo.name || 'Student'}</em>
          </h2>
          <p style={{ margin: 0, color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Roll No: <strong style={{ color: 'var(--text-1)' }}>{studentInfo.roll || 'Not Assigned'}</strong> · Regulation 6086 Verified Standing
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-primary" onClick={() => onNavigate('study')}>
            + Start 25m Focus Sprint
          </button>
          <button className="btn btn-sm btn-outline" onClick={onOpenTaskModal}>
            + Add Task
          </button>
        </div>
      </div>

      {/* 4 Vital Metric Cards — Bento Layout */}
      <div className="dash-stats-grid bento-grid" style={{ marginBottom: '24px' }}>
        {/* Metric 1: Task Completion Standing */}
        <div className="stat-card card glass col-span-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div className="stat-lbl" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Task Completion
            </div>
            <span className="chip chip-primary" style={{ fontSize: '10px' }}>Active Sprint</span>
          </div>
          <div className="stat-val display" style={{ color: 'var(--action)', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.1 }}>
            {taskCompletionPct}%
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className={completedTasks.length > 0 ? 'chip chip-success' : 'chip chip-info'} style={{ fontSize: '11px' }}>
              {completedTasks.length} of {safeTasks.length} goals achieved
            </span>
          </div>
        </div>

        {/* Metric 2: Attendance Average */}
        <div className="stat-card card glass col-span-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div className="stat-lbl" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Attendance Health
            </div>
            <span className={Number(avgAttend) >= 75 ? 'chip chip-success' : 'chip chip-error'} style={{ fontSize: '10px' }}>
              {Number(avgAttend) >= 75 ? 'Safe Clearance' : 'Below Cutoff'}
            </span>
          </div>
          <div className="stat-val display" style={{ color: Number(avgAttend) >= 75 ? 'var(--success)' : 'var(--error)', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.1 }}>
            {avgAttend}%
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className={attendanceBuffer >= 0 ? 'chip chip-info' : 'chip chip-error'} style={{ fontSize: '11px' }}>
              {totalHeld > 0
                ? `${attendanceBuffer >= 0 ? `+${attendanceBuffer} buffer lectures` : `${attendanceBuffer} lectures deficit`}`
                : 'No lectures held yet'}
            </span>
          </div>
        </div>

        {/* Metric 3: Active Courseworks */}
        <div className="stat-card card glass col-span-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div className="stat-lbl" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Active Courseworks
            </div>
            <span className={pendingAsgns.length > 0 ? 'chip chip-warning' : 'chip chip-success'} style={{ fontSize: '10px' }}>
              {pendingAsgns.length > 0 ? `${pendingAsgns.length} Pending` : 'All Clear'}
            </span>
          </div>
          <div className="stat-val display" style={{ color: 'var(--secondary-ink)', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.1 }}>
            {attendList.length > 0 ? `${attendList.length} Subjects` : `${safeAssignments.length} Assignments`}
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className={pendingAsgns.length > 0 ? 'chip chip-warning' : 'chip chip-success'} style={{ fontSize: '11px' }}>
              {pendingAsgns.length} deliverables pending review
            </span>
          </div>
        </div>

        {/* Metric 4: Weekly Focus Sprint */}
        <div className="stat-card card glass col-span-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div className="stat-lbl" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Weekly Focus Sprint
            </div>
            <span className="chip chip-apricot" style={{ fontSize: '10px' }}>Pomodoro</span>
          </div>
          <div className="stat-val display" style={{ color: 'var(--apricot)', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.1 }}>
            {studyLogged.toFixed(1)}h <span style={{ fontSize: '1rem', color: 'var(--text-3)', fontStyle: 'normal' }}>/ {studyTarget}h</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className="chip chip-apricot" style={{ fontSize: '11px' }}>
              {studyPct}% of sprint goal logged
            </span>
          </div>
        </div>
      </div>

      {/* 3-Column Action Layout — Bento Layout */}
      <div className="bento-grid" style={{ marginBottom: '24px' }}>
        {/* Today's Action Focus - Dynamically populated from pending tasks & assignments */}
        <div className="card glass col-span-4" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 className="display" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Today's Action Focus</h3>
            <button className="btn btn-xs btn-outline" onClick={() => onNavigate('tasks')}>
              Tasks →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingTasks.length === 0 && pendingAsgns.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
                🎉 You are all caught up! No urgent tasks or pending assignment deadlines for today.
              </div>
            ) : (
              <>
                {pendingAsgns.slice(0, 2).map((a) => (
                  <div key={a.id} style={{ padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '12.5px' }}>{a.title}</strong>
                      <span className="chip chip-warning" style={{ fontSize: '10px' }}>{a.dueDate || 'Due Soon'}</span>
                    </div>
                    <small style={{ color: 'var(--text-2)', fontSize: '11px' }}>{a.code || a.subject || 'Coursework'}</small>
                  </div>
                ))}

                {pendingTasks.slice(0, 2).map((t) => (
                  <div key={t.id} style={{ padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '12.5px' }}>{t.title}</strong>
                      <span className={`chip ${t.priority === 'HIGH' ? 'chip-error' : 'chip-primary'}`} style={{ fontSize: '10px' }}>
                        {t.priority}
                      </span>
                    </div>
                    <small style={{ color: 'var(--text-2)', fontSize: '11px' }}>Subject: {t.subject || 'General'}</small>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Academic Calendar Events & Deadlines */}
        <div className="card glass col-span-4" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 className="display" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Calendar &amp; Scheduled Events</h3>
            <button className="btn btn-xs btn-outline" onClick={() => onNavigate('cal')}>
              Full Calendar →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {allEvents.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
                No events scheduled. Add an event in the Calendar or check back for institutional exam timetables.
              </div>
            ) : (
              allEvents.slice(0, 4).map((ev, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <strong style={{ fontSize: '12px' }}>{ev.title}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{ev.venue || 'Campus'} {ev.time ? `· ${ev.time}` : ''}</div>
                  </div>
                  <span className="chip chip-primary" style={{ height: 'fit-content', fontSize: '10px' }}>Day {ev.day}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Reminders & Alerts */}
        <div className="card glass col-span-4" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 className="display" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Active Reminders &amp; Alerts</h3>
            <button className="btn btn-xs btn-primary" onClick={onOpenRemModal}>
              + Schedule Alert
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeRems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)', fontSize: '12px' }}>
                No active alerts right now. Click "+ Schedule Alert" to set deadline reminders.
              </div>
            ) : (
              activeRems.slice(0, 3).map((rem) => (
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

      {/* 2-Column Secondary Row — Bento Layout */}
      <div className="bento-grid" style={{ marginBottom: '24px' }}>
        {/* Attendance Health Progress */}
        <div className="card glass col-span-7" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 className="display" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Course Attendance Standing</h3>
              <small style={{ color: 'var(--text-3)' }}>Mandatory 75% Cutoff Threshold</small>
            </div>
            <button className="btn btn-xs btn-outline" onClick={() => onNavigate('attend')}>
              Open Tracker →
            </button>
          </div>

          {attendList.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
              No attendance records yet. Once enrolled in institutional subjects, attendance will be tracked here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {attendList.map((c) => {
                const pct = c.total > 0 ? Math.round((c.present / c.total) * 100) : 0;
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
          )}
        </div>

        {/* Weekly Study Hours & Timetable Focus */}
        <div className="card glass col-span-5" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 className="display" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Weekly Study Sprint</h3>
              <small style={{ color: 'var(--text-3)' }}>Goal: {studyTarget} hours / week</small>
            </div>
            <button className="btn btn-xs btn-primary" onClick={() => onNavigate('study')}>
              ▶ Launch Pomodoro
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* SVG Circular Ring */}
            <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
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
                <small style={{ fontSize: '10px', color: 'var(--text-3)' }}>LOGGED</small>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div>
                <strong style={{ color: 'var(--text-1)' }}>{studyLogged.toFixed(1)} Hours Logged</strong>
                <p style={{ margin: 0, color: 'var(--text-3)' }}>
                  {Math.max(0, studyTarget - studyLogged).toFixed(1)} hours remaining to reach goal
                </p>
              </div>
              <div style={{ padding: '8px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
                <b>Focus Suggestion:</b> Launch a 25-minute Pomodoro study block to start logging hours.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3rd Row: Priority Tasks & Recent Study Notes — Bento Layout */}
      <div className="bento-grid">
        {/* Productivity Tasks Snapshot */}
        <div className="card glass col-span-6" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 className="display" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Productivity Tasks</h3>
              <small style={{ color: 'var(--text-3)' }}>Immediate Focus Items</small>
            </div>
            <button className="btn btn-xs btn-outline" onClick={() => onNavigate('tasks')}>
              All Tasks →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {safeTasks.length === 0 ? (
              <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
                No tasks logged yet. Click "+ Add Task" to organize your academic to-dos.
              </div>
            ) : (
              safeTasks.slice(0, 4).map((t) => (
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
                  <span className={`chip ${t.status === 'DONE' ? 'chip-success' : 'chip-warning'}`} style={{ fontSize: '10px' }}>
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Study Notes */}
        <div className="card glass col-span-6" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 className="display" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Recent Study Notes</h3>
              <small style={{ color: 'var(--text-3)' }}>Markdown Summaries</small>
            </div>
            <button className="btn btn-xs btn-outline" onClick={() => onNavigate('notes')}>
              Notes Manager →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {safeNotes.length === 0 ? (
              <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
                No study notes written yet. Click "Notes Manager →" to draft your first subject note.
              </div>
            ) : (
              safeNotes.slice(0, 3).map((n) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

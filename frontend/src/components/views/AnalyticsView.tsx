import type { TaskItem, AssignmentItem, NoteItem, AttendanceRecord } from '../../types';

interface AnalyticsProps {
  tasks?: TaskItem[];
  studyLogged?: number;
  assignments?: AssignmentItem[];
  notes?: NoteItem[];
  attendance?: Record<string, AttendanceRecord>;
}

export default function AnalyticsView({
  tasks = [],
  studyLogged = 0,
  assignments = [],
  notes = [],
  attendance = {},
}: AnalyticsProps) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const safeNotes = Array.isArray(notes) ? notes : [];
  const attendList = Object.values(attendance || {});

  const totalTasks = safeTasks.length;
  const completedTasks = safeTasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = safeTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const todoTasks = safeTasks.filter((t) => t.status === 'TODO').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalAssignments = safeAssignments.length;
  const pendingAssignments = safeAssignments.filter((a) => a.status === 'Pending').length;
  const submittedAssignments = safeAssignments.filter((a) => a.status === 'Submitted' || a.status === 'Graded').length;

  const totalNotes = safeNotes.length;

  const totalPres = attendList.reduce((acc, c) => acc + (c.present || 0), 0);
  const totalHeld = attendList.reduce((acc, c) => acc + (c.total || 0), 0);
  const attendanceRate = totalHeld > 0 ? ((totalPres / totalHeld) * 100).toFixed(1) : '0.0';

  return (
    <div className="view active" id="v-analytics">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Performance &amp; Progress Analytics</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Live performance telemetry calculated directly from your database tasks, logged study sprints, and coursework submissions.
          </p>
        </div>
      </div>

      {/* Top Vital Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <small style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: '10px' }}>TASK COMPLETION RATE</small>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', margin: '4px 0' }}>
            {taskCompletionRate}%
          </div>
          <span style={{ fontSize: '11px', color: completedTasks > 0 ? 'var(--success)' : 'var(--text-2)', fontWeight: 700 }}>
            {completedTasks} of {totalTasks} tasks finished
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <small style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: '10px' }}>FOCUS STUDY LOGGED</small>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)', margin: '4px 0' }}>
            {studyLogged.toFixed(1)}h
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Logged via Pomodoro sprints</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <small style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: '10px' }}>COURSEWORK SUBMISSIONS</small>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--info)', margin: '4px 0' }}>
            {submittedAssignments} / {totalAssignments}
          </div>
          <span style={{ fontSize: '11px', color: pendingAssignments > 0 ? 'var(--warning)' : 'var(--text-2)' }}>
            {pendingAssignments} pending deadlines
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <small style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: '10px' }}>OVERALL ATTENDANCE</small>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: Number(attendanceRate) >= 75 ? 'var(--accent)' : 'var(--error)', margin: '4px 0' }}>
            {attendanceRate}%
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>
            {attendList.length > 0 ? `${attendList.length} enrolled courses` : 'No courses enrolled'}
          </span>
        </div>
      </div>

      {/* Task & Productivity Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Task Pipeline Health */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Task Lifecycle Breakdown</h3>
            <span className="badge badge-primary">{totalTasks} Total Tasks</span>
          </div>

          {totalTasks === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
              No tasks recorded in your workspace yet. Create a task in the Task Manager to see live breakdown analytics.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Completed Tasks ({completedTasks})</span>
                  <b>{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</b>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-3)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`, background: 'var(--success)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>In Progress ({inProgressTasks})</span>
                  <b>{totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%</b>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-3)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%`, background: 'var(--warning)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>To Do / Pending ({todoTasks})</span>
                  <b>{totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0}%</b>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-3)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0}%`, background: 'var(--primary)' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Study Notes & Knowledge Bank Summary */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Knowledge &amp; Study Notes Repository</h3>
            <span className="badge badge-secondary">{totalNotes} Saved</span>
          </div>

          {totalNotes === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
              No notes written yet. Use the Notes Manager to author subject-wise study summaries and extract AI flashcards.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {safeNotes.slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-3)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '12.5px', color: 'var(--text-1)' }}>{n.title}</strong>
                    <small style={{ display: 'block', color: 'var(--text-3)', fontSize: '11px' }}>{n.subject || 'General Notes'}</small>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                    {n.code || 'DOC'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';


interface StudyProps {
  logged: number;
  target: number;
  subjects?: any[];
  onLogHours: (hours: number) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function StudyView({ logged, target, subjects = [], onLogHours, showToast }: StudyProps) {
  const [pomoMode, setPomoMode] = useState<25 | 50 | 5>(25);
  const [pomoSeconds, setPomoSeconds] = useState(1500);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('General Study');

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [goals, setGoals] = useState<{ id: number; text: string; done: boolean }[]>([]);

  useEffect(() => {
    let interval: any = null;
    if (pomoRunning && pomoSeconds > 0) {
      interval = setInterval(() => {
        setPomoSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (pomoSeconds === 0 && pomoRunning) {
      setPomoRunning(false);
      onLogHours(pomoMode / 60);
      showToast(`Pomodoro completed! ${pomoMode} minutes logged to your study sprint.`, 'success');
    }
    return () => clearInterval(interval);
  }, [pomoRunning, pomoSeconds, pomoMode, onLogHours, showToast]);

  const switchMode = (mode: 25 | 50 | 5) => {
    setPomoRunning(false);
    setPomoMode(mode);
    setPomoSeconds(mode * 60);
  };

  const toggleGoal = (id: number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, done: !g.done } : g))
    );
  };

  const addGoal = () => {
    setIsAddingGoal(true);
  };

  const handleSaveGoal = () => {
    if (newGoalText.trim()) {
      setGoals((prev) => [...prev, { id: Date.now(), text: newGoalText.trim(), done: false }]);
      setNewGoalText('');
      setIsAddingGoal(false);
      showToast('Study goal added!', 'success');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timetableSlots: Array<{ time: string; mon: string; tue: string; wed: string; thu: string; fri: string }> = [];

  return (
    <div className="view active" id="v-study">
      {/* Target & Metric Banner */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Weekly Study & Focus Hub</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
              Structured time allocation for Semester 5 theoretical prep and technical lab sprints.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)' }}>
              {logged.toFixed(1)} / {target} hrs
            </div>
            <small style={{ color: 'var(--success)', fontWeight: 700 }}>
              {Math.round((logged / target) * 100)}% weekly target completed
            </small>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Interactive Pomodoro Focus Timer */}
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800 }}>Pomodoro Focus Timer</h3>

          {/* Mode Switchers */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
            <button
              className={`btn btn-sm ${pomoMode === 25 ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => switchMode(25)}
            >
              25m Focus
            </button>
            <button
              className={`btn btn-sm ${pomoMode === 50 ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => switchMode(50)}
            >
              50m Deep
            </button>
            <button
              className={`btn btn-sm ${pomoMode === 5 ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => switchMode(5)}
            >
              5m Break
            </button>
          </div>

          <div style={{ margin: '16px 0' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-3)', display: 'block', marginBottom: '6px' }}>
              Focusing on Course:
            </label>
            <select
              className="form-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{ maxWidth: '280px', margin: '0 auto', fontSize: '12px' }}
            >
              <option value="General Study">General Study Session</option>
              {subjects.map((s) => (
                <option key={s.id || s.code} value={s.code || s.name}>
                  {s.code ? `${s.code} · ${s.name}` : s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Digital Timer Display */}
          <div style={{ fontSize: '3.6rem', fontWeight: 900, color: 'var(--text-timer, var(--text-1))', margin: '16px 0', letterSpacing: '2px' }}>
            {formatTime(pomoSeconds)}
          </div>

          {/* Timer Action Controls */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              id="pomoStartBtn"
              onClick={() => setPomoRunning(!pomoRunning)}
              style={{ minWidth: '130px' }}
            >
              {pomoRunning ? '⏸ Pause Focus' : '▶ Start Focus'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setPomoRunning(false);
                setPomoSeconds(pomoMode * 60);
              }}
            >
              ↺ Reset
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                onLogHours(0.5);
                showToast('30 minutes (0.5h) logged manually to study sprint!', 'success');
              }}
            >
              + Log 30m
            </button>
          </div>
        </div>

        {/* Semester Study Goals */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Semester Study Goals</h3>
            <button className="btn btn-xs btn-primary" onClick={addGoal}>
              + Add Goal
            </button>
          </div>

          {isAddingGoal && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                className="form-input"
                placeholder="Type your study goal and press Enter..."
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveGoal();
                  if (e.key === 'Escape') setIsAddingGoal(false);
                }}
                autoFocus
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
              <button className="btn btn-xs btn-primary" onClick={handleSaveGoal}>Save</button>
              <button className="btn btn-xs btn-secondary" onClick={() => setIsAddingGoal(false)}>Cancel</button>
            </div>
          )}

          {goals.length === 0 && !isAddingGoal ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
              No focus goals added for this sprint. Click "+ Add Focus Goal" to set revision objectives.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {goals.map((g) => (
                <label
                  key={g.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'var(--bg-3)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={g.done}
                    onChange={() => toggleGoal(g.id)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ textDecoration: g.done ? 'line-through' : 'none', opacity: g.done ? 0.6 : 1 }}>
                    {g.text}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Weekly Academic Timetable</h3>
          <span className="badge badge-primary">Lecture Schedule</span>
        </div>

        {timetableSlots.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
            No institutional timetable published yet. Enrolled semester lectures and classroom schedules will appear here automatically.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-3)' }}>
                  <th style={{ padding: '10px' }}>Time Slot</th>
                  <th style={{ padding: '10px' }}>Monday</th>
                  <th style={{ padding: '10px' }}>Tuesday</th>
                  <th style={{ padding: '10px' }}>Wednesday</th>
                  <th style={{ padding: '10px' }}>Thursday</th>
                  <th style={{ padding: '10px' }}>Friday</th>
                </tr>
              </thead>
              <tbody>
                {timetableSlots.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: 'var(--text-2)' }}>{row.time}</td>
                    <td style={{ padding: '10px' }}>
                      <span
                        className="timetable-chip" style={{ cursor: 'pointer' }}
                        onClick={() => showToast(`Mon ${row.time}: ${row.mon}`, 'info')}
                      >
                        {row.mon}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span
                        className="timetable-chip" style={{ cursor: 'pointer' }}
                        onClick={() => showToast(`Tue ${row.time}: ${row.tue}`, 'info')}
                      >
                        {row.tue}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span
                        className="timetable-chip" style={{ cursor: 'pointer' }}
                        onClick={() => showToast(`Wed ${row.time}: ${row.wed}`, 'info')}
                      >
                        {row.wed}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span
                        className="timetable-chip" style={{ cursor: 'pointer' }}
                        onClick={() => showToast(`Thu ${row.time}: ${row.thu}`, 'info')}
                      >
                        {row.thu}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span
                        className="timetable-chip" style={{ cursor: 'pointer' }}
                        onClick={() => showToast(`Fri ${row.time}: ${row.fri}`, 'info')}
                      >
                        {row.fri}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

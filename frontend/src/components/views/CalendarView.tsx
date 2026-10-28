import { useState } from 'react';
import type { AssignmentItem, CalendarEventItem } from '../../types';

interface CalendarProps {
  assignments: AssignmentItem[];
  events: Record<string, CalendarEventItem[]>;
  onOpenEventModal: () => void;
}

export default function CalendarView({ assignments, events, onOpenEventModal }: CalendarProps) {
  const now = new Date();
  const todayDay = now.getDate();
  const todayMonthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(now);
  const [selectedDay, setSelectedDay] = useState(todayDay <= 31 ? todayDay : 15);

  const examDays: Record<number, { code: string; title: string; time: string; venue: string }> = {
    15: { code: '1105111', title: 'Artificial Intelligence', time: '10:30 AM - 01:30 PM', venue: 'Hall 4A · Row 3' },
    17: { code: '1105112', title: 'Cyber & Information Security', time: '10:30 AM - 01:30 PM', venue: 'Hall 3B · Row 5' },
    20: { code: '1105115', title: 'IKS in Computational Systems', time: '10:30 AM - 01:30 PM', venue: 'Hall 4A · Row 2' },
    22: { code: '1105116', title: 'Software Testing & Quality Assurance', time: '10:30 AM - 01:30 PM', venue: 'Hall 2C · Row 4' },
    26: { code: '1105118', title: 'R Programming Practical Examination', time: '09:00 AM - 12:00 PM', venue: 'Computer Lab 1' },
  };

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="view active" id="v-cal">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Academic Calendar & Unified Deadlines</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            October 2026 unified schedule including midterm theory papers, assignments, and practicals.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenEventModal}>
          + Add Event
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Full Month Grid */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>October 2026</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-xs btn-outline">‹ Prev</button>
              <button className="btn btn-xs btn-primary" onClick={() => setSelectedDay(todayDay <= 31 ? todayDay : 15)}>Today ({todayMonthName} {todayDay})</button>
              <button className="btn btn-xs btn-outline">Next ›</button>
            </div>
          </div>

          {/* 7-day header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px' }}>
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>

          {/* Day Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {daysInMonth.map((day) => {
              const isExam = examDays[day];
              const isSelected = day === selectedDay;
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    height: '42px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: isExam ? 'var(--primary-light)' : isSelected ? 'var(--bg-3)' : 'var(--card-bg, #fff)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: isExam || isSelected ? 800 : 500,
                    color: isExam ? 'var(--primary)' : 'var(--text-1)',
                  }}
                >
                  <span>{day}</span>
                  {isExam && (
                    <span style={{ fontSize: '8px', color: 'var(--error)', lineHeight: 1 }}>● EXAM</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Viewer */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Agenda: Thursday, Oct {selectedDay}, 2026</h3>
            <span className="badge badge-primary">Day Agenda</span>
          </div>

          {examDays[selectedDay] ? (
            <div style={{ padding: '16px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--error)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px' }}>{examDays[selectedDay].code} · {examDays[selectedDay].title}</strong>
                <span className="badge badge-error">Theory Exam</span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-2)' }}>
                <div>⏰ <b>Time:</b> {examDays[selectedDay].time}</div>
                <div>📍 <b>Venue & Seating:</b> {examDays[selectedDay].venue}</div>
                <div>📋 <b>Centre:</b> Examination Hall B - Centre Code 042 (Main Campus)</div>
                <div>⚠️ <b>Reporting:</b> Closed book theory paper. Hall ticket mandatory.</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '12px', color: 'var(--text-2)' }}>
              No official university examinations scheduled for this day. Standard tutorial and coursework study day.
            </div>
          )}

          {/* Additional Day Events */}
          {(events[selectedDay.toString()] || []).map((ev, idx) => (
            <div key={idx} style={{ padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '12px' }}>{ev.title}</strong>
                <span className="badge badge-secondary" style={{ fontSize: '10px' }}>{ev.type}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                {ev.time} · {ev.venue || 'Auditorium Hall 4A, Campus Centre (TBA)'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unified Deadlines & Coursework Submissions */}
      <div className="card" style={{ padding: '20px', overflowX: 'auto' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800 }}>Unified Timeline & Deliverables</h3>
        <table className="tbl" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-3)' }}>
              <th style={{ padding: '12px 14px' }}>Title & Description</th>
              <th style={{ padding: '12px 14px' }}>Target Date</th>
              <th style={{ padding: '12px 14px' }}>Type</th>
              <th style={{ padding: '12px 14px' }}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {/* Calendar Events in Unified Schedule */}
            {Object.entries(events).flatMap(([day, evList]) =>
              evList.map((ev, idx) => (
                <tr key={`ev-${day}-${idx}`} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <strong style={{ fontSize: '13px', display: 'block' }}>{ev.title}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Venue: {ev.venue}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px' }}>Oct {day}, 2026 {ev.time}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="badge badge-error">{ev.type || 'EXAM'}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="badge badge-error">HIGH</span>
                  </td>
                </tr>
              ))
            )}

            {/* Assignments in Unified Schedule */}
            {assignments.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 14px' }}>
                  <strong style={{ fontSize: '13px', display: 'block' }}>{a.title}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{a.code} · {a.subject}</span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: '12px' }}>{a.dueDate || 'Oct 28, 2026'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="badge badge-primary">ASSIGNMENT</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span
                    className={`badge ${
                      a.priority === 'HIGH' ? 'badge-error' : a.priority === 'LOW' ? 'badge-secondary' : 'badge-warning'
                    }`}
                  >
                    {a.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

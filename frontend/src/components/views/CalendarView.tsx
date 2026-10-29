import { useState } from 'react';
import type { AssignmentItem, CalendarEventItem } from '../../types';

interface CalendarProps {
  assignments: AssignmentItem[];
  events: Record<string, CalendarEventItem[]>;
  onOpenEventModal: () => void;
}

export default function CalendarView({ assignments, events, onOpenEventModal }: CalendarProps) {
  // Store view date for dynamic month navigation (defaults to October 2026)
  const [viewDate, setViewDate] = useState(() => new Date(2026, 9, 15));
  const [selectedDay, setSelectedDay] = useState(15);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0-indexed (9 = Oct)
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(viewDate);
  const shortMonthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(viewDate);

  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Monday-first indexing: Sunday (0) becomes 6, Monday (1) becomes 0
  const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(1);
  };

  const handleGoToday = () => {
    setViewDate(new Date(2026, 9, 15));
    setSelectedDay(15);
  };

  // Check if a day has an examination or deadline event
  const getDayExams = (day: number) => {
    const dayEvs = events[day.toString()] || [];
    return dayEvs.filter((e) => e.type === 'EXAM' || e.title.toLowerCase().includes('exam'));
  };

  const leadingBlanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const monthDays = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

  return (
    <div className="view active" id="v-cal">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Academic Calendar & Unified Deadlines</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            {monthName} {currentYear} unified schedule including theory papers, assignment deadlines, and tutorials.
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
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
              {monthName} {currentYear}
            </h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-xs btn-outline" onClick={handlePrevMonth} title="Previous Month">
                ‹ Prev
              </button>
              <button className="btn btn-xs btn-primary" onClick={handleGoToday} title="Jump to Midterms">
                Today (Oct 15)
              </button>
              <button className="btn btn-xs btn-outline" onClick={handleNextMonth} title="Next Month">
                Next ›
              </button>
            </div>
          </div>

          {/* 7-day header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px' }}>
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>

          {/* Calendar Grid with Leading Blanks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {leadingBlanks.map((blank) => (
              <div
                key={`blank-${blank}`}
                style={{
                  height: '42px',
                  background: 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  opacity: 0.2,
                }}
              />
            ))}

            {monthDays.map((day) => {
              const dayExams = getDayExams(day);
              const isExam = dayExams.length > 0;
              const isSelected = day === selectedDay;
              const hasEvents = (events[day.toString()] || []).length > 0;

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
                    background: isExam ? 'var(--primary-light)' : isSelected ? 'var(--bg-3)' : 'var(--card-bg, #ffffff)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: isExam || isSelected ? 800 : 500,
                    color: isExam ? 'var(--primary)' : 'var(--text-1)',
                    position: 'relative',
                  }}
                >
                  <span>{day}</span>
                  {isExam && (
                    <span style={{ fontSize: '8px', color: 'var(--error)', lineHeight: 1 }}>● EXAM</span>
                  )}
                  {!isExam && hasEvents && (
                    <span style={{ fontSize: '7px', color: 'var(--primary)', lineHeight: 1 }}>● EVENT</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Viewer */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
              Agenda: {shortMonthName} {selectedDay}, {currentYear}
            </h3>
            <span className="badge badge-primary">Day Agenda</span>
          </div>

          {getDayExams(selectedDay).length > 0 ? (
            getDayExams(selectedDay).map((ex, i) => (
              <div key={i} style={{ padding: '16px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--error)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '14px' }}>{ex.title}</strong>
                  <span className="badge badge-error">Theory Exam</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-2)' }}>
                  <div><b>Time:</b> {ex.time || '10:30 AM'}</div>
                  <div><b>Venue &amp; Seating:</b> {ex.venue || 'Campus Examination Hall'}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '16px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '12px', color: 'var(--text-2)' }}>
              No official university examinations scheduled for this day. Standard tutorial and coursework study day.
            </div>
          )}

          {/* Additional Day Events */}
          {(events[selectedDay.toString()] || []).length > 0 ? (
            (events[selectedDay.toString()] || []).map((ev, idx) => (
              <div key={idx} style={{ padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '12px' }}>{ev.title}</strong>
                  <span className="badge badge-secondary" style={{ fontSize: '10px' }}>{ev.type || 'EVENT'}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                  {ev.time || '10:00 AM'} · {ev.venue || 'Auditorium Hall 4A, Campus Centre'}
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              No personal reminders or custom deadlines for this day.
            </div>
          )}
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
            {Object.keys(events).length === 0 && assignments.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)' }}>
                  No scheduled events or assignments in this period. Click "+ Add Event" above to add to your calendar.
                </td>
              </tr>
            )}
            {/* Calendar Events in Unified Schedule */}
            {Object.entries(events).flatMap(([day, evList]) =>
              evList.map((ev, idx) => (
                <tr key={`ev-${day}-${idx}`} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <strong style={{ fontSize: '13px' }}>{ev.title}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{ev.venue || 'Campus Examination Hall'}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px' }}>{shortMonthName} {day}, {currentYear}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="badge badge-secondary">{ev.type || 'Event'}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="badge badge-primary">Scheduled</span>
                  </td>
                </tr>
              ))
            )}

            {/* Assignments in Unified Schedule */}
            {assignments.map((a) => (
              <tr key={`asgn-${a.id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 14px' }}>
                  <strong style={{ fontSize: '13px' }}>{a.title}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{a.code} · {a.subject}</div>
                </td>
                <td style={{ padding: '12px 14px', fontSize: '12px' }}>{a.dueDate || 'Oct 28, 2026'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="badge badge-info">Coursework</span>
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

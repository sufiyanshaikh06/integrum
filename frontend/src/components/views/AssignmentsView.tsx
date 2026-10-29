import { useState } from 'react';
import type { AssignmentItem } from '../../types';

interface AssignmentsProps {
  assignments: AssignmentItem[];
  subjects: any[];
  onOpenAsgnModal: () => void;
  onOpenSubjectModal: () => void;
  onViewAsgn: (asgn: AssignmentItem) => void;
  onUpdateAsgnStatus?: (id: string, newStatus: 'Pending' | 'Submitted' | 'Graded') => void;
  onDeleteAsgn?: (id: string) => void;
  onDeleteSubject?: (id: string) => void;
  onClearBlankWorkspace?: () => void;
}

export default function AssignmentsView({
  assignments,
  subjects,
  onOpenAsgnModal,
  onOpenSubjectModal,
  onViewAsgn,
  onUpdateAsgnStatus,
  onDeleteAsgn,
  onDeleteSubject,
  onClearBlankWorkspace,
}: AssignmentsProps) {
  const [filterTab, setFilterTab] = useState<'All' | 'Pending' | 'Submitted' | 'Graded'>('All');

  const filteredAsgns = assignments.filter((a) => {
    if (filterTab === 'All') return true;
    return a.status === filterTab;
  });

  return (
    <div className="view active" id="v-asgn">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Courses & Assignments</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Enrolled curriculum courses, coursework submission deadlines, and grading records.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {subjects.length > 0 && onClearBlankWorkspace && (
            <button className="btn btn-ghost" onClick={onClearBlankWorkspace} style={{ fontSize: '12px' }}>
              Reset Curriculum
            </button>
          )}
          <button className="btn btn-secondary" onClick={onOpenSubjectModal}>
            + Add Subject
          </button>
          <button className="btn btn-primary" onClick={onOpenAsgnModal}>
            + Add Assignment
          </button>
        </div>
      </div>

      {/* Enrolled Subjects Cards */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>Enrolled Curriculum Courses</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {subjects.length === 0 ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-3)' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px' }}>No enrolled subjects yet. Click "+ Add Subject" above to enroll in your courses.</p>
              <button className="btn btn-sm btn-primary" onClick={onOpenSubjectModal}>
                + Add Subject
              </button>
            </div>
          ) : (
            subjects.map((s) => (
            <div key={s.id || s.code} className="card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-primary">{s.code || 'COURSE'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <small style={{ color: 'var(--text-3)' }}>{s.credits ? `${s.credits} Credits` : '4 Credits'}</small>
                  {onDeleteSubject && (
                    <button
                      onClick={() => onDeleteSubject(s.id || s.code)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0 4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: 'var(--text-3)',
                      }}
                      title="Remove subject"
                      aria-label="Remove subject"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  )}
                </div>
              </div>
              <strong style={{ display: 'block', margin: '8px 0 4px 0', fontSize: '13px' }}>{s.name}</strong>
              <small style={{ color: 'var(--text-2)' }}>Semester 5 (Fall 2026)</small>
            </div>
          )))
        }
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '18px', display: 'flex', gap: '8px' }}>
        {(['All', 'Pending', 'Submitted', 'Graded'] as const).map((tab) => (
          <button
            key={tab}
            className={`btn btn-xs ${filterTab === tab ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Assignments Table */}
      <div className="card" style={{ padding: '20px', overflowX: 'auto' }}>
        <table className="tbl" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-3)' }}>
              <th style={{ padding: '12px 14px' }}>Assignment & Course</th>
              <th style={{ padding: '12px 14px' }}>Due Date</th>
              <th style={{ padding: '12px 14px' }}>Priority</th>
              <th style={{ padding: '12px 14px' }}>Status</th>
              <th style={{ padding: '12px 14px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAsgns.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)' }}>
                  No assignments in this category.
                </td>
              </tr>
            ) : (
              filteredAsgns.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <strong style={{ fontSize: '13px', display: 'block' }}>{a.title}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{a.code} · {a.subject}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px' }}>{a.dueDate || 'Oct 28, 2026'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      className={`badge ${
                        a.priority === 'HIGH' ? 'badge-error' : a.priority === 'LOW' ? 'badge-secondary' : 'badge-warning'
                      }`}
                    >
                      {a.priority}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {onUpdateAsgnStatus ? (
                      <select
                        className="form-select"
                        value={a.status}
                        onChange={(e) => onUpdateAsgnStatus(a.id, e.target.value as any)}
                        style={{ fontSize: '11px', padding: '3px 8px', fontWeight: 700, borderRadius: 'var(--radius-sm)' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Graded">Graded</option>
                      </select>
                    ) : (
                      <span
                        className={`badge ${
                          a.status === 'Graded' ? 'badge-success' : a.status === 'Submitted' ? 'badge-info' : 'badge-warning'
                        }`}
                      >
                        {a.status}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => onViewAsgn(a)}
                      >
                        View Details
                      </button>
                      {onDeleteAsgn && (
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => onDeleteAsgn(a.id)}
                          style={{ color: 'var(--error)', display: 'inline-flex', alignItems: 'center' }}
                          title="Delete assignment"
                          aria-label="Delete assignment"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

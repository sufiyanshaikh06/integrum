import { useState } from 'react';
import type { TaskItem } from '../../types';

interface TasksProps {
  tasks: TaskItem[];
  onOpenCreateModal: () => void;
  onToggleTask: (id: string) => Promise<void>;
  onChangeStatus: (id: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => Promise<void>;
  onDeleteTask: (id: string) => void;
}

export default function TasksView({
  tasks,
  onOpenCreateModal,
  onToggleTask,
  onChangeStatus,
  onDeleteTask,
}: TasksProps) {
  const [filterTab, setFilterTab] = useState<'All' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('All');
  const [search, setSearch] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filterTab !== 'All' && t.status !== filterTab) return false;
    if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="view active" id="v-tasks">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Productivity Tasks</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Action items with atomic completion timestamps and priority triage.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenCreateModal}>
          + Create Task
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['All', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map((tab) => (
            <button
              key={tab}
              className={`btn btn-xs ${filterTab === tab ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterTab(tab)}
            >
              {tab === 'All' ? 'All Tasks' : tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <input
          className="form-input"
          placeholder="Filter tasks by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '240px', fontSize: '12px', padding: '6px 10px' }}
        />
      </div>

      {/* Tasks Table */}
      <div className="card" style={{ padding: '20px', overflowX: 'auto' }}>
        <table className="tbl" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-3)' }}>
              <th style={{ width: '40px', padding: '12px 14px' }}></th>
              <th style={{ padding: '12px 14px' }}>Task Title</th>
              <th style={{ padding: '12px 14px' }}>Subject</th>
              <th style={{ padding: '12px 14px' }}>Priority</th>
              <th style={{ padding: '12px 14px' }}>Status</th>
              <th style={{ padding: '12px 14px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)' }}>
                  No tasks found in this view.
                </td>
              </tr>
            ) : (
              filteredTasks.map((t) => {
                const isDone = t.status === 'DONE';
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        className={`tcheck ${isDone ? 'done' : ''}`}
                        onClick={() => onToggleTask(t.id)}
                      >
                        {isDone ? '✓' : ''}
                      </span>
                    </td>
                    <td className={isDone ? 'done-txt' : ''} style={{ padding: '12px 14px' }}>
                      <strong style={{ fontSize: '13px' }}>{t.title}</strong>
                      {t.completedAt && (
                        <div style={{ fontSize: '10px', color: 'var(--success)' }}>
                          Completed at {new Date(t.completedAt).toLocaleTimeString()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-2)' }}>
                      {t.subject || 'General'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        className={`badge ${
                          t.priority === 'HIGH' ? 'badge-error' : t.priority === 'LOW' ? 'badge-secondary' : 'badge-warning'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <select
                        className="form-select"
                        value={t.status}
                        onChange={(e) => onChangeStatus(t.id, e.target.value as any)}
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="DONE">DONE</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => onDeleteTask(t.id)}
                        style={{ color: 'var(--error)' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

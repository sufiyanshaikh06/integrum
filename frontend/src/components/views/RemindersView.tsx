import { useState } from 'react';
import type { ReminderItem } from '../../types';

interface RemindersProps {
  reminders: ReminderItem[];
  onOpenCreateModal: () => void;
  onSnooze: (id: string) => void;
  onDismiss: (id: string) => void;
  onReactivate: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function RemindersView({
  reminders,
  onOpenCreateModal,
  onSnooze,
  onDismiss,
  onReactivate,
  onDelete,
}: RemindersProps) {
  const [filterTab, setFilterTab] = useState<'All' | 'active' | 'snoozed' | 'dismissed'>('All');

  const filteredRems = reminders.filter((r) => {
    if (filterTab === 'All') return true;
    return r.status === filterTab;
  });

  return (
    <div className="view active" id="v-rems">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Reminders & Examination Alerts</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Automated alerts dispatched by in-process reminder processor and user deadlines.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenCreateModal}>
          + Schedule Alert
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '8px' }}>
        {(['All', 'active', 'snoozed', 'dismissed'] as const).map((tab) => (
          <button
            key={tab}
            className={`btn btn-xs ${filterTab === tab ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterTab(tab)}
          >
            {tab === 'All' ? 'All Alerts' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Reminders Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {filteredRems.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', gridColumn: '1 / -1' }}>
            No reminders found in this category.
          </div>
        ) : (
          filteredRems.map((r) => (
            <div key={r.id} className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-warning" style={{ fontSize: '11px' }}>{r.time || 'Upcoming'}</span>
                <span
                  className={`badge ${
                    r.status === 'active' ? 'badge-primary' : r.status === 'snoozed' ? 'badge-secondary' : 'badge-error'
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
                {r.title}
              </h4>

              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-2)', flex: 1, lineHeight: 1.5 }}>
                {r.desc}
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                {r.status === 'active' && (
                  <>
                    <button className="btn btn-xs btn-outline" onClick={() => onSnooze(r.id)}>
                      Snooze 24h
                    </button>
                    <button className="btn btn-xs btn-secondary" onClick={() => onDismiss(r.id)}>
                      Dismiss
                    </button>
                  </>
                )}
                {r.status !== 'active' && (
                  <button className="btn btn-xs btn-outline" onClick={() => onReactivate(r.id)}>
                    Reactivate
                  </button>
                )}
                <button
                  className="btn btn-xs btn-danger"
                  onClick={() => onDelete(r.id)}
                  style={{ marginLeft: 'auto', color: 'var(--error)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

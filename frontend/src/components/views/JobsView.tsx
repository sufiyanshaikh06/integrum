import type { JobItem } from '../../types';

interface JobsProps {
  jobs: JobItem[];
  onOpenCreateModal: () => void;
  onAdvanceStage: (id: string, nextStage: 'Applied' | 'Interviewing' | 'Offered' | 'Rejected') => void;
}

export default function JobsView({ jobs, onOpenCreateModal, onAdvanceStage }: JobsProps) {
  const stages: Array<'Applied' | 'Interviewing' | 'Offered' | 'Rejected'> = [
    'Applied',
    'Interviewing',
    'Offered',
    'Rejected',
  ];

  return (
    <div className="view active" id="v-jobs">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Placement & Job Tracking</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Visual kanban board for campus placements, software internships, and off-campus pipelines.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenCreateModal}>
          + Add Application
        </button>
      </div>

      {/* 4-Column Kanban Board */}
      <div
        id="kanbanBoard"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        {stages.map((stg) => {
          const colJobs = jobs.filter((j) => j.stage === stg);
          return (
            <div key={stg} className="card" style={{ padding: '16px', background: 'var(--bg-2)', minHeight: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {stg} ({colJobs.length})
                </strong>
                <span
                  className={`badge ${
                    stg === 'Offered'
                      ? 'badge-success'
                      : stg === 'Interviewing'
                      ? 'badge-primary'
                      : stg === 'Rejected'
                      ? 'badge-error'
                      : 'badge-secondary'
                  }`}
                >
                  {colJobs.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {colJobs.map((j) => (
                  <div
                    key={j.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-1)' }}>{j.company}</strong>
                      <span className="badge badge-secondary" style={{ fontSize: '10px' }}>{j.ctc}</span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginTop: '2px' }}>
                      {j.role}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', margin: '4px 0 10px 0' }}>
                      {j.location} · {j.type}
                    </div>

                    {/* Advance controls */}
                    <div style={{ display: 'flex', gap: '4px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                      {stg === 'Applied' && (
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => onAdvanceStage(j.id, 'Interviewing')}
                          style={{ fontSize: '10px' }}
                        >
                          Advance to Interview →
                        </button>
                      )}
                      {stg === 'Interviewing' && (
                        <>
                          <button
                            className="btn btn-xs btn-success"
                            onClick={() => onAdvanceStage(j.id, 'Offered')}
                            style={{ fontSize: '10px' }}
                          >
                            Mark Offer 🎉
                          </button>
                          <button
                            className="btn btn-xs btn-outline"
                            onClick={() => onAdvanceStage(j.id, 'Rejected')}
                            style={{ fontSize: '10px' }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {stg === 'Offered' && (
                        <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700 }}>
                          ✓ Offer Letter Received
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

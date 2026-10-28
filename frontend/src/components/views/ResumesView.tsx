import type { ResumeVersion } from '../../types';

interface ResumesProps {
  resumes: Record<string, ResumeVersion>;
  onInspectResume: (key: string) => void;
  onOpenCreateModal: () => void;
  onDownloadPdf: (filename: string) => void;
}

export default function ResumesView({
  resumes,
  onInspectResume,
  onOpenCreateModal,
  onDownloadPdf,
}: ResumesProps) {
  const resumeEntries = Object.entries(resumes);

  return (
    <div className="view active" id="v-resumes">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Resume Versions & ATS Audit</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Automated applicant tracking system audit scores, keyword coverage, and role tailoring.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenCreateModal}>
          + Create Resume
        </button>
      </div>

      {/* Resume Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {resumeEntries.map(([key, res]) => (
          <div key={key} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{res.title}</h3>
                <small style={{ color: 'var(--text-3)' }}>Updated {res.updated}</small>
              </div>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  border: '2px solid var(--primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <strong style={{ fontSize: '16px', color: 'var(--primary)', lineHeight: 1 }}>{res.score}</strong>
                <small style={{ fontSize: '9px', color: 'var(--text-3)' }}>ATS</small>
              </div>
            </div>

            {/* Sub-Metric Dials */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', margin: '14px 0', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-3)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--success)' }}>{res.format}%</div>
                <small style={{ fontSize: '9px', color: 'var(--text-3)' }}>Format</small>
              </div>
              <div style={{ background: 'var(--bg-3)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--info)' }}>{res.keywords}%</div>
                <small style={{ fontSize: '9px', color: 'var(--text-3)' }}>Keywords</small>
              </div>
              <div style={{ background: 'var(--bg-3)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent)' }}>{res.impact}%</div>
                <small style={{ fontSize: '9px', color: 'var(--text-3)' }}>Impact</small>
              </div>
              <div style={{ background: 'var(--bg-3)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>{res.brevity}%</div>
                <small style={{ fontSize: '9px', color: 'var(--text-3)' }}>Brevity</small>
              </div>
            </div>

            {/* Keyword Pills Preview */}
            <div style={{ margin: '8px 0 16px 0', flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '6px' }}>Matched Keywords:</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {res.matched.slice(0, 5).map((kw, i) => (
                  <span key={i} className="badge badge-success" style={{ fontSize: '10px' }}>
                    ✓ {kw}
                  </span>
                ))}
                {res.matched.length > 5 && (
                  <span className="badge badge-secondary" style={{ fontSize: '10px' }}>
                    +{res.matched.length - 5} more
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => onInspectResume(key)}
                style={{ flex: 1 }}
              >
                Inspect ATS & Keywords
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => onDownloadPdf(`${key}-resume.pdf`)}
              >
                Download PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

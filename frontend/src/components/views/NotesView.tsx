import { useState } from 'react';
import type { NoteItem } from '../../types';

interface NotesProps {
  notes: NoteItem[];
  onOpenCreateModal: () => void;
  onViewNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
}

export default function NotesView({
  notes,
  onOpenCreateModal,
  onViewNote,
  onDeleteNote,
}: NotesProps) {
  const [filterCode, setFilterCode] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'az'>('newest');

  const filteredNotes = notes.filter((n) => {
    if (filterCode === 'ALL') return true;
    return n.code === filterCode || n.subject.includes(filterCode);
  });

  if (sortOrder === 'az') {
    filteredNotes.sort((a, b) => a.title.localeCompare(b.title));
  }

  const availableCodes = ['ALL', ...Array.from(new Set(notes.map((n) => n.code).filter(Boolean)))];

  return (
    <div className="view active" id="v-notes">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Study Notes & Summaries</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Structured markdown notes, theorem sheets, and exam reference cards.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenCreateModal}>
          + New Note
        </button>
      </div>

      {/* Filter and Sort Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {availableCodes.map((code) => (
            <button
              key={code}
              className={`btn btn-xs ${filterCode === code ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterCode(code)}
            >
              {code === 'ALL' ? 'All Subjects' : code}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-3)' }}>Sort:</label>
          <select
            className="form-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            <option value="newest">Newest First</option>
            <option value="az">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Notes Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {filteredNotes.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', gridColumn: '1 / -1' }}>
            No notes found matching this subject filter.
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-secondary" style={{ fontSize: '11px' }}>{note.code || 'GENERAL'}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{note.date || 'Recent'}</span>
              </div>

              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-1)' }}>
                {note.title}
              </h4>

              <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: 'var(--text-2)', flex: 1, lineHeight: 1.5 }}>
                {(note.excerpt || note.content || '').replace(/\\n/g, ' ').replace(/\n+/g, ' ').slice(0, 130) + '...'}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {(note.tags || []).map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--bg-3)',
                      color: 'var(--primary)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    #{t.replace(/^#/, '')}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <button
                  className="btn btn-xs btn-outline"
                  onClick={() => onViewNote(note)}
                >
                  View Note
                </button>
                <button
                  className="btn btn-xs btn-danger"
                  onClick={() => onDeleteNote(note.id)}
                  style={{ color: 'var(--error)' }}
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

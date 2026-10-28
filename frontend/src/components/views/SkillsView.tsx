import { useState } from 'react';
import type { SkillItem } from '../../types';

interface SkillsProps {
  skills: SkillItem[];
  onOpenCreateModal: () => void;
}

export default function SkillsView({ skills, onOpenCreateModal }: SkillsProps) {
  const [filterCat, setFilterCat] = useState<string>('ALL');

  const categories = ['ALL', 'Languages', 'Frameworks', 'Cloud & DevOps', 'Core CS'];

  const filteredSkills = skills.filter((s) => {
    if (filterCat === 'ALL') return true;
    return s.category === filterCat;
  });

  return (
    <div className="view active" id="v-skills">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Technical Skills Matrix & Gap Analysis</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Verified technical competencies benchmarked against campus placement and internship criteria.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenCreateModal}>
          + Add Skill
        </button>
      </div>

      {/* Role Gap Analysis Grid */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '1.1rem', fontWeight: 800 }}>Target Role Gap Analysis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '14px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '13px' }}>AI & Software Engineer</strong>
              <span className="badge badge-success">88% Match</span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'var(--text-2)' }}>
              Strong Python, React, Algorithms. Recommended focus: Distributed caching (Redis) and Docker orchestration.
            </p>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '13px' }}>Cyber Security Analyst</strong>
              <span className="badge badge-warning">72% Match</span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'var(--text-2)' }}>
              Strong Networking and PKI foundations. Recommended focus: Network packet inspection (Wireshark) & OWASP Top 10.
            </p>
          </div>

          <div style={{ padding: '14px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '13px' }}>Data Analyst & ML Associate</strong>
              <span className="badge badge-info">80% Match</span>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'var(--text-2)' }}>
              Proficient in SQL and R Programming. Recommended focus: Advanced Tableau dashboarding and Pandas feature engineering.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '18px', display: 'flex', gap: '8px' }}>
        {categories.map((c) => (
          <button
            key={c}
            className={`btn btn-xs ${filterCat === c ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {filteredSkills.map((s, idx) => {
          const rating = s.level <= 5 ? s.level : s.level / 20;
          const pct = Math.min(100, Math.round(rating * 20));

          return (
            <div key={idx} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '14px' }}>{s.name}</strong>
                <span className="badge badge-secondary" style={{ fontSize: '10px' }}>{s.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px' }}>
                <span>Proficiency: {rating.toFixed(1)} / 5.0</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{pct}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-3)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: 'var(--primary)',
                    borderRadius: '999px',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

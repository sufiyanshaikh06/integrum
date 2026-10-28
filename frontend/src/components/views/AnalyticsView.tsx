import { useState } from 'react';

export default function AnalyticsView() {
  // Simulator Grade Points
  const [grades, setGrades] = useState({
    '1105111': 9, // AI (Grade A+)
    '1105112': 9, // Security (Grade A+)
    '1105115': 10, // IKS (Grade O)
    '1105116': 8, // STQA (Grade A)
    '1105118': 9, // R Prog (Grade A+)
  });

  const courses = [
    { code: '1105111', name: 'Artificial Intelligence', credits: 4 },
    { code: '1105112', name: 'Cyber & Information Security', credits: 4 },
    { code: '1105115', name: 'IKS in Computational Systems', credits: 3 },
    { code: '1105116', name: 'Software Testing & Quality Assurance', credits: 4 },
    { code: '1105118', name: 'R Programming Practical', credits: 3 },
  ];

  // SGPA Calculation
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
  const totalPoints = courses.reduce((acc, c) => acc + (grades[c.code as keyof typeof grades] || 8) * c.credits, 0);
  const simSGPA = (totalPoints / totalCredits).toFixed(2);
  const simCGPA = (((8.64 * 4) + parseFloat(simSGPA)) / 5).toFixed(2);

  const handleGradeChange = (code: string, val: number) => {
    setGrades((prev) => ({ ...prev, [code]: val }));
  };

  return (
    <div className="view active" id="v-analytics">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Analytics & Success Index</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Comprehensive telemetry on academic progression, study consistency, and projected grade points.
          </p>
        </div>
      </div>

      {/* Top Vital Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <small style={{ color: 'var(--text-3)', fontWeight: 700 }}>STUDENT SUCCESS INDEX</small>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', margin: '4px 0' }}>86 / 100</div>
          <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700 }}>Exemplary Academic Health</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <small style={{ color: 'var(--text-3)', fontWeight: 700 }}>PROJECTED SGPA (SEM 5)</small>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)', margin: '4px 0' }}>{simSGPA}</div>
          <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Across 18 Semester Credits</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <small style={{ color: 'var(--text-3)', fontWeight: 700 }}>CUMULATIVE CGPA</small>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--info)', margin: '4px 0' }}>{simCGPA}</div>
          <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Semesters 1 through 5</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <small style={{ color: 'var(--text-3)', fontWeight: 700 }}>ATTENDANCE CONSISTENCY</small>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)', margin: '4px 0' }}>94%</div>
          <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700 }}>Zero Defaulter Risk</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Attendance Progression Chart (SVG) */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Weekly Attendance Progression</h3>
              <small style={{ color: 'var(--text-3)' }}>Weeks 1 to 8 (Fall 2026)</small>
            </div>
            <span className="badge badge-success">Above 75% Cutoff</span>
          </div>

          <div style={{ height: '180px', position: 'relative' }}>
            <svg viewBox="0 0 400 160" style={{ width: '100%', height: '100%' }}>
              {/* Reference Grid */}
              <line x1="40" y1="20" x2="380" y2="20" stroke="var(--border)" strokeDasharray="3 3" />
              <line x1="40" y1="60" x2="380" y2="60" stroke="var(--border)" strokeDasharray="3 3" />
              <line x1="40" y1="100" x2="380" y2="100" stroke="var(--border)" strokeDasharray="3 3" />
              <line x1="40" y1="140" x2="380" y2="140" stroke="var(--border)" />

              {/* 75% Cutoff Line in Red */}
              <line x1="40" y1="75" x2="380" y2="75" stroke="var(--error)" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="382" y="79" fill="var(--error)" fontSize="9" fontWeight="bold">75% Cutoff</text>

              {/* Attendance Trend Line */}
              <polyline
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                points="40,55 85,50 135,40 185,45 235,35 285,38 335,32 380,30"
              />

              {/* Data points */}
              {[[40,55], [85,50], [135,40], [185,45], [235,35], [285,38], [335,32], [380,30]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="4" fill="var(--primary)" stroke="#fff" strokeWidth="2" />
              ))}
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>
            <span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>W5</span><span>W6</span><span>W7</span><span>W8</span>
          </div>
        </div>

        {/* Study Hours Allocation Bar Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800 }}>Study Hours Course Distribution</h3>
          <small style={{ color: 'var(--text-3)' }}>18.5 Total Hours Logged this Week</small>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                <span>Artificial Intelligence (6.5h)</span>
                <b>35%</b>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-3)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '35%', background: 'var(--primary)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                <span>Cyber & Information Security (4.5h)</span>
                <b>25%</b>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-3)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '25%', background: 'var(--secondary)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                <span>Software Testing & QA (3.0h)</span>
                <b>16%</b>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-3)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '16%', background: 'var(--info)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                <span>IKS in Computational Systems (2.5h)</span>
                <b>14%</b>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-3)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '14%', background: 'var(--accent)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '2px' }}>
                <span>R Programming (2.0h)</span>
                <b>10%</b>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-3)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '10%', background: 'var(--warning)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive SGPA & CGPA Grade Simulator */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>SGPA & CGPA Grade Simulator</h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.85rem' }}>
              Adjust projected grade point sliders for each course to calculate real-time impact on Semester 5 SGPA and overall CGPA.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-primary" style={{ fontSize: '13px' }}>Simulated SGPA: {simSGPA}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {courses.map((c) => {
            const currentGrade = grades[c.code as keyof typeof grades] || 8;
            return (
              <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-3)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ width: '240px' }}>
                  <strong style={{ fontSize: '13px', display: 'block' }}>{c.code} · {c.name}</strong>
                  <small style={{ color: 'var(--text-3)' }}>{c.credits} Credits</small>
                </div>
                <input
                  type="range"
                  min="6"
                  max="10"
                  step="1"
                  value={currentGrade}
                  onChange={(e) => handleGradeChange(c.code, parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--primary)' }}
                />
                <div style={{ width: '80px', textAlign: 'right', fontWeight: 800, fontSize: '14px', color: 'var(--primary)' }}>
                  {currentGrade === 10 ? 'Grade O (10)' : currentGrade === 9 ? 'Grade A+ (9)' : currentGrade === 8 ? 'Grade A (8)' : currentGrade === 7 ? 'Grade B+ (7)' : 'Grade B (6)'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

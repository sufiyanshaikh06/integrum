import { useState } from 'react';
import type { ActiveView, UserRole } from '../types';
import IntegrumLogo from './IntegrumLogo';

interface SidebarProps {
  isOpen: boolean;
  activeView: ActiveView;
  userRole: UserRole;
  isInstitutional?: boolean;
  onClose: () => void;
  onNavigate: (view: ActiveView) => void;
  onLogout: () => void;
}

export default function Sidebar({
  isOpen,
  activeView,
  userRole,
  isInstitutional = true,
  onClose,
  onNavigate,
  onLogout,
}: SidebarProps) {
  const [learningOpen, setLearningOpen] = useState(true);
  const [prodOpen, setProdOpen] = useState(true);
  const [careerOpen, setCareerOpen] = useState(true);

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        id="sidebarOverlay"
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
        <div className="sb-brand">
          <div className="sb-logo">
            <IntegrumLogo size={34} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700 }}>Integrum</h1>
            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              {userRole === 'admin' ? 'Faculty Administration' : 'Student Workspace'}
            </div>
          </div>
        </div>

        {/* ── ROLE-BASED ISOLATED NAVIGATION ────────────────────────── */}
        {userRole === 'admin' ? (
          /* EXCLUSIVE FACULTY & ADMINISTRATION PORTAL NAVIGATION */
          <nav className="sb-nav" id="adminSidebarNav">
            <div className="sb-section">
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', padding: '8px 12px 4px' }}>Governance</div>
              <div
                className={`sb-item ${activeView === 'admin' ? 'active' : ''}`}
                onClick={() => onNavigate('admin')}
                id="sbAdminItem"
              >
                Administration
              </div>
              <div
                className={`sb-item ${activeView === 'analytics' ? 'active' : ''}`}
                onClick={() => onNavigate('analytics')}
              >
                Campus Analytics
              </div>
            </div>

            <div className="sb-section">
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', padding: '8px 12px 4px' }}>Institutional Records</div>
              <div
                className={`sb-item ${activeView === 'admin' ? 'active' : ''}`}
                onClick={() => onNavigate('admin')}
              >
                Official Circulars
              </div>
              <div
                className={`sb-item ${activeView === 'admin' ? 'active' : ''}`}
                onClick={() => onNavigate('admin')}
              >
                Student Directory
              </div>
            </div>

            <div className="sb-section">
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', padding: '8px 12px 4px' }}>Settings</div>
              <div
                className={`sb-item ${activeView === 'profile' ? 'active' : ''}`}
                onClick={() => onNavigate('profile')}
              >
                Faculty Settings
              </div>
            </div>

            <div style={{ marginTop: 'auto', padding: '16px' }}>
              <button
                className="lp-button secondary"
                onClick={onLogout}
                style={{ width: '100%', fontSize: '12px', padding: '8px' }}
              >
                Sign Out (Faculty)
              </button>
            </div>
          </nav>
        ) : (
          /* EXCLUSIVE STUDENT SUCCESS PLATFORM NAVIGATION */
          <nav className="sb-nav" id="studentSidebarNav">
            <div className="sb-section">
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', padding: '8px 12px 4px' }}>Overview</div>
              <div
                className={`sb-item ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => onNavigate('dashboard')}
              >
                Dashboard
              </div>
            </div>

            <div className="sb-section">
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', padding: '8px 12px 4px' }}>Learning</div>
              <div className="sb-item" onClick={() => setLearningOpen(!learningOpen)}>
                Academic Courses <span className="sb-arrow">{learningOpen ? '▾' : '›'}</span>
              </div>
              {learningOpen && (
                <div className="sb-sub open">
                  <div
                    className={`sb-item sb-sub-item ${activeView === 'study' ? 'active' : ''}`}
                    onClick={() => onNavigate('study')}
                  >
                    Study Planner
                  </div>
                  <div
                    className={`sb-item sb-sub-item ${activeView === 'notes' ? 'active' : ''}`}
                    onClick={() => onNavigate('notes')}
                  >
                    Study Notes
                  </div>
                  <div
                    className={`sb-item sb-sub-item ${activeView === 'asgn' ? 'active' : ''}`}
                    onClick={() => onNavigate('asgn')}
                  >
                    Courses & Assignments
                  </div>
                  {isInstitutional && (
                    <div
                      className={`sb-item sb-sub-item ${activeView === 'attend' ? 'active' : ''}`}
                      onClick={() => onNavigate('attend')}
                    >
                      Attendance Tracker
                    </div>
                  )}
                  <div
                    className={`sb-item sb-sub-item ${activeView === 'cal' ? 'active' : ''}`}
                    onClick={() => onNavigate('cal')}
                  >
                    Calendar & Deadlines
                  </div>
                </div>
              )}

              <div className="sb-item" onClick={() => setProdOpen(!prodOpen)}>
                Productivity <span className="sb-arrow">{prodOpen ? '▾' : '›'}</span>
              </div>
              {prodOpen && (
                <div className="sb-sub open">
                  <div
                    className={`sb-item sb-sub-item ${activeView === 'tasks' ? 'active' : ''}`}
                    onClick={() => onNavigate('tasks')}
                  >
                    Tasks
                  </div>
                  <div
                    className={`sb-item sb-sub-item ${activeView === 'rems' ? 'active' : ''}`}
                    onClick={() => onNavigate('rems')}
                  >
                    Reminders
                  </div>
                </div>
              )}
            </div>

            <div className="sb-section">
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', padding: '8px 12px 4px' }}>Career</div>
              <div className="sb-item" onClick={() => setCareerOpen(!careerOpen)}>
                Career & Placements <span className="sb-arrow">{careerOpen ? '▾' : '›'}</span>
              </div>
              {careerOpen && (
                <div className="sb-sub open">
                  <div
                    className={`sb-item sb-sub-item ${activeView === 'resumes' ? 'active' : ''}`}
                    onClick={() => onNavigate('resumes')}
                  >
                    Resumes & ATS
                  </div>
                  <div
                    className={`sb-item sb-sub-item ${activeView === 'skills' ? 'active' : ''}`}
                    onClick={() => onNavigate('skills')}
                  >
                    Skills Matrix
                  </div>
                  <div
                    className={`sb-item sb-sub-item ${activeView === 'jobs' ? 'active' : ''}`}
                    onClick={() => onNavigate('jobs')}
                  >
                    Job & Internship Tracking
                  </div>
                </div>
              )}
            </div>

            <div className="sb-section">
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', padding: '8px 12px 4px' }}>Intelligence</div>
              <div
                className={`sb-item ${activeView === 'analytics' ? 'active' : ''}`}
                onClick={() => onNavigate('analytics')}
              >
                Performance Analytics
              </div>
              <div
                className={`sb-item ${activeView === 'ai' ? 'active' : ''}`}
                onClick={() => onNavigate('ai')}
              >
                AI Assistant
              </div>
            </div>

            <div className="sb-section">
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', padding: '8px 12px 4px' }}>Settings</div>
              <div
                className={`sb-item ${activeView === 'profile' ? 'active' : ''}`}
                onClick={() => onNavigate('profile')}
              >
                Profile & Settings
              </div>
            </div>

            <div style={{ marginTop: 'auto', padding: '16px' }}>
              <button
                className="lp-button secondary"
                onClick={onLogout}
                style={{ width: '100%', fontSize: '12px', padding: '8px' }}
              >
                Sign Out
              </button>
            </div>
          </nav>
        )}
      </aside>
    </>
  );
}

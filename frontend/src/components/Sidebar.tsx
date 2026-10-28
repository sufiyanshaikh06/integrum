import { useState } from 'react';
import type { ActiveView, UserRole } from '../types';

interface SidebarProps {
  isOpen: boolean;
  activeView: ActiveView;
  userRole: UserRole;
  onClose: () => void;
  onNavigate: (view: ActiveView) => void;
  onLogout: () => void;
}

export default function Sidebar({
  isOpen,
  activeView,
  userRole,
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
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M50 5C25.1 5 5 25.1 5 50s20.1 45 45 45 45-20.1 45-45S74.9 5 50 5z"
                stroke="#7C3AED"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray="255"
                strokeDashoffset="45"
              />
              <circle cx="54" cy="30" r="5.5" fill="#7C3AED" />
              <rect x="49" y="40" width="10" height="32" rx="5" fill="#7C3AED" />
            </svg>
          </div>
          <div>
            <h1>Integrum</h1>
            <small id="sbRoleSubtitle">
              {userRole === 'admin' ? 'University Administration Portal' : 'Student Success Platform'}
            </small>
          </div>
        </div>

        <nav className="sb-nav">
          <div className="sb-section">
            <div className="sb-section-label">Main</div>
            <div
              className={`sb-item ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onNavigate('dashboard')}
            >
              <span className="sb-icon">📊</span>Dashboard
            </div>
          </div>

          <div className="sb-section">
            <div className="sb-section-label">Learning</div>
            <div className="sb-item" onClick={() => setLearningOpen(!learningOpen)}>
              <span className="sb-icon">📚</span>Academic<span className="sb-arrow">{learningOpen ? '▾' : '›'}</span>
            </div>
            {learningOpen && (
              <div className="sb-sub open">
                <div
                  className={`sb-sub-item ${activeView === 'study' ? 'active' : ''}`}
                  onClick={() => onNavigate('study')}
                >
                  Study Planner
                </div>
                <div
                  className={`sb-sub-item sb-item ${activeView === 'notes' ? 'active' : ''}`}
                  onClick={() => onNavigate('notes')}
                >
                  Study Notes
                </div>
                <div
                  className={`sb-sub-item sb-item ${activeView === 'asgn' ? 'active' : ''}`}
                  onClick={() => onNavigate('asgn')}
                >
                  Courses & Assignments
                </div>
                <div
                  className={`sb-sub-item ${activeView === 'attend' ? 'active' : ''}`}
                  onClick={() => onNavigate('attend')}
                >
                  Attendance Tracker
                </div>
                <div
                  className={`sb-sub-item sb-item ${activeView === 'cal' ? 'active' : ''}`}
                  onClick={() => onNavigate('cal')}
                >
                  Calendar & Deadlines
                </div>
              </div>
            )}

            <div className="sb-item" onClick={() => setProdOpen(!prodOpen)}>
              <span className="sb-icon">⚡</span>Productivity<span className="sb-arrow">{prodOpen ? '▾' : '›'}</span>
            </div>
            {prodOpen && (
              <div className="sb-sub open">
                <div
                  className={`sb-sub-item sb-item ${activeView === 'tasks' ? 'active' : ''}`}
                  onClick={() => onNavigate('tasks')}
                >
                  Tasks
                </div>
                <div
                  className={`sb-sub-item ${activeView === 'rems' ? 'active' : ''}`}
                  onClick={() => onNavigate('rems')}
                >
                  Reminders
                </div>
              </div>
            )}
          </div>

          <div className="sb-section">
            <div className="sb-section-label">Growth</div>
            <div className="sb-item" onClick={() => setCareerOpen(!careerOpen)}>
              <span className="sb-icon">💼</span>Career<span className="sb-arrow">{careerOpen ? '▾' : '›'}</span>
            </div>
            {careerOpen && (
              <div className="sb-sub open">
                <div
                  className={`sb-sub-item ${activeView === 'resumes' ? 'active' : ''}`}
                  onClick={() => onNavigate('resumes')}
                >
                  Resumes & ATS
                </div>
                <div
                  className={`sb-sub-item ${activeView === 'skills' ? 'active' : ''}`}
                  onClick={() => onNavigate('skills')}
                >
                  Skills Matrix
                </div>
                <div
                  className={`sb-sub-item ${activeView === 'jobs' ? 'active' : ''}`}
                  onClick={() => onNavigate('jobs')}
                >
                  Job Tracking
                </div>
              </div>
            )}
          </div>

          <div className="sb-section">
            <div className="sb-section-label">Insights</div>
            <div
              className={`sb-item ${activeView === 'analytics' ? 'active' : ''}`}
              onClick={() => onNavigate('analytics')}
            >
              <span className="sb-icon">📈</span>Analytics Hub
            </div>
            <div
              className={`sb-item ${activeView === 'ai' ? 'active' : ''}`}
              onClick={() => onNavigate('ai')}
            >
              <span className="sb-icon">🤖</span>AI Assistant
            </div>
          </div>

          <div className="sb-section">
            <div className="sb-section-label">System</div>
            {userRole === 'admin' && (
              <div
                className={`sb-item admin-only ${activeView === 'admin' ? 'active' : ''}`}
                onClick={() => onNavigate('admin')}
                id="sbAdminItem"
              >
                <span className="sb-icon">🏛️</span>Administration
              </div>
            )}
            <div
              className={`sb-item ${activeView === 'profile' ? 'active' : ''}`}
              onClick={() => onNavigate('profile')}
            >
              <span className="sb-icon">👤</span>Profile & Settings
            </div>
          </div>

          <div style={{ marginTop: 'auto', padding: '16px' }}>
            <button
              className="btn btn-outline btn-sm logout-btn"
              onClick={onLogout}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>🚪</span> Sign Out
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}

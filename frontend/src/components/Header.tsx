
import type { ActiveView, UserRole, StudentInfo, AdminInfo } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  userRole: UserRole;
  studentInfo: StudentInfo;
  adminInfo: AdminInfo;
  user: any;
  darkMode: boolean;
  notifOpen: boolean;
  notifications: any[];
  onToggleSidebar: () => void;
  onOpenCmdPalette: () => void;
  onToggleRole: () => void;
  onToggleDarkMode: () => void;
  onToggleNotif: () => void;
  onMarkNotifRead: (id: string) => void;
  onMarkAllNotifsRead: () => void;
  onNavigate?: (view: ActiveView) => void;
  onDismissNotif?: (id: string) => void;
  onLogout: () => void;
}

const titles: Record<ActiveView, string> = {
  dashboard: 'Dashboard',
  study: 'Study Planner & Pomodoro',
  notes: 'Academic Notes Manager',
  asgn: 'Courses & Assignments',
  attend: 'Attendance Tracker & Safe-Bunk Calculator',
  cal: 'October 2026 Examination Calendar',
  tasks: 'Productivity Tasks',
  rems: 'Reminders & Examination Alerts',
  resumes: 'Resume Versions & ATS Audit',
  skills: 'Technical Skills Matrix & Gap Analysis',
  jobs: 'Placement & Job Tracking',
  analytics: 'Analytics & Success Index',
  ai: 'Integrum AI Assistant',
  admin: 'University Administration Portal',
  profile: 'Student Profile & Settings',
};

export default function Header({
  activeView,
  userRole,
  studentInfo,
  adminInfo,
  user,
  darkMode,
  notifOpen,
  notifications,
  onToggleSidebar,
  onOpenCmdPalette,
  onToggleRole,
  onToggleDarkMode,
  onToggleNotif,
  onMarkNotifRead,
  onMarkAllNotifsRead,
  onNavigate,
  onDismissNotif,
  onLogout,
}: HeaderProps) {
  const unreadCount = notifications.filter((n) => n.unread).length;
  const displayName = user?.name || (userRole === 'admin' ? adminInfo.name : studentInfo.name);
  const avatarText = userRole === 'admin' ? adminInfo.avatar : studentInfo.avatar;

  const handleNotifClick = (n: any) => {
    onMarkNotifRead(n.id);
    if (!onNavigate) return;
    const title = (n.title || '').toLowerCase();
    const desc = (n.msg || n.description || '').toLowerCase();
    if (title.includes('attendance') || desc.includes('attendance') || title.includes('stqa')) {
      onNavigate('attend');
    } else if (title.includes('exam') || title.includes('calendar') || desc.includes('venue') || desc.includes('oct')) {
      onNavigate('cal');
    } else if (title.includes('hall ticket')) {
      onNavigate('profile');
    } else if (title.includes('assignment') || title.includes('lab')) {
      onNavigate('asgn');
    } else if (title.includes('task') || title.includes('tlb')) {
      onNavigate('tasks');
    } else if (title.includes('resume') || title.includes('ats')) {
      onNavigate('resumes');
    } else if (title.includes('job') || title.includes('placement')) {
      onNavigate('jobs');
    }
  };

  return (
    <header className="app-header">
      <div className="hdr-left">
        <button className="mobile-menu-btn" onClick={onToggleSidebar} aria-label="Open menu">
          ☰
        </button>
        <h2 id="pageTitle" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
          {titles[activeView] || 'Integrum'}
        </h2>
        {userRole === 'admin' && (
          <span className="admin-badge" id="hdrAdminBadge" style={{ marginLeft: '12px' }}>
            Administrator Mode
          </span>
        )}
      </div>

      <div className="hdr-center">
        <div
          className="search-box"
          onClick={onOpenCmdPalette}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          title="Click or press Ctrl+K"
        >
          <span>🔍</span>
          <span style={{ color: 'var(--text-3)', fontSize: '13px' }}>Jump anywhere... (Ctrl+K)</span>
        </div>
      </div>

      <div className="hdr-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Role Toggle */}
        <button
          className="btn btn-xs btn-outline"
          onClick={onToggleRole}
          title="Switch view mode"
          style={{ fontSize: '11px', padding: '4px 10px' }}
        >
          {userRole === 'admin' ? '🏛️ Admin View' : '🎓 Student View'}
        </button>

        {/* Dark Mode Toggle */}
        <button
          className="theme-btn"
          id="darkModeToggle"
          onClick={onToggleDarkMode}
          title="Toggle Dark Mode"
          style={{
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            className="notif-btn"
            title="Notifications"
            onClick={onToggleNotif}
            style={{
              position: 'relative',
              background: 'var(--bg-3)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span
                id="notifBadge"
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--error)',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: '10px',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-popover notif-dropdown open" id="notifDropdown">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <strong>Notifications ({unreadCount} new)</strong>
                <button
                  className="btn btn-xs btn-outline"
                  onClick={onMarkAllNotifsRead}
                  style={{ fontSize: '10px' }}
                >
                  Mark all read
                </button>
              </div>

              <div id="notifList" style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-3)', fontSize: '12px' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${n.unread ? 'unread' : ''}`}
                      onClick={() => handleNotifClick(n)}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px' }}>{n.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{n.time || 'Today'}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDismissNotif) onDismissNotif(n.id);
                              else onMarkNotifRead(n.id);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-3)',
                              fontSize: '12px',
                              lineHeight: 1,
                              padding: '2px 4px',
                            }}
                            title="Dismiss notification"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: '2px' }}>
                        {n.msg || n.description}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            className="user-avatar"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '13px',
            }}
          >
            {avatarText}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)' }}>
              {displayName}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              {userRole === 'admin' ? 'University Admin' : 'Semester 5 CSE'}
            </span>
          </div>
          <button
            className="btn btn-sm btn-outline logout-btn"
            onClick={onLogout}
            style={{ marginLeft: '6px', fontSize: '11px' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

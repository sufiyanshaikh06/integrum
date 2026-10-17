import React, { useState, useEffect } from 'react';
import {
  authApi,
  academicApi,
  taskApi,
  reminderApi,
  noteApi,
  calendarApi,
  notificationApi,
} from './services/api';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  // Phase & Navigation State
  const [phase, setPhase] = useState<'landing' | 'login' | 'app'>('landing');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'academic' | 'tasks' | 'notes' | 'calendar' | 'tools' | 'profile'>('dashboard');
  const [authChecking, setAuthChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // User & Academic State
  const [user, setUser] = useState<any>(null);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unifiedCalendar, setUnifiedCalendar] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Notes Modal & Filter State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteSubjectId, setNewNoteSubjectId] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [noteFilterSubjectId, setNoteFilterSubjectId] = useState<string>('ALL');

  // Calendar Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-10-28T10:00');
  const [newEventType, setNewEventType] = useState<'EXAM' | 'HOLIDAY' | 'COLLEGE_EVENT' | 'CLASS'>('EXAM');

  // Notification Popover State
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Forms & Modals
  const [loginEmail, setLoginEmail] = useState('sufiyan.shaikh@example.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [regFirstName, setRegFirstName] = useState('Sufiyan');
  const [regLastName, setRegLastName] = useState('Shaikh');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [newTaskStatus, setNewTaskStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO');
  const [newTaskDue, setNewTaskDue] = useState('');

  const [isAsgnModalOpen, setIsAsgnModalOpen] = useState(false);
  const [newAsgnTitle, setNewAsgnTitle] = useState('');
  const [newAsgnSubjectId, setNewAsgnSubjectId] = useState('');
  const [newAsgnPriority, setNewAsgnPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [newAsgnDue, setNewAsgnDue] = useState('2026-10-25T18:00:00.000Z');

  const [isSubjModalOpen, setIsSubjModalOpen] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');

  // Interactive Tools State
  const [pomoMinutes, setPomoMinutes] = useState(25);
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState(25 * 60);
  const [pomoIsRunning, setPomoIsRunning] = useState(false);

  const [bunkTotal, setBunkTotal] = useState(24);
  const [bunkAttended, setBunkAttended] = useState(20);
  const [bunkTarget, setBunkTarget] = useState(0.75);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // ─────────────────────────────────────────────────────────────
  // Initial Boot: Silent Session Restoration via HttpOnly Cookie
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function restore() {
      try {
        const { user } = await authApi.restoreSession();
        setUser(user);
        setPhase('app');
        await loadUserData();
        addToast(`Welcome back, ${user.studentProfile?.firstName || user.email}!`, 'success');
      } catch {
        setPhase('landing');
      } finally {
        setAuthChecking(false);
      }
    }
    restore();
  }, []);

  // Pomodoro countdown effect
  useEffect(() => {
    let timer: any = null;
    if (pomoIsRunning) {
      timer = setInterval(() => {
        setPomoSecondsLeft((prev) => {
          if (prev <= 1) {
            setPomoIsRunning(false);
            addToast('Focus session complete! Take a breather.', 'success');
            return pomoMinutes * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [pomoIsRunning, pomoMinutes]);

  // Refresh calendar agenda when calendar view is opened
  useEffect(() => {
    if (phase === 'app' && activeView === 'calendar') {
      const now = new Date();
      const start = new Date(now.getTime() - 7 * 86400000).toISOString();
      const end = new Date(now.getTime() + 60 * 86400000).toISOString();
      calendarApi.getUnifiedCalendar(start, end).then((cal) => {
        setUnifiedCalendar(Array.isArray(cal) ? cal : []);
      }).catch(() => {});
    }
  }, [activeView, phase]);

  const loadUserData = async () => {
    setLoadingData(true);
    try {
      const now = new Date();
      const start = new Date(now.getTime() - 7 * 86400000).toISOString();
      const end = new Date(now.getTime() + 60 * 86400000).toISOString();

      const [sems, subs, asgns, tsks, rems, nts, notifs, cal] = await Promise.all([
        academicApi.getSemesters().catch(() => []),
        academicApi.getSubjects().catch(() => []),
        academicApi.getAssignments().catch(() => []),
        taskApi.getTasks().catch(() => []),
        reminderApi.getReminders().catch(() => []),
        noteApi.getNotes().catch(() => []),
        notificationApi.getNotifications().catch(() => []),
        calendarApi.getUnifiedCalendar(start, end).catch(() => []),
      ]);

      setSemesters(sems || []);
      setSubjects(subs || []);
      setAssignments(asgns || []);
      setTasks(tsks || []);
      setReminders(rems || []);
      setNotes(nts || []);
      setNotifications(notifs || []);
      setUnifiedCalendar(Array.isArray(cal) ? cal : []);

      if (subs && subs.length > 0) {
        if (!newAsgnSubjectId) setNewAsgnSubjectId(subs[0].id);
        if (!newNoteSubjectId) setNewNoteSubjectId(subs[0].id);
      }
    } catch (err: any) {
      addToast(err.message || 'Error loading academic data', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Authentication Actions
  // ─────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      await authApi.login({ email: loginEmail, password: loginPassword });
      const profile = await authApi.getProfile();
      setUser(profile);
      setPhase('app');
      await loadUserData();
      addToast(`Signed in successfully as ${profile.studentProfile?.firstName || 'Student'}!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Login failed. Check credentials.', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      await authApi.register({
        firstName: regFirstName,
        lastName: regLastName,
        email: regEmail,
        password: regPassword,
      });
      addToast('Account created! Signing you in...', 'success');
      await authApi.login({ email: regEmail, password: regPassword });
      const profile = await authApi.getProfile();
      setUser(profile);
      setPhase('app');
      await loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Registration failed.', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      setPhase('landing');
      addToast('Signed out successfully.', 'info');
    } catch (err: any) {
      addToast(err.message || 'Logout failed', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Academic & Task Actions
  // ─────────────────────────────────────────────────────────────
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsgnTitle.trim() || newAsgnTitle.trim().length < 2) {
      addToast('Assignment title must be at least 2 characters', 'error');
      return;
    }
    if (!newAsgnSubjectId) {
      addToast('Please select a subject or create one first', 'error');
      return;
    }

    try {
      await academicApi.createAssignment({
        subjectId: newAsgnSubjectId,
        title: newAsgnTitle.trim(),
        priority: newAsgnPriority,
        status: 'PENDING',
        dueDate: newAsgnDue ? new Date(newAsgnDue).toISOString() : undefined,
      });
      addToast('Assignment created successfully!', 'success');
      setNewAsgnTitle('');
      setIsAsgnModalOpen(false);
      const asgns = await academicApi.getAssignments();
      setAssignments(asgns || []);
      const now = new Date();
      const start = new Date(now.getTime() - 7 * 86400000).toISOString();
      const end = new Date(now.getTime() + 60 * 86400000).toISOString();
      const cal = await calendarApi.getUnifiedCalendar(start, end).catch(() => []);
      setUnifiedCalendar(Array.isArray(cal) ? cal : []);
    } catch (err: any) {
      addToast(err.message || 'Failed to create assignment', 'error');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) {
      addToast('Subject name is required', 'error');
      return;
    }
    let targetSemId = semesters[0]?.id;
    if (!targetSemId) {
      try {
        const sem = await academicApi.createSemester({
          name: 'Semester 5 (B.Sc. Computer Science)',
          startDate: '2026-06-15T00:00:00.000Z',
          endDate: '2026-11-30T00:00:00.000Z',
        });
        targetSemId = sem.id;
        setSemesters([sem]);
      } catch (err: any) {
        addToast(err.message || 'Could not initialize semester', 'error');
        return;
      }
    }

    try {
      await academicApi.createSubject({
        semesterId: targetSemId,
        name: newSubjName.trim(),
        code: newSubjCode.trim() || undefined,
        credits: 4,
      });
      addToast(`Subject "${newSubjName}" added!`, 'success');
      setNewSubjName('');
      setNewSubjCode('');
      setIsSubjModalOpen(false);
      const subs = await academicApi.getSubjects();
      setSubjects(subs || []);
      if (subs.length > 0) setNewAsgnSubjectId(subs[0].id);
    } catch (err: any) {
      addToast(err.message || 'Failed to create subject', 'error');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || newTaskTitle.trim().length < 2) {
      addToast('Task title must be at least 2 characters', 'error');
      return;
    }

    try {
      await taskApi.createTask({
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        status: newTaskStatus,
        dueDate: newTaskDue ? new Date(newTaskDue).toISOString() : null,
      });
      addToast('Task added to your plan!', 'success');
      setNewTaskTitle('');
      setIsTaskModalOpen(false);
      const tsks = await taskApi.getTasks();
      setTasks(tsks || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to create task', 'error');
    }
  };

  const handleToggleTask = async (task: any) => {
    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      await taskApi.updateTask(task.id, { status: nextStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      addToast(nextStatus === 'DONE' ? 'Task completed!' : 'Task reopened.', 'info');
    } catch (err: any) {
      addToast(err.message || 'Could not update task', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskApi.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      addToast('Task removed', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete task', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Text Notes Actions
  // ─────────────────────────────────────────────────────────────
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) {
      addToast('Note title is required', 'error');
      return;
    }
    if (!newNoteSubjectId) {
      addToast('Please select an enrolled subject', 'error');
      return;
    }

    try {
      const tags = newNoteTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await noteApi.createNote({
        subjectId: newNoteSubjectId,
        title: newNoteTitle.trim(),
        content: newNoteContent.trim() || undefined,
        tags: tags.length ? tags : undefined,
      });
      addToast('Study note created successfully!', 'success');
      setNewNoteTitle('');
      setNewNoteContent('');
      setNewNoteTags('');
      setIsNoteModalOpen(false);
      const updatedNotes = await noteApi.getNotes();
      setNotes(updatedNotes || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to create note', 'error');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await noteApi.deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedNote?.id === noteId) setSelectedNote(null);
      addToast('Note deleted', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete note', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Calendar Actions
  // ─────────────────────────────────────────────────────────────
  const handleCreateCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      addToast('Event title is required', 'error');
      return;
    }
    if (!newEventDate) {
      addToast('Event date and time is required', 'error');
      return;
    }

    try {
      await calendarApi.createCalendarEvent({
        title: newEventTitle.trim(),
        description: newEventDesc.trim() || undefined,
        date: new Date(newEventDate).toISOString(),
        eventType: newEventType,
      });
      addToast('Calendar event created!', 'success');
      setNewEventTitle('');
      setNewEventDesc('');
      setIsEventModalOpen(false);
      const now = new Date();
      const start = new Date(now.getTime() - 7 * 86400000).toISOString();
      const end = new Date(now.getTime() + 60 * 86400000).toISOString();
      const cal = await calendarApi.getUnifiedCalendar(start, end);
      setUnifiedCalendar(Array.isArray(cal) ? cal : []);
    } catch (err: any) {
      addToast(err.message || 'Failed to create calendar event', 'error');
    }
  };

  const handleDeleteCalendarEvent = async (id: string) => {
    try {
      await calendarApi.deleteCalendarEvent(id);
      setUnifiedCalendar((prev) => prev.filter((item) => item.sourceId !== id && item.id !== id));
      addToast('Calendar event removed', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete calendar event', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Notifications Actions
  // ─────────────────────────────────────────────────────────────
  const handleMarkNotifRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err: any) {
      addToast(err.message || 'Could not update notification', 'error');
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      addToast('All notifications marked as read', 'success');
    } catch (err: any) {
      addToast(err.message || 'Could not update notifications', 'error');
    }
  };

  // Safe-Bunk calculation
  const calcSafeBunk = () => {
    if (bunkTotal <= 0) return { status: 'safe', text: 'Enter class counts to calculate.' };
    const curPct = bunkAttended / bunkTotal;
    if (curPct < bunkTarget) {
      const needed = Math.ceil((bunkTarget * bunkTotal - bunkAttended) / (1 - bunkTarget));
      return {
        status: 'warn',
        text: `Attendance is ${(curPct * 100).toFixed(1)}% (below ${bunkTarget * 100}% threshold). You must attend the next ${needed} consecutive classes without missing.`,
      };
    } else {
      const canMiss = Math.floor(bunkAttended / bunkTarget - bunkTotal);
      return {
        status: 'safe',
        text: `Attendance is ${(curPct * 100).toFixed(1)}% (above threshold). You can safely miss up to ${canMiss} upcoming classes.`,
      };
    }
  };

  const bunkResult = calcSafeBunk();

  // If restoring initial session
  if (authChecking) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>Integrum</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginTop: 8 }}>Restoring verified session...</div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: LANDING PAGE
  // ─────────────────────────────────────────────────────────────
  if (phase === 'landing') {
    return (
      <div className="phase active">
        <nav className="landing-nav">
          <div className="nav-inner">
            <div className="nav-brand">
              <span className="nav-brand-text">Integrum</span>
            </div>
            <div className="nav-links">
              <a href="#features">Academic Hub</a>
              <a href="#productivity">Productivity</a>
              <a href="#tools">Tools</a>
            </div>
            <div className="nav-actions">
              <button className="btn btn-sm btn-ghost" onClick={() => setPhase('login')}>Sign In</button>
              <button className="btn btn-sm btn-primary" onClick={() => { setIsRegisterMode(true); setPhase('login'); }}>Get Started</button>
            </div>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-inner">
            <div className="hero-badge">
              <span className="dot"></span> Active Academic Prototype
            </div>
            <h1>
              Unified Student Success, <span className="gradient">Built for Real Outcomes.</span>
            </h1>
            <p className="hero-sub">
              Organize your semester, track courses, manage assignments and tasks, and monitor attendance thresholds with verified PostgreSQL data integrity.
            </p>
            <div className="hero-cta">
              <button className="btn btn-lg btn-primary" onClick={() => setPhase('login')}>
                Open Demo Application →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 40 }}>
              <div className="card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📚</div>
                <div className="card-t">Academic Spine</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: 4 }}>
                  Semesters, subjects, assignments and unified calendar projection with row-level student isolation.
                </p>
              </div>
              <div className="card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                <div className="card-t">Productivity Engine</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: 4 }}>
                  Task management with priorities, due dates, and atomic status transitions.
                </p>
              </div>
              <div className="card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏱️</div>
                <div className="card-t">Interactive Focus Tools</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: 4 }}>
                  Client-side Pomodoro timer, safe-bunk formula calculator, and GPA forecast simulator.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Toasts */}
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              {t.message}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: LOGIN & REGISTRATION
  // ─────────────────────────────────────────────────────────────
  if (phase === 'login') {
    return (
      <div id="phase-login" className="active">
        <div className="login-wrapper">
          <div className="login-brand">
            <div className="lb-logo">
              <span className="lb-name">Integrum</span>
            </div>
            <h2>Your student journey, unified and verified.</h2>
            <p>
              Verified prototype demonstration for <strong>R.K. Talreja College</strong> (B.Sc. Computer Science).
            </p>
            <ul className="lb-features">
              <li><span className="check">✓</span> In-memory access token security</li>
              <li><span className="check">✓</span> HttpOnly refresh cookie session rotation</li>
              <li><span className="check">✓</span> PostgreSQL academic data persistence</li>
              <li><span className="check">✓</span> 46 automated regression tests passing</li>
            </ul>
          </div>

          <div className="login-form-panel">
            {!isRegisterMode ? (
              <div>
                <h2>Student Sign In</h2>
                <p className="login-sub">Access your Integrum prototype dashboard</p>
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      className="form-input"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      className="form-input"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 14 }}>
                    Pre-seeded demo credentials for <strong>Sufiyan Shaikh</strong> are ready.
                  </div>
                  <button type="submit" className="btn btn-primary login-btn" disabled={authSubmitting}>
                    {authSubmitting ? 'Signing in...' : 'Sign In →'}
                  </button>
                </form>
                <div className="login-toggle">
                  New student? <a onClick={() => setIsRegisterMode(true)}>Create an account</a>
                </div>
              </div>
            ) : (
              <div>
                <h2>Create Student Account</h2>
                <p className="login-sub">Register as a student in the platform</p>
                <form onSubmit={handleRegister}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        className="form-input"
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        className="form-input"
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="e.g. ahmed.khan@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password (min 8 chars)</label>
                    <input
                      className="form-input"
                      type="password"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary login-btn" disabled={authSubmitting}>
                    {authSubmitting ? 'Registering...' : 'Complete Registration →'}
                  </button>
                </form>
                <div className="login-toggle">
                  Already have an account? <a onClick={() => setIsRegisterMode(false)}>Sign in</a>
                </div>
              </div>
            )}
            <div className="login-back">
              <a onClick={() => setPhase('landing')}>← Back to Home</a>
            </div>
          </div>
        </div>

        {/* Toasts */}
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              {t.message}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: APP / DASHBOARD (AUTHENTICATED)
  // ─────────────────────────────────────────────────────────────
  const studentName = user?.studentProfile
    ? `${user.studentProfile.firstName} ${user.studentProfile.lastName}`
    : 'Sufiyan Shaikh';
  const collegeName = user?.studentProfile?.university || 'R.K. Talreja College';
  const doneTasksCount = tasks.filter((t) => t.status === 'DONE').length;
  const pendingAsgns = assignments.filter((a) => a.status === 'PENDING');

  return (
    <div id="phase-app" className="active">
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sb-brand">
          <div className="sb-logo">
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>I</span>
          </div>
          <div>
            <h1>Integrum</h1>
            <small>Student Success</small>
          </div>
        </div>

        <nav className="sb-nav">
          <div className="sb-section">
            <div className="sb-section-label">Main</div>
            <div
              className={`sb-item ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }}
            >
              <span className="sb-icon">📊</span> Dashboard
            </div>
          </div>

          <div className="sb-section">
            <div className="sb-section-label">Academic & Tasks</div>
            <div
              className={`sb-item ${activeView === 'academic' ? 'active' : ''}`}
              onClick={() => { setActiveView('academic'); setSidebarOpen(false); }}
            >
              <span className="sb-icon">📚</span> Courses & Assignments
            </div>
            <div
              className={`sb-item ${activeView === 'tasks' ? 'active' : ''}`}
              onClick={() => { setActiveView('tasks'); setSidebarOpen(false); }}
            >
              <span className="sb-icon">✅</span> Tasks ({tasks.length})
            </div>
            <div
              className={`sb-item ${activeView === 'notes' ? 'active' : ''}`}
              onClick={() => { setActiveView('notes'); setSidebarOpen(false); }}
            >
              <span className="sb-icon">📝</span> Study Notes ({notes.length})
            </div>
            <div
              className={`sb-item ${activeView === 'calendar' ? 'active' : ''}`}
              onClick={() => { setActiveView('calendar'); setSidebarOpen(false); }}
            >
              <span className="sb-icon">📅</span> Calendar & Deadlines
            </div>
          </div>

          <div className="sb-section">
            <div className="sb-section-label">Interactive Tools</div>
            <div
              className={`sb-item ${activeView === 'tools' ? 'active' : ''}`}
              onClick={() => { setActiveView('tools'); setSidebarOpen(false); }}
            >
              <span className="sb-icon">⏱️</span> Calculators & Focus
            </div>
          </div>

          <div className="sb-section">
            <div className="sb-section-label">Account</div>
            <div
              className={`sb-item ${activeView === 'profile' ? 'active' : ''}`}
              onClick={() => { setActiveView('profile'); setSidebarOpen(false); }}
            >
              <span className="sb-icon">👤</span> Profile & Settings
            </div>
          </div>
        </nav>

        <div className="sb-user">
          <div className="sb-avatar">SS</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sb-user-name">{studentName}</div>
            <div className="sb-user-role">B.Sc. CS · Sem 5</div>
          </div>
        </div>
      </aside>

      <div className="main-wrap">
        {/* Header */}
        <header className="app-header">
          <div className="hdr-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <h2>
              {activeView === 'dashboard' && 'Student Dashboard'}
              {activeView === 'academic' && 'Courses & Assignments'}
              {activeView === 'tasks' && 'Productivity Tasks'}
              {activeView === 'notes' && 'Study Notes & Summaries'}
              {activeView === 'calendar' && 'Academic Calendar & Unified Deadlines'}
              {activeView === 'tools' && 'Interactive Calculators & Focus Tools'}
              {activeView === 'profile' && 'Student Profile'}
            </h2>
          </div>

          <div className="hdr-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="proto-badge">Working Prototype · 53 Tests Verified</span>

            {/* In-App Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-ghost"
                style={{ fontSize: '1.2rem', padding: '6px 10px', position: 'relative', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                onClick={() => setIsNotifOpen((prev) => !prev)}
                title="Notifications"
              >
                🔔
                {notifications.filter((n) => !n.isRead).length > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: 'var(--error)',
                      color: '#fff',
                      borderRadius: '999px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '1px 5px',
                      minWidth: 16,
                      textAlign: 'center',
                    }}
                  >
                    {notifications.filter((n) => !n.isRead).length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="notif-popover">
                  <div className="notif-header">
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Notifications</span>
                    {notifications.some((n) => !n.isRead) && (
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={handleMarkAllNotifsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: '0.82rem' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                          onClick={() => !n.isRead && handleMarkNotifRead(n.id)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="notif-title">{n.title}</div>
                            {!n.isRead && <span className="badge b-warn" style={{ fontSize: '0.65rem' }}>New</span>}
                          </div>
                          <div className="notif-msg">{n.message}</div>
                          <div className="notif-time">
                            {new Date(n.triggerTime || n.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hdr-avatar" title={studentName}>SS</div>
            <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="main-content">
          {/* ── VIEW: DASHBOARD ── */}
          {activeView === 'dashboard' && (
            <div className="view active">
              <div className="welcome">
                <div>
                  <h2>Welcome back, {studentName} 👋</h2>
                  <p>B.Sc. Computer Science · {collegeName} · Semester 5</p>
                </div>
                <div className="sem-badge">Semester 5 · Fall 2026</div>
              </div>

              {/* Real Stat Cards */}
              <div className="g4" style={{ marginBottom: 18 }}>
                <div className="card stat-card">
                  <div style={{ fontSize: 22, marginBottom: 4 }}>📋</div>
                  <div className="stat-val">{tasks.length}</div>
                  <div className="stat-lbl">Total Tasks</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: 4 }}>
                    {doneTasksCount} Completed ({tasks.length > 0 ? Math.round((doneTasksCount / tasks.length) * 100) : 0}%)
                  </div>
                </div>

                <div className="card stat-card">
                  <div style={{ fontSize: 22, marginBottom: 4 }}>📑</div>
                  <div className="stat-val">{assignments.length}</div>
                  <div className="stat-lbl">Assignments</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--warning)', marginTop: 4 }}>
                    {pendingAsgns.length} Pending Submission
                  </div>
                </div>

                <div className="card stat-card">
                  <div style={{ fontSize: 22, marginBottom: 4 }}>📖</div>
                  <div className="stat-val">{subjects.length}</div>
                  <div className="stat-lbl">Enrolled Courses</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--info)', marginTop: 4 }}>
                    {semesters[0]?.name || 'Semester 5'}
                  </div>
                </div>

                <div className="card stat-card">
                  <div style={{ fontSize: 22, marginBottom: 4 }}>⏰</div>
                  <div className="stat-val">{reminders.length}</div>
                  <div className="stat-lbl">Active Reminders</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: 4 }}>
                    {loadingData ? 'Syncing...' : 'Synced with Backend'}
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Items */}
              <div className="g2">
                <div className="card">
                  <div className="card-hdr">
                    <div className="card-t">Upcoming Assignments</div>
                    <button className="btn btn-xs btn-outline" onClick={() => setActiveView('academic')}>View All</button>
                  </div>
                  {assignments.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.85rem' }}>
                      No assignments logged yet.{' '}
                      <button className="btn btn-xs btn-primary" onClick={() => setIsAsgnModalOpen(true)}>+ Add One</button>
                    </div>
                  ) : (
                    assignments.slice(0, 4).map((a) => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{a.subject?.name || 'Subject Course'}</div>
                        </div>
                        <span className={`badge ${a.status === 'PENDING' ? 'b-warn' : 'b-ok'}`}>{a.status}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="card">
                  <div className="card-hdr">
                    <div className="card-t">Today's Tasks</div>
                    <button className="btn btn-xs btn-outline" onClick={() => setIsTaskModalOpen(true)}>+ Add Task</button>
                  </div>
                  {tasks.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.85rem' }}>
                      No tasks scheduled. Add your first task above.
                    </div>
                  ) : (
                    tasks.slice(0, 5).map((t) => (
                      <div key={t.id} className="task-item">
                        <div
                          className={`tcheck ${t.status === 'DONE' ? 'done' : ''}`}
                          onClick={() => handleToggleTask(t)}
                        >
                          {t.status === 'DONE' ? '✓' : ''}
                        </div>
                        <span className={`pdot ${t.priority === 'HIGH' ? 'p-hi' : t.priority === 'MEDIUM' ? 'p-md' : 'p-lo'}`}></span>
                        <span className={`task-txt ${t.status === 'DONE' ? 'done-txt' : ''}`}>{t.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW: ACADEMIC (COURSES & ASSIGNMENTS) ── */}
          {activeView === 'academic' && (
            <div className="view active">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div className="card-t" style={{ fontSize: '1.1rem' }}>Enrolled Subjects & Courses</div>
                  <div className="card-sub">Semester 5 · B.Sc. Computer Science at {collegeName}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-outline" onClick={() => setIsSubjModalOpen(true)}>+ Add Subject</button>
                  <button className="btn btn-sm btn-primary" onClick={() => setIsAsgnModalOpen(true)}>+ Add Assignment</button>
                </div>
              </div>

              {/* Subjects List */}
              <div className="g3" style={{ marginBottom: 20 }}>
                {subjects.map((sub) => (
                  <div key={sub.id} className="card" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{sub.name}</div>
                      <span className="badge b-pri">{sub.code || 'CORE'}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: 6 }}>
                      Credits: {sub.credits || 4} · Status: Active
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>
                      Classes Logged: {sub.attendedClasses || 0} / {sub.totalClasses || 0}
                    </div>
                  </div>
                ))}
              </div>

              {/* Assignments Table */}
              <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-t">Assignments Tracker</div>
                  <span className="badge b-ok">{assignments.length} Total</span>
                </div>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Due Date</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-3)' }}>
                          No assignments currently assigned. Click "+ Add Assignment" to record one.
                        </td>
                      </tr>
                    ) : (
                      assignments.map((a) => (
                        <tr key={a.id}>
                          <td style={{ fontWeight: 600 }}>{a.title}</td>
                          <td>{a.subject?.name || subjects.find((s) => s.id === a.subjectId)?.name || 'Course Subject'}</td>
                          <td>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No date set'}</td>
                          <td>
                            <span className={`badge ${a.priority === 'HIGH' ? 'b-err' : a.priority === 'MEDIUM' ? 'b-warn' : 'b-ok'}`}>
                              {a.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${a.status === 'PENDING' ? 'b-warn' : 'b-ok'}`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── VIEW: TASKS ── */}
          {activeView === 'tasks' && (
            <div className="view active">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div className="card-t" style={{ fontSize: '1.1rem' }}>Personal Productivity Tasks</div>
                  <div className="card-sub">Verified persistence in PostgreSQL with priority levels</div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => setIsTaskModalOpen(true)}>+ Create Task</button>
              </div>

              <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}></th>
                      <th>Task Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-3)' }}>
                          No tasks recorded. Add a task to track your study goals.
                        </td>
                      </tr>
                    ) : (
                      tasks.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <div
                              className={`tcheck ${t.status === 'DONE' ? 'done' : ''}`}
                              onClick={() => handleToggleTask(t)}
                            >
                              {t.status === 'DONE' ? '✓' : ''}
                            </div>
                          </td>
                          <td className={t.status === 'DONE' ? 'done-txt' : ''} style={{ fontWeight: 500 }}>
                            {t.title}
                          </td>
                          <td>
                            <span className={`badge ${t.priority === 'HIGH' ? 'b-err' : t.priority === 'MEDIUM' ? 'b-warn' : 'b-ok'}`}>
                              {t.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${t.status === 'DONE' ? 'b-ok' : 'b-info'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Open'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-xs btn-outline"
                              style={{ color: 'var(--error)' }}
                              onClick={() => handleDeleteTask(t.id)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── VIEW: NOTES (TEXT STUDY NOTES) ── */}
          {activeView === 'notes' && (
            <div className="view active">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div className="card-t" style={{ fontSize: '1.1rem' }}>Study Notes & Summaries</div>
                  <div className="card-sub">Verified subject-bound revision notes stored in PostgreSQL</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    className="form-select"
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                    value={noteFilterSubjectId}
                    onChange={(e) => setNoteFilterSubjectId(e.target.value)}
                  >
                    <option value="ALL">All Enrolled Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code ? `${s.code} · ` : ''}{s.name}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-sm btn-primary" onClick={() => setIsNoteModalOpen(true)}>+ New Note</button>
                </div>
              </div>

              {/* Notes Grid */}
              {(() => {
                const filteredNotes = noteFilterSubjectId === 'ALL'
                  ? notes
                  : notes.filter((n) => n.subjectId === noteFilterSubjectId);

                if (filteredNotes.length === 0) {
                  return (
                    <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>📝</div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)' }}>No Study Notes Found</div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: 4, marginBottom: 16 }}>
                        Create revision summaries and study materials linked to your enrolled subjects.
                      </p>
                      <button className="btn btn-sm btn-primary" onClick={() => setIsNoteModalOpen(true)}>+ Create First Note</button>
                    </div>
                  );
                }

                return (
                  <div className="g3">
                    {filteredNotes.map((note) => {
                      const subj = subjects.find((s) => s.id === note.subjectId);
                      return (
                        <div key={note.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <span className="badge b-pri">{subj?.code || subj?.name || 'Subject'}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6, color: 'var(--text-1)' }}>
                            {note.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', flex: 1, whiteSpace: 'pre-wrap', lineHeight: 1.4, marginBottom: 12 }}>
                            {note.content ? (note.content.length > 120 ? note.content.slice(0, 120) + '...' : note.content) : <em>No text content recorded.</em>}
                          </div>
                          {Array.isArray(note.tags) && note.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                              {note.tags.map((tag: string, idx: number) => (
                                <span key={idx} className="badge b-info" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 'auto' }}>
                            <button
                              className="btn btn-xs btn-outline"
                              onClick={() => setSelectedNote(note)}
                            >
                              View Note
                            </button>
                            <button
                              className="btn btn-xs btn-ghost"
                              style={{ color: 'var(--error)' }}
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── VIEW: CALENDAR & DEADLINES ── */}
          {activeView === 'calendar' && (
            <div className="view active">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div className="card-t" style={{ fontSize: '1.1rem' }}>Academic Calendar & Unified Deadlines</div>
                  <div className="card-sub">Combined schedule across assignment due dates, college events, exams, and reminders</div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => setIsEventModalOpen(true)}>+ Add Event</button>
              </div>

              {/* Schedule Stats Banner */}
              <div className="g3" style={{ marginBottom: 20 }}>
                <div className="card" style={{ marginBottom: 0, padding: 14 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Upcoming Assignments</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)', marginTop: 4 }}>
                    {unifiedCalendar.filter((i: any) => i.source === 'ASSIGNMENT').length}
                  </div>
                </div>
                <div className="card" style={{ marginBottom: 0, padding: 14 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Academic Events & Exams</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--info)', marginTop: 4 }}>
                    {unifiedCalendar.filter((i: any) => i.source === 'PERSONAL' || i.source === 'INSTITUTIONAL').length}
                  </div>
                </div>
                <div className="card" style={{ marginBottom: 0, padding: 14 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>Interviews & Reminders</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>
                    {unifiedCalendar.filter((i: any) => i.source === 'TASK' || i.source === 'INTERVIEW').length}
                  </div>
                </div>
              </div>

              {/* Unified Timeline Agenda */}
              {(() => {
                const combinedItems = [...unifiedCalendar].sort(
                  (a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                );

                if (combinedItems.length === 0) {
                  return (
                    <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>📅</div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)' }}>No Scheduled Deadlines in Active Window</div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: 4, marginBottom: 16 }}>
                        Add an assignment with a due date or create a custom exam/college event to build your schedule.
                      </p>
                      <button className="btn btn-sm btn-primary" onClick={() => setIsEventModalOpen(true)}>+ Add Calendar Event</button>
                    </div>
                  );
                }

                return (
                  <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Category</th>
                          <th>Title & Details</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {combinedItems.map((item: any) => {
                          const dateObj = new Date(item.startDate);
                          const isExam = item.category === 'EXAM' || item.source === 'PERSONAL';
                          const isAsgn = item.source === 'ASSIGNMENT';
                          const isInst = item.source === 'INSTITUTIONAL';

                          const typeBadgeClass = isExam
                            ? 'b-err'
                            : isAsgn
                            ? 'b-warn'
                            : isInst
                            ? 'b-info'
                            : 'b-ok';

                          return (
                            <tr key={item.id}>
                              <td style={{ whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.83rem' }}>
                                {dateObj.toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 400 }}>
                                  {dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${typeBadgeClass}`}>
                                  {item.source}: {item.category}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{item.title}</div>
                                {item.description && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{item.description}</div>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {item.source === 'PERSONAL' ? (
                                  <button
                                    className="btn btn-xs btn-outline"
                                    style={{ color: 'var(--error)' }}
                                    onClick={() => handleDeleteCalendarEvent(item.sourceId)}
                                  >
                                    ✕
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Auto-Synced</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── VIEW: INTERACTIVE TOOLS ── */}
          {activeView === 'tools' && (
            <div className="view active">
              <div className="g2">
                {/* Tool 1: Focus Timer */}
                <div className="card pomodoro-box">
                  <div className="card-t" style={{ marginBottom: 4 }}>Pomodoro Focus Timer</div>
                  <div className="card-sub" style={{ marginBottom: 16 }}>Interactive Client-Side Focus Tool</div>
                  <div className="pomo-modes">
                    <button
                      className={`pomo-mode-btn ${pomoMinutes === 25 ? 'active' : ''}`}
                      onClick={() => { setPomoMinutes(25); setPomoSecondsLeft(25 * 60); setPomoIsRunning(false); }}
                    >
                      25m Focus
                    </button>
                    <button
                      className={`pomo-mode-btn ${pomoMinutes === 50 ? 'active' : ''}`}
                      onClick={() => { setPomoMinutes(50); setPomoSecondsLeft(50 * 60); setPomoIsRunning(false); }}
                    >
                      50m Deep
                    </button>
                    <button
                      className={`pomo-mode-btn ${pomoMinutes === 5 ? 'active' : ''}`}
                      onClick={() => { setPomoMinutes(5); setPomoSecondsLeft(5 * 60); setPomoIsRunning(false); }}
                    >
                      5m Break
                    </button>
                  </div>
                  <div className="pomo-timer-display">
                    {Math.floor(pomoSecondsLeft / 60).toString().padStart(2, '0')}:
                    {(pomoSecondsLeft % 60).toString().padStart(2, '0')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setPomoIsRunning(!pomoIsRunning)}
                    >
                      {pomoIsRunning ? '⏸ Pause' : '▶ Start'}
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => { setPomoIsRunning(false); setPomoSecondsLeft(pomoMinutes * 60); }}
                    >
                      ↺ Reset
                    </button>
                  </div>
                </div>

                {/* Tool 2: Attendance Safe-Bunk Calculator */}
                <div className="card">
                  <div className="card-hdr">
                    <div>
                      <div className="card-t">Safe-Bunk Threshold Calculator</div>
                      <div className="card-sub">Mathematical formula verification tool (Enter custom values)</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label className="form-label">Total Conducted Classes</label>
                      <input
                        className="form-input"
                        type="number"
                        min={1}
                        value={bunkTotal}
                        onChange={(e) => setBunkTotal(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>
                    <div>
                      <label className="form-label">Classes Attended</label>
                      <input
                        className="form-input"
                        type="number"
                        min={0}
                        max={bunkTotal}
                        value={bunkAttended}
                        onChange={(e) => setBunkAttended(Math.max(0, parseInt(e.target.value) || 0))}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label className="form-label">Target Cutoff Threshold</label>
                    <select
                      className="form-select"
                      value={bunkTarget}
                      onChange={(e) => setBunkTarget(parseFloat(e.target.value))}
                    >
                      <option value="0.75">75% (Mandatory University Criteria)</option>
                      <option value="0.80">80% (Safe Cushion)</option>
                      <option value="0.85">85% (Distinction)</option>
                    </select>
                  </div>
                  <div className={`bunk-box ${bunkResult.status === 'safe' ? 'bunk-status-safe' : 'bunk-status-warn'}`}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>
                      {bunkResult.status === 'safe' ? '✅ Status: Safe' : '🚨 Status: Critical Action Required'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>{bunkResult.text}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── VIEW: PROFILE ── */}
          {activeView === 'profile' && (
            <div className="view active">
              <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="sb-avatar" style={{ width: 64, height: 64, fontSize: '1.4rem' }}>SS</div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{studentName}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>{user?.email || 'sufiyan.shaikh@example.com'}</p>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-2)' }}>
                    B.Sc. Computer Science · {collegeName} · Semester 5
                  </p>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    <span className="badge b-pri">Student</span>
                    <span className="badge b-ok">Verified Account</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-hdr">
                  <div className="card-t">System & Verification Architecture</div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.7 }}>
                  <p><strong>Architecture Pattern:</strong> Three-Tier Architecture (Client UI $\rightarrow$ Node.js/Express API Gateway $\rightarrow$ PostgreSQL Persistence via Prisma ORM).</p>
                  <p><strong>Authentication Mechanism:</strong> In-memory short-lived Access Token with HttpOnly Secure Refresh Token cookie rotation.</p>
                  <p><strong>Automated Verification Status:</strong> 46 Native PostgreSQL automated tests passing covering session revocation, row locking, reminder synchronization, and transactional rollback.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MODAL: CREATE TASK ── */}
      {isTaskModalOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Task</h3>
              <button className="modal-close" onClick={() => setIsTaskModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Task Title</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Implement B-Tree deletion algorithm"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={newTaskStatus}
                      onChange={(e) => setNewTaskStatus(e.target.value as any)}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date (Optional)</label>
                  <input
                    className="form-input"
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setIsTaskModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE ASSIGNMENT ── */}
      {isAsgnModalOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Course Assignment</h3>
              <button className="modal-close" onClick={() => setIsAsgnModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateAssignment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Assignment Title</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Socket Programming Chat Server"
                    value={newAsgnTitle}
                    onChange={(e) => setNewAsgnTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Enrolled Subject Course</label>
                  <select
                    className="form-select"
                    value={newAsgnSubjectId}
                    onChange={(e) => setNewAsgnSubjectId(e.target.value)}
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code ? `${s.code} · ` : ''}{s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={newAsgnPriority}
                      onChange={(e) => setNewAsgnPriority(e.target.value as any)}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={newAsgnDue.split('T')[0]}
                      onChange={(e) => setNewAsgnDue(`${e.target.value}T18:00:00.000Z`)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setIsAsgnModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary">Add Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE SUBJECT ── */}
      {isSubjModalOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Enrolled Subject</h3>
              <button className="modal-close" onClick={() => setIsSubjModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSubject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Subject Course Name</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Software Engineering"
                    value={newSubjName}
                    onChange={(e) => setNewSubjName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Course Code (Optional)</label>
                  <input
                    className="form-input"
                    placeholder="e.g. CS305"
                    value={newSubjCode}
                    onChange={(e) => setNewSubjCode(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setIsSubjModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE STUDY NOTE ── */}
      {isNoteModalOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-header">
              <h3>Create Study Note</h3>
              <button className="modal-close" onClick={() => setIsNoteModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateNote}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Note Title</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Binary Search Trees & AVL Rotations"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Enrolled Subject Course</label>
                  <select
                    className="form-select"
                    value={newNoteSubjectId}
                    onChange={(e) => setNewNoteSubjectId(e.target.value)}
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code ? `${s.code} · ` : ''}{s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (Comma-separated)</label>
                  <input
                    className="form-input"
                    placeholder="e.g. exam, algorithms, unit-2"
                    value={newNoteTags}
                    onChange={(e) => setNewNoteTags(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes Content (Markdown/Text)</label>
                  <textarea
                    className="form-textarea"
                    rows={6}
                    placeholder="Key concepts, formulas, definitions, and code snippets..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setIsNoteModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW STUDY NOTE ── */}
      {selectedNote && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3>{selectedNote.title}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
                  Subject: {subjects.find((s) => s.id === selectedNote.subjectId)?.name || 'Subject Course'}
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedNote(null)}>✕</button>
            </div>
            <div className="modal-body">
              {Array.isArray(selectedNote.tags) && selectedNote.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {selectedNote.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="badge b-info">#{tag}</span>
                  ))}
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.88rem', color: 'var(--text-1)' }}>
                {selectedNote.content || <em>No text content recorded.</em>}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ color: 'var(--error)' }}
                onClick={() => handleDeleteNote(selectedNote.id)}
              >
                Delete Note
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => setSelectedNote(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD CALENDAR EVENT ── */}
      {isEventModalOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Calendar Event</h3>
              <button className="modal-close" onClick={() => setIsEventModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCalendarEvent}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Event Title</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Midterm Theory Examination"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Event Type</label>
                    <select
                      className="form-select"
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value as any)}
                    >
                      <option value="EXAM">Exam</option>
                      <option value="CLASS">Class / Lecture</option>
                      <option value="COLLEGE_EVENT">College Event</option>
                      <option value="HOLIDAY">Holiday</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date & Time</label>
                    <input
                      className="form-input"
                      type="datetime-local"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Hall ticket requirements, venue room number, or preparation scope..."
                    value={newEventDesc}
                    onChange={(e) => setNewEventDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setIsEventModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

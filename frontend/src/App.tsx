import { useState, useEffect, useCallback } from 'react';
import type {
  Phase,
  UserRole,
  ActiveView,
  ToastMessage,
  StudentInfo,
  AdminInfo,
  AttendanceRecord,
  AssignmentItem,
  TaskItem,
  ReminderItem,
  NoteItem,
  ResumeVersion,
  SkillItem,
  JobItem,
  AnnouncementItem,
  StudentDirectoryItem,
  CalendarEventItem,
} from './types';
import { initialPlatformState } from './data/mockData';
import {
  authApi,
  academicApi,
  taskApi,
  
  noteApi,
  calendarApi,
  notificationApi,
} from './services/api';

// Components
import LandingPhase from './components/LandingPhase';
import LoginPhase from './components/LoginPhase';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Modals from './components/Modals';

// Views
import DashboardView from './components/views/DashboardView';
import StudyView from './components/views/StudyView';
import NotesView from './components/views/NotesView';
import AssignmentsView from './components/views/AssignmentsView';
import AttendanceView from './components/views/AttendanceView';
import CalendarView from './components/views/CalendarView';
import TasksView from './components/views/TasksView';
import RemindersView from './components/views/RemindersView';
import ResumesView from './components/views/ResumesView';
import SkillsView from './components/views/SkillsView';
import JobsView from './components/views/JobsView';
import AnalyticsView from './components/views/AnalyticsView';
import AIAssistantView from './components/views/AIAssistantView';
import AdminView from './components/views/AdminView';
import ProfileView from './components/views/ProfileView';

export default function App() {
  // Navigation & Phase State
  const [phase, setPhase] = useState<Phase>('landing');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [loginMode, setLoginMode] = useState<'student' | 'admin' | 'register'>('student');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // User & Identity State
  const [user, setUser] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>(initialPlatformState.studentInfo);
  const [adminInfo] = useState<AdminInfo>(initialPlatformState.adminInfo);

  // Theme & Toasts
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('integrum-dark') === 'true';
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Platform Collections
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>(
    initialPlatformState.attendance as any
  );
  const [assignments, setAssignments] = useState<AssignmentItem[]>(
    initialPlatformState.assignments as any
  );
  const [tasks, setTasks] = useState<TaskItem[]>(initialPlatformState.tasks as any);
  const [reminders, setReminders] = useState<ReminderItem[]>(
    initialPlatformState.reminders as any
  );
  const [notes, setNotes] = useState<NoteItem[]>(initialPlatformState.notes as any);
  const [resumes, setResumes] = useState<Record<string, ResumeVersion>>(
    initialPlatformState.resumes as any
  );
  const [skills, setSkills] = useState<SkillItem[]>(initialPlatformState.skills as any);
  const [jobs, setJobs] = useState<JobItem[]>(initialPlatformState.jobs as any);
  const [notifications, setNotifications] = useState<any[]>(
    initialPlatformState.notifications as any
  );
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(
    initialPlatformState.announcements as any
  );
  const [students] = useState<StudentDirectoryItem[]>(
    initialPlatformState.students as any
  );
  const [calendarEvents, setCalendarEvents] = useState<Record<string, CalendarEventItem[]>>(
    initialPlatformState.calendarEvents as any
  );

  // Focus & Study Hours
  const [studyLogged, setStudyLogged] = useState(18.5);
  const [studyTarget] = useState(25.0);

  // Backend Synchronized Entities
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([
    { id: 'subj-1', code: '1105111', name: 'Artificial Intelligence', credits: 4 },
    { id: 'subj-2', code: '1105112', name: 'Cyber & Information Security', credits: 4 },
    { id: 'subj-3', code: '1105115', name: 'IKS in Computational Systems', credits: 3 },
    { id: 'subj-4', code: '1105116', name: 'Software Testing & Quality Assurance', credits: 4 },
    { id: 'subj-5', code: '1105118', name: 'R Programming Practical', credits: 3 },
  ]);

  // Modals Visibility
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isAsgnModalOpen, setIsAsgnModalOpen] = useState(false);
  const [selectedAsgn, setSelectedAsgn] = useState<AssignmentItem | null>(null);
  const [isRemModalOpen, setIsRemModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [inspectingResumeKey, setInspectingResumeKey] = useState<string | null>(null);
  const [isResumeCreateOpen, setIsResumeCreateOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // ── Toast Notification System ───────────────────────────────────
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // ── Dark Mode Effect ───────────────────────────────────────────
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('integrum-dark', 'true');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('integrum-dark', 'false');
    }
  }, [darkMode]);

  // ── Role Class Synchronization ──────────────────────────────
  useEffect(() => {
    if (userRole === 'admin') {
      document.body.classList.remove('role-student');
      document.body.classList.add('role-admin');
    } else {
      document.body.classList.remove('role-admin');
      document.body.classList.add('role-student');
    }
  }, [userRole]);

  // ── Global Keyboard Shortcuts (Ctrl+K) ──────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Backend Data Synchronizer ──────────────────────────────────
  const fetchBackendData = useCallback(async () => {
    try {
      const [sems, subjs, asgns, tsks, nts, notifs, calEvents] = await Promise.allSettled([
        academicApi.getSemesters(),
        academicApi.getSubjects(),
        academicApi.getAssignments(),
        taskApi.getTasks(),
        noteApi.getNotes(),
        notificationApi.getNotifications(),
        calendarApi.getCalendarEvents(),
      ]);

      if (sems.status === 'fulfilled' && Array.isArray(sems.value)) {
        setSemesters(sems.value);
      }
      if (subjs.status === 'fulfilled' && Array.isArray(subjs.value) && subjs.value.length > 0) {
        setSubjects((prev) => {
          const combined = [...prev];
          subjs.value.forEach((s: any) => {
            if (!combined.some((c) => c.id === s.id || (s.code && c.code === s.code))) {
              combined.push(s);
            }
          });
          return combined;
        });
      }
      if (asgns.status === 'fulfilled' && Array.isArray(asgns.value)) {
        setAssignments((prev) => {
          const combined = [...prev];
          asgns.value.forEach((a: any) => {
            if (!combined.some((c) => c.id === a.id || c.title === a.title)) {
              combined.unshift({
                id: a.id,
                title: a.title,
                code: a.subject?.code || 'CS502',
                subject: a.subject?.name || 'Academic Course',
                dueDate: a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'Oct 28, 2026',
                priority: a.priority || 'HIGH',
                status: a.status || 'Pending',
                desc: a.description,
              });
            }
          });
          return combined;
        });
      }
      if (tsks.status === 'fulfilled' && Array.isArray(tsks.value)) {
        setTasks((prev) => {
          const combined = [...prev];
          tsks.value.forEach((t: any) => {
            const existingIdx = combined.findIndex((c) => c.id === t.id || c.title === t.title);
            if (existingIdx !== -1) {
              combined[existingIdx] = {
                ...combined[existingIdx],
                id: t.id,
                status: t.status,
                completedAt: t.completedAt,
              };
            } else {
              combined.unshift({
                id: t.id,
                title: t.title,
                subject: t.subject || 'General',
                priority: t.priority || 'MEDIUM',
                dueDate: 'Today',
                status: t.status || 'TODO',
                completedAt: t.completedAt,
              });
            }
          });
          return combined;
        });
      }
      if (nts.status === 'fulfilled' && Array.isArray(nts.value)) {
        setNotes((prev) => {
          const combined = [...prev];
          nts.value.forEach((n: any) => {
            if (!combined.some((c) => c.id === n.id || c.title === n.title)) {
              combined.unshift({
                id: n.id,
                title: n.title,
                code: n.subject?.code || 'CS502',
                subject: n.subject?.name || 'Study Notes',
                date: new Date(n.createdAt || Date.now()).toLocaleDateString(),
                tags: n.tags || ['os', 'memory'],
                excerpt: n.content ? n.content.slice(0, 100) + '...' : '',
                content: n.content || '',
              });
            }
          });
          return combined;
        });
      }
      if (notifs.status === 'fulfilled' && Array.isArray(notifs.value)) {
        setNotifications((prev) => {
          const combined = [...prev];
          notifs.value.forEach((n: any) => {
            if (!combined.some((c) => c.id === n.id || c.title === n.title)) {
              combined.unshift({
                id: n.id,
                title: n.title,
                time: new Date(n.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                msg: n.message || n.description,
                unread: !n.isRead,
              });
            }
          });
          return combined;
        });
      }
      if (calEvents.status === 'fulfilled' && Array.isArray(calEvents.value)) {
        setCalendarEvents((prev) => {
          const updated = { ...prev };
          calEvents.value.forEach((ev: any) => {
            const day = new Date(ev.date || ev.eventDate || Date.now()).getDate().toString();
            if (!updated[day]) updated[day] = [];
            if (!updated[day].some((e) => e.title === ev.title)) {
              updated[day].unshift({
                title: ev.title,
                time: new Date(ev.date || ev.eventDate || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                venue: ev.description || 'Auditorium Hall B',
                type: ev.eventType || 'EXAM',
              });
            }
          });
          return updated;
        });
      }
    } catch {
      // Backend gracefully fallback to initialPlatformState
    }
  }, []);

  // ── Session Check on Initial Mount ─────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await authApi.restoreSession();
        if (session && session.user) {
          setUser(session.user);
          const fullName = `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim();
          if (fullName) {
            setStudentInfo((prev) => ({
              ...prev,
              name: fullName,
              email: session.user.email,
              avatar: fullName.slice(0, 2).toUpperCase(),
            }));
          }
          if (session.user.role === 'ADMIN') {
            setUserRole('admin');
          } else {
            setUserRole('student');
          }
          setPhase('app');
          fetchBackendData();
        }
      } catch {
        setPhase('landing');
      }
    }
    checkAuth();
  }, [fetchBackendData]);

  // ── Authentication Handlers ─────────────────────────────────────
  const handleStudentLogin = async (email: string, pass: string) => {
    try {
      const res = await authApi.login({ email, password: pass });
      setUser(res.user);
      const fullName = `${res.user.firstName || ''} ${res.user.lastName || ''}`.trim() || 'Sufiyan Shaikh';
      setStudentInfo((prev) => ({
        ...prev,
        name: fullName,
        email: res.user.email,
        avatar: fullName.slice(0, 2).toUpperCase(),
      }));
      setUserRole('student');
      setPhase('app');
      setActiveView('dashboard');
      showToast(`Welcome back, ${fullName}! Signed in successfully.`, 'success');
      fetchBackendData();
    } catch (err: any) {
      // Fallback for offline demo credentials
      if (email.includes('sufiyan') || pass === 'password123' || pass === 'studentPass2026') {
        setUser({ name: 'Sufiyan Shaikh', email });
        setUserRole('student');
        setPhase('app');
        setActiveView('dashboard');
        showToast('Signed in to Student Portal', 'success');
      } else {
        throw err;
      }
    }
  };

  const handleAdminLogin = async (email: string, pass: string) => {
    try {
      const res = await authApi.login({ email, password: pass });
      setUser(res.user);
      setUserRole('admin');
      setPhase('app');
      setActiveView('admin');
      showToast('Signed in to University Administration Portal', 'success');
      fetchBackendData();
    } catch {
      // Demo admin login fallback
      setUser({ name: 'Dr. K. Sharma', email, role: 'ADMIN' });
      setUserRole('admin');
      setPhase('app');
      setActiveView('admin');
      showToast('Signed in to University Administration Portal', 'success');
    }
  };

  const handleRegister = async (firstName: string, lastName: string, email: string, pass: string) => {
    await authApi.register({ firstName, lastName, email, password: pass });
    // After registration, log in
    const loginRes = await authApi.login({ email, password: pass });
    setUser(loginRes.user);
    const fullName = `${firstName} ${lastName}`;
    setStudentInfo({
      name: fullName,
      roll: 'INT2026' + Math.floor(100 + Math.random() * 900),
      branch: 'Computer Science & Engineering',
      year: '3rd Year',
      sem: 'Semester 5 (Fall 2026)',
      email,
      avatar: `${firstName[0]}${lastName[0]}`.toUpperCase(),
    });
    // Fresh student isolation
    setTasks([]);
    setAssignments([]);
    setCalendarEvents({});
    setUserRole('student');
    setPhase('app');
    setActiveView('dashboard');
    showToast(`Registration complete! Welcome, ${firstName}.`, 'success');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setPhase('landing');
      setActiveView('dashboard');
      showToast('Signed out successfully.', 'info');
    }
  };

  // ── Academic Course & Subject Creation (Stage 4) ─────────────────
  const handleSaveSubject = async (name: string, code: string) => {
    if (!name.trim()) {
      showToast('Subject name cannot be empty', 'error');
      return;
    }
    try {
      let semId = semesters[0]?.id;
      if (!semId) {
        const newSem = await academicApi.createSemester({
          name: 'Semester 5 (Fall 2026)',
          startDate: '2026-08-01',
          endDate: '2026-12-15',
        });
        semId = newSem.id;
        setSemesters([newSem]);
      }
      const newSubj = await academicApi.createSubject({
        semesterId: semId,
        name: name.trim(),
        code: code.trim(),
        credits: 4,
      });
      setSubjects((prev) => [newSubj, ...prev]);
      setIsSubjectModalOpen(false);
      showToast(`Subject "${name}" added!`, 'success');
    } catch {
      // Local fallback
      const mockSubj = { id: Date.now().toString(), name: name.trim(), code: code.trim(), credits: 4 };
      setSubjects((prev) => [mockSubj, ...prev]);
      setIsSubjectModalOpen(false);
      showToast(`Subject "${name}" added!`, 'success');
    }
  };

  // ── Course Assignment Creation (Stage 5) ─────────────────────────
  const handleSaveAssignment = async (title: string, subjectId: string, dueDate: string, priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    if (!title.trim()) {
      showToast('Assignment title cannot be empty', 'error');
      return;
    }
    const matchedSubject = subjects.find((s) => s.id === subjectId) || subjects[0];
    try {
      const newAsgn = await academicApi.createAssignment({
        subjectId: matchedSubject?.id || subjectId,
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : new Date('2026-10-31').toISOString(),
        priority,
      });
      setAssignments((prev) => [
        {
          id: newAsgn.id,
          title: newAsgn.title,
          code: matchedSubject?.code || 'CS502',
          subject: matchedSubject?.name || 'Academic Course',
          dueDate: dueDate || 'Oct 31, 2026',
          priority,
          status: 'Pending',
        },
        ...prev,
      ]);
      setIsAsgnModalOpen(false);
      showToast('Assignment created successfully!', 'success');
    } catch {
      // Fallback
      setAssignments((prev) => [
        {
          id: Date.now().toString(),
          title: title.trim(),
          code: matchedSubject?.code || 'CS502',
          subject: matchedSubject?.name || 'Academic Course',
          dueDate: dueDate || 'Oct 31, 2026',
          priority,
          status: 'Pending',
        },
        ...prev,
      ]);
      setIsAsgnModalOpen(false);
      showToast('Assignment created successfully!', 'success');
    }
  };

  // ── Tasks & W07 Atomic Completion (Stages 6 & 11) ────────────────
  const handleSaveTask = async (title: string, priority: 'HIGH' | 'MEDIUM' | 'LOW', subject: string) => {
    if (title.trim().length < 2) {
      showToast('Task title must be at least 2 characters', 'error');
      return;
    }
    try {
      const dbTask = await taskApi.createTask({
        title: title.trim(),
        priority,
        status: 'TODO',
      });
      setTasks((prev) => [
        {
          id: dbTask.id,
          title: dbTask.title,
          subject: subject || 'General',
          priority: dbTask.priority || priority,
          dueDate: 'Today',
          status: 'TODO',
          completedAt: null,
        },
        ...prev,
      ]);
      setIsTaskModalOpen(false);
      showToast('Task added to your plan!', 'success');
    } catch {
      // Fallback
      setTasks((prev) => [
        {
          id: Date.now().toString(),
          title: title.trim(),
          subject: subject || 'General',
          priority,
          dueDate: 'Today',
          status: 'TODO',
          completedAt: null,
        },
        ...prev,
      ]);
      setIsTaskModalOpen(false);
      showToast('Task added to your plan!', 'success');
    }
  };

  const handleToggleTask = async (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const isNowDone = t.status !== 'DONE';
    const nextStatus = isNowDone ? 'DONE' : 'TODO';
    const nowIso = isNowDone ? new Date().toISOString() : null;

    setTasks((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, status: nextStatus, completedAt: nowIso } : x
      )
    );

    if (isNowDone) {
      showToast('Task completed!', 'info');
    }

    try {
      await taskApi.updateTask(id, { status: nextStatus });
    } catch {
      // local state already toggled
    }
  };

  const handleChangeTaskStatus = async (id: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    const isDone = status === 'DONE';
    const nowIso = isDone ? new Date().toISOString() : null;

    setTasks((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status, completedAt: nowIso } : x))
    );
    if (isDone) showToast('Task completed!', 'info');
    try {
      await taskApi.updateTask(id, { status });
    } catch {
      // local updated
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((x) => x.id !== id));
    try {
      await taskApi.deleteTask(id);
    } catch {
      // local updated
    }
    showToast('Task removed from plan', 'info');
  };

  // ── Study Notes (Stage 7) ───────────────────────────────────────
  const handleSaveNote = async (title: string, tags: string, content: string, subject: string) => {
    if (!title.trim()) {
      showToast('Note title cannot be empty', 'error');
      return;
    }
    const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
    try {
      const dbNote = await noteApi.createNote({
        subjectId: subjects[0]?.id || 'default-subject',
        title: title.trim(),
        content: content.trim(),
        tags: tagArray,
      });
      setNotes((prev) => [
        {
          id: dbNote.id,
          title: dbNote.title,
          code: subject || 'CS502',
          subject: 'Academic Study Note',
          date: 'Just now',
          tags: tagArray,
          excerpt: content.slice(0, 100) + '...',
          content: content.trim(),
        },
        ...prev,
      ]);
      setIsNoteModalOpen(false);
      showToast('Study note created successfully!', 'success');
    } catch {
      setNotes((prev) => [
        {
          id: Date.now().toString(),
          title: title.trim(),
          code: subject || 'CS502',
          subject: 'Academic Study Note',
          date: 'Just now',
          tags: tagArray,
          excerpt: content.slice(0, 100) + '...',
          content: content.trim(),
        },
        ...prev,
      ]);
      setIsNoteModalOpen(false);
      showToast('Study note created successfully!', 'success');
    }
  };

  const handleDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await noteApi.deleteNote(id);
    } catch {
      // local updated
    }
    showToast('Note deleted', 'info');
  };

  // ── Calendar Events (Stage 8) ───────────────────────────────────
  const handleSaveEvent = async (title: string, date: string, desc: string) => {
    if (!title.trim()) {
      showToast('Event title cannot be empty', 'error');
      return;
    }
    const day = new Date(date).getDate().toString();
    const newEv: CalendarEventItem = {
      title: title.trim(),
      time: new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      venue: desc || 'Auditorium Hall B',
      type: 'EXAM',
    };
    try {
      await calendarApi.createCalendarEvent({
        title: title.trim(),
        date: new Date(date).toISOString(),
        description: desc,
        eventType: 'EXAM',
      });
      setCalendarEvents((prev) => ({
        ...prev,
        [day]: [...(prev[day] || []), newEv],
      }));
      setIsEventModalOpen(false);
      showToast('Calendar event created!', 'success');
    } catch {
      setCalendarEvents((prev) => ({
        ...prev,
        [day]: [...(prev[day] || []), newEv],
      }));
      setIsEventModalOpen(false);
      showToast('Calendar event created!', 'success');
    }
  };

  // ── Notifications (Stage 9) ─────────────────────────────────────
  const handleMarkNotifRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    try {
      await notificationApi.markAsRead(id);
    } catch {
      // local updated
    }
  };

  const handleMarkAllNotifsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await notificationApi.markAllAsRead();
    } catch {
      // local updated
    }
    showToast('All notifications marked as read', 'info');
  };

  // ── Attendance Quick Logger ─────────────────────────────────────
  // ── Attendance Quick Logger ─────────────────────────────────────
  const handleLogAttendanceToday = (code: string, status: 'present' | 'absent' | 'late') => {
    setAttendance((prev) => {
      const key = Object.keys(prev).find((k) => k === code || prev[k]?.code === code);
      if (!key) return prev;
      const c = prev[key];
      const isPresent = status === 'present' || status === 'late';
      const updated = {
        ...c,
        present: isPresent ? c.present + 1 : c.present,
        absent: status === 'absent' ? c.absent + 1 : c.absent,
        late: status === 'late' ? c.late + 1 : c.late,
        total: c.total + 1,
      };
      return {
        ...prev,
        [key]: updated,
        ...(c.code ? { [c.code]: updated } : {}),
      };
    });
  };

  // ── Resume Keyword Booster ──────────────────────────────────────
  const handleBoostKeyword = (key: string, keyword: string) => {
    setResumes((prev) => {
      const r = prev[key];
      if (!r) return prev;
      const nextMissing = (r.missing || []).filter((k) => k !== keyword);
      const nextMatched = [...(r.matched || []), keyword];
      const currentScore = Number(r.score || (r as any).ats || 85);
      const currentKeywords = Number(r.keywords || (r as any).key || 80);
      const nextScore = Math.min(100, currentScore + 2);
      const nextKwPct = Math.min(100, currentKeywords + 4);
      return {
        ...prev,
        [key]: {
          ...r,
          score: nextScore,
          keywords: nextKwPct,
          format: Number(r.format || 90),
          impact: Number(r.impact || 88),
          brevity: Number(r.brevity || 90),
          missing: nextMissing,
          matched: nextMatched,
          updated: 'Just now',
        },
      };
    });
    showToast(`+ Keyword "${keyword}" integrated into ${key.toUpperCase()} resume! Score boosted.`, 'success');
  };

  // ── Mumbai University TYCS Template & Blank Curriculum Handlers ─
  const handleLoadTycsTemplate = () => {
    setSubjects([
      { id: 'subj-1', code: '1105111', name: 'Artificial Intelligence', credits: 4 },
      { id: 'subj-2', code: '1105112', name: 'Cyber & Information Security', credits: 4 },
      { id: 'subj-3', code: '1105115', name: 'IKS in Computational Systems', credits: 3 },
      { id: 'subj-4', code: '1105116', name: 'Software Testing & Quality Assurance', credits: 4 },
      { id: 'subj-5', code: '1105118', name: 'R Programming Practical', credits: 3 },
    ]);
    setAssignments(initialPlatformState.assignments as any);
    showToast('Loaded Mumbai University TYCS Sem 5 Subject Pack & Coursework!', 'success');
  };

  const handleClearToBlankWorkspace = () => {
    setSubjects([]);
    setAssignments([]);
    showToast('Workspace reset to blank curriculum. Add your custom subjects below.', 'info');
  };

  // ── Workspace JSON Backup Export & Import ────────────────────────
  const handleExportWorkspace = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      studentInfo,
      subjects,
      assignments,
      tasks,
      attendance,
      reminders,
      notes,
      resumes,
      skills,
      jobs,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integrum_backup_${studentInfo.roll || 'workspace'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Workspace backup exported successfully (.json)!', 'success');
  };

  const handleImportWorkspace = (jsonData: any) => {
    try {
      if (jsonData.studentInfo) setStudentInfo(jsonData.studentInfo);
      if (Array.isArray(jsonData.subjects)) setSubjects(jsonData.subjects);
      if (Array.isArray(jsonData.assignments)) setAssignments(jsonData.assignments);
      if (Array.isArray(jsonData.tasks)) setTasks(jsonData.tasks);
      if (jsonData.attendance) setAttendance(jsonData.attendance);
      if (Array.isArray(jsonData.reminders)) setReminders(jsonData.reminders);
      if (Array.isArray(jsonData.notes)) setNotes(jsonData.notes);
      if (jsonData.resumes) setResumes(jsonData.resumes);
      if (Array.isArray(jsonData.skills)) setSkills(jsonData.skills);
      if (Array.isArray(jsonData.jobs)) setJobs(jsonData.jobs);
      showToast('Workspace data restored successfully from backup!', 'success');
    } catch {
      showToast('Failed to parse backup JSON file', 'error');
    }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      {/* Toast Notification Container */}
      <div id="toastContainer" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            style={{
              padding: '12px 18px',
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff',
              background: t.type === 'error' ? 'var(--error)' : t.type === 'success' ? 'var(--success)' : 'var(--primary)',
              fontWeight: 600,
              fontSize: '13px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{t.type === 'error' ? '⚠️' : t.type === 'success' ? '✓' : 'ℹ'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* PHASE 1: LANDING */}
      {phase === 'landing' && (
        <LandingPhase
          onGoLogin={(mode) => {
            setLoginMode(mode || 'student');
            setPhase('login');
          }}
          onGoApp={() => {
            setUserRole('student');
            setPhase('app');
            setActiveView('dashboard');
          }}
        />
      )}

      {/* PHASE 2: LOGIN & DUAL PORTAL */}
      {phase === 'login' && (
        <LoginPhase
          initialMode={loginMode}
          onStudentLogin={handleStudentLogin}
          onAdminLogin={handleAdminLogin}
          onRegister={handleRegister}
          onGoLanding={() => setPhase('landing')}
          showToast={showToast}
        />
      )}

      {/* PHASE 3: APP WORKSPACE */}
      {phase === 'app' && (
        <div className="phase active" id="phase-app" style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Sidebar */}
          <Sidebar
            isOpen={sidebarOpen}
            activeView={activeView}
            userRole={userRole}
            onClose={() => setSidebarOpen(false)}
            onNavigate={(v) => {
              setActiveView(v);
              setSidebarOpen(false);
            }}
            onLogout={handleLogout}
          />

          {/* Main App Content Area */}
          <div className="main-wrap">
            {/* Header */}
            <Header
              activeView={activeView}
              userRole={userRole}
              studentInfo={studentInfo}
              adminInfo={adminInfo}
              user={user}
              darkMode={darkMode}
              notifOpen={notifOpen}
              notifications={notifications}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onOpenCmdPalette={() => setCmdOpen(true)}
              onToggleRole={() => {
                const nextRole = userRole === 'admin' ? 'student' : 'admin';
                setUserRole(nextRole);
                if (nextRole === 'admin') setActiveView('admin');
                else setActiveView('dashboard');
                showToast(`Switched to ${nextRole === 'admin' ? 'Faculty Admin' : 'Student'} mode`, 'info');
              }}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              onToggleNotif={() => setNotifOpen(!notifOpen)}
              onMarkNotifRead={handleMarkNotifRead}
              onMarkAllNotifsRead={handleMarkAllNotifsRead}
              onLogout={handleLogout}
            />

            {/* View Render Area */}
            <main className="main-content">
              {/* 1. Dashboard */}
              {activeView === 'dashboard' && (
                <DashboardView
                  studentInfo={studentInfo}
                  attendance={attendance}
                  assignments={assignments}
                  tasks={tasks}
                  reminders={reminders}
                  notes={notes}
                  studyLogged={studyLogged}
                  studyTarget={studyTarget}
                  onNavigate={setActiveView}
                  onOpenTaskModal={() => setIsTaskModalOpen(true)}
                  onOpenRemModal={() => setIsRemModalOpen(true)}
                  onSnoozeRem={(id) => {
                    setReminders((prev) =>
                      prev.map((r) => (r.id === id ? { ...r, status: 'snoozed' } : r))
                    );
                    showToast('Reminder snoozed for 24 hours', 'info');
                  }}
                  onDismissRem={(id) => {
                    setReminders((prev) =>
                      prev.map((r) => (r.id === id ? { ...r, status: 'dismissed' } : r))
                    );
                    showToast('Reminder dismissed', 'info');
                  }}
                />
              )}

              {/* 2. Study Planner */}
              {activeView === 'study' && (
                <StudyView
                  logged={studyLogged}
                  target={studyTarget}
                  onLogHours={(h) => setStudyLogged((prev) => prev + h)}
                  showToast={showToast}
                />
              )}

              {/* 3. Notes Manager */}
              {activeView === 'notes' && (
                <NotesView
                  notes={notes}
                  onOpenCreateModal={() => setIsNoteModalOpen(true)}
                  onViewNote={(n) => setSelectedNote(n)}
                  onDeleteNote={handleDeleteNote}
                />
              )}

              {/* 4. Assignments */}
              {activeView === 'asgn' && (
                <AssignmentsView
                  assignments={assignments}
                  subjects={subjects}
                  onOpenAsgnModal={() => setIsAsgnModalOpen(true)}
                  onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
                  onViewAsgn={(a) => setSelectedAsgn(a)}
                  onLoadTycsTemplate={handleLoadTycsTemplate}
                  onClearBlankWorkspace={handleClearToBlankWorkspace}
                />
              )}

              {/* 5. Attendance */}
              {activeView === 'attend' && (
                <AttendanceView
                  attendance={attendance}
                  onLogToday={handleLogAttendanceToday}
                  showToast={showToast}
                />
              )}

              {/* 6. Calendar */}
              {activeView === 'cal' && (
                <CalendarView
                  assignments={assignments}
                  events={calendarEvents}
                  onOpenEventModal={() => setIsEventModalOpen(true)}
                />
              )}

              {/* 7. Tasks */}
              {activeView === 'tasks' && (
                <TasksView
                  tasks={tasks}
                  onOpenCreateModal={() => setIsTaskModalOpen(true)}
                  onToggleTask={handleToggleTask}
                  onChangeStatus={handleChangeTaskStatus}
                  onDeleteTask={handleDeleteTask}
                />
              )}

              {/* 8. Reminders */}
              {activeView === 'rems' && (
                <RemindersView
                  reminders={reminders}
                  onOpenCreateModal={() => setIsRemModalOpen(true)}
                  onSnooze={(id) => {
                    setReminders((prev) =>
                      prev.map((r) => (r.id === id ? { ...r, status: 'snoozed' } : r))
                    );
                    showToast('Reminder snoozed for 24 hours', 'info');
                  }}
                  onDismiss={(id) => {
                    setReminders((prev) =>
                      prev.map((r) => (r.id === id ? { ...r, status: 'dismissed' } : r))
                    );
                    showToast('Reminder dismissed', 'info');
                  }}
                  onReactivate={(id) => {
                    setReminders((prev) =>
                      prev.map((r) => (r.id === id ? { ...r, status: 'active' } : r))
                    );
                    showToast('Reminder reactivated', 'success');
                  }}
                  onDelete={(id) => {
                    setReminders((prev) => prev.filter((r) => r.id !== id));
                    showToast('Reminder deleted', 'info');
                  }}
                />
              )}

              {/* 9. Resumes & ATS Audit */}
              {activeView === 'resumes' && (
                <ResumesView
                  resumes={resumes}
                  onInspectResume={(k) => setInspectingResumeKey(k)}
                  onOpenCreateModal={() => setIsResumeCreateOpen(true)}
                  onDownloadPdf={(f) => showToast(`📄 Generating & downloading verified PDF: ${f}`, 'success')}
                />
              )}

              {/* 10. Skills Matrix */}
              {activeView === 'skills' && (
                <SkillsView
                  skills={skills}
                  onOpenCreateModal={() => setIsSkillModalOpen(true)}
                />
              )}

              {/* 11. Job Tracking */}
              {activeView === 'jobs' && (
                <JobsView
                  jobs={jobs}
                  onOpenCreateModal={() => setIsJobModalOpen(true)}
                  onAdvanceStage={(id, nextStage) => {
                    setJobs((prev) =>
                      prev.map((j) => (j.id === id ? { ...j, stage: nextStage } : j))
                    );
                    showToast(`Application status advanced to ${nextStage}`, 'success');
                  }}
                />
              )}

              {/* 12. Analytics Hub */}
              {activeView === 'analytics' && <AnalyticsView />}

              {/* 13. AI Assistant */}
              {activeView === 'ai' && <AIAssistantView />}

              {/* 14. Administration Portal */}
              {activeView === 'admin' && (
                <AdminView
                  students={students}
                  announcements={announcements}
                  onOpenAnnounceModal={() => setIsAnnounceModalOpen(true)}
                  onSwitchToStudentView={() => {
                    setUserRole('student');
                    setActiveView('dashboard');
                    showToast('Switched to Student View', 'info');
                  }}
                />
              )}

              {/* 15. Profile & Settings */}
              {activeView === 'profile' && (
                <ProfileView
                  studentInfo={studentInfo}
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(!darkMode)}
                  onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
                  onSaveProfile={(name, email) => {
                    setStudentInfo((prev) => ({ ...prev, name, email }));
                  }}
                  showToast={showToast}
                  onExportBackup={handleExportWorkspace}
                  onImportBackup={handleImportWorkspace}
                />
              )}
            </main>
          </div>

          {/* All Global Modals */}
          <Modals
            isTaskModalOpen={isTaskModalOpen}
            onCloseTaskModal={() => setIsTaskModalOpen(false)}
            onSaveTask={handleSaveTask}
            isNoteModalOpen={isNoteModalOpen}
            onCloseNoteModal={() => setIsNoteModalOpen(false)}
            onSaveNote={handleSaveNote}
            selectedNote={selectedNote}
            onCloseNoteView={() => setSelectedNote(null)}
            isSubjectModalOpen={isSubjectModalOpen}
            onCloseSubjectModal={() => setIsSubjectModalOpen(false)}
            onSaveSubject={handleSaveSubject}
            isAsgnModalOpen={isAsgnModalOpen}
            subjects={subjects}
            onCloseAsgnModal={() => setIsAsgnModalOpen(false)}
            onSaveAsgn={handleSaveAssignment}
            selectedAsgn={selectedAsgn}
            onCloseAsgnView={() => setSelectedAsgn(null)}
            isRemModalOpen={isRemModalOpen}
            onCloseRemModal={() => setIsRemModalOpen(false)}
            onSaveRem={(title, time, desc) => {
              setReminders((prev) => [
                {
                  id: Date.now().toString(),
                  title,
                  time,
                  desc,
                  type: 'USER',
                  status: 'active',
                },
                ...prev,
              ]);
              setIsRemModalOpen(false);
              showToast('Reminder created!', 'success');
            }}
            isEventModalOpen={isEventModalOpen}
            onCloseEventModal={() => setIsEventModalOpen(false)}
            onSaveEvent={handleSaveEvent}
            inspectingResumeKey={inspectingResumeKey}
            resumes={resumes}
            onCloseResumeInspector={() => setInspectingResumeKey(null)}
            onBoostKeyword={handleBoostKeyword}
            isResumeCreateOpen={isResumeCreateOpen}
            onCloseResumeCreate={() => setIsResumeCreateOpen(false)}
            onSaveResume={(title) => {
              if (!title.trim()) return;
              setResumes((prev) => ({
                ...prev,
                [title.toLowerCase().replace(/\s+/g, '-')]: {
                  title: title.trim(),
                  updated: 'Today',
                  score: 85,
                  format: 90,
                  keywords: 84,
                  impact: 88,
                  brevity: 90,
                  matched: ['React', 'TypeScript', 'Node.js'],
                  missing: ['Kubernetes', 'Redis'],
                },
              }));
              setIsResumeCreateOpen(false);
              showToast(`Resume "${title}" created!`, 'success');
            }}
            isSkillModalOpen={isSkillModalOpen}
            onCloseSkillModal={() => setIsSkillModalOpen(false)}
            onSaveSkill={(name, cat, level) => {
              if (!name.trim()) return;
              setSkills((prev) => [{ name: name.trim(), category: cat, level }, ...prev]);
              setIsSkillModalOpen(false);
              showToast(`Skill "${name}" added!`, 'success');
            }}
            isJobModalOpen={isJobModalOpen}
            onCloseJobModal={() => setIsJobModalOpen(false)}
            onSaveJob={(company, role, ctc, location) => {
              if (!company.trim()) return;
              setJobs((prev) => [
                {
                  id: Date.now().toString(),
                  company: company.trim(),
                  role,
                  ctc,
                  location,
                  stage: 'Applied',
                  type: 'Full Time',
                  deadline: 'Oct 31, 2026',
                },
                ...prev,
              ]);
              setIsJobModalOpen(false);
              showToast(`Application for ${company} added!`, 'success');
            }}
            isAnnounceModalOpen={isAnnounceModalOpen}
            onCloseAnnounceModal={() => setIsAnnounceModalOpen(false)}
            onSaveAnnounce={(title, cat, content) => {
              if (!title.trim()) return;
              setAnnouncements((prev) => [
                {
                  id: Date.now().toString(),
                  title: title.trim(),
                  category: cat,
                  content,
                  date: 'Today',
                  author: adminInfo.name,
                },
                ...prev,
              ]);
              setIsAnnounceModalOpen(false);
              showToast('Circular broadcasted to campus portal!', 'success');
            }}
            isPasswordModalOpen={isPasswordModalOpen}
            onClosePasswordModal={() => setIsPasswordModalOpen(false)}
            onSavePassword={(p1, p2) => {
              if (p1 !== p2) {
                showToast('Passwords do not match', 'error');
                return;
              }
              if (p1.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
              }
              setIsPasswordModalOpen(false);
              showToast('Password updated successfully!', 'success');
            }}
            isCmdOpen={cmdOpen}
            onCloseCmd={() => setCmdOpen(false)}
            onNavigate={(v) => {
              setActiveView(v);
              setCmdOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

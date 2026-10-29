import { useState, useEffect, useCallback } from 'react';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import ErrorBoundary from './components/ErrorBoundary';
import type {
  Phase,
  UserRole,
  ActiveView,
  ThemeMode,
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
  InstitutionAdminInfo,
  DepartmentHeadInfo,
  FacultyInfo,
  RegistrationCodeItem,
  StaffRole,
} from './types';
import { initialPlatformState } from './data/mockData';
import {
  authApi,
  academicApi,
  taskApi,
  
  noteApi,
  calendarApi,
  notificationApi,
  adminApi,
} from './services/api';

// Components
import LandingPhase from './components/LandingPhase';
import LoginPhase, { type RegisterData } from './components/LoginPhase';
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
  const [phase, setPhase] = useLocalStorageState<Phase>('integrum_phase', 'landing');
  const [activeView, setActiveView] = useLocalStorageState<ActiveView>('integrum_active_view', 'dashboard');
  const [userRole, setUserRole] = useLocalStorageState<UserRole>('integrum_user_role', 'student');
  const [loginMode, setLoginMode] = useState<'student' | 'admin' | 'register'>('student');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // User & Identity State
  const [user, setUser] = useLocalStorageState<any>('integrum_user', null);
  const [studentInfo, setStudentInfo] = useLocalStorageState<StudentInfo>('integrum_student_info', initialPlatformState.studentInfo);
  const [adminInfo] = useState<AdminInfo>(initialPlatformState.adminInfo);
  const [institutionAdminInfo, setInstitutionAdminInfo] = useLocalStorageState<InstitutionAdminInfo>(
    'integrum_institution_admin_info',
    initialPlatformState.institutionAdminInfo
  );
  const [departmentHeadInfo, setDepartmentHeadInfo] = useLocalStorageState<DepartmentHeadInfo>(
    'integrum_department_head_info',
    initialPlatformState.departmentHeadInfo
  );
  const [facultyInfo, setFacultyInfo] = useLocalStorageState<FacultyInfo>(
    'integrum_faculty_info',
    initialPlatformState.facultyInfo
  );
  const [registrationCodes, setRegistrationCodes] = useState<RegistrationCodeItem[]>([]);

  // Theme & Toasts
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('integrum-theme-mode');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved as ThemeMode;
    }
    const legacy = localStorage.getItem('integrum-dark');
    if (legacy === 'true') return 'dark';
    if (legacy === 'false') return 'light';
    return 'system';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedMode = localStorage.getItem('integrum-theme-mode');
    if (savedMode === 'dark') return true;
    if (savedMode === 'light') return false;
    const legacy = localStorage.getItem('integrum-dark');
    if (legacy === 'true') return true;
    if (legacy === 'false') return false;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Platform Collections
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>(
    initialPlatformState.attendance as any
  );
  const [assignments, setAssignments] = useState<AssignmentItem[]>(
    initialPlatformState.assignments as any
  );
  const [tasks, setTasks] = useLocalStorageState<TaskItem[]>('integrum_tasks', initialPlatformState.tasks as any);
  const [reminders, setReminders] = useState<ReminderItem[]>(
    initialPlatformState.reminders as any
  );
  const [notes, setNotes] = useLocalStorageState<NoteItem[]>('integrum_notes', initialPlatformState.notes as any);
  const [resumes, setResumes] = useState<Record<string, ResumeVersion>>(
    initialPlatformState.resumes as any
  );
  const [skills, setSkills] = useLocalStorageState<SkillItem[]>('integrum_skills', initialPlatformState.skills as any);
  const [jobs, setJobs] = useLocalStorageState<JobItem[]>('integrum_jobs', initialPlatformState.jobs as any);
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
  const [studyLogged, setStudyLogged] = useLocalStorageState<number>('integrum_study_logged', 0.0);
  const [studyTarget] = useState(25.0);

  // Backend Synchronized Entities
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

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

  // ── Theme Management & Automatic System Sync ─────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const syncTheme = () => {
      if (themeMode === 'system') {
        setDarkMode(mediaQuery.matches);
      } else if (themeMode === 'dark') {
        setDarkMode(true);
      } else {
        setDarkMode(false);
      }
    };

    syncTheme();

    const listener = (e: MediaQueryListEvent) => {
      if (themeMode === 'system') {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [themeMode]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('integrum-dark', darkMode ? 'true' : 'false');
    localStorage.setItem('integrum-theme-mode', themeMode);
  }, [darkMode, themeMode]);

  const handleToggleDarkMode = () => {
    const nextMode: ThemeMode = darkMode ? 'light' : 'dark';
    setThemeMode(nextMode);
    setDarkMode(!darkMode);
  };

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    if (mode === 'system') {
      const isDark = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
      setDarkMode(isDark);
      showToast('Theme synchronized with browser system preference', 'info');
    } else {
      setDarkMode(mode === 'dark');
      showToast(`Switched to ${mode === 'dark' ? 'High-Contrast Dark' : 'Academic Light'} theme`, 'info');
    }
  };

  const handleToggleInstitutional = () => {
    const currentIsInst = studentInfo.isInstitutional !== false;
    const nextIsInst = !currentIsInst;
    setStudentInfo((prev) => ({
      ...prev,
      isInstitutional: nextIsInst,
      institution: nextIsInst ? 'University Department of Computer Science' : undefined,
    }));
    showToast(
      nextIsInst
        ? 'Connected to University Department of Computer Science. Attendance and Academic Calendar activated.'
        : 'Disconnected from institution. Switched to Independent Learner mode (attendance & exam schedules hidden).',
      'info'
    );
  };

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

  // ── One-Time Cache Purge for Stale Mock Data ───────────────────
  useEffect(() => {
    const PURGE_KEY = 'integrum_mock_purged_v4';
    if (typeof window !== 'undefined' && localStorage.getItem(PURGE_KEY) !== 'true') {
      const keysToPurge = [
        'integrum_tasks',
        'integrum_notes',
        'integrum_assignments',
        'integrum_subjects',
        'integrum_attendance',
        'integrum_calendar_events',
        'integrum_reminders',
        'integrum_skills',
        'integrum_jobs',
        'integrum_study_logged',
        'integrum_announcements',
        'integrum_notifications',
      ];
      keysToPurge.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(PURGE_KEY, 'true');
      setTasks([]);
      setNotes([]);
      setAssignments([]);
      setSubjects([]);
      setAttendance({});
      setCalendarEvents({});
      setReminders([]);
      setSkills([]);
      setJobs([]);
      setStudyLogged(0.0);
    }
  }, [setTasks, setNotes, setSkills, setJobs, setStudyLogged]);

  // ── Backend Data Synchronizer ──────────────────────────────────
  const fetchBackendData = useCallback(async (targetRole?: UserRole) => {
    try {
      const activeRole = targetRole || userRole;
      const isStaff = activeRole === 'admin';

      const calls: Promise<any>[] = [
        academicApi.getSemesters(),
        academicApi.getSubjects(),
        academicApi.getAssignments(),
        taskApi.getTasks(),
        noteApi.getNotes(),
        notificationApi.getNotifications(),
        calendarApi.getCalendarEvents(),
      ];
      if (isStaff) {
        calls.push(adminApi.getRegistrationCodes());
      }

      const results = await Promise.allSettled(calls);
      const [sems, subjs, asgns, tsks, nts, notifs, calEvents] = results;
      const regCodes = isStaff ? results[7] : null;

      if (sems.status === 'fulfilled' && Array.isArray(sems.value)) {
        setSemesters(sems.value);
      }
      if (subjs.status === 'fulfilled' && Array.isArray(subjs.value)) {
        setSubjects(subjs.value);
      }
      if (asgns.status === 'fulfilled' && Array.isArray(asgns.value)) {
        setAssignments(
          asgns.value.map((a: any) => ({
            id: a.id,
            title: a.title,
            code: a.subject?.code || 'COURSE',
            subject: a.subject?.name || 'Academic Course',
            dueDate: a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'Pending',
            priority: a.priority || 'MEDIUM',
            status: a.status || 'Pending',
            desc: a.description,
          }))
        );
      }
      if (tsks.status === 'fulfilled' && Array.isArray(tsks.value)) {
        setTasks(
          tsks.value.map((t: any) => ({
            id: t.id,
            title: t.title,
            subject: t.subject || 'General',
            priority: t.priority || 'MEDIUM',
            dueDate: 'Today',
            status: t.status || 'TODO',
            completedAt: t.completedAt,
          }))
        );
      }
      if (nts.status === 'fulfilled' && Array.isArray(nts.value)) {
        setNotes(
          nts.value.map((n: any) => ({
            id: n.id,
            title: n.title,
            code: n.subject?.code || 'COURSE',
            subject: n.subject?.name || 'Study Notes',
            date: new Date(n.createdAt || Date.now()).toLocaleDateString(),
            tags: n.tags || ['notes'],
            excerpt: n.content ? n.content.slice(0, 100) + '...' : '',
            content: n.content || '',
          }))
        );
      }
      if (notifs.status === 'fulfilled' && Array.isArray(notifs.value)) {
        setNotifications(
          notifs.value.map((n: any) => ({
            id: n.id,
            title: n.title,
            time: new Date(n.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            msg: n.message || n.description,
            unread: !n.isRead,
          }))
        );
      }
      if (calEvents.status === 'fulfilled' && Array.isArray(calEvents.value)) {
        const updated: Record<string, any[]> = {};
        calEvents.value.forEach((ev: any) => {
          const day = new Date(ev.date || ev.eventDate || Date.now()).getDate().toString();
          if (!updated[day]) updated[day] = [];
          updated[day].push({
            title: ev.title,
            time: new Date(ev.date || ev.eventDate || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            venue: ev.description || 'Campus',
            type: ev.eventType || 'EVENT',
          });
        });
        setCalendarEvents(updated);
      }
      if (regCodes && regCodes.status === 'fulfilled' && Array.isArray(regCodes.value)) {
        setRegistrationCodes(
          regCodes.value.map((c: any) => ({
            id: c.id,
            code: c.code,
            departmentName: c.department?.name || 'Computer Science & Engineering',
            departmentCode: c.department?.code || 'CSE',
            semesterNumber: c.semesterNumber || 1,
            academicYear: c.academicYear || 2026,
            maxUses: c.maxUses ?? null,
            usedCount: c.usedCount || 0,
            isActive: c.isActive ?? true,
            createdAt: typeof c.createdAt === 'string' ? c.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          }))
        );
      }
    } catch (syncErr: unknown) {
      console.warn('Backend data sync fallback to local cache:', syncErr);
    }
  }, [userRole, setAssignments, setTasks, setNotes, setNotifications, setCalendarEvents, setSemesters, setSubjects, setRegistrationCodes]);

  // ── Session Check on Initial Mount ─────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await authApi.restoreSession();
        if (session && session.user) {
          setUser(session.user);
          const profile = session.user.studentProfile || session.user;
          const firstName = profile.firstName || session.user.firstName || '';
          const lastName = profile.lastName || session.user.lastName || '';
          let fullName = `${firstName} ${lastName}`.trim();
          if (!fullName && session.user.email) {
            const clean = session.user.email.split('@')[0].replace(/[._]/g, ' ');
            fullName = clean.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }
          if (fullName) {
            const isInst = profile.isIndependent === false || Boolean(profile.departmentId);
            setStudentInfo((prev) => ({
              ...prev,
              name: fullName,
              email: session.user.email,
              avatar: fullName.slice(0, 2).toUpperCase(),
              roll: profile.rollNumber || (isInst ? '2625001' : 'INDEPENDENT'),
              branch: profile.department?.name || (isInst ? 'Computer Science & Engineering' : 'Self-Directed Learning'),
              institution: profile.department?.institution?.name || (isInst ? 'University Department of Computer Science' : undefined),
              isInstitutional: isInst,
            }));
          }
          const role: UserRole = (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN' || session.user.role === 'INSTITUTION_ADMIN' || session.user.role === 'FACULTY') ? 'admin' : 'student';
          setUserRole(role);
          setActiveView(role === 'admin' ? 'admin' : 'dashboard');
          setPhase('app');
          fetchBackendData(role);
        } else {
          setUser(null);
          setPhase('landing');
        }
      } catch (authErr: unknown) {
        console.warn('Silent session restore failed, presenting guest landing view:', authErr);
        setUser(null);
        setPhase('landing');
      }
    }
    checkAuth();
  }, [fetchBackendData, setActiveView, setPhase, setStudentInfo, setUser, setUserRole]);

  // ── Authentication Handlers ─────────────────────────────────────
  const handleStudentLogin = async (email: string, pass: string) => {
    const res = await authApi.login({ email, password: pass });
    setUser(res.user);
    const profile = res.user?.studentProfile || res.user || {};
    const firstName = profile.firstName || res.user?.firstName || '';
    const lastName = profile.lastName || res.user?.lastName || '';
    let fullName = `${firstName} ${lastName}`.trim();
    if (!fullName && email) {
      const clean = email.split('@')[0].replace(/[._]/g, ' ');
      fullName = clean.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    if (!fullName) fullName = 'Student';

    const isInst = profile.isIndependent === false || Boolean(profile.departmentId);
    setStudentInfo((prev) => ({
      ...prev,
      name: fullName,
      email: res.user?.email || email,
      avatar: fullName.slice(0, 2).toUpperCase(),
      roll: profile.rollNumber || (isInst ? '2625001' : 'INDEPENDENT'),
      branch: profile.department?.name || (isInst ? 'Computer Science & Engineering' : 'Self-Directed Learning'),
      institution: profile.department?.institution?.name || (isInst ? 'University Department of Computer Science' : undefined),
      isInstitutional: isInst,
    }));
    setUserRole('student');
    setPhase('app');
    setActiveView('dashboard');
    showToast(`Welcome back, ${fullName}! Signed in successfully.`, 'success');
    fetchBackendData('student');
  };

  const handleAdminLogin = async (email: string, pass: string) => {
    const res = await authApi.login({ email, password: pass });
    const staffRoles = ['ADMIN', 'SUPER_ADMIN', 'INSTITUTION_ADMIN', 'FACULTY'];
    if (!staffRoles.includes(res.user?.role)) {
      throw new Error('Access denied. This administrative portal requires staff or faculty credentials.');
    }
    setUser(res.user);
    setUserRole('admin');
    setPhase('app');
    setActiveView('admin');
    showToast('Signed in to University Administration Portal', 'success');
    fetchBackendData('admin');
  };

  const handleRegister = async (data: RegisterData) => {
    const { isInstitutional, firstName, lastName, email, pass, rollNo, institutionCode } = data;
    const fullName = `${firstName} ${lastName}`.trim() || 'Student';

    // Real backend registration
    await authApi.register({
      firstName,
      lastName,
      email,
      password: pass,
      isInstitutional,
      rollNumber: rollNo,
      institutionCode,
    });

    // Auto-login upon successful registration
    const loginRes = await authApi.login({ email, password: pass });
    setUser(loginRes.user);

    // Clear previous/stale data so the new profile starts completely clean:
    setTasks([]);
    setAssignments([]);
    setNotes([]);
    try {
      localStorage.removeItem('integrum_tasks');
      localStorage.removeItem('integrum_notes');
      localStorage.removeItem('integrum_assignments');
      localStorage.removeItem('integrum_subjects');
      localStorage.removeItem('integrum_calendar_events');
    } catch {
      // ignore
    }

    if (!isInstitutional) {
      // Independent Learner: Purge all mock institutional subjects, attendance, and calendar events
      setSubjects([]);
      setCalendarEvents({});
      setAttendance({});
      setStudentInfo({
        name: fullName,
        roll: 'INDEPENDENT',
        branch: 'Self-Directed Learning',
        year: 'Independent',
        sem: 'Personal Workspace',
        email,
        avatar: `${firstName[0] || 'I'}${lastName[0] || 'L'}`.toUpperCase(),
        institution: undefined,
        isInstitutional: false,
      });
    } else {
      // Institutional Student: Link official department code and assigned roll number (e.g. 2625001)
      setStudentInfo({
        name: fullName,
        roll: rollNo || '2625001',
        branch: institutionCode ? `Department [${institutionCode}]` : 'Computer Science & Engineering',
        year: 'Academic Year 2026',
        sem: 'Semester 5 (Active)',
        email,
        avatar: `${firstName[0] || 'A'}${lastName[0] || 'K'}`.toUpperCase(),
        institution: institutionCode ? `Institution [${institutionCode}]` : 'University Department of Computer Science',
        isInstitutional: true,
      });
    }

    setUserRole('student');
    setPhase('app');
    setActiveView('dashboard');
    showToast(
      isInstitutional
        ? `Registration complete! Enrolled as ${rollNo || 'student'} via code ${institutionCode || ''}.`
        : `Registration complete! Welcome to your independent workspace, ${firstName}.`,
      'success'
    );
    if (isInstitutional) {
      fetchBackendData();
    }
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
      setTasks([]);
      setAssignments([]);
      setNotes([]);
      setReminders([]);
      setAttendance({});
      setCalendarEvents({});
      setSubjects([]);
      setSkills([]);
      setJobs([]);
      setNotifications([]);
      setStudentInfo(initialPlatformState.studentInfo);
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

  // ── Multi-Tenant Hierarchy & Staff Profile Handlers ──────────────
  const handleSaveInstitutionAdmin = (info: Partial<InstitutionAdminInfo>) => {
    setInstitutionAdminInfo((prev) => ({ ...prev, ...info }));
    showToast('Institution Admin details saved successfully!', 'success');
  };

  const handleSaveDepartmentHead = (info: Partial<DepartmentHeadInfo>) => {
    setDepartmentHeadInfo((prev) => ({ ...prev, ...info }));
    showToast('Department Head details saved successfully!', 'success');
  };

  const handleSaveFaculty = (info: Partial<FacultyInfo>) => {
    setFacultyInfo((prev) => ({ ...prev, ...info }));
    showToast('Faculty details saved successfully!', 'success');
  };

  const handleAddRegistrationCode = async (newCode: RegistrationCodeItem) => {
    try {
      const created = await adminApi.createRegistrationCode({
        code: newCode.code,
        departmentName: newCode.departmentName,
        departmentCode: newCode.departmentCode,
        semesterNumber: newCode.semesterNumber,
        academicYear: newCode.academicYear,
        maxUses: newCode.maxUses,
        isActive: newCode.isActive,
      });
      const formatted: RegistrationCodeItem = {
        id: created?.id || newCode.id,
        code: created?.code || newCode.code,
        departmentName: created?.department?.name || newCode.departmentName,
        departmentCode: created?.department?.code || newCode.departmentCode,
        semesterNumber: created?.semesterNumber || newCode.semesterNumber,
        academicYear: created?.academicYear || newCode.academicYear,
        maxUses: created?.maxUses ?? newCode.maxUses,
        usedCount: created?.usedCount || 0,
        isActive: created?.isActive ?? newCode.isActive,
        createdAt: typeof created?.createdAt === 'string' ? created.createdAt.split('T')[0] : (newCode.createdAt || new Date().toISOString().split('T')[0]),
      };
      setRegistrationCodes((prev) => [formatted, ...prev]);
    } catch (err: any) {
      showToast(err.message || 'Failed to persist registration code', 'error');
      throw err;
    }
  };

  const handleToggleRegistrationCode = async (id: string) => {
    const existing = registrationCodes.find((c) => c.id === id);
    const targetState = existing ? !existing.isActive : true;
    try {
      await adminApi.toggleRegistrationCode(id, targetState);
      setRegistrationCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: targetState } : c))
      );
      showToast('Registration code status updated', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to update registration code', 'error');
    }
  };

  const handleAddStaffMember = (role: StaffRole, data: any) => {
    if (role === 'institution_admin') {
      setInstitutionAdminInfo((prev) => ({
        ...prev,
        name: data.name,
        email: data.email,
        title: data.title,
        institutionCode: data.specificField1 || prev.institutionCode,
        accreditation: data.specificField2 || prev.accreditation,
      }));
    } else if (role === 'department_head') {
      setDepartmentHeadInfo((prev) => ({
        ...prev,
        name: data.name,
        email: data.email,
        title: data.title,
        departmentCode: data.specificField1 || prev.departmentCode,
      }));
    } else if (role === 'faculty') {
      setFacultyInfo((prev) => ({
        ...prev,
        name: data.name,
        email: data.email,
        title: data.title,
        facultyId: data.specificField1 || prev.facultyId,
        specialization: data.specificField2 || prev.specialization,
      }));
    }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      {/* Toast Notification Container */}
      <div id="toastContainer" style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none', maxWidth: '420px', width: 'calc(100vw - 48px)' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast show toast-${t.type}`}
            style={{
              padding: '14px 20px',
              borderRadius: '8px',
              color: '#ffffff',
              background: t.type === 'error' ? '#991b1b' : t.type === 'success' ? '#15803d' : '#0f4c42',
              borderLeft: `5px solid ${t.type === 'error' ? '#fca5a5' : t.type === 'success' ? '#86efac' : '#5eead4'}`,
              fontWeight: 600,
              fontSize: '13.5px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              opacity: 1,
              transform: 'none',
              pointerEvents: 'auto',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <span style={{ fontSize: '15px' }}>
              {t.type === 'error' ? '❌' : t.type === 'success' ? '✅' : 'ℹ️'}
            </span>
            <span style={{ lineHeight: 1.4 }}>{t.message}</span>
          </div>
        ))}
      </div>

      {/* PHASE 1: LANDING */}
      {((phase === 'app' && !user) ? 'landing' : phase) === 'landing' && (
        <LandingPhase
          onGoLogin={(mode) => {
            setLoginMode(mode || 'student');
            setPhase('login');
          }}
          onGoApp={() => {
            if (user) {
              setPhase('app');
              setActiveView('dashboard');
            } else {
              setLoginMode('student');
              setPhase('login');
            }
          }}
        />
      )}

      {/* PHASE 2: LOGIN & DUAL PORTAL */}
      {((phase === 'app' && !user) ? 'landing' : phase) === 'login' && (
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
      {phase === 'app' && user && (
        (() => {
          const isInst = studentInfo.isInstitutional !== false;
          const visibleNotifications = (notifications || []).filter((n) => {
            if (!isInst) {
              const text = `${n.title || ''} ${n.msg || ''} ${n.description || ''}`.toLowerCase();
              if (
                text.includes('attendance') ||
                text.includes('stqa') ||
                text.includes('lecture') ||
                text.includes('exam calendar') ||
                text.includes('hall ticket') ||
                text.includes('circular')
              ) {
                return false;
              }
            }
            return true;
          });

          return (
            <div className="phase active" id="phase-app" style={{ display: 'flex', minHeight: '100vh' }}>
              {/* Sidebar */}
              <Sidebar
                isOpen={sidebarOpen}
                activeView={activeView}
                userRole={userRole}
                isInstitutional={isInst}
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
                  notifications={visibleNotifications}
                  onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                  onOpenCmdPalette={() => setCmdOpen(true)}
                  onToggleRole={() => {
                    const nextRole = userRole === 'admin' ? 'student' : 'admin';
                    setUserRole(nextRole);
                    if (nextRole === 'admin') setActiveView('admin');
                    else setActiveView('dashboard');
                    showToast(`Switched to ${nextRole === 'admin' ? 'Faculty Admin' : 'Student'} mode`, 'info');
                  }}
                  onToggleDarkMode={handleToggleDarkMode}
                  onToggleNotif={() => setNotifOpen(!notifOpen)}
                  onMarkNotifRead={handleMarkNotifRead}
                  onMarkAllNotifsRead={handleMarkAllNotifsRead}
                  onLogout={handleLogout}
                />

            {/* View Render Area */}
            <main className="main-content">
              <ErrorBoundary>
              {/* 1. Dashboard */}
              {activeView === 'dashboard' && (
                <DashboardView
                  studentInfo={studentInfo}
                  attendance={attendance}
                  assignments={assignments}
                  tasks={tasks}
                  reminders={reminders}
                  notes={notes}
                  calendarEvents={calendarEvents}
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
                  subjects={subjects}
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
                  onClearBlankWorkspace={handleClearToBlankWorkspace}
                />
              )}

              {/* 5. Attendance (Institution-Gated) */}
              {activeView === 'attend' && (
                isInst ? (
                  <AttendanceView
                    attendance={attendance}
                    onLogToday={handleLogAttendanceToday}
                    showToast={showToast}
                  />
                ) : (
                  <div className="view active" id="v-attend">
                    <div className="card" style={{ padding: '36px 24px', textAlign: 'center', maxWidth: '620px', margin: '40px auto' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏛️</div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 10px 0' }}>Institutional Feature Required</h2>
                      <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '22px' }}>
                        Attendance tracking is managed directly by authorized universities and colleges. Independent student accounts do not have institutional lecture rosters or required attendance reports.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={handleToggleInstitutional}
                        style={{ padding: '10px 24px', fontWeight: 700 }}
                      >
                        Connect Institutional Account
                      </button>
                    </div>
                  </div>
                )
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
                  onDownloadPdf={(f) => showToast(`Generating & downloading verified PDF: ${f}`, 'success')}
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
              {activeView === 'analytics' && (
                <AnalyticsView
                  tasks={tasks}
                  studyLogged={studyLogged}
                  assignments={assignments}
                  notes={notes}
                  attendance={attendance}
                />
              )}

              {/* 13. AI Assistant */}
              {activeView === 'ai' && <AIAssistantView studentInfo={studentInfo} subjects={subjects} attendance={attendance} tasks={tasks} />}

              {/* 14. Administration Portal */}
              {activeView === 'admin' && (
                <AdminView
                  students={students}
                  announcements={announcements}
                  registrationCodes={registrationCodes}
                  institutionAdminInfo={institutionAdminInfo}
                  departmentHeadInfo={departmentHeadInfo}
                  facultyInfo={facultyInfo}
                  onOpenAnnounceModal={() => setIsAnnounceModalOpen(true)}
                  onSwitchToStudentView={() => {
                    setUserRole('student');
                    setActiveView('dashboard');
                    showToast('Switched to Student View', 'info');
                  }}
                  onAddRegistrationCode={handleAddRegistrationCode}
                  onToggleRegistrationCode={handleToggleRegistrationCode}
                  onAddStaffMember={handleAddStaffMember}
                  showToast={showToast}
                />
              )}

              {/* 15. Profile & Settings */}
              {activeView === 'profile' && (
                <ProfileView
                  studentInfo={studentInfo}
                  userRole={userRole}
                  staffRole="faculty"
                  institutionAdminInfo={institutionAdminInfo}
                  departmentHeadInfo={departmentHeadInfo}
                  facultyInfo={facultyInfo}
                  darkMode={darkMode}
                  themeMode={themeMode}
                  onSetThemeMode={handleSetThemeMode}
                  onToggleDarkMode={handleToggleDarkMode}
                  onToggleInstitutional={handleToggleInstitutional}
                  onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
                  onSaveProfile={(name, email) => {
                    setStudentInfo((prev) => ({ ...prev, name, email }));
                  }}
                  onSaveInstitutionAdmin={handleSaveInstitutionAdmin}
                  onSaveDepartmentHead={handleSaveDepartmentHead}
                  onSaveFaculty={handleSaveFaculty}
                  showToast={showToast}
                  onExportBackup={handleExportWorkspace}
                  onImportBackup={handleImportWorkspace}
                />
              )}
              </ErrorBoundary>
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
          );
        })()
      )}
    </div>
  );
}

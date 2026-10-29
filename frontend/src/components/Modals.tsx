import { useState } from 'react';
import type { NoteItem, AssignmentItem, ResumeVersion, ActiveView } from '../types';

interface ModalsProps {
  // Task Modal
  isTaskModalOpen: boolean;
  onCloseTaskModal: () => void;
  onSaveTask: (title: string, priority: 'HIGH' | 'MEDIUM' | 'LOW', subject: string) => Promise<void>;

  // Note Modal
  isNoteModalOpen: boolean;
  onCloseNoteModal: () => void;
  onSaveNote: (title: string, tags: string, content: string, subject: string) => Promise<void>;

  // Note View Modal
  selectedNote: NoteItem | null;
  onCloseNoteView: () => void;

  // Subject Modal
  isSubjectModalOpen: boolean;
  onCloseSubjectModal: () => void;
  onSaveSubject: (name: string, code: string) => Promise<void>;

  // Assignment Modal
  isAsgnModalOpen: boolean;
  subjects: any[];
  onCloseAsgnModal: () => void;
  onSaveAsgn: (title: string, subjectId: string, dueDate: string, priority: 'HIGH' | 'MEDIUM' | 'LOW') => Promise<void>;

  // Assignment View Modal
  selectedAsgn: AssignmentItem | null;
  onCloseAsgnView: () => void;
  onUpdateAsgnStatus?: (id: string, newStatus: 'Pending' | 'Submitted' | 'Graded') => void;
  onDeleteAsgn?: (id: string) => void;

  // Reminder Modal
  isRemModalOpen: boolean;
  onCloseRemModal: () => void;
  onSaveRem: (title: string, time: string, desc: string) => void;

  // Event Modal
  isEventModalOpen: boolean;
  onCloseEventModal: () => void;
  onSaveEvent: (title: string, date: string, desc: string) => Promise<void>;

  // Resume Inspector Modal
  inspectingResumeKey: string | null;
  resumes: Record<string, ResumeVersion>;
  onCloseResumeInspector: () => void;
  onBoostKeyword: (key: string, keyword: string) => void;

  // Resume Create Modal
  isResumeCreateOpen: boolean;
  onCloseResumeCreate: () => void;
  onSaveResume: (title: string) => void;

  // Skill Modal
  isSkillModalOpen: boolean;
  onCloseSkillModal: () => void;
  onSaveSkill: (name: string, cat: any, level: number) => void;

  // Job Modal
  isJobModalOpen: boolean;
  onCloseJobModal: () => void;
  onSaveJob: (company: string, role: string, ctc: string, location: string) => void;

  // Announce Modal
  isAnnounceModalOpen: boolean;
  onCloseAnnounceModal: () => void;
  onSaveAnnounce: (title: string, cat: string, content: string) => void;

  // Password Modal
  isPasswordModalOpen: boolean;
  onClosePasswordModal: () => void;
  onSavePassword: (p1: string, p2: string) => void;

  // Command Palette
  isCmdOpen: boolean;
  onCloseCmd: () => void;
  onNavigate: (view: ActiveView) => void;
}


const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const viewIcons: Record<ActiveView, React.ReactNode> = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>,
  study: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  notes: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>,
  asgn: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  attend: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  cal: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  tasks: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>,
  rems: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  resumes: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>,
  skills: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  jobs: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
  analytics: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  ai: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M9 10h.01"></path><path d="M15 10h.01"></path><path d="M9.5 15a3.5 3.5 0 0 0 5 0"></path></svg>,
  admin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 2l10 5H2l10-5z"></path></svg>,
  profile: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
};

export default function Modals(props: ModalsProps) {
  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [taskSubject, setTaskSubject] = useState('Artificial Intelligence');

  // Note state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteTags, setNoteTags] = useState('exam, algorithms');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubject, setNoteSubject] = useState('1105111');

  // Subject state
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('CS502');

  // Asgn state
  const [asgnTitle, setAsgnTitle] = useState('');
  const [asgnSubjectId, setAsgnSubjectId] = useState(props.subjects[0]?.id || '');
  const [asgnDueDate, setAsgnDueDate] = useState('2026-10-31');
  const [asgnPriority, setAsgnPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  // Rem state
  const [remTitle, setRemTitle] = useState('');
  const [remTime, setRemTime] = useState('Tomorrow 10:00 AM');
  const [remDesc, setRemDesc] = useState('');

  // Event state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('2026-10-28T10:00');
  const [eventDesc, setEventDesc] = useState('');

  // Resume create state
  const [resumeTitle, setResumeTitle] = useState('');

  // Skill state
  const [skillName, setSkillName] = useState('');
  const [skillCat, setSkillCat] = useState<'Languages' | 'Frameworks' | 'Cloud & DevOps' | 'Core CS'>('Languages');
  const [skillLevel, setSkillLevel] = useState(85);

  // Job state
  const [jobCompany, setJobCompany] = useState('');
  const [jobRole, setJobRole] = useState('Software Development Engineer');
  const [jobCtc, setJobCtc] = useState('₹18-24 LPA');
  const [jobLocation, setJobLocation] = useState('Bengaluru / Hybrid');

  // Announce state
  const [annTitle, setAnnTitle] = useState('');
  const [annCat, setAnnCat] = useState('Academic Circular');
  const [annContent, setAnnContent] = useState('');

  // Password state
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');

  // Command palette state
  const [cmdQuery, setCmdQuery] = useState('');

  const cmdList: Array<{ label: string; view: ActiveView; keywords?: string[] }> = [
    { label: 'Dashboard Overview', view: 'dashboard', keywords: ['home', 'overview', 'stats', 'kpi', 'summary'] },
    { label: 'Study Planner & Pomodoro', view: 'study', keywords: ['timer', 'pomodoro', 'focus', 'hours', 'timetable', 'schedule'] },
    { label: 'Academic Notes Manager', view: 'notes', keywords: ['notes', 'study notes', 'cheatsheet', 'lecture', 'revision'] },
    { label: 'Courses & Assignments', view: 'asgn', keywords: ['courses', 'assignments', 'homework', 'curriculum', 'subjects', 'syllabus'] },
    { label: 'Attendance Health & Course Standing', view: 'attend', keywords: ['attendance', 'eligibility', 'standing', 'calculator', '75%', 'present', 'absent'] },
    { label: 'October 2026 Examination Calendar', view: 'cal', keywords: ['calendar', 'exam', 'dates', 'deadlines', 'agenda', 'october'] },
    { label: 'Productivity Tasks', view: 'tasks', keywords: ['tasks', 'todo', 'checklist', 'atomic', 'w07'] },
    { label: 'Reminders & Examination Alerts', view: 'rems', keywords: ['reminders', 'alerts', 'notifications', 'alarm'] },
    { label: 'Resume Versions & ATS Audit', view: 'resumes', keywords: ['resumes', 'ats', 'cv', 'audit', 'score', 'keywords'] },
    { label: 'Technical Skills Matrix', view: 'skills', keywords: ['skills', 'matrix', 'competencies', 'gap analysis', 'ratings'] },
    { label: 'Placement & Job Tracking', view: 'jobs', keywords: ['jobs', 'placement', 'internship', 'kanban', 'applications', 'interview'] },
    { label: 'Analytics & Success Index', view: 'analytics', keywords: ['analytics', 'success index', 'gpa', 'sgpa', 'simulator', 'metrics'] },
    { label: 'Integrum AI Assistant', view: 'ai', keywords: ['ai', 'assistant', 'advisor', 'bot', 'chat', 'help'] },
    { label: 'University Administration Portal', view: 'admin', keywords: ['admin', 'faculty', 'portal', 'circulars', 'directory', 'students'] },
    { label: 'Student Profile & Settings', view: 'profile', keywords: ['profile', 'settings', 'hall ticket', 'backup', 'export', 'import', 'json'] },
  ];
const filteredCmds = cmdList.filter((c) => {
    const q = cmdQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.label.toLowerCase().includes(q) ||
      (c.keywords && c.keywords.some((kw) => kw.toLowerCase().includes(q)))
    );
  });

  return (
    <div id="modalsContainer">
      {/* 1. Task Modal */}
      {props.isTaskModalOpen && (
        <div className="modal-overlay open" id="modalTask">
          <div className="modal-box">
            <div className="modal-header">
              <h3 id="modalTaskTitle">Create New Task</h3>
              <button className="modal-close" onClick={props.onCloseTaskModal} aria-label="Close dialog"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Task Title</label>
                <input
                  className="form-input"
                  id="taskInputTitle"
                  placeholder="e.g. Implement B-Tree Indexing in PostgreSQL"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Associated Subject</label>
                <input
                  className="form-input"
                  value={taskSubject}
                  onChange={(e) => setTaskSubject(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={props.onCloseTaskModal}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await props.onSaveTask(taskTitle, taskPriority, taskSubject);
                  setTaskTitle('');
                }}
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Note Modal */}
      {props.isNoteModalOpen && (
        <div className="modal-overlay open" id="modalNote">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Create Study Note</h3>
              <button className="modal-close" onClick={props.onCloseNoteModal} aria-label="Close dialog"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Note Title</label>
                <input
                  className="form-input"
                  placeholder="e.g. Binary Search Trees & Balanced Rotations"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Subject Code</label>
                <input
                  className="form-input"
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Tags (comma separated)</label>
                <input
                  className="form-input"
                  placeholder="exam, algorithms, os"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Markdown Content</label>
                <textarea
                  className="form-input form-textarea"
                  rows={6}
                  placeholder="Comprehensive notes, formulas, theorems..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={props.onCloseNoteModal}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await props.onSaveNote(noteTitle, noteTags, noteContent, noteSubject);
                  setNoteTitle('');
                  setNoteContent('');
                }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Note View Modal */}
      {props.selectedNote && (
        <div className="modal-overlay open" id="modalNoteView">
          <div className="modal-box" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{props.selectedNote.title}</h3>
              <button className="modal-close" onClick={props.onCloseNoteView} aria-label="Close dialog"><CloseIcon /></button>
            </div>
            <div className="modal-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '13px' }}>
              <div style={{ marginBottom: '12px', display: 'flex', gap: '6px' }}>
                <span className="badge badge-primary">{props.selectedNote.code || 'CS502'}</span>
                <span className="badge badge-secondary">{props.selectedNote.date || 'Oct 2026'}</span>
              </div>
              {props.selectedNote.content.replace(/\\n/g, '\n')}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={props.onCloseNoteView}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Subject Modal */}
      {props.isSubjectModalOpen && (
        <div className="modal-overlay open" id="modalSubject">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add Enrolled Subject</h3>
              <button className="modal-close" onClick={props.onCloseSubjectModal} aria-label="Close dialog"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Subject Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Software Engineering & Architecture"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Course Code</label>
                <input
                  className="form-input"
                  placeholder="CS305"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={props.onCloseSubjectModal}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await props.onSaveSubject(subjectName, subjectCode);
                  setSubjectName('');
                }}
              >
                Save Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Assignment Modal */}
      {props.isAsgnModalOpen && (
        <div className="modal-overlay open" id="modalAsgn">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add Course Assignment</h3>
              <button className="modal-close" onClick={props.onCloseAsgnModal} aria-label="Close dialog"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Assignment Title</label>
                <input
                  className="form-input"
                  placeholder="e.g. Socket Programming & IPC Benchmark"
                  value={asgnTitle}
                  onChange={(e) => setAsgnTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Subject</label>
                <select
                  className="form-select"
                  value={asgnSubjectId}
                  onChange={(e) => setAsgnSubjectId(e.target.value)}
                >
                  {props.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code ? `${s.code} · ${s.name}` : s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Due Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={asgnDueDate}
                  onChange={(e) => setAsgnDueDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={asgnPriority}
                  onChange={(e) => setAsgnPriority(e.target.value as any)}
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={props.onCloseAsgnModal}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await props.onSaveAsgn(asgnTitle, asgnSubjectId, asgnDueDate, asgnPriority);
                  setAsgnTitle('');
                }}
              >
                Add Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Assignment View Modal */}
      {props.selectedAsgn && (
        <div className="modal-overlay open" id="modalAsgnView">
          <div className="modal-box">
            <div className="modal-header">
              <h3>{props.selectedAsgn.title}</h3>
              <button className="modal-close" onClick={props.onCloseAsgnView} aria-label="Close dialog"><CloseIcon /></button>
            </div>
            <div className="modal-body" style={{ fontSize: '13px', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">{props.selectedAsgn.code} · {props.selectedAsgn.subject}</span>
                <span className="badge badge-warning">{props.selectedAsgn.priority} Priority</span>
                <span className="badge badge-info">{props.selectedAsgn.status}</span>
              </div>
              <p><b>Due Date:</b> {props.selectedAsgn.dueDate || 'October 28, 2026'}</p>
              <p>{props.selectedAsgn.desc || 'Comprehensive coursework assignment for Semester 5 academic evaluation.'}</p>

              {props.onUpdateAsgnStatus && (
                <div style={{ margin: '16px 0 8px 0', padding: '12px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    Submission Status:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['Pending', 'Submitted', 'Graded'] as const).map((st) => (
                      <button
                        key={st}
                        className={`btn btn-xs ${props.selectedAsgn!.status === st ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => {
                          props.onUpdateAsgnStatus!(props.selectedAsgn!.id, st);
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {props.onDeleteAsgn ? (
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    props.onDeleteAsgn!(props.selectedAsgn!.id);
                    props.onCloseAsgnView();
                  }}
                  style={{ color: 'var(--error)' }}
                >
                  Delete assignment
                </button>
              ) : <div />}
              <button className="btn btn-primary" onClick={props.onCloseAsgnView}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Reminder Modal */}
      {props.isRemModalOpen && (
        <div className="modal-overlay open" id="modalRem">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Schedule Examination Alert</h3>
              <button className="modal-close" onClick={props.onCloseRemModal} aria-label="Close dialog"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Alert Title</label>
                <input
                  className="form-input"
                  placeholder="e.g. Pack scientific calculator & Hall Ticket"
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Alert Time / Trigger</label>
                <input
                  className="form-input"
                  value={remTime}
                  onChange={(e) => setRemTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Details / Instructions</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={remDesc}
                  onChange={(e) => setRemDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={props.onCloseRemModal}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  props.onSaveRem(remTitle, remTime, remDesc);
                  setRemTitle('');
                  setRemDesc('');
                }}
              >
                Save Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Event Modal */}
      {props.isEventModalOpen && (
        <div className="modal-overlay open" id="modalEvent">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add Calendar Event</h3>
              <button className="modal-close" onClick={props.onCloseEventModal} aria-label="Close dialog"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Event Title</label>
                <input
                  className="form-input"
                  placeholder="e.g. Midterm Theory Examination"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Date & Time</label>
                <input
                  className="form-input"
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Venue & Requirements</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Hall ticket requirements, venue details, syllabus covered..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={props.onCloseEventModal}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await props.onSaveEvent(eventTitle, eventDate, eventDesc);
                  setEventTitle('');
                }}
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Resume Inspector Modal — Deep Audit & Full Inspector */}
      {props.inspectingResumeKey && props.resumes[props.inspectingResumeKey] && (() => {
        const r = props.resumes[props.inspectingResumeKey];
        const score = Number(r.score || (r as any).ats || 85);
        const formatScore = Number(r.format || 94);
        const kwScore = Number(r.keywords || (r as any).key || 90);
        const impactScore = Number(r.impact || 92);
        const brevityScore = Number(r.brevity || 92);
        const isTopTier = score >= 90;

        return (
          <div className="modal-overlay open" id="modalResumeInspector">
            <div className="modal-box" style={{ maxWidth: '680px', maxHeight: '90vh' }}>
              <div className="modal-header">
                <div>
                  <h3 id="inspResumeTitle" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    {r.title}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-3)' }}>
                    Deep ATS Parsing Audit · Candidate Screening Profile
                  </p>
                </div>
                <button className="modal-close" onClick={props.onCloseResumeInspector} aria-label="Close dialog"><CloseIcon /></button>
              </div>

              <div className="modal-body" style={{ gap: '18px' }}>
                {/* Score Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '16px 20px',
                    background: 'var(--bg-2)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      background: isTopTier ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary-light)',
                      border: `3px solid ${isTopTier ? 'var(--success)' : 'var(--primary)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <strong style={{ fontSize: '24px', color: isTopTier ? 'var(--success)' : 'var(--primary)', lineHeight: 1 }}>
                      {score}
                    </strong>
                    <small style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.5px' }}>
                      ATS SCORE
                    </small>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '15px' }}>
                        {isTopTier ? 'Tier-1 Candidate Standing' : 'Competitive Candidate Standing'}
                      </strong>
                      <span className={`badge ${isTopTier ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '10px' }}>
                        {isTopTier ? 'Top 5% Cohort' : 'Passed Cutoff'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                      Machine-scanned for single-column layout, standard section keywords, action verbs, and quantifiable impact metrics.
                    </p>
                  </div>
                </div>

                {/* Sub-Metric Dials */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-3)', display: 'block', marginBottom: '8px' }}>
                    Parser Metric Analysis
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
                    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '12px 8px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--success)' }}>{formatScore}%</div>
                      <small style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)' }}>Format & Structure</small>
                    </div>
                    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '12px 8px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--info)' }}>{kwScore}%</div>
                      <small style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)' }}>Keyword Coverage</small>
                    </div>
                    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '12px 8px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--primary)' }}>{impactScore}%</div>
                      <small style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)' }}>Metric Impact</small>
                    </div>
                    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '12px 8px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--primary)' }}>{brevityScore}%</div>
                      <small style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-2)' }}>Brevity & Conciseness</small>
                    </div>
                  </div>
                </div>

                {/* Keyword Scanner Section */}
                <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-1)' }}>
                        Matched high-impact keywords ({r.matched.length})
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 700 }}>Scored</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {r.matched.map((kw, i) => (
                        <span
                          key={i}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#065F46',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-1)' }}>
                        Target Role Keywords ({r.missing.length})
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Click any keyword to integrate & boost score</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {r.missing.length === 0 ? (
                        <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 700, padding: '4px 0' }}>
                          100% Keyword Alignment! No missing core competencies detected.
                        </div>
                      ) : (
                        r.missing.map((kw, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => props.onBoostKeyword(props.inspectingResumeKey!, kw)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: '#FEF3C7',
                              color: '#92400E',
                              border: '1.5px solid #FCD34D',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease',
                            }}
                            title="Click to integrate keyword into resume"
                          >
                            + Add {kw}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* ATS Diagnostic Checklist */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-3)', display: 'block', marginBottom: '8px' }}>
                    Automated Formatting Diagnostics
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--success)" }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Single-column linear structure</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--success)" }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Standard typography & hierarchy</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--success)" }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Quantified performance metrics</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--success)" }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>No tables, headers or footer traps</span>
                    </div>
                  </div>
                </div>

                {/* Candidate Recommendation Box */}
                <div style={{ padding: '12px 16px', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-1)' }}>
                  <strong>Tailoring strategy:</strong> Your technical experience shows high correlation with modern engineering roles. Integrating the suggested missing keywords will maximize ATS pipeline advancement.
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary" onClick={props.onCloseResumeInspector}>
                  Done & Close Inspector
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 10. Resume Create Modal */}
      {props.isResumeCreateOpen && (
        <div className="modal-overlay open" id="modalResumeCreate">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Create Tailored Resume</h3>
              <button className="modal-close" onClick={props.onCloseResumeCreate} aria-label="Close dialog"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Resume Title</label>
                <input
                  className="form-input"
                  id="newResumeTitle"
                  placeholder="e.g. Distributed Systems & Cloud Engineer"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={props.onCloseResumeCreate}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  props.onSaveResume(resumeTitle);
                  setResumeTitle('');
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Skill Modal */}
      {props.isSkillModalOpen && (
        <div className="modal-overlay open" id="modalSkill">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add Technical Skill</h3>
              <button className="modal-close" onClick={props.onCloseSkillModal} aria-label="Close dialog"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Skill Name</label>
                <input
                  className="form-input"
                  id="skillInputName"
                  placeholder="e.g. Redis, Kubernetes, PostgreSQL"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  id="skillInputCat"
                  value={skillCat}
                  onChange={(e) => setSkillCat(e.target.value as any)}
                >
                  <option value="Languages">Languages</option>
                  <option value="Frameworks">Frameworks</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="Core CS">Core CS</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Proficiency ({skillLevel}%)</label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={props.onCloseSkillModal}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  props.onSaveSkill(skillName, skillCat, skillLevel);
                  setSkillName('');
                }}
              >
                Save Skill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. Job Modal */}
      {props.isJobModalOpen && (
        <div className="modal-overlay open" id="modalJob">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add Job Application</h3>
              <button className="modal-close" onClick={props.onCloseJobModal} aria-label="Close dialog"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Company Name</label>
                <input
                  className="form-input"
                  id="jobInputCompany"
                  placeholder="e.g. Google, Microsoft, Razorpay"
                  value={jobCompany}
                  onChange={(e) => setJobCompany(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Role Title</label>
                <input
                  className="form-input"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Compensation / CTC</label>
                <input
                  className="form-input"
                  value={jobCtc}
                  onChange={(e) => setJobCtc(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  className="form-input"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={props.onCloseJobModal}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  props.onSaveJob(jobCompany, jobRole, jobCtc, jobLocation);
                  setJobCompany('');
                }}
              >
                Save Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. Announcement Modal */}
      {props.isAnnounceModalOpen && (
        <div className="modal-overlay open" id="modalAnnounce">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Post Campus Circular</h3>
              <button className="modal-close" onClick={props.onCloseAnnounceModal} aria-label="Close dialog"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Circular Title</label>
                <input
                  className="form-input"
                  placeholder="e.g. Midterm Theory Seating Plan Released"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={annCat}
                  onChange={(e) => setAnnCat(e.target.value)}
                >
                  <option value="Academic Circular">Academic Circular</option>
                  <option value="Examination Notification">Examination Notification</option>
                  <option value="Placement Drive">Placement Drive</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Circular Content</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={props.onCloseAnnounceModal}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  props.onSaveAnnounce(annTitle, annCat, annContent);
                  setAnnTitle('');
                  setAnnContent('');
                }}
              >
                Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14. Password Modal */}
      {props.isPasswordModalOpen && (
        <div className="modal-overlay open" id="modalPassword">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Change University Password</h3>
              <button className="modal-close" onClick={props.onClosePasswordModal} aria-label="Close dialog"><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">New Password</label>
                <input
                  className="form-input"
                  type="password"
                  id="newPass"
                  value={pass1}
                  onChange={(e) => setPass1(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  className="form-input"
                  type="password"
                  id="confirmPass"
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={props.onClosePasswordModal}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  props.onSavePassword(pass1, pass2);
                  setPass1('');
                  setPass2('');
                }}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15. Command Palette Modal (Ctrl+K) */}
      {props.isCmdOpen && (
        <div
          className="modal-overlay open"
          id="cmdOverlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) props.onCloseCmd();
          }}
        >
          <div className="modal-box" style={{ maxWidth: '540px', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-3)", flexShrink: 0 }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                className="form-input"
                id="cmdSearchInput"
                placeholder="Jump to any view or type a command... (Esc to close)"
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                autoFocus
                style={{ border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none', fontSize: '14px', width: '100%' }}
              />
              <button className="modal-close" onClick={props.onCloseCmd} aria-label="Close dialog"><CloseIcon /></button>
            </div>

            <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px' }}>
              {filteredCmds.map((item) => (
                <div
                  key={item.view}
                  onClick={() => {
                    props.onNavigate(item.view);
                    props.onCloseCmd();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--primary)' }}>{viewIcons[item.view]}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Jump ↵</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

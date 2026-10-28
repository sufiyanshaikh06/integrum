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

  const cmdList: Array<{ label: string; view: ActiveView; icon: string }> = [
    { label: 'Dashboard Overview', view: 'dashboard', icon: '📊' },
    { label: 'Study Planner & Pomodoro', view: 'study', icon: '⏱️' },
    { label: 'Academic Notes Manager', view: 'notes', icon: '📝' },
    { label: 'Courses & Assignments', view: 'asgn', icon: '📚' },
    { label: 'Attendance Tracker & Safe-Bunk Calculator', view: 'attend', icon: '🛡️' },
    { label: 'October 2026 Examination Calendar', view: 'cal', icon: '📅' },
    { label: 'Productivity Tasks', view: 'tasks', icon: '✓' },
    { label: 'Reminders & Examination Alerts', view: 'rems', icon: '🔔' },
    { label: 'Resume Versions & ATS Audit', view: 'resumes', icon: '📄' },
    { label: 'Technical Skills Matrix', view: 'skills', icon: '⚡' },
    { label: 'Placement & Job Tracking', view: 'jobs', icon: '💼' },
    { label: 'Analytics & Success Index', view: 'analytics', icon: '📈' },
    { label: 'Integrum AI Assistant', view: 'ai', icon: '🤖' },
    { label: 'University Administration Portal', view: 'admin', icon: '🏛️' },
    { label: 'Student Profile & Settings', view: 'profile', icon: '👤' },
  ];

  const filteredCmds = cmdList.filter((c) =>
    c.label.toLowerCase().includes(cmdQuery.toLowerCase())
  );

  return (
    <div id="modalsContainer">
      {/* 1. Task Modal */}
      {props.isTaskModalOpen && (
        <div className="modal-overlay open" id="modalTask">
          <div className="modal-box">
            <div className="modal-header">
              <h3 id="modalTaskTitle">Create New Task</h3>
              <button className="modal-close" onClick={props.onCloseTaskModal}>✕</button>
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
              <button className="modal-close" onClick={props.onCloseNoteModal}>✕</button>
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
              <button className="modal-close" onClick={props.onCloseNoteView}>✕</button>
            </div>
            <div className="modal-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '13px' }}>
              <div style={{ marginBottom: '12px', display: 'flex', gap: '6px' }}>
                <span className="badge badge-primary">{props.selectedNote.code || 'CS502'}</span>
                <span className="badge badge-secondary">{props.selectedNote.date || 'Oct 2026'}</span>
              </div>
              {props.selectedNote.content}
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
              <button className="modal-close" onClick={props.onCloseSubjectModal}>✕</button>
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
              <button className="modal-close" onClick={props.onCloseAsgnModal}>✕</button>
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
              <button className="modal-close" onClick={props.onCloseAsgnView}>✕</button>
            </div>
            <div className="modal-body" style={{ fontSize: '13px', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span className="badge badge-primary">{props.selectedAsgn.code} · {props.selectedAsgn.subject}</span>
                <span className="badge badge-warning">{props.selectedAsgn.priority} Priority</span>
                <span className="badge badge-info">{props.selectedAsgn.status}</span>
              </div>
              <p><b>Due Date:</b> {props.selectedAsgn.dueDate || 'October 28, 2026'}</p>
              <p>{props.selectedAsgn.desc || 'Comprehensive coursework assignment for Semester 5 academic evaluation.'}</p>
            </div>
            <div className="modal-footer">
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
              <button className="modal-close" onClick={props.onCloseRemModal}>✕</button>
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
              <button className="modal-close" onClick={props.onCloseEventModal}>✕</button>
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

      {/* 9. Resume Inspector Modal */}
      {props.inspectingResumeKey && props.resumes[props.inspectingResumeKey] && (
        <div className="modal-overlay open" id="modalResumeInspector">
          <div className="modal-box" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 id="inspResumeTitle">{props.resumes[props.inspectingResumeKey].title} · ATS Inspector</h3>
              <button className="modal-close" onClick={props.onCloseResumeInspector}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    border: '3px solid var(--primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <strong style={{ fontSize: '22px', color: 'var(--primary)', lineHeight: 1 }}>
                    {props.resumes[props.inspectingResumeKey].score}
                  </strong>
                  <small style={{ fontSize: '10px', color: 'var(--text-3)' }}>ATS SCORE</small>
                </div>
                <div>
                  <strong style={{ fontSize: '14px', display: 'block' }}>Verified Keyword Scanner</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-2)' }}>
                    Click missing keywords below to automatically integrate and recalculate ATS score.
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
                  Matched High-Impact Keywords:
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {props.resumes[props.inspectingResumeKey].matched.map((kw, i) => (
                    <span key={i} className="badge badge-success" style={{ fontSize: '11px' }}>
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
                  Missing Target Role Keywords (Click to boost):
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {props.resumes[props.inspectingResumeKey].missing.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--success)' }}>
                      🎉 Excellent! All high-impact keywords matched!
                    </span>
                  ) : (
                    props.resumes[props.inspectingResumeKey].missing.map((kw, i) => (
                      <span
                        key={i}
                        className="badge badge-warning"
                        onClick={() => props.onBoostKeyword(props.inspectingResumeKey!, kw)}
                        style={{ cursor: 'pointer', fontSize: '11px' }}
                        title="Click to boost"
                      >
                        + Add {kw}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={props.onCloseResumeInspector}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Resume Create Modal */}
      {props.isResumeCreateOpen && (
        <div className="modal-overlay open" id="modalResumeCreate">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Create Tailored Resume</h3>
              <button className="modal-close" onClick={props.onCloseResumeCreate}>✕</button>
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
              <button className="modal-close" onClick={props.onCloseSkillModal}>✕</button>
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
              <button className="modal-close" onClick={props.onCloseJobModal}>✕</button>
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
              <button className="modal-close" onClick={props.onCloseAnnounceModal}>✕</button>
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
              <button className="modal-close" onClick={props.onClosePasswordModal}>✕</button>
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
              <span style={{ fontSize: '18px' }}>🔍</span>
              <input
                className="form-input"
                id="cmdSearchInput"
                placeholder="Jump to any view or type a command... (Esc to close)"
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                autoFocus
                style={{ border: 'none', background: 'transparent', outline: 'none', boxShadow: 'none', fontSize: '14px', width: '100%' }}
              />
              <button className="modal-close" onClick={props.onCloseCmd}>✕</button>
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
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
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

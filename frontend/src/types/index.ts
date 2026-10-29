export type Phase = 'landing' | 'login' | 'app';

export type UserRole = 'student' | 'admin';

export type ThemeMode = 'system' | 'light' | 'dark';

export type ActiveView =
  | 'dashboard'
  | 'study'
  | 'notes'
  | 'asgn'
  | 'attend'
  | 'cal'
  | 'tasks'
  | 'rems'
  | 'resumes'
  | 'skills'
  | 'jobs'
  | 'analytics'
  | 'ai'
  | 'admin'
  | 'profile';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface StudentInfo {
  name: string;
  roll: string;
  branch: string;
  year: string;
  sem: string;
  email: string;
  avatar: string;
  institution?: string;
  isInstitutional?: boolean;
}

export interface AdminInfo {
  name: string;
  title: string;
  email: string;
  avatar: string;
}

export type StaffRole = 'super_admin' | 'institution_admin' | 'department_head' | 'faculty';

export interface InstitutionAdminInfo {
  name: string;
  email: string;
  title: string;
  institutionName: string;
  institutionCode: string;
  website?: string;
  accreditation?: string;
  contactPhone?: string;
  avatar: string;
  managedDepartmentsCount: number;
}

export interface DepartmentHeadInfo {
  name: string;
  email: string;
  title: string;
  departmentName: string;
  departmentCode: string;
  institutionName: string;
  facultyCount: number;
  studentCount: number;
  avatar: string;
}

export interface FacultyInfo {
  name: string;
  email: string;
  title: string;
  facultyId: string;
  departmentName: string;
  specialization: string;
  officeHours: string;
  assignedSubjects: string[];
  avatar: string;
}

export interface RegistrationCodeItem {
  id: string;
  code: string;
  departmentName: string;
  departmentCode: string;
  semesterNumber: number;
  academicYear: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  name: string;
  code: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

export interface AssignmentItem {
  id: string;
  code: string;
  subject: string;
  title: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'Pending' | 'Submitted' | 'Graded';
  marks?: string;
  desc?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  subject: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  completedAt?: string | null;
}

export interface ReminderItem {
  id: string;
  title: string;
  type: string;
  time: string;
  desc: string;
  status: 'active' | 'snoozed' | 'dismissed';
}

export interface NoteItem {
  id: string;
  code: string;
  subject: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  content: string;
}

export interface ResumeVersion {
  title: string;
  updated: string;
  score: number;
  format: number;
  keywords: number;
  impact: number;
  brevity: number;
  matched: string[];
  missing: string[];
}

export interface SkillItem {
  name: string;
  category: 'Languages' | 'Frameworks' | 'Cloud & DevOps' | 'Core CS';
  level: number;
}

export interface JobItem {
  id: string;
  company: string;
  role: string;
  type: string;
  ctc: string;
  location: string;
  stage: 'Applied' | 'Interviewing' | 'Offered' | 'Rejected';
  deadline: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  content: string;
}

export interface StudentDirectoryItem {
  roll: string;
  name: string;
  branch: string;
  sem: string;
  cgpa: number;
  attendance: number;
  status: 'Regular' | 'Academic Caution' | 'Dean List';
}

export interface CalendarEventItem {
  time: string;
  title: string;
  venue: string;
  type: 'EXAM' | 'DEADLINE' | 'HOLIDAY' | 'CLASS';
}

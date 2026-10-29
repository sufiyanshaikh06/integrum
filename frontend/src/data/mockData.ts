// Initial Clean State for Integrum Platform
// All mock student and course data purged - populated exclusively via database or active user inputs

export const initialPlatformState = {
  activeView: 'dashboard',
  userRole: 'student', // 'student' or 'admin'
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selectedCalDay: new Date().getDate(),
  
  studentInfo: {
    name: 'Student User',
    roll: '',
    branch: 'Not Assigned',
    year: '1st Year',
    sem: 'Semester 1',
    email: '',
    avatar: 'SU',
    institution: '',
    isInstitutional: false,
  },

  adminInfo: {
    name: 'Administrator',
    title: 'University Administrator · Engineering Portal',
    email: 'admin@integrum.ac.in',
    avatar: 'AD'
  },

  institutionAdminInfo: {
    name: 'Dr. Aris Thorne',
    email: 'dean.technology@mu.ac.in',
    title: 'Dean of Technology & Master Institution Administrator',
    institutionName: 'Mumbai University - Faculty of Technology',
    institutionCode: 'MU-ENG',
    website: 'https://mu.ac.in/technology',
    accreditation: 'NAAC A++ Accredited',
    contactPhone: '+91 (022) 2654-3000',
    avatar: 'AT',
    managedDepartmentsCount: 6,
  },

  departmentHeadInfo: {
    name: 'Prof. Rajesh K. Varma',
    email: 'hod.cse@mu.ac.in',
    title: 'Head of Department (HOD)',
    departmentName: 'Computer Science & Engineering',
    departmentCode: 'CSE',
    institutionName: 'Mumbai University - Faculty of Technology',
    facultyCount: 0,
    studentCount: 0,
    avatar: 'RV',
  },

  facultyInfo: {
    name: 'Faculty Member',
    email: 'faculty@mu.ac.in',
    title: 'Assistant Professor',
    facultyId: 'FAC-2026-01',
    departmentName: 'Computer Science & Engineering',
    specialization: 'Computer Science',
    officeHours: 'By Appointment',
    assignedSubjects: [],
    avatar: 'FM',
  },

  registrationCodes: [],

  // Focus & Study Timer Clean Baseline
  study: {
    target: 25.0,
    logged: 0.0,
    pomoSeconds: 1500,
    pomoMode: 25,
    pomoRunning: false,
    pomoTimerId: null
  },
  
  // Real database-backed collections start completely empty
  attendance: {},
  assignments: [],
  tasks: [],
  reminders: [],
  notes: [],
  resumes: {},
  skills: [],
  jobs: [],
  notifications: [],
  announcements: [],
  students: [],
  calendarEvents: {},

  currentViewingNoteId: null,
  currentViewingAsgnId: null
};

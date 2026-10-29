import type { FormEvent } from 'react';
import { useState } from 'react';
import type {
  StudentInfo,
  ThemeMode,
  UserRole,
  StaffRole,
  InstitutionAdminInfo,
  DepartmentHeadInfo,
  FacultyInfo,
} from '../../types';

interface ProfileProps {
  studentInfo: StudentInfo;
  userRole?: UserRole;
  staffRole?: StaffRole;
  institutionAdminInfo?: InstitutionAdminInfo;
  departmentHeadInfo?: DepartmentHeadInfo;
  facultyInfo?: FacultyInfo;
  darkMode: boolean;
  themeMode?: ThemeMode;
  onSetThemeMode?: (mode: ThemeMode) => void;
  onToggleDarkMode: () => void;
  onToggleInstitutional?: () => void;
  onOpenPasswordModal: () => void;
  onSaveProfile: (name: string, email: string) => void;
  onSaveInstitutionAdmin?: (info: Partial<InstitutionAdminInfo>) => void;
  onSaveDepartmentHead?: (info: Partial<DepartmentHeadInfo>) => void;
  onSaveFaculty?: (info: Partial<FacultyInfo>) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onExportBackup?: () => void;
  onImportBackup?: (data: any) => void;
}

export default function ProfileView({
  studentInfo,
  userRole = 'student',
  staffRole = 'faculty',
  institutionAdminInfo,
  departmentHeadInfo,
  facultyInfo,
  darkMode,
  themeMode = 'system',
  onSetThemeMode,
  onToggleDarkMode,
  onToggleInstitutional,
  onOpenPasswordModal,
  onSaveProfile,
  onSaveInstitutionAdmin,
  onSaveDepartmentHead,
  onSaveFaculty,
  showToast,
  onExportBackup,
  onImportBackup,
}: ProfileProps) {
  // Determine initial active profile tab based on userRole / staffRole
  const initialTab: 'student' | 'institution_admin' | 'department_head' | 'faculty' =
    userRole === 'admin'
      ? staffRole === 'institution_admin' || staffRole === 'super_admin'
        ? 'institution_admin'
        : staffRole === 'department_head'
        ? 'department_head'
        : 'faculty'
      : 'student';

  const [activeProfileTab, setActiveProfileTab] = useState<'student' | 'institution_admin' | 'department_head' | 'faculty'>(initialTab);

  // Student Profile State
  const [studentName, setStudentName] = useState(studentInfo.name);
  const [studentEmail, setStudentEmail] = useState(studentInfo.email);

  // Institution Admin State
  const [instName, setInstName] = useState(institutionAdminInfo?.name || 'Dr. Aris Thorne');
  const [instEmail, setInstEmail] = useState(institutionAdminInfo?.email || 'dean.technology@mu.ac.in');
  const [instTitle, setInstTitle] = useState(institutionAdminInfo?.title || 'Dean of Technology & Master Institution Administrator');
  const [instOrgName, setInstOrgName] = useState(institutionAdminInfo?.institutionName || 'University / Institution');
  const [instCode, setInstCode] = useState(institutionAdminInfo?.institutionCode || 'INST');
  const [instWebsite, setInstWebsite] = useState(institutionAdminInfo?.website || '');
  const [instAccreditation, setInstAccreditation] = useState(institutionAdminInfo?.accreditation || '');
  const [instPhone, setInstPhone] = useState(institutionAdminInfo?.contactPhone || '');

  // Department Head State
  const [deptHeadName, setDeptHeadName] = useState(departmentHeadInfo?.name || 'Department Head');
  const [deptHeadEmail, setDeptHeadEmail] = useState(departmentHeadInfo?.email || 'hod@institution.ac.in');
  const [deptHeadTitle, setDeptHeadTitle] = useState(departmentHeadInfo?.title || 'Head of Department (HOD)');
  const [deptName, setDeptName] = useState(departmentHeadInfo?.departmentName || 'Computer Science & Engineering');
  const [deptCode, setDeptCode] = useState(departmentHeadInfo?.departmentCode || 'CSE');
  const [deptAffiliation, setDeptAffiliation] = useState(departmentHeadInfo?.institutionName || 'University / Institution');

  // Faculty State
  const [facName, setFacName] = useState(facultyInfo?.name || 'Dr. Neha Kapoor');
  const [facEmail, setFacEmail] = useState(facultyInfo?.email || 'n.kapoor@mu.ac.in');
  const [facTitle, setFacTitle] = useState(facultyInfo?.title || 'Associate Professor & Lab Incharge');
  const [facId, setFacId] = useState(facultyInfo?.facultyId || 'FAC-2026-08');
  const [facDept, setFacDept] = useState(facultyInfo?.departmentName || 'Computer Science & Engineering');
  const [facSpec, setFacSpec] = useState(facultyInfo?.specialization || 'Artificial Intelligence & Software Quality Assurance');
  const [facOfficeHours, setFacOfficeHours] = useState(facultyInfo?.officeHours || 'Mon & Wed: 2:00 PM – 4:30 PM (Room 402)');

  // Interface & Notification Settings (Student/Global)
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [attendWarnEnabled, setAttendWarnEnabled] = useState(true);
  const [aiDigestEnabled, setAiDigestEnabled] = useState(false);
  const [compactDensity, setCompactDensity] = useState(false);

  // Form Handlers
  const handleSaveStudent = (e: FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentEmail.trim()) {
      showToast('Name and email cannot be empty', 'error');
      return;
    }
    onSaveProfile(studentName.trim(), studentEmail.trim());
    showToast('Student credentials saved successfully!', 'success');
  };

  const handleSaveInstitutionAdminForm = (e: FormEvent) => {
    e.preventDefault();
    if (!instName.trim() || !instEmail.trim()) {
      showToast('Name and email cannot be empty', 'error');
      return;
    }
    onSaveInstitutionAdmin?.({
      name: instName.trim(),
      email: instEmail.trim(),
      title: instTitle.trim(),
      institutionName: instOrgName.trim(),
      institutionCode: instCode.trim(),
      website: instWebsite.trim(),
      accreditation: instAccreditation.trim(),
      contactPhone: instPhone.trim(),
    });
    showToast('Institution Admin Profile updated successfully!', 'success');
  };

  const handleSaveDepartmentHeadForm = (e: FormEvent) => {
    e.preventDefault();
    if (!deptHeadName.trim() || !deptHeadEmail.trim()) {
      showToast('Name and email cannot be empty', 'error');
      return;
    }
    onSaveDepartmentHead?.({
      name: deptHeadName.trim(),
      email: deptHeadEmail.trim(),
      title: deptHeadTitle.trim(),
      departmentName: deptName.trim(),
      departmentCode: deptCode.trim(),
      institutionName: deptAffiliation.trim(),
    });
    showToast('Department Head Profile updated successfully!', 'success');
  };

  const handleSaveFacultyForm = (e: FormEvent) => {
    e.preventDefault();
    if (!facName.trim() || !facEmail.trim()) {
      showToast('Name and email cannot be empty', 'error');
      return;
    }
    onSaveFaculty?.({
      name: facName.trim(),
      email: facEmail.trim(),
      title: facTitle.trim(),
      facultyId: facId.trim(),
      departmentName: facDept.trim(),
      specialization: facSpec.trim(),
      officeHours: facOfficeHours.trim(),
    });
    showToast('Faculty Profile updated successfully!', 'success');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImportBackup?.(json);
        showToast('Workspace backup restored successfully!', 'success');
      } catch {
        showToast('Invalid JSON backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="view active" id="v-profile">
      {/* Top Header & Role Perspective Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800 }}>Account &amp; Entity Profile Management</h2>
            <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
              Multi-Tenant Architecture
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Dedicated profiles for Institution Leaders, Department Heads, Faculty Staff, and Students.
          </p>
        </div>

        {/* Profile Perspective Selector */}
        <div style={{ display: 'flex', background: 'var(--bg-2)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', gap: '4px' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeProfileTab === 'student' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveProfileTab('student')}
            style={{ fontWeight: 700, fontSize: '12px' }}
          >
            🎓 Student
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeProfileTab === 'institution_admin' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveProfileTab('institution_admin')}
            style={{ fontWeight: 700, fontSize: '12px' }}
          >
            🏛️ Institution Admin
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeProfileTab === 'department_head' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveProfileTab('department_head')}
            style={{ fontWeight: 700, fontSize: '12px' }}
          >
            🏢 Dept Head (HOD)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeProfileTab === 'faculty' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveProfileTab('faculty')}
            style={{ fontWeight: 700, fontSize: '12px' }}
          >
            👩‍🏫 Faculty Member
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. STUDENT PROFILE TAB                                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeProfileTab === 'student' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Student Profile & Credentials Form */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                  color: '#fff',
                  fontSize: '26px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(15, 76, 66, 0.25)',
                  flexShrink: 0,
                }}
              >
                {studentInfo.avatar || studentName.charAt(0) || 'S'}
              </div>
              <div>
                <strong style={{ fontSize: '1.25rem', display: 'block', color: 'var(--text-1)' }}>{studentName}</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px', fontWeight: 600 }}>
                  Roll / PRN: <span style={{ color: 'var(--text-1)' }}>{studentInfo.roll || 'CS2026-042'}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '1px' }}>
                  {studentInfo.branch || 'Computer Science & Engineering'} · Semester {studentInfo.sem || '5'}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <span className={`badge ${studentInfo.isInstitutional !== false ? 'badge-success' : 'badge-secondary'}`}>
                    {studentInfo.isInstitutional !== false ? '🏛️ Institution Enrolled' : '👤 Independent Learner'}
                  </span>
                </div>
              </div>
            </div>

            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-1)' }}>
              Edit Student Credentials
            </h3>

            <form onSubmit={handleSaveStudent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px' }}>
                  Full Student Name
                </label>
                <input
                  className="form-input"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Sufiyan Shaikh"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px' }}>
                  University / Personal Email
                </label>
                <input
                  className="form-input"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="e.g. student@university.edu"
                  required
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 700 }}>
                  Save Student Details
                </button>
              </div>
            </form>
          </div>

          {/* Display & Interface Settings */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
              Display &amp; Interface Settings
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Appearance Theme Configuration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-1)' }}>Appearance Theme</strong>
                  <small style={{ color: 'var(--text-3)', fontSize: '12px' }}>
                    Active: <b>{darkMode ? 'High-Contrast Dark' : 'Academic Light'}</b> {themeMode === 'system' ? '(Synchronized with System)' : '(Manual Override)'}
                  </small>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${themeMode === 'system' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => onSetThemeMode ? onSetThemeMode('system') : onToggleDarkMode()}
                    style={{ fontSize: '12px', fontWeight: 700, padding: '6px 8px' }}
                  >
                    🖥️ Auto (System)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${themeMode === 'light' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => onSetThemeMode ? onSetThemeMode('light') : onToggleDarkMode()}
                    style={{ fontSize: '12px', fontWeight: 700, padding: '6px 8px' }}
                  >
                    ☀️ Light
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${themeMode === 'dark' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => onSetThemeMode ? onSetThemeMode('dark') : onToggleDarkMode()}
                    style={{ fontSize: '12px', fontWeight: 700, padding: '6px 8px' }}
                  >
                    🌙 Dark
                  </button>
                </div>
              </div>

              {/* Institutional Membership Configuration */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-1)' }}>Institutional Membership</strong>
                  <small style={{ color: 'var(--text-3)', fontSize: '12px', display: 'block', marginTop: '2px' }}>
                    {studentInfo.isInstitutional !== false
                      ? `Connected: ${studentInfo.institution || 'University College'}`
                      : 'Independent Learner (No institutional attendance/exam tracking)'}
                  </small>
                </div>
                {onToggleInstitutional && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={onToggleInstitutional}
                    style={{ fontSize: '11px', fontWeight: 700 }}
                  >
                    {studentInfo.isInstitutional !== false ? 'Disconnect' : 'Connect Institution'}
                  </button>
                )}
              </div>

              {/* Layout Density */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-1)' }}>Compact Table Density</strong>
                  <small style={{ color: 'var(--text-3)', fontSize: '12px' }}>Reduces padding in tables &amp; lists</small>
                </div>
                <input
                  type="checkbox"
                  checked={compactDensity}
                  onChange={() => {
                    setCompactDensity(!compactDensity);
                    showToast(`Compact density ${!compactDensity ? 'enabled' : 'disabled'}`, 'info');
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              {/* Notification Toggles */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Notification Preferences
                </h4>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-1)' }}>Coursework Alerts</strong>
                    <small style={{ color: 'var(--text-3)', fontSize: '11px' }}>In-app alerts for pending assignments</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertsEnabled}
                    onChange={() => {
                      setAlertsEnabled(!alertsEnabled);
                      showToast(`Deadline alerts ${!alertsEnabled ? 'enabled' : 'disabled'}`, 'info');
                    }}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-1)' }}>Attendance Standing Warnings</strong>
                    <small style={{ color: 'var(--text-3)', fontSize: '11px' }}>Notify when attendance nears the 75% cutoff</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={attendWarnEnabled}
                    onChange={() => {
                      setAttendWarnEnabled(!attendWarnEnabled);
                      showToast(`Attendance alerts ${!attendWarnEnabled ? 'enabled' : 'disabled'}`, 'info');
                    }}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-1)' }}>AI Study Recommendations</strong>
                    <small style={{ color: 'var(--text-3)', fontSize: '11px' }}>Daily morning revision suggestions</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiDigestEnabled}
                    onChange={() => {
                      setAiDigestEnabled(!aiDigestEnabled);
                      showToast(`AI study recommendations ${!aiDigestEnabled ? 'enabled' : 'disabled'}`, 'info');
                    }}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Account Security & Password Card */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
              Account Security &amp; Access
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
              Student accounts are safeguarded by cryptographic token verification, HttpOnly browser security cookies, and row-level database ownership.
            </p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onOpenPasswordModal}
              style={{ padding: '10px 20px', alignSelf: 'flex-start', fontWeight: 700 }}
            >
              Change Account Password
            </button>
          </div>

          {/* Local Data Portability & Workspace Storage */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
              Workspace Backup &amp; Data Portability
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
              Export your entire workspace (tasks, attendance history, notes, and study sprints) to a portable JSON backup file, or restore an existing backup on any device.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onExportBackup}
                style={{ fontWeight: 700 }}
              >
                Export Backup (.json)
              </button>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0, fontWeight: 700 }}>
                Import Backup (.json)
                <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. INSTITUTION ADMIN PROFILE TAB                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeProfileTab === 'institution_admin' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Executive Institutional Identity Card */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0F4C42 0%, #0c3d35 100%)',
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(15, 76, 66, 0.35)',
                  flexShrink: 0,
                }}
              >
                {institutionAdminInfo?.avatar || instName.charAt(0) || 'AT'}
              </div>
              <div>
                <strong style={{ fontSize: '1.25rem', display: 'block', color: 'var(--text-1)' }}>{instName}</strong>
                <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>
                  {instTitle}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                  🏛️ {instOrgName} ({instCode})
                </div>
              </div>
            </div>

            {/* Institution KPI Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <small style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: '10px' }}>MANAGED DEPARTMENTS</small>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>
                  {institutionAdminInfo?.managedDepartmentsCount || 6}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>CSE, IT, ECE, MECH, CIVIL, AI</span>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <small style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: '10px' }}>ACCREDITATION</small>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--success)', marginTop: '4px' }}>
                  {instAccreditation}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Cycle 4 Verified</span>
              </div>
            </div>

            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-1)' }}>
              Edit Institution Leadership Profile
            </h3>

            <form onSubmit={handleSaveInstitutionAdminForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Dean / Admin Name
                </label>
                <input
                  className="form-input"
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  placeholder="e.g. Dr. Aris Thorne"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Institutional Email
                </label>
                <input
                  className="form-input"
                  type="email"
                  value={instEmail}
                  onChange={(e) => setInstEmail(e.target.value)}
                  placeholder="e.g. dean.technology@mu.ac.in"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Executive Title
                </label>
                <input
                  className="form-input"
                  value={instTitle}
                  onChange={(e) => setInstTitle(e.target.value)}
                  placeholder="e.g. Dean of Technology"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Institution Name &amp; Code
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <input
                    className="form-input"
                    value={instOrgName}
                    onChange={(e) => setInstOrgName(e.target.value)}
                    placeholder="e.g. Mumbai University - Faculty of Technology"
                    required
                  />
                  <input
                    className="form-input"
                    value={instCode}
                    onChange={(e) => setInstCode(e.target.value)}
                    placeholder="e.g. MU-ENG"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Accreditation Status
                </label>
                <input
                  className="form-input"
                  value={instAccreditation}
                  onChange={(e) => setInstAccreditation(e.target.value)}
                  placeholder="e.g. NAAC A++ Accredited"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Official Portal Website
                </label>
                <input
                  className="form-input"
                  value={instWebsite}
                  onChange={(e) => setInstWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Administrative Contact Phone
                </label>
                <input
                  className="form-input"
                  value={instPhone}
                  onChange={(e) => setInstPhone(e.target.value)}
                  placeholder="+91..."
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 700 }}>
                  Save Institution Profile
                </button>
              </div>
            </form>
          </div>

          {/* Central Institution Governance & Tree Hierarchy Card */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
              Campus Hierarchy &amp; Multi-Tenant Control
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
              As the <b>Master Institution Administrator</b>, you govern the node layer directly under the Super User. You hold authority to create departments, appoint Department Heads (HODs), and oversee institutional compliance.
            </p>

            <div style={{ padding: '16px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>
                <span>🌲</span> Tree Hierarchy Position
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>• <b>Level 0 (Root)</b>: Super Admin (Platform Owner)</div>
                <div style={{ color: 'var(--primary)', fontWeight: 700 }}>• <b>Level 1 (Node)</b>: Institution Admin ({instOrgName}) ← <i>Your Tier</i></div>
                <div>• <b>Level 2 (Branches)</b>: Department Heads (CSE, IT, ECE, Arts, etc.)</div>
                <div>• <b>Level 3 (Faculty)</b>: Professors &amp; Lab Lecturers</div>
                <div>• <b>Level 4 (Leaves)</b>: Enrolled Students</div>
              </div>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)', marginBottom: '6px' }}>
                Direct Administrative Capabilities
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Provision new Academic Departments and Courses</li>
                <li>Appoint and rotate Department Heads (HODs)</li>
                <li>Oversee master registration code distribution across branches</li>
                <li>Review cross-department accreditation and performance telemetry</li>
              </ul>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={onOpenPasswordModal}
              style={{ padding: '10px 20px', alignSelf: 'flex-start', fontWeight: 700 }}
            >
              Update Security Credentials
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. DEPARTMENT HEAD (HOD) PROFILE TAB                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeProfileTab === 'department_head' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Department Head Identity Card */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(29, 78, 216, 0.35)',
                  flexShrink: 0,
                }}
              >
                {departmentHeadInfo?.avatar || deptHeadName.charAt(0) || 'RV'}
              </div>
              <div>
                <strong style={{ fontSize: '1.25rem', display: 'block', color: 'var(--text-1)' }}>{deptHeadName}</strong>
                <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>
                  {deptHeadTitle}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                  🏢 {deptName} ({deptCode})
                </div>
              </div>
            </div>

            {/* Department Head Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <small style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: '10px' }}>FACULTY STAFF</small>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>
                  {departmentHeadInfo?.facultyCount || 14}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Professors &amp; TAs</span>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <small style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: '10px' }}>ENROLLED STUDENTS</small>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--success)' }}>
                  {departmentHeadInfo?.studentCount || 248}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Active in Fall 2026</span>
              </div>
            </div>

            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-1)' }}>
              Edit Department Head Credentials
            </h3>

            <form onSubmit={handleSaveDepartmentHeadForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  HOD Full Name
                </label>
                <input
                  className="form-input"
                  value={deptHeadName}
                  onChange={(e) => setDeptHeadName(e.target.value)}
                  placeholder="e.g. Prof. Rajesh K. Varma"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Department Email Address
                </label>
                <input
                  className="form-input"
                  type="email"
                  value={deptHeadEmail}
                  onChange={(e) => setDeptHeadEmail(e.target.value)}
                  placeholder="e.g. hod.cse@mu.ac.in"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Department Designation
                </label>
                <input
                  className="form-input"
                  value={deptHeadTitle}
                  onChange={(e) => setDeptHeadTitle(e.target.value)}
                  placeholder="e.g. Head of Department (HOD)"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Department Title &amp; Code
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <input
                    className="form-input"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                    required
                  />
                  <input
                    className="form-input"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    placeholder="e.g. CSE"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Affiliated Institution
                </label>
                <input
                  className="form-input"
                  value={deptAffiliation}
                  onChange={(e) => setDeptAffiliation(e.target.value)}
                  placeholder="e.g. Mumbai University - Faculty of Technology"
                  required
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 700 }}>
                  Save Department Profile
                </button>
              </div>
            </form>
          </div>

          {/* Department Branch Governance Card */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
              Branch Authority &amp; Registration Codes
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
              As <b>Head of Department (HOD)</b>, you manage the faculty roster for your branch, configure semester curricula (e.g. Semester 5 AI, CIS, STQA, IKS), and generate locked registration codes (e.g. <code>CSE-2026-S5</code>).
            </p>

            <div style={{ padding: '16px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)', marginBottom: '8px' }}>
                Active Registration Codes Managed
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--primary)' }}>CSE-2026-S5</span>
                    <small style={{ display: 'block', color: 'var(--text-3)', fontSize: '11px' }}>Semester 5 (Fall 2026) · 42/60 Enrolled</small>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '10px' }}>Active</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--primary)' }}>CSE-2026-S3</span>
                    <small style={{ display: 'block', color: 'var(--text-3)', fontSize: '11px' }}>Semester 3 (Fall 2026) · 65/65 Full</small>
                  </div>
                  <span className="badge badge-secondary" style={{ fontSize: '10px' }}>Closed</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)', marginBottom: '6px' }}>
                Department Head Governance Rights
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Assign faculty members to theoretical &amp; laboratory courses</li>
                <li>Issue department-wide circulars and exam schedules</li>
                <li>Monitor student attendance minimum standing (&lt; 75% caution)</li>
                <li>Approve internal grades and semester submissions</li>
              </ul>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={onOpenPasswordModal}
              style={{ padding: '10px 20px', alignSelf: 'flex-start', fontWeight: 700 }}
            >
              Update Security Credentials
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. FACULTY MEMBER PROFILE TAB                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeProfileTab === 'faculty' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Faculty Member Identity Card */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
                  flexShrink: 0,
                }}
              >
                {facultyInfo?.avatar || facName.charAt(0) || 'NK'}
              </div>
              <div>
                <strong style={{ fontSize: '1.25rem', display: 'block', color: 'var(--text-1)' }}>{facName}</strong>
                <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>
                  {facTitle}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                  ID: <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{facId}</span> · {facDept}
                </div>
              </div>
            </div>

            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-1)' }}>
              Edit Faculty Profile Details
            </h3>

            <form onSubmit={handleSaveFacultyForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Faculty Name
                </label>
                <input
                  className="form-input"
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  placeholder="e.g. Dr. Neha Kapoor"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Academic Email
                </label>
                <input
                  className="form-input"
                  type="email"
                  value={facEmail}
                  onChange={(e) => setFacEmail(e.target.value)}
                  placeholder="e.g. n.kapoor@mu.ac.in"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Academic Designation
                </label>
                <input
                  className="form-input"
                  value={facTitle}
                  onChange={(e) => setFacTitle(e.target.value)}
                  placeholder="e.g. Associate Professor & Lab Incharge"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Faculty ID &amp; Assigned Department
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                  <input
                    className="form-input"
                    value={facId}
                    onChange={(e) => setFacId(e.target.value)}
                    placeholder="e.g. FAC-2026-08"
                    required
                  />
                  <input
                    className="form-input"
                    value={facDept}
                    onChange={(e) => setFacDept(e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Domain Specialization
                </label>
                <input
                  className="form-input"
                  value={facSpec}
                  onChange={(e) => setFacSpec(e.target.value)}
                  placeholder="e.g. Artificial Intelligence & STQA"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '4px' }}>
                  Office Consultation Hours &amp; Location
                </label>
                <input
                  className="form-input"
                  value={facOfficeHours}
                  onChange={(e) => setFacOfficeHours(e.target.value)}
                  placeholder="e.g. Mon & Wed: 2:00 PM – 4:30 PM (Room 402)"
                  required
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 700 }}>
                  Save Faculty Profile
                </button>
              </div>
            </form>
          </div>

          {/* Assigned Courses & Lecture Load Card */}
          <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
              Assigned Courses &amp; Teaching Load
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
              Courses assigned by the Department Head. Total lecture delivery target: 40 sessions per course.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {(facultyInfo?.assignedSubjects && facultyInfo.assignedSubjects.length > 0) ? (
                facultyInfo.assignedSubjects.map((subj, idx) => (
                  <div key={idx} style={{ padding: '14px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-1)' }}>{subj}</strong>
                      <span className="badge badge-primary" style={{ fontSize: '11px' }}>Assigned</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                  No courses assigned yet. Enrolled teaching courses will appear here once allocated by your Department Head.
                </div>
              )}
            </div>

            <div style={{ padding: '16px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)', marginBottom: '6px' }}>
                Faculty Teaching Responsibilities
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Conduct scheduled classroom lectures and lab demonstrations</li>
                <li>Mark daily lecture attendance and report students below 75%</li>
                <li>Review and grade lab assignments and term papers</li>
                <li>Hold weekly student consultation sessions in designated office room</li>
              </ul>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={onOpenPasswordModal}
              style={{ padding: '10px 20px', alignSelf: 'flex-start', fontWeight: 700 }}
            >
              Update Security Credentials
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

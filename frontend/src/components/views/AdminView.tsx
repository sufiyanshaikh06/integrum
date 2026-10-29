import { useState } from 'react';
import type {
  StudentDirectoryItem,
  AnnouncementItem,
  RegistrationCodeItem,
  InstitutionAdminInfo,
  DepartmentHeadInfo,
  FacultyInfo,
  StaffRole,
} from '../../types';

interface AdminProps {
  students?: StudentDirectoryItem[];
  announcements?: AnnouncementItem[];
  registrationCodes?: RegistrationCodeItem[];
  institutionAdminInfo?: InstitutionAdminInfo;
  departmentHeadInfo?: DepartmentHeadInfo;
  facultyInfo?: FacultyInfo;
  onOpenAnnounceModal: () => void;
  onSwitchToStudentView?: () => void;
  onOpenDemoModal?: () => void;
  onAddRegistrationCode?: (code: RegistrationCodeItem) => void | Promise<void>;
  onToggleRegistrationCode?: (id: string) => void;
  onAddStaffMember?: (role: StaffRole, data: any) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AdminView({
  students = [],
  announcements = [],
  registrationCodes = [],
  institutionAdminInfo,
  departmentHeadInfo,
  facultyInfo,
  onOpenAnnounceModal,
  onSwitchToStudentView: _onSwitchToStudentView,
  onOpenDemoModal,
  onAddRegistrationCode,
  onToggleRegistrationCode,
  onAddStaffMember,
  showToast,
}: AdminProps) {
  // Navigation Tabs: 'overview' | 'codes' | 'hierarchy' | 'directory'
  const [activeTab, setActiveTab] = useState<'overview' | 'codes' | 'hierarchy' | 'directory'>('overview');

  // Student Directory Filter
  const [studentSearch, setStudentSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');

  // Registration Code Modal State
  const [isGenerateCodeModalOpen, setIsGenerateCodeModalOpen] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [newDeptName, setNewDeptName] = useState('Computer Science & Engineering');
  const [newDeptCode, setNewDeptCode] = useState('CSE');
  const [newSem, setNewSem] = useState(5);
  const [newYear, setNewYear] = useState(2026);
  const [newMaxUses, setNewMaxUses] = useState(60);

  // Enrolled Students Drilldown Modal State
  const [selectedCodeForDrilldown, setSelectedCodeForDrilldown] = useState<RegistrationCodeItem | null>(null);

  // Staff Provisioning Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffRoleToProvision, setStaffRoleToProvision] = useState<StaffRole>('faculty');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffTitle, setStaffTitle] = useState('');
  const [staffSpecificField1, setStaffSpecificField1] = useState(''); // e.g. Inst Code, Dept Code, or Faculty ID
  const [staffSpecificField2, setStaffSpecificField2] = useState(''); // e.g. Accreditation, Office Room, Specialization

  const safeStudents = Array.isArray(students) ? students : [];
  const safeAnnouncements = Array.isArray(announcements) ? announcements : [];
  const safeCodes = Array.isArray(registrationCodes) ? registrationCodes : [];

  const filteredStudents = safeStudents.filter((s) => {
    if (!s) return false;
    const branch = s.branch || (s as any).dept || 'Computer Science';
    if (branchFilter !== 'ALL' && !branch.toLowerCase().includes(branchFilter.toLowerCase())) {
      return false;
    }
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      const name = (s.name || '').toLowerCase();
      const roll = (s.roll || '').toLowerCase();
      return name.includes(q) || roll.includes(q);
    }
    return true;
  });

  // Calculate Code Telemetry
  const activeCodesCount = safeCodes.filter((c) => c.isActive).length;
  const totalEnrolledViaCode = safeCodes.reduce((acc, c) => acc + c.usedCount, 0);
  const totalMaxCapacity = safeCodes.reduce((acc, c) => acc + (c.maxUses || 0), 0);
  const averageUtilization = totalMaxCapacity > 0 ? Math.round((totalEnrolledViaCode / totalMaxCapacity) * 100) : 0;

  // Handle Code Generation Submit
  const handleGenerateCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = (newCodeName.trim() || `${newDeptCode}-${newYear}-S${newSem}`).toUpperCase();

    // Check duplicate
    if (safeCodes.some((c) => c.code.toUpperCase() === finalCode)) {
      showToast?.(`Code "${finalCode}" already exists!`, 'error');
      return;
    }

    const newCodeItem: RegistrationCodeItem = {
      id: `reg-code-${Date.now()}`,
      code: finalCode,
      departmentName: newDeptName,
      departmentCode: newDeptCode,
      semesterNumber: Number(newSem),
      academicYear: Number(newYear),
      maxUses: Number(newMaxUses) || 60,
      usedCount: 0,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      await onAddRegistrationCode?.(newCodeItem);
      showToast?.(`Registration code ${finalCode} created and activated!`, 'success');
      setIsGenerateCodeModalOpen(false);
    } catch (err: unknown) {
      console.warn('Registration code creation error handled by parent handler:', err);
    }
  };

  // Handle Staff Provisioning Submit
  const handleProvisionStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim()) {
      showToast?.('Staff name and email are required', 'error');
      return;
    }

    const payload = {
      name: staffName.trim(),
      email: staffEmail.trim(),
      title: staffTitle.trim() || 'Staff Member',
      role: staffRoleToProvision,
      specificField1: staffSpecificField1.trim(),
      specificField2: staffSpecificField2.trim(),
    };

    onAddStaffMember?.(staffRoleToProvision, payload);
    showToast?.(`Provisioned ${staffRoleToProvision.replace('_', ' ')} (${staffName}) successfully!`, 'success');
    setIsStaffModalOpen(false);
    setStaffName('');
    setStaffEmail('');
    setStaffTitle('');
    setStaffSpecificField1('');
    setStaffSpecificField2('');
  };

  return (
    <div className="view active" id="v-admin">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>University Administration &amp; Governance</h2>
            <span className="admin-badge">Multi-Tenant Root</span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Campus hierarchy control, on-the-fly registration codes, faculty appointments, and curriculum distribution.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            id="btnAdminSupport"
            onClick={() => {
              if (onOpenDemoModal) {
                onOpenDemoModal();
              } else {
                alert('University Enterprise Support: Connect directly at enterprise@integrum.ac.in or request a guided administrative walkthrough.');
              }
            }}
          >
            Institutional Support &amp; Demo
          </button>
          <button className="btn btn-primary" onClick={onOpenAnnounceModal}>
            + Post Circular
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', background: 'var(--bg-2)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', gap: '4px', marginBottom: '24px', overflowX: 'auto' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('overview')}
          style={{ fontWeight: 700, fontSize: '12.5px' }}
        >
          📊 Campus Overview
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'codes' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('codes')}
          style={{ fontWeight: 700, fontSize: '12.5px' }}
        >
          🔑 Registration Codes &amp; Enrollment ({safeCodes.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'hierarchy' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('hierarchy')}
          style={{ fontWeight: 700, fontSize: '12.5px' }}
        >
          👥 Staff &amp; Faculty Hierarchy
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'directory' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('directory')}
          style={{ fontWeight: 700, fontSize: '12.5px' }}
        >
          🎓 Student Directory ({safeStudents.length})
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. CAMPUS OVERVIEW TAB                                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Admin KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="card" style={{ padding: '18px' }}>
              <small style={{ color: 'var(--text-3)', fontWeight: 700 }}>ENROLLED STUDENTS</small>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', margin: '4px 0' }}>{safeStudents.length}</div>
              <span style={{ fontSize: '11px', color: safeStudents.length > 0 ? 'var(--success)' : 'var(--text-2)' }}>Registered Cohort Students</span>
            </div>
            <div className="card" style={{ padding: '18px' }}>
              <small style={{ color: 'var(--text-3)', fontWeight: 700 }}>REGISTRATION CODES</small>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--info)', margin: '4px 0' }}>{safeCodes.length}</div>
              <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Active Department Keys</span>
            </div>
            <div className="card" style={{ padding: '18px' }}>
              <small style={{ color: 'var(--text-3)', fontWeight: 700 }}>FACULTY CIRCULARS</small>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)', margin: '4px 0' }}>{safeAnnouncements.length}</div>
              <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Broadcast to Student Portal</span>
            </div>
            <div className="card" style={{ padding: '18px' }}>
              <small style={{ color: 'var(--text-3)', fontWeight: 700 }}>CODE ENROLLMENTS</small>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--success)', margin: '4px 0' }}>{totalEnrolledViaCode}</div>
              <span style={{ fontSize: '11px', color: 'var(--success)' }}>Locked into Curriculum</span>
            </div>
          </div>

          {/* Campus Circulars Broadcaster */}
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Campus Circulars &amp; Official Notices</h3>
                <small style={{ color: 'var(--text-3)' }}>Broadcasting to Institutional Students</small>
              </div>
              <span className="badge badge-primary">Broadcast Stream</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {safeAnnouncements.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--text-3)', textAlign: 'center', fontSize: '13px' }}>
                  No circulars posted yet. Click "+ Post Circular" above to broadcast an official announcement.
                </div>
              ) : (
                safeAnnouncements.map((a) => (
                  <div key={a.id} style={{ padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px' }}>{a.title}</strong>
                      <span className="badge badge-secondary" style={{ fontSize: '10px' }}>{a.category || (a as any).cat || 'General'}</span>
                    </div>
                    <p style={{ margin: '6px 0 8px 0', fontSize: '12px', color: 'var(--text-2)' }}>{a.content || (a as any).body || ''}</p>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                      Published on {a.date || 'Today'} · By {a.author || 'Office of the Dean'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. REGISTRATION CODES & ENROLLMENT TAB                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'codes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Telemetry Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <small style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: '10px' }}>ACTIVE CODES</small>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', marginTop: '2px' }}>{activeCodesCount}</div>
              <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Of {safeCodes.length} total generated</span>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <small style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: '10px' }}>STUDENTS ENROLLED</small>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--success)', marginTop: '2px' }}>{totalEnrolledViaCode}</div>
              <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Locked into curriculum</span>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <small style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: '10px' }}>MAX COHORT CAPACITY</small>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-1)', marginTop: '2px' }}>{totalMaxCapacity}</div>
              <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Across active semesters</span>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <small style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: '10px' }}>COHORT UTILIZATION</small>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', marginTop: '2px' }}>{averageUtilization}%</div>
              <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Real-time seat fill rate</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Department Registration Codes</h3>
                <p style={{ margin: '3px 0 0 0', color: 'var(--text-2)', fontSize: '12px' }}>
                  Generate on-the-fly codes locked to Semester &amp; Year. When a student registers with this code, they instantly inherit the department curriculum, 40-lecture targets, and attendance roster.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsGenerateCodeModalOpen(true)}
                style={{ fontWeight: 700 }}
              >
                + Generate Registration Code
              </button>
            </div>

            {/* Registration Codes Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-3)' }}>
                    <th style={{ padding: '10px 12px' }}>Code</th>
                    <th style={{ padding: '10px 12px' }}>Department</th>
                    <th style={{ padding: '10px 12px' }}>Curriculum Lock</th>
                    <th style={{ padding: '10px 12px' }}>Cohort Enrollment</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)' }}>
                        No registration codes generated yet. Click "+ Generate Registration Code" to create one.
                      </td>
                    </tr>
                  ) : (
                    safeCodes.map((codeItem) => {
                      const max = codeItem.maxUses || 60;
                      const pct = Math.min(100, Math.round((codeItem.usedCount / max) * 100));
                      return (
                        <tr key={codeItem.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 900, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '13px', background: 'var(--primary-light)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                                {codeItem.code}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <strong style={{ fontSize: '13px', display: 'block' }}>{codeItem.departmentName}</strong>
                            <small style={{ color: 'var(--text-3)', fontSize: '11px' }}>Code: {codeItem.departmentCode}</small>
                          </td>
                          <td style={{ padding: '12px', fontSize: '12.5px', color: 'var(--text-2)' }}>
                            <b>Semester {codeItem.semesterNumber}</b> · Academic Year {codeItem.academicYear}
                          </td>
                          <td style={{ padding: '12px', minWidth: '160px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>
                              <span>{codeItem.usedCount} / {max} Enrolled</span>
                              <span style={{ color: pct >= 90 ? 'var(--error)' : 'var(--primary)' }}>{pct}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: pct >= 90 ? 'var(--error)' : 'var(--primary)',
                                  borderRadius: '3px',
                                }}
                              />
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className={`badge ${codeItem.isActive ? 'badge-success' : 'badge-secondary'}`}>
                              {codeItem.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                onClick={() => setSelectedCodeForDrilldown(codeItem)}
                                style={{ fontWeight: 700 }}
                              >
                                Enrolled Students
                              </button>
                              <button
                                type="button"
                                className={`btn btn-xs ${codeItem.isActive ? 'btn-ghost' : 'btn-primary'}`}
                                onClick={() => onToggleRegistrationCode?.(codeItem.id)}
                                style={{ fontWeight: 700 }}
                              >
                                {codeItem.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. STAFF & FACULTY HIERARCHY TAB                                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'hierarchy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Hierarchy Banner & Explanation */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Multi-Tenant Authority &amp; Tree Hierarchy</h3>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)', fontSize: '13px' }}>
                  Root (Super User) controls Institutions $\to$ Institution Admin controls Departments $\to$ Department Heads appoint Faculty $\to$ Faculty manage Courseworks.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setStaffRoleToProvision('institution_admin');
                  setIsStaffModalOpen(true);
                }}
                style={{ fontWeight: 700 }}
              >
                + Provision Staff / Entity
              </button>
            </div>

            {/* Visual Tree Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              {/* Level 0: Root / Super Admin */}
              <div style={{ padding: '18px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '2px solid var(--primary)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900 }}>
                      👑
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--text-1)' }}>Super User / Platform Owner (Root)</strong>
                        <span className="badge badge-primary" style={{ fontSize: '10px' }}>System Root</span>
                      </div>
                      <small style={{ color: 'var(--text-2)', fontSize: '12px' }}>
                        Global platform provisioning authority · Creates Institutions and appoints Master Admins
                      </small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={() => {
                      setStaffRoleToProvision('institution_admin');
                      setIsStaffModalOpen(true);
                    }}
                    style={{ fontWeight: 700 }}
                  >
                    + Provision Institution Admin
                  </button>
                </div>
              </div>

              {/* Connector line */}
              <div style={{ width: '2px', height: '16px', background: 'var(--border)', margin: '-10px 0 -10px 38px' }} />

              {/* Level 1: Node / Institution */}
              <div style={{ padding: '18px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginLeft: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#0F4C42', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900 }}>
                      🏛️
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--text-1)' }}>
                          {institutionAdminInfo?.institutionName || 'Institutional Campus Portal'}
                        </strong>
                        <span className="badge badge-success" style={{ fontSize: '10px' }}>
                          Code: {institutionAdminInfo?.institutionCode || 'INST'}
                        </span>
                      </div>
                      <small style={{ color: 'var(--text-2)', fontSize: '12px' }}>
                        Admin: <b>{institutionAdminInfo?.name || 'Administrator'}</b> ({institutionAdminInfo?.title || 'Institution Admin'}) · {institutionAdminInfo?.managedDepartmentsCount ?? 0} Departments
                      </small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={() => {
                      setStaffRoleToProvision('department_head');
                      setIsStaffModalOpen(true);
                    }}
                    style={{ fontWeight: 700 }}
                  >
                    + Assign Department Head (HOD)
                  </button>
                </div>
              </div>

              {/* Connector line */}
              <div style={{ width: '2px', height: '16px', background: 'var(--border)', margin: '-10px 0 -10px 62px' }} />

              {/* Level 2: Branch / Department Head */}
              <div style={{ padding: '18px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginLeft: '48px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1d4ed8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900 }}>
                      🏢
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--text-1)' }}>
                          Department: {departmentHeadInfo?.departmentName || 'Computer Science & Engineering'} ({departmentHeadInfo?.departmentCode || 'CSE'})
                        </strong>
                        <span className="badge badge-primary" style={{ fontSize: '10px' }}>Academic Branch</span>
                      </div>
                      <small style={{ color: 'var(--text-2)', fontSize: '12px' }}>
                        HOD: <b>{departmentHeadInfo?.name || 'Prof. Rajesh K. Varma'}</b> · {departmentHeadInfo?.facultyCount || 14} Faculty · {departmentHeadInfo?.studentCount || 248} Students
                      </small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={() => {
                      setStaffRoleToProvision('faculty');
                      setIsStaffModalOpen(true);
                    }}
                    style={{ fontWeight: 700 }}
                  >
                    + Add Faculty Member
                  </button>
                </div>
              </div>

              {/* Connector line */}
              <div style={{ width: '2px', height: '16px', background: 'var(--border)', margin: '-10px 0 -10px 86px' }} />

              {/* Level 3: Leaves / Faculty Staff Roster */}
              <div style={{ padding: '18px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginLeft: '72px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900 }}>
                    👩‍🏫
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-1)' }}>Department Faculty Teaching Roster</strong>
                    <small style={{ display: 'block', color: 'var(--text-2)', fontSize: '12px' }}>
                      Faculty conduct 40 lectures per course, record attendance, and post announcements.
                    </small>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {facultyInfo?.name ? (
                    <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13px' }}>{facultyInfo.name}</strong>
                        <span className="badge badge-success" style={{ fontSize: '10px' }}>{facultyInfo.facultyId || 'FAC-ACTIVE'}</span>
                      </div>
                      <small style={{ display: 'block', color: 'var(--primary)', fontWeight: 700, fontSize: '11px', marginTop: '2px' }}>
                        {facultyInfo.title || 'Faculty Member'}
                      </small>
                      <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: '4px' }}>
                        Specialization: {facultyInfo.specialization || 'Computer Science & Engineering'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                        Office: {facultyInfo.officeHours || 'By Appointment'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '18px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px', gridColumn: '1 / -1' }}>
                      No faculty members assigned to this department yet. Add faculty members using the button above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. STUDENT DIRECTORY TAB                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'directory' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Student Directory &amp; Academic Health</h3>
              <small style={{ color: 'var(--text-3)' }}>Enrolled cohort records and attendance standing</small>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="form-input"
                placeholder="Search by name or roll..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ fontSize: '12px', padding: '6px 10px', width: '220px' }}
              />
              <select
                className="form-select"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                style={{ fontSize: '12px', padding: '6px 10px' }}
              >
                <option value="ALL">All Branches</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Tech">Information Tech</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-3)' }}>
                  <th style={{ padding: '10px 12px' }}>Roll Number</th>
                  <th style={{ padding: '10px 12px' }}>Student Name</th>
                  <th style={{ padding: '10px 12px' }}>Branch &amp; Sem</th>
                  <th style={{ padding: '10px 12px' }}>CGPA</th>
                  <th style={{ padding: '10px 12px' }}>Attendance</th>
                  <th style={{ padding: '10px 12px' }}>Standing</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)' }}>
                      No student records matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const cgpaVal = typeof s.cgpa === 'number' ? s.cgpa : parseFloat((s as any).cgpa) || 8.5;
                    const attVal = typeof s.attendance === 'number' ? s.attendance : parseFloat(String((s as any).attendance || (s as any).att || '85')) || 85;
                    const branchVal = s.branch || (s as any).dept || 'Computer Science';
                    const semVal = s.sem || 'Semester 5';
                    const statusVal = s.status || (attVal >= 75 ? 'Regular' : 'Academic Caution');

                    return (
                      <tr key={s.roll} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{s.roll}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 800 }}>{s.name}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-2)' }}>
                          {branchVal} · {semVal}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{cgpaVal.toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: attVal >= 75 ? 'var(--success)' : 'var(--error)' }}>
                          {attVal}%
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            className={`badge ${
                              statusVal === 'Dean List' ? 'badge-primary' : statusVal === 'Regular' ? 'badge-success' : 'badge-warning'
                            }`}
                          >
                            {statusVal}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: GENERATE REGISTRATION CODE                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isGenerateCodeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGenerateCodeModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Generate Department Code</h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsGenerateCodeModalOpen(false)}
                style={{ fontSize: '18px', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5 }}>
              Create an on-the-fly registration code locked to a specific semester curriculum. When students register with this code, they are enrolled with the 40-lecture target and curriculum automatically.
            </p>

            <form onSubmit={handleGenerateCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                  Department Name &amp; Code
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                  <input
                    className="form-input"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                    required
                  />
                  <input
                    className="form-input"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CSE"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                    Semester Lock
                  </label>
                  <select
                    className="form-select"
                    value={newSem}
                    onChange={(e) => setNewSem(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                    Academic Year
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                  Max Student Capacity
                </label>
                <input
                  className="form-input"
                  type="number"
                  value={newMaxUses}
                  onChange={(e) => setNewMaxUses(Number(e.target.value))}
                  placeholder="e.g. 60"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                    Registration Code String
                  </label>
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={() => setNewCodeName(`${newDeptCode}-${newYear}-S${newSem}`)}
                    style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}
                  >
                    Auto-Fill Format
                  </button>
                </div>
                <input
                  className="form-input"
                  value={newCodeName}
                  onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                  placeholder={`e.g. ${newDeptCode || 'CSE'}-${newYear}-S${newSem}`}
                />
                <small style={{ color: 'var(--text-3)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  Leave blank to auto-format as <b>{`${newDeptCode || 'CSE'}-${newYear}-S${newSem}`}</b>
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsGenerateCodeModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Activate Code Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: DRILLDOWN ENROLLED STUDENTS FOR A CODE                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedCodeForDrilldown && (
        <div className="modal-overlay" onClick={() => setSelectedCodeForDrilldown(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Enrolled Student Roster</h3>
                  <span className="badge badge-primary" style={{ fontFamily: 'monospace' }}>
                    {selectedCodeForDrilldown.code}
                  </span>
                </div>
                <small style={{ color: 'var(--text-3)', fontSize: '12px' }}>
                  {selectedCodeForDrilldown.departmentName} · Semester {selectedCodeForDrilldown.semesterNumber} (Year {selectedCodeForDrilldown.academicYear})
                </small>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelectedCodeForDrilldown(null)}
                style={{ fontSize: '18px', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Total Enrolled: <b>{selectedCodeForDrilldown.usedCount} Students</b></span>
              <span>Capacity: <b>{selectedCodeForDrilldown.maxUses || 60} Seats</b></span>
              <span>Status: <b style={{ color: selectedCodeForDrilldown.isActive ? 'var(--success)' : 'var(--text-3)' }}>{selectedCodeForDrilldown.isActive ? 'Open' : 'Closed'}</b></span>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="tbl" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-3)' }}>
                    <th style={{ padding: '8px 10px' }}>Roll No</th>
                    <th style={{ padding: '8px 10px' }}>Student Name</th>
                    <th style={{ padding: '8px 10px' }}>Attendance</th>
                    <th style={{ padding: '8px 10px' }}>Standing</th>
                  </tr>
                </thead>
                <tbody>
                  {safeStudents.slice(0, 5).map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>262500{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>{s.name}</td>
                      <td style={{ padding: '8px 10px', color: (s.attendance || 85) >= 75 ? 'var(--success)' : 'var(--error)' }}>
                        {s.attendance || 85}%
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span className="badge badge-success" style={{ fontSize: '10px' }}>Regular</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedCodeForDrilldown(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: PROVISION STAFF MEMBER / ENTITY                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isStaffModalOpen && (
        <div className="modal-overlay" onClick={() => setIsStaffModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Provision Staff &amp; Authority</h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsStaffModalOpen(false)}
                style={{ fontSize: '18px', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProvisionStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                  Hierarchy Tier to Provision
                </label>
                <select
                  className="form-select"
                  value={staffRoleToProvision}
                  onChange={(e) => setStaffRoleToProvision(e.target.value as StaffRole)}
                >
                  <option value="institution_admin">Tier 1: Master Institution Admin (Dean / Rector)</option>
                  <option value="department_head">Tier 2: Department Head / HOD</option>
                  <option value="faculty">Tier 3: Faculty Member / Lecturer</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                  Staff Member Full Name
                </label>
                <input
                  className="form-input"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Dr. Priya Raman"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                  Official Email Address
                </label>
                <input
                  className="form-input"
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="e.g. p.raman@mu.ac.in"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                  Designation / Academic Title
                </label>
                <input
                  className="form-input"
                  value={staffTitle}
                  onChange={(e) => setStaffTitle(e.target.value)}
                  placeholder={
                    staffRoleToProvision === 'institution_admin'
                      ? 'e.g. Dean of Academic Affairs'
                      : staffRoleToProvision === 'department_head'
                      ? 'e.g. Head of Department (HOD)'
                      : 'e.g. Associate Professor'
                  }
                  required
                />
              </div>

              {/* Dynamic Field 1 */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                  {staffRoleToProvision === 'institution_admin'
                    ? 'Institution Code'
                    : staffRoleToProvision === 'department_head'
                    ? 'Department Code (e.g. IT, AIML)'
                    : 'Faculty ID (e.g. FAC-2026-22)'}
                </label>
                <input
                  className="form-input"
                  value={staffSpecificField1}
                  onChange={(e) => setStaffSpecificField1(e.target.value)}
                  placeholder="e.g. AIML or FAC-2026-22"
                />
              </div>

              {/* Dynamic Field 2 */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                  {staffRoleToProvision === 'institution_admin'
                    ? 'Accreditation Status'
                    : staffRoleToProvision === 'department_head'
                    ? 'Department Office Room'
                    : 'Specialization / Courses'}
                </label>
                <input
                  className="form-input"
                  value={staffSpecificField2}
                  onChange={(e) => setStaffSpecificField2(e.target.value)}
                  placeholder={
                    staffRoleToProvision === 'faculty'
                      ? 'e.g. Cloud Computing & Distributed Systems'
                      : 'e.g. Room 302, Academic Block'
                  }
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsStaffModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Confirm Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

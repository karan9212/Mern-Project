import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography } from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import { useThemeMode } from '../../context/ThemeModeContext';
import API from '../../api/api';
import {
  clearEmployeeActivity,
  formatCountdown,
  getEmployeeLastActivity,
  getEmployeeIdleRemainingMs,
  hasEmployeeActivityExpired,
  refreshEmployeeActivity
} from '../../utils/employeeSession';
import AppToast from '../../components/common/AppToast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageLoader from '../../components/common/PageLoader';
import DashboardLayout from '../../components/layouts/dashboard/DashboardLayout';
import DashboardSidebar from '../../components/layouts/dashboard/DashboardSidebar';
import useToast from '../../hooks/useToast';

const drawerWidth = 280;
const collapsedDrawerWidth = 84;
const SCHOOL_CLASSES = ['10th', '12th'];
const SCHOOL_BOARDS = ['CBSE', 'ICSE', 'NIOS', 'State Board', 'IB', 'Cambridge'];
const COLLEGE_DEPARTMENTS = {
  'B.Tech': ['Computer Science Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electronics and Communication', 'Electrical Engineering', 'Information Technology'],
  'B.E': ['Computer Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Electronics Engineering', 'Electrical Engineering', 'Automobile Engineering'],
  'M.Tech': ['Computer Science', 'Data Science', 'VLSI Design', 'Structural Engineering', 'Power Systems', 'Thermal Engineering'],
  'B.Com': ['Accounting', 'Finance', 'Banking', 'Taxation', 'Business Analytics'],
  'M.Com': ['Advanced Accounting', 'Finance', 'Business Management', 'Economics', 'Taxation'],
  BSc: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Statistics'],
  MSc: ['Physics', 'Chemistry', 'Mathematics', 'Biotechnology', 'Computer Science', 'Environmental Science'],
  BCA: ['Computer Applications', 'Software Development', 'Data Analytics', 'Cloud Computing'],
  MCA: ['Computer Applications', 'Artificial Intelligence', 'Cyber Security', 'Data Science'],
  Arts: ['English', 'History', 'Political Science', 'Economics', 'Psychology', 'Sociology'],
  BA: ['English', 'History', 'Political Science', 'Economics', 'Psychology', 'Sociology'],
  MA: ['English', 'History', 'Political Science', 'Economics', 'Psychology', 'Public Administration'],
  MBA: ['Marketing', 'Finance', 'Human Resources', 'Operations', 'Business Analytics', 'International Business'],
  Diploma: ['Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Computer Engineering', 'Fashion Design']
};

const createEducationEntry = () => ({
  id: `edu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  educationType: 'college',
  collegeName: '',
  eduDepartment: '',
  courseName: '',
  fromDate: '',
  currentlyPursuing: false,
  toDate: '',
  certificate: '',
  certificateName: '',
  schoolName: '',
  schoolAddress: '',
  schoolClass: '',
  boardName: ''
});

const normalizeEducationEntry = (entry) => {
  const base = createEducationEntry();
  return {
    ...base,
    ...entry,
    id: entry?.id || base.id,
    educationType: entry?.educationType === 'school' ? 'school' : 'college',
    currentlyPursuing: Boolean(entry?.currentlyPursuing),
    certificate: entry?.certificate || '',
    certificateName: entry?.certificateName || ''
  };
};

const getPrimaryEmployeeRole = (employeeType) => {
  if (Array.isArray(employeeType)) {
    if (employeeType.includes('admin')) return 'admin';
    if (employeeType.includes('subAdmin')) return 'subAdmin';
    return 'team';
  }

  if (employeeType === 'admin') return 'admin';
  if (employeeType === 'subAdmin') return 'subAdmin';
  return 'team';
};

const normalizeEmployeeTypes = (employeeType) => {
  const rawRoles = Array.isArray(employeeType) ? employeeType : [employeeType];
  const uniqueRoles = [...new Set(rawRoles.filter((role) => ['team', 'subAdmin', 'admin'].includes(role)))];
  const normalizedRoles = ['team'];

  if (uniqueRoles.includes('admin')) {
    normalizedRoles.push('admin');
    return normalizedRoles;
  }

  if (uniqueRoles.includes('subAdmin')) {
    normalizedRoles.push('subAdmin');
  }

  return normalizedRoles;
};

const routeToSection = {
  '/dashboard': 'overview',
  '/dashboard/profile': 'profile',
  '/dashboard/attendance': 'attendance',
  '/dashboard/leave': 'leave',
  '/dashboard/tasks': 'tasks',
  '/dashboard/team': 'teamDirectory',
  '/dashboard/documents': 'documents',
  '/dashboard/announcements': 'announcements',
  '/dashboard/support': 'support',
  '/dashboard/manage-team': 'teamManagement',
  '/dashboard/reports': 'reports',
  '/dashboard/settings': 'settings'
};

const ProfileSection = lazy(() => import('./sections/ProfileSection'));
const TeamSection = lazy(() => import('./sections/TeamSection'));
const ReportsSection = lazy(() => import('./sections/ReportsSection'));
const SettingsSection = lazy(() => import('./sections/SettingsSection'));
const UserOverviewSection = lazy(() => import('./sections/UserOverviewSection'));
const EmployeeOverviewSection = lazy(() => import('./sections/EmployeeOverviewSection'));
const EmployeeAttendanceSection = lazy(() => import('./sections/EmployeeAttendanceSection'));
const EmployeeLeaveSection = lazy(() => import('./sections/EmployeeLeaveSection'));
const EmployeeTasksSection = lazy(() => import('./sections/EmployeeTasksSection'));
const TeamDirectorySection = lazy(() => import('./sections/TeamDirectorySection'));
const EmployeeDocumentsSection = lazy(() => import('./sections/EmployeeDocumentsSection'));
const EmployeeAnnouncementsSection = lazy(() => import('./sections/EmployeeAnnouncementsSection'));
const EmployeeSupportSection = lazy(() => import('./sections/EmployeeSupportSection'));

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleColorMode } = useThemeMode();
  const name = localStorage.getItem('name') || 'User';
  const userId = localStorage.getItem('userId') || 'N/A';
  const loginAs = localStorage.getItem('loginAs') || 'user';
  const sessionExpiry = Number(localStorage.getItem('sessionExpiry'));
  const hasSessionLimit = loginAs === 'user';
  const activeSection = routeToSection[location.pathname] || 'overview';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [profileImage, setProfileImage] = useState(localStorage.getItem('profileImage') || '');
  const [employeeLastActivityAt, setEmployeeLastActivityAt] = useState(getEmployeeLastActivity());
  const [profileDetails, setProfileDetails] = useState({
    name,
    userId,
    loginAs,
    phoneNo: '',
    gender: 'other',
    address: '',
    status: 'Not Active',
    dateOfJoining: null,
    department: '',
    position: '',
    employeeType: [],
    dateOfExit: null,
    education: [],
    documents: [],
    userCategory: '',
    noOfBookings: 0
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { toast, showToast, closeToast } = useToast();
  const fileInputRef = useRef(null);
  const lastPathRef = useRef(location.pathname);
  const [employees, setEmployees] = useState([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false);
  const [isEmployeeSaving, setIsEmployeeSaving] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState('');
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    gender: 'other',
    dateOfBirth: '',
    employeeType: ['team'],
    recruitedVia: 'self',
    referralByName: '',
    referralByEmployeeId: '',
    experience: '',
    position: '',
    phoneNo: '',
    address: '',
    aadhaarNumber: '',
    educationEntries: [createEducationEntry()],
    department: '',
    status: 'Not Active',
    dateOfJoining: '',
    dateOfExit: ''
  });

  const currentEmployeeRole = getPrimaryEmployeeRole(profileDetails.employeeType);
  const isEmployee = profileDetails.loginAs === 'employee' || loginAs === 'employee';
  const isAdminEmployee = isEmployee && currentEmployeeRole === 'admin';
  const isSubAdminEmployee = isEmployee && currentEmployeeRole === 'subAdmin';
  const isElevatedEmployee = isAdminEmployee || isSubAdminEmployee;

  useEffect(() => {
    if (loginAs === 'user') {
      navigate('/user-portal', { replace: true });
    }
  }, [loginAs, navigate]);

  const navItems = useMemo(() => {
    if (isAdminEmployee) {
      return [
        { key: 'overview', label: 'Overview', icon: <DashboardRoundedIcon />, route: '/dashboard' },
        { key: 'profile', label: 'Profile', icon: <PersonRoundedIcon />, route: '/dashboard/profile' },
        { key: 'attendance', label: 'Attendance', icon: <AccessTimeRoundedIcon />, route: '/dashboard/attendance' },
        { key: 'leave', label: 'Leave', icon: <EventAvailableRoundedIcon />, route: '/dashboard/leave' },
        { key: 'tasks', label: 'Tasks', icon: <TaskAltRoundedIcon />, route: '/dashboard/tasks' },
        { key: 'teamDirectory', label: 'Team Directory', icon: <GroupsRoundedIcon />, route: '/dashboard/team' },
        { key: 'documents', label: 'Documents', icon: <DescriptionRoundedIcon />, route: '/dashboard/documents' },
        { key: 'announcements', label: 'Announcements', icon: <CampaignRoundedIcon />, route: '/dashboard/announcements' },
        { key: 'support', label: 'Support', icon: <SupportAgentRoundedIcon />, route: '/dashboard/support' },
        { key: 'teamManagement', label: 'Employee Management', icon: <BadgeRoundedIcon />, route: '/dashboard/manage-team' },
        { key: 'allUsers', label: 'All User Data', icon: <TableChartRoundedIcon />, route: '/all-users' },
        { key: 'allEmployees', label: 'All Employee Data', icon: <GroupsRoundedIcon />, route: '/all-employees' },
        { key: 'reports', label: 'Reports', icon: <InsightsRoundedIcon />, route: '/dashboard/reports' },
        { key: 'settings', label: 'Settings', icon: <SettingsRoundedIcon />, route: '/dashboard/settings' }
      ];
    }

    if (isSubAdminEmployee) {
      return [
        { key: 'overview', label: 'Overview', icon: <DashboardRoundedIcon />, route: '/dashboard' },
        { key: 'profile', label: 'Profile', icon: <PersonRoundedIcon />, route: '/dashboard/profile' },
        { key: 'attendance', label: 'Attendance', icon: <AccessTimeRoundedIcon />, route: '/dashboard/attendance' },
        { key: 'leave', label: 'Leave', icon: <EventAvailableRoundedIcon />, route: '/dashboard/leave' },
        { key: 'tasks', label: 'Tasks', icon: <TaskAltRoundedIcon />, route: '/dashboard/tasks' },
        { key: 'teamDirectory', label: 'Team Directory', icon: <GroupsRoundedIcon />, route: '/dashboard/team' },
        { key: 'documents', label: 'Documents', icon: <DescriptionRoundedIcon />, route: '/dashboard/documents' },
        { key: 'announcements', label: 'Announcements', icon: <CampaignRoundedIcon />, route: '/dashboard/announcements' },
        { key: 'support', label: 'Support', icon: <SupportAgentRoundedIcon />, route: '/dashboard/support' },
        { key: 'teamManagement', label: 'Employee Management', icon: <BadgeRoundedIcon />, route: '/dashboard/manage-team' },
        { key: 'allEmployees', label: 'All Employee Data', icon: <GroupsRoundedIcon />, route: '/all-employees' },
        { key: 'settings', label: 'Settings', icon: <SettingsRoundedIcon />, route: '/dashboard/settings' }
      ];
    }

    if (isEmployee) {
      return [
        { key: 'overview', label: 'Overview', icon: <DashboardRoundedIcon />, route: '/dashboard' },
        { key: 'profile', label: 'Profile', icon: <PersonRoundedIcon />, route: '/dashboard/profile' },
        { key: 'attendance', label: 'Attendance', icon: <AccessTimeRoundedIcon />, route: '/dashboard/attendance' },
        { key: 'leave', label: 'Leave', icon: <EventAvailableRoundedIcon />, route: '/dashboard/leave' },
        { key: 'tasks', label: 'Tasks', icon: <TaskAltRoundedIcon />, route: '/dashboard/tasks' },
        { key: 'teamDirectory', label: 'Team Directory', icon: <GroupsRoundedIcon />, route: '/dashboard/team' },
        { key: 'documents', label: 'Documents', icon: <DescriptionRoundedIcon />, route: '/dashboard/documents' },
        { key: 'announcements', label: 'Announcements', icon: <CampaignRoundedIcon />, route: '/dashboard/announcements' },
        { key: 'support', label: 'Support', icon: <SupportAgentRoundedIcon />, route: '/dashboard/support' },
        { key: 'settings', label: 'Settings', icon: <SettingsRoundedIcon />, route: '/dashboard/settings' }
      ];
    }

    return [
      { key: 'overview', label: 'Overview', icon: <DashboardRoundedIcon />, route: '/dashboard' },
      { key: 'profile', label: 'Profile', icon: <PersonRoundedIcon />, route: '/dashboard/profile' },
      { key: 'tasks', label: 'Tasks', icon: <TaskAltRoundedIcon />, route: '/dashboard/tasks' },
      { key: 'settings', label: 'Settings', icon: <SettingsRoundedIcon />, route: '/dashboard/settings' }
    ];
  }, [isAdminEmployee, isSubAdminEmployee, isEmployee]);

  const sessionMinutesLeft = useMemo(() => {
    if (!hasSessionLimit) return 0;
    if (!sessionExpiry || Number.isNaN(sessionExpiry)) return 0;
    return Math.max(0, Math.floor((sessionExpiry - now) / 60000));
  }, [hasSessionLimit, sessionExpiry, now]);

  const sessionTimeLeft = useMemo(() => {
    if (!hasSessionLimit) return '';
    if (!sessionExpiry || Number.isNaN(sessionExpiry)) return '00:00';
    const totalSecondsLeft = Math.max(0, Math.floor((sessionExpiry - now) / 1000));
    const minutes = String(Math.floor(totalSecondsLeft / 60)).padStart(2, '0');
    const seconds = String(totalSecondsLeft % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [hasSessionLimit, sessionExpiry, now]);

  const sessionSecondsLeft = useMemo(() => {
    if (!hasSessionLimit) return 0;
    if (!sessionExpiry || Number.isNaN(sessionExpiry)) return 0;
    return Math.max(0, Math.floor((sessionExpiry - now) / 1000));
  }, [hasSessionLimit, sessionExpiry, now]);

  const employeeIdleRemainingMs = useMemo(() => {
    if (!isEmployee) return 0;
    return getEmployeeIdleRemainingMs(now);
  }, [isEmployee, now]);

  const employeeIdleTimeLeft = useMemo(() => {
    if (!isEmployee) return '';
    return formatCountdown(employeeIdleRemainingMs);
  }, [isEmployee, employeeIdleRemainingMs]);

  const employeeIdleMinutesLeft = useMemo(() => {
    if (!isEmployee) return 0;
    return Math.max(0, Math.ceil(employeeIdleRemainingMs / 60000));
  }, [isEmployee, employeeIdleRemainingMs]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const markUserNotActive = useCallback(async () => {
    if (!userId || userId === 'N/A') return;
    try {
      await API.post('/logoutUser', { userId });
    } catch (error) {
      // Non-blocking: local logout should proceed regardless.
    }
  }, [userId]);

  const clearStoredSession = useCallback(() => {
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionExpiry');
    localStorage.removeItem('profileImage');
    localStorage.removeItem('loginAs');
    clearEmployeeActivity();
  }, []);

  const recordEmployeeActivity = useCallback(() => {
    if (!isEmployee) return;
    const timestamp = refreshEmployeeActivity();
    if (timestamp) {
      setEmployeeLastActivityAt(timestamp);
    }
  }, [isEmployee]);

  useEffect(() => {
    if (!isEmployee) return;
    if (!employeeLastActivityAt) {
      recordEmployeeActivity();
    }
  }, [isEmployee, employeeLastActivityAt, recordEmployeeActivity]);

  useEffect(() => {
    if (!isEmployee) return;

    if (lastPathRef.current !== location.pathname) {
      lastPathRef.current = location.pathname;
      recordEmployeeActivity();
    }
  }, [location.pathname, isEmployee, recordEmployeeActivity]);

  useEffect(() => {
    if (!name) {
      navigate('/');
      return;
    }

    if (hasSessionLimit && (!sessionExpiry || now > sessionExpiry)) {
      markUserNotActive();
      clearStoredSession();
      navigate('/');
      return;
    }

    if (isEmployee && employeeLastActivityAt && hasEmployeeActivityExpired()) {
      markUserNotActive();
      clearStoredSession();
      navigate('/');
    }
  }, [name, hasSessionLimit, sessionExpiry, now, navigate, markUserNotActive, clearStoredSession, isEmployee, employeeLastActivityAt]);

  const fetchProfile = useCallback(async () => {
    if (!userId || userId === 'N/A') return;

    try {
      const res = await API.get(`/user/${userId}`);
      const profile = res.data?.user || {};
      const image = profile.profileImage || '';
      setProfileImage(image);
      localStorage.setItem('profileImage', image);
      setProfileDetails({
        name: profile.name || name,
        userId: profile.userId || userId,
        loginAs: profile.loginAs || loginAs,
        phoneNo: profile.phoneNo || '',
        gender: profile.gender || 'other',
        address: profile.address || '',
        status: profile.status || 'Not Active',
        dateOfJoining: profile.dateOfJoining || null,
        department: profile.department || '',
        position: profile.position || '',
        employeeType: profile.employeeType || [],
        dateOfExit: profile.dateOfExit || null,
        education: profile.education || [],
        documents: profile.documents || [],
        userCategory: profile.userCategory || '',
        noOfBookings: profile.noOfBookings || 0
      });
    } catch (error) {
      // Silent failure: profile image is non-critical for dashboard load
    }
  }, [userId, name, loginAs]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await markUserNotActive();
    clearStoredSession();
    showToast('You have been logged out.', 'info');
    navigate('/');
  };

  const handleSectionChange = (sectionKey) => {
    const selectedNav = navItems.find((item) => item.key === sectionKey);
    setMobileOpen(false);

    if (selectedNav?.route) {
      recordEmployeeActivity();
      navigate(selectedNav.route);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId || userId === 'N/A') {
      showToast('Unable to identify user account.', 'error');
      return;
    }

    try {
      setIsDeletingAccount(true);
      await API.delete(`/deleteUser/${userId}`);
      clearStoredSession();
      navigate('/');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete account.', 'error');
    } finally {
      setIsDeletingAccount(false);
      setDeleteDialogOpen(false);
    }
  };

  const fetchEmployees = useCallback(async () => {
    try {
      setIsEmployeesLoading(true);
      const res = await API.get('/teams');
      setEmployees(res.data?.users || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch employees.', 'error');
    } finally {
      setIsEmployeesLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeSection !== 'teamManagement') return;
    fetchEmployees();
  }, [activeSection, fetchEmployees]);

  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: '',
      gender: 'other',
      dateOfBirth: '',
      employeeType: ['team'],
      recruitedVia: 'self',
      referralByName: '',
      referralByEmployeeId: '',
      experience: '',
      position: '',
      phoneNo: '',
      address: '',
      aadhaarNumber: '',
      educationEntries: [createEducationEntry()],
      department: '',
      status: 'Not Active',
      dateOfJoining: '',
      dateOfExit: ''
    });
    setEditingEmployeeId('');
  };

  const handleEmployeeInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const normalizedValue =
      name === 'employeeType' ? normalizeEmployeeTypes(value) : value;
    setEmployeeForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : normalizedValue,
      ...(name === 'status' && normalizedValue === 'Active' ? { dateOfExit: '' } : {})
    }));
  };

  const handleEducationEntryChange = (entryId, field, value) => {
    setEmployeeForm((prev) => ({
      ...prev,
      educationEntries: prev.educationEntries.map((entry) => {
        if (entry.id !== entryId) return entry;

        if (field === 'educationType') {
          return normalizeEducationEntry({
            ...entry,
            educationType: value,
            currentlyPursuing: false,
            toDate: '',
            certificate: '',
            certificateName: ''
          });
        }

        if (field === 'eduDepartment') {
          return {
            ...entry,
            eduDepartment: value,
            courseName: ''
          };
        }

        if (field === 'currentlyPursuing') {
          return {
            ...entry,
            currentlyPursuing: Boolean(value),
            toDate: value ? '' : entry.toDate,
            certificate: value ? '' : entry.certificate,
            certificateName: value ? '' : entry.certificateName
          };
        }

        return {
          ...entry,
          [field]: value
        };
      })
    }));
  };

  const addEducationEntry = () => {
    setEmployeeForm((prev) => ({
      ...prev,
      educationEntries: [...prev.educationEntries, createEducationEntry()]
    }));
  };

  const removeEducationEntry = (entryId) => {
    setEmployeeForm((prev) => {
      if (prev.educationEntries.length === 1) return prev;
      return {
        ...prev,
        educationEntries: prev.educationEntries.filter((entry) => entry.id !== entryId)
      };
    });
  };

  const handleEducationCertificateUpload = async (entryId, file) => {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Education certificate must be 2MB or smaller.', 'warning');
      return;
    }

    try {
      const certificate = await fileToBase64(file);
      setEmployeeForm((prev) => ({
        ...prev,
        educationEntries: prev.educationEntries.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                certificate,
                certificateName: file.name
              }
            : entry
        )
      }));
    } catch (error) {
      showToast('Failed to read education certificate.', 'error');
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployeeId(employee.employeeId);
    setEmployeeForm({
      name: employee.name || '',
      gender: employee.gender || 'other',
      dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
      employeeType: normalizeEmployeeTypes(employee.employeeType),
      recruitedVia: employee.recruitedVia || 'self',
      referralByName: employee.referralBy?.name || '',
      referralByEmployeeId: employee.referralBy?.employeeId || '',
      experience: employee.experience || '',
      position: employee.position || '',
      phoneNo: employee.phoneNo || '',
      address: employee.address || '',
      aadhaarNumber: employee.aadhaarNumber || '',
      educationEntries:
        Array.isArray(employee.education) && employee.education.length > 0
          ? employee.education.map((entry) => normalizeEducationEntry(entry))
          : [createEducationEntry()],
      department: employee.department || '',
      status: employee.status || 'Not Active',
      dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toISOString().split('T')[0] : '',
      dateOfExit: employee.dateOfExit ? new Date(employee.dateOfExit).toISOString().split('T')[0] : ''
    });
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();

    const education = employeeForm.educationEntries.map((entry) => ({
      educationType: entry.educationType,
      collegeName: entry.educationType === 'college' ? entry.collegeName.trim() : '',
      eduDepartment: entry.educationType === 'college' ? entry.eduDepartment : '',
      courseName: entry.educationType === 'college' ? entry.courseName : '',
      fromDate: entry.fromDate || '',
      currentlyPursuing: entry.educationType === 'college' ? Boolean(entry.currentlyPursuing) : false,
      toDate:
        entry.educationType === 'school'
          ? entry.toDate || ''
          : entry.currentlyPursuing
            ? ''
            : (entry.toDate || ''),
      certificate:
        entry.educationType === 'school' || !entry.currentlyPursuing
          ? (entry.certificate || '')
          : '',
      certificateName:
        entry.educationType === 'school' || !entry.currentlyPursuing
          ? (entry.certificateName || '')
          : '',
      schoolName: entry.educationType === 'school' ? entry.schoolName.trim() : '',
      schoolAddress: entry.educationType === 'school' ? entry.schoolAddress.trim() : '',
      schoolClass: entry.educationType === 'school' ? entry.schoolClass : '',
      boardName: entry.educationType === 'school' ? entry.boardName : ''
    }));

    if (education.length === 0) {
      showToast('At least one education entry is required.', 'warning');
      return;
    }

    for (const entry of education) {
      if (!entry.fromDate) {
        showToast('Education from date is required.', 'warning');
        return;
      }

      if (entry.educationType === 'college') {
        if (!entry.collegeName || !entry.eduDepartment || !entry.courseName) {
          showToast('Please complete all required college education fields.', 'warning');
          return;
        }
        if (!entry.currentlyPursuing && (!entry.toDate || !entry.certificate)) {
          showToast('Completed college education requires to date and certificate.', 'warning');
          return;
        }
      }

      if (entry.educationType === 'school') {
        if (!entry.schoolName || !entry.schoolAddress || !entry.schoolClass || !entry.boardName || !entry.toDate || !entry.certificate) {
          showToast('Please complete all required school education fields.', 'warning');
          return;
        }
      }
    }

    const payload = {
      ...employeeForm,
      name: employeeForm.name.trim(),
      position: employeeForm.position,
      phoneNo: employeeForm.phoneNo.trim(),
      dateOfBirth: employeeForm.dateOfBirth,
      address: employeeForm.address.trim(),
      aadhaarNumber: employeeForm.aadhaarNumber.trim(),
      employeeType: employeeForm.employeeType,
      actingEmployeeId: userId,
      department: employeeForm.department,
      education,
      referralBy:
        employeeForm.recruitedVia === 'referral'
          ? { name: employeeForm.referralByName.trim(), employeeId: employeeForm.referralByEmployeeId.trim() }
          : { name: '', employeeId: '' },
      dateOfJoining: employeeForm.dateOfJoining,
      dateOfExit: employeeForm.status === 'Active' ? null : (employeeForm.dateOfExit || null)
    };

    if (!payload.name || !payload.position || !payload.phoneNo || !payload.address || !payload.aadhaarNumber || !payload.department || !payload.dateOfJoining) {
      showToast('Please fill all required employee fields.', 'warning');
      return;
    }

    if (!/^\d{10}$/.test(payload.phoneNo)) {
      showToast('Phone number must be 10 digits.', 'warning');
      return;
    }

    if (!/^\d{12}$/.test(payload.aadhaarNumber)) {
      showToast('Aadhaar number must be 12 digits.', 'warning');
      return;
    }

    try {
      setIsEmployeeSaving(true);
      if (editingEmployeeId) {
        await API.put(`/teams/${editingEmployeeId}`, payload);
        showToast('Employee updated successfully.', 'success');
      } else {
        await API.post('/teams', payload);
        showToast('Employee created successfully.', 'success');
      }
      resetEmployeeForm();
      fetchEmployees();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save employee.', 'error');
    } finally {
      setIsEmployeeSaving(false);
    }
  };

  const handleChooseProfileImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'warning');
      return;
    }

    // 2MB max to keep payload size controlled in DB
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be 2MB or smaller.', 'warning');
      return;
    }

    try {
      setIsUploadingImage(true);
      const base64Image = await fileToBase64(file);
      await API.post('/updateProfileImage', {
        userId,
        profileImage: base64Image
      });
      setProfileImage(base64Image);
      localStorage.setItem('profileImage', base64Image);
      showToast('Profile picture updated successfully.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update profile picture.', 'error');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const sidebarContent = (
    <DashboardSidebar
      navItems={navItems}
      activeSection={activeSection}
      desktopCollapsed={desktopCollapsed}
      onSectionChange={handleSectionChange}
      hasSessionLimit={hasSessionLimit}
      sessionTimeLeft={sessionTimeLeft}
      sessionMinutesLeft={sessionMinutesLeft}
      sessionSecondsLeft={sessionSecondsLeft}
      isEmployee={isEmployee}
      employeeIdleTimeLeft={employeeIdleTimeLeft}
      employeeIdleMinutesLeft={employeeIdleMinutesLeft}
      employeeIdleRemainingMs={employeeIdleRemainingMs}
    />
  );

  const sectionRenderer = {
    overview: isEmployee ? (
      <EmployeeOverviewSection employeeId={userId} showToast={showToast} />
    ) : (
      <UserOverviewSection profileDetails={profileDetails} />
    ),
    profile: (
      <ProfileSection
        profileImage={profileImage}
        name={profileDetails.name}
        userId={profileDetails.userId}
        loginAs={profileDetails.loginAs}
        phoneNo={profileDetails.phoneNo}
        gender={profileDetails.gender}
        address={profileDetails.address}
        status={profileDetails.status}
        dateOfJoining={profileDetails.dateOfJoining}
        department={profileDetails.department}
        position={profileDetails.position}
        dateOfExit={profileDetails.dateOfExit}
        userCategory={profileDetails.userCategory}
        noOfBookings={profileDetails.noOfBookings}
        documents={profileDetails.documents}
        education={profileDetails.education}
        fileInputRef={fileInputRef}
        handleProfileImageUpload={handleProfileImageUpload}
        handleChooseProfileImage={handleChooseProfileImage}
        isUploadingImage={isUploadingImage}
      />
    ),
    attendance: isEmployee ? (
      <EmployeeAttendanceSection employeeId={userId} showToast={showToast} />
    ) : null,
    leave: isEmployee ? (
      <EmployeeLeaveSection employeeId={userId} showToast={showToast} />
    ) : null,
    tasks: <EmployeeTasksSection userId={userId} />,
    teamDirectory: isEmployee ? (
      <TeamDirectorySection currentEmployeeId={userId} showToast={showToast} />
    ) : null,
    documents: isEmployee ? (
      <EmployeeDocumentsSection
        employeeId={userId}
        documents={profileDetails.documents}
        onDocumentsUpdated={(documents) => setProfileDetails((prev) => ({ ...prev, documents }))}
        showToast={showToast}
      />
    ) : null,
    announcements: isEmployee ? <EmployeeAnnouncementsSection showToast={showToast} /> : null,
    support: isEmployee ? <EmployeeSupportSection employeeId={userId} showToast={showToast} /> : null,
    teamManagement: isElevatedEmployee ? (
      <TeamSection
        editingEmployeeId={editingEmployeeId}
        handleSaveEmployee={handleSaveEmployee}
        employeeForm={employeeForm}
        handleEmployeeInputChange={handleEmployeeInputChange}
        handleEducationEntryChange={handleEducationEntryChange}
        addEducationEntry={addEducationEntry}
        removeEducationEntry={removeEducationEntry}
        handleEducationCertificateUpload={handleEducationCertificateUpload}
        isEmployeeSaving={isEmployeeSaving}
        resetEmployeeForm={resetEmployeeForm}
        isEmployeesLoading={isEmployeesLoading}
        employees={employees}
        handleEditEmployee={handleEditEmployee}
        currentEmployeeRole={currentEmployeeRole}
        canEditEmployee={(employee) => getPrimaryEmployeeRole(employee.employeeType) !== 'admin'}
        collegeDepartments={COLLEGE_DEPARTMENTS}
        schoolClasses={SCHOOL_CLASSES}
        schoolBoards={SCHOOL_BOARDS}
      />
    ) : null,
    reports: isAdminEmployee ? <ReportsSection /> : null,
    settings: (
      <SettingsSection
        mode={mode}
        toggleColorMode={toggleColorMode}
        setLogoutDialogOpen={setLogoutDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        canDeleteAccount={!isEmployee}
      />
    )
  };

  const ActiveComponent = sectionRenderer[activeSection] || sectionRenderer.overview;
  const activeLabel = navItems.find((item) => item.key === activeSection)?.label || 'Overview';

  if (loginAs === 'user') {
    return null;
  }

  return (
    <>
      <DashboardLayout
        background={(theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(140deg, #0d1220 0%, #151d34 100%)'
            : 'linear-gradient(140deg, #eef3ff 0%, #f8fbff 100%)'
        }
        headerProps={{
          activeLabel,
          desktopCollapsed,
          drawerWidth,
          collapsedDrawerWidth,
          loginAs,
          name,
          onToggleMobile: () => setMobileOpen((prev) => !prev),
          onToggleDesktop: () => setDesktopCollapsed((prev) => !prev),
          onLogout: () => setLogoutDialogOpen(true)
        }}
        drawerProps={{
          mobileOpen,
          onMobileClose: () => setMobileOpen(false),
          desktopCollapsed,
          drawerWidth,
          collapsedDrawerWidth
        }}
        sidebarContent={sidebarContent}
      >
        <Suspense fallback={<PageLoader message="Loading section..." minHeight={320} />}>
          {ActiveComponent}
        </Suspense>
      </DashboardLayout>
      <ConfirmDialog
        open={logoutDialogOpen}
        title="Confirm Logout"
        description="Do you want to logout from your current session?"
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogout}
        confirmLabel="Logout"
        confirmColor="error"
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Account"
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        confirmLabel={isDeletingAccount ? 'Deleting...' : 'Delete'}
        confirmColor="error"
        confirmDisabled={isDeletingAccount}
        cancelDisabled={isDeletingAccount}
      >
        <Typography color="error" fontWeight={700} sx={{ mb: 1 }}>
          This action cannot be undone.
        </Typography>
        <Typography>
          Are you sure you want to permanently delete your account?
        </Typography>
      </ConfirmDialog>

      <AppToast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={closeToast}
      />
    </>
  );
}

export default Dashboard;

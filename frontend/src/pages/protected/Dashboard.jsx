import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControlLabel,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Typography
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { useThemeMode } from '../../context/ThemeModeContext';
import API from '../../api/api';

const drawerWidth = 280;
const collapsedDrawerWidth = 84;

const navItems = [
  { key: 'overview', label: 'Overview', icon: <DashboardRoundedIcon />, route: '/dashboard' },
  { key: 'profile', label: 'Profile', icon: <PersonRoundedIcon />, route: '/profile' },
  { key: 'team', label: 'Team', icon: <GroupsRoundedIcon />, route: '/team' },
  { key: 'tasks', label: 'Tasks', icon: <TaskAltRoundedIcon />, route: '/tasks' },
  { key: 'reports', label: 'Reports', icon: <InsightsRoundedIcon />, route: '/reports' },
  { key: 'allUsers', label: 'All User Data', icon: <TableChartRoundedIcon />, route: '/all-users' },
  { key: 'allEmployees', label: 'All Employee Data', icon: <GroupsRoundedIcon />, route: '/all-employees' },
  { key: 'settings', label: 'Settings', icon: <SettingsRoundedIcon />, route: '/settings' }
];

function Dashboard({ initialSection = 'overview' }) {
  const navigate = useNavigate();
  const { mode, toggleColorMode } = useThemeMode();
  const name = localStorage.getItem('name') || 'User';
  const userId = localStorage.getItem('userId') || 'N/A';
  const loginAs = localStorage.getItem('loginAs') || 'user';
  const sessionExpiry = Number(localStorage.getItem('sessionExpiry'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [profileImage, setProfileImage] = useState(localStorage.getItem('profileImage') || '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const fileInputRef = useRef(null);
  const [taskList, setTaskList] = useState([
    { id: 1, title: 'Approve onboarding docs', done: false },
    { id: 2, title: 'Review pending attendance alerts', done: true },
    { id: 3, title: 'Publish weekly HR update', done: false }
  ]);
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
    educationText: '',
    department: '',
    status: 'Not Active',
    dateOfJoining: '',
    dateOfExit: ''
  });

  const sessionMinutesLeft = useMemo(() => {
    if (!sessionExpiry || Number.isNaN(sessionExpiry)) return 0;
    return Math.max(0, Math.floor((sessionExpiry - now) / 60000));
  }, [sessionExpiry, now]);

  const sessionTimeLeft = useMemo(() => {
    if (!sessionExpiry || Number.isNaN(sessionExpiry)) return '00:00';
    const totalSecondsLeft = Math.max(0, Math.floor((sessionExpiry - now) / 1000));
    const minutes = String(Math.floor(totalSecondsLeft / 60)).padStart(2, '0');
    const seconds = String(totalSecondsLeft % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [sessionExpiry, now]);

  const sessionSecondsLeft = useMemo(() => {
    if (!sessionExpiry || Number.isNaN(sessionExpiry)) return 0;
    return Math.max(0, Math.floor((sessionExpiry - now) / 1000));
  }, [sessionExpiry, now]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const markUserNotActive = useCallback(async () => {
    if (!userId || userId === 'N/A') return;
    try {
      await API.post('/logoutUser', { userId });
    } catch (error) {
      // Non-blocking: local logout should proceed regardless.
    }
  }, [userId]);

  useEffect(() => {
    if (!name || !sessionExpiry || now > sessionExpiry) {
      markUserNotActive();
      localStorage.removeItem('name');
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionExpiry');
      localStorage.removeItem('profileImage');
      localStorage.removeItem('loginAs');
      navigate('/');
    }
  }, [name, sessionExpiry, now, navigate, markUserNotActive]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId || userId === 'N/A') return;
      try {
        const res = await API.get(`/user/${userId}`);
        const image = res.data?.user?.profileImage || '';
        setProfileImage(image);
        localStorage.setItem('profileImage', image);
      } catch (error) {
        // Silent failure: profile image is non-critical for dashboard load
      }
    };

    fetchProfile();
  }, [userId]);

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity });
  }, []);

  const closeToast = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleLogout = async () => {
    await markUserNotActive();
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionExpiry');
    localStorage.removeItem('profileImage');
    localStorage.removeItem('loginAs');
    showToast('You have been logged out.', 'info');
    navigate('/');
  };

  const handleSectionChange = (sectionKey) => {
    const selectedNav = navItems.find((item) => item.key === sectionKey);
    const hasInPageSection = ['overview', 'profile', 'team', 'tasks', 'reports', 'settings'].includes(sectionKey);

    if (hasInPageSection) {
      setActiveSection(sectionKey);
    }
    setMobileOpen(false);

    if (selectedNav?.route) {
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
      localStorage.removeItem('name');
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionExpiry');
      localStorage.removeItem('profileImage');
      localStorage.removeItem('loginAs');
      navigate('/');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete account.', 'error');
    } finally {
      setIsDeletingAccount(false);
      setDeleteDialogOpen(false);
    }
  };

  const toggleTaskStatus = (taskId) => {
    setTaskList((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task))
    );
  };

  const fetchEmployees = useCallback(async () => {
    try {
      setIsEmployeesLoading(true);
      const res = await API.get('/teams', { params: { employeeType: 'team' } });
      const teamUsers = (res.data?.users || []).filter(
        (user) => Array.isArray(user.employeeType) && user.employeeType.includes('team')
      );
      setEmployees(teamUsers);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch employees.', 'error');
    } finally {
      setIsEmployeesLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeSection !== 'team') return;
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
      educationText: '',
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
      name === 'employeeType' ? (Array.isArray(value) ? value : String(value).split(',')) : value;
    setEmployeeForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : normalizedValue,
      ...(name === 'status' && normalizedValue === 'Active' ? { dateOfExit: '' } : {})
    }));
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployeeId(employee.employeeId);
    setEmployeeForm({
      name: employee.name || '',
      gender: employee.gender || 'other',
      dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
      employeeType: Array.isArray(employee.employeeType) && employee.employeeType.length > 0 ? employee.employeeType : ['team'],
      recruitedVia: employee.recruitedVia || 'self',
      referralByName: employee.referralBy?.name || '',
      referralByEmployeeId: employee.referralBy?.employeeId || '',
      experience: employee.experience || '',
      position: employee.position || '',
      phoneNo: employee.phoneNo || '',
      address: employee.address || '',
      aadhaarNumber: employee.aadhaarNumber || '',
      educationText: Array.isArray(employee.education) && employee.education.length > 0 ? JSON.stringify(employee.education) : '',
      department: employee.department || '',
      status: employee.status || 'Not Active',
      dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toISOString().split('T')[0] : '',
      dateOfExit: employee.dateOfExit ? new Date(employee.dateOfExit).toISOString().split('T')[0] : ''
    });
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();

    let education = [];
    if (employeeForm.educationText.trim()) {
      try {
        const parsed = JSON.parse(employeeForm.educationText);
        education = Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        showToast('Education must be valid JSON array.', 'warning');
        return;
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

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: desktopCollapsed ? 2 : 3, pb: 2 }}>
        {desktopCollapsed ? (
          <Typography variant="h5" fontWeight={800} textAlign="center">
            H
          </Typography>
        ) : (
          <Typography variant="h5" fontWeight={800}>
            HRMS
          </Typography>
        )}
      </Box>
      <Divider />
      <List sx={{ px: 1.5, py: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.key}
            selected={activeSection === item.key}
            onClick={() => handleSectionChange(item.key)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              justifyContent: desktopCollapsed ? 'center' : 'flex-start',
              px: desktopCollapsed ? 1 : 2
            }}
          >
            <ListItemIcon sx={{ minWidth: desktopCollapsed ? 0 : 38, mr: desktopCollapsed ? 0 : 1 }}>
              {item.icon}
            </ListItemIcon>
            {!desktopCollapsed && <ListItemText primary={item.label} />}
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ mt: 'auto', p: desktopCollapsed ? 1.5 : 2 }}>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderWidth: 2,
            borderColor: (theme) => {
              if (sessionSecondsLeft <= 60) return theme.palette.error.main;
              if (sessionSecondsLeft <= 300) return theme.palette.warning.main;
              return theme.palette.divider;
            }
          }}
        >
          <CardContent
            sx={{
              p: desktopCollapsed ? 1 : 2,
              '&:last-child': { pb: desktopCollapsed ? 1 : 2 }
            }}
          >
            {!desktopCollapsed && (
              <Typography variant="body2" color="text.secondary">
                Session left
              </Typography>
            )}
            <Typography
              variant={desktopCollapsed ? 'body2' : 'h6'}
              fontWeight={700}
              sx={{
                textAlign: 'center',
                fontFamily: 'monospace',
                letterSpacing: desktopCollapsed ? 0.5 : 0,
                lineHeight: 1.2
              }}
            >
              {sessionTimeLeft}
            </Typography>
            {!desktopCollapsed && (
              <Typography variant="caption" color="text.secondary">
                {sessionMinutesLeft} min remaining
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  const renderOverview = () => (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">Total Employees</Typography>
            <Typography variant="h5" fontWeight={800}>126</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">Present Today</Typography>
            <Typography variant="h5" fontWeight={800}>112</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">Open Requests</Typography>
            <Typography variant="h5" fontWeight={800}>14</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography color="text.secondary" variant="body2">Pending Approvals</Typography>
            <Typography variant="h5" fontWeight={800}>8</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card sx={{ borderRadius: 3, minHeight: 250 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Weekly Activity</Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
                <Card key={day} variant="outlined" sx={{ p: 1.5, borderRadius: 2, minWidth: 82 }}>
                  <Typography variant="body2" color="text.secondary">{day}</Typography>
                  <Typography variant="h6" fontWeight={700}>{70 + idx * 6}%</Typography>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ borderRadius: 3, minHeight: 250 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Announcements</Typography>
            <Stack spacing={1.2}>
              <Chip label="Payroll closes on 28th" color="primary" />
              <Chip label="Policy update published" color="secondary" />
              <Chip label="Townhall at 4:00 PM" />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderProfile = () => (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={1.5} alignItems="center">
              <Avatar src={profileImage} sx={{ width: 82, height: 82 }}>
                {name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{name}</Typography>
              <Typography variant="body2" color="text.secondary">User ID: {userId}</Typography>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleProfileImageUpload}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleChooseProfileImage}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? 'Uploading...' : 'Upload Profile Picture'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Account Details</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Display Name" value={name} fullWidth disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Employee ID" value={userId} fullWidth disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Department" value="Human Resources" fullWidth disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Role" value="Manager" fullWidth disabled />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTeam = () => (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {editingEmployeeId ? 'Update Employee' : 'Create Employee'}
            </Typography>
            <Box component="form" onSubmit={handleSaveEmployee}>
              <Stack spacing={2}>
                <TextField label="Name" name="name" value={employeeForm.name} onChange={handleEmployeeInputChange} required fullWidth />
                <FormControl fullWidth required>
                  <InputLabel id="position-label">Position</InputLabel>
                  <Select
                    labelId="position-label"
                    name="position"
                    value={employeeForm.position}
                    label="Position"
                    onChange={handleEmployeeInputChange}
                  >
                    <MenuItem value="Manager">Manager</MenuItem>
                    <MenuItem value="Team Lead">Team Lead</MenuItem>
                    <MenuItem value="HR Executive">HR Executive</MenuItem>
                    <MenuItem value="Recruiter">Recruiter</MenuItem>
                    <MenuItem value="Staff">Staff</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Phone Number" name="phoneNo" value={employeeForm.phoneNo} onChange={handleEmployeeInputChange} required fullWidth />
                <TextField label="Aadhaar Number" name="aadhaarNumber" value={employeeForm.aadhaarNumber} onChange={handleEmployeeInputChange} required fullWidth />
                <FormControl fullWidth>
                  <InputLabel id="team-user-type-label">Employee Type</InputLabel>
                  <Select
                    labelId="team-user-type-label"
                    name="employeeType"
                    multiple
                    value={employeeForm.employeeType}
                    label="Employee Type"
                    onChange={handleEmployeeInputChange}
                  >
                    <MenuItem value="team">team</MenuItem>
                    <MenuItem value="subAdmin">subAdmin</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select
                    labelId="gender-label"
                    name="gender"
                    value={employeeForm.gender}
                    label="Gender"
                    onChange={handleEmployeeInputChange}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={employeeForm.dateOfBirth}
                  onChange={handleEmployeeInputChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField label="Address" name="address" value={employeeForm.address} onChange={handleEmployeeInputChange} required fullWidth multiline minRows={2} />
                <FormControl fullWidth required>
                  <InputLabel id="department-label">Department</InputLabel>
                  <Select
                    labelId="department-label"
                    name="department"
                    value={employeeForm.department}
                    label="Department"
                    onChange={handleEmployeeInputChange}
                  >
                    <MenuItem value="HR">HR</MenuItem>
                    <MenuItem value="Engineering">Engineering</MenuItem>
                    <MenuItem value="Sales">Sales</MenuItem>
                    <MenuItem value="Operations">Operations</MenuItem>
                    <MenuItem value="Finance">Finance</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Experience (yy/mm)" name="experience" value={employeeForm.experience} onChange={handleEmployeeInputChange} fullWidth />
                <TextField
                  label="Education (JSON Array)"
                  name="educationText"
                  value={employeeForm.educationText}
                  onChange={handleEmployeeInputChange}
                  fullWidth
                  multiline
                  minRows={2}
                />
                <FormControl fullWidth>
                  <InputLabel id="recruited-via-label">Recruited Via</InputLabel>
                  <Select
                    labelId="recruited-via-label"
                    name="recruitedVia"
                    value={employeeForm.recruitedVia}
                    label="Recruited Via"
                    onChange={handleEmployeeInputChange}
                  >
                    <MenuItem value="referral">Referral</MenuItem>
                    <MenuItem value="self">Self</MenuItem>
                    <MenuItem value="hiring campaign">Hiring Campaign</MenuItem>
                  </Select>
                </FormControl>
                {employeeForm.recruitedVia === 'referral' && (
                  <>
                    <TextField label="Referral By Name" name="referralByName" value={employeeForm.referralByName} onChange={handleEmployeeInputChange} fullWidth />
                    <TextField label="Referral By Employee ID" name="referralByEmployeeId" value={employeeForm.referralByEmployeeId} onChange={handleEmployeeInputChange} fullWidth />
                  </>
                )}
                <FormControl fullWidth>
                  <InputLabel id="working-status-label">Status</InputLabel>
                  <Select
                    labelId="working-status-label"
                    name="status"
                    value={employeeForm.status}
                    label="Status"
                    onChange={handleEmployeeInputChange}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Not Active">Not Active</MenuItem>
                    <MenuItem value="Deleted">Deleted</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Date of Joining"
                  name="dateOfJoining"
                  type="date"
                  value={employeeForm.dateOfJoining}
                  onChange={handleEmployeeInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
                <TextField
                  label="Date of Exit"
                  name="dateOfExit"
                  type="date"
                  value={employeeForm.dateOfExit}
                  onChange={handleEmployeeInputChange}
                  InputLabelProps={{ shrink: true }}
                  disabled={employeeForm.status === 'Active'}
                  fullWidth
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button type="submit" variant="contained" fullWidth disabled={isEmployeeSaving}>
                    {isEmployeeSaving ? 'Saving...' : editingEmployeeId ? 'Update Employee' : 'Create Employee'}
                  </Button>
                  <Button type="button" variant="outlined" fullWidth onClick={resetEmployeeForm}>
                    Reset
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Existing Employees</Typography>
            {isEmployeesLoading ? (
              <Typography color="text.secondary">Loading employees...</Typography>
            ) : employees.length === 0 ? (
              <Typography color="text.secondary">No user yet.</Typography>
            ) : (
              <Stack spacing={1.2}>
                {employees.map((employee) => (
                  <Card key={employee.employeeId} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ py: '12px !important' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.2}>
                        <Box>
                          <Typography fontWeight={700}>{employee.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {employee.position || 'N/A'} | {employee.department || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Phone: {employee.phoneNo || 'N/A'} | Aadhaar: {employee.aadhaarNumber || 'N/A'}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            DOJ: {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : 'N/A'} | Exit: {employee.dateOfExit ? new Date(employee.dateOfExit).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            color={employee.status === 'Active' ? 'success' : employee.status === 'Deleted' ? 'error' : 'warning'}
                            label={employee.status || 'Not Active'}
                          />
                          <Button variant="outlined" size="small" onClick={() => handleEditEmployee(employee)}>
                            Edit
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTasks = () => (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>Tasks</Typography>
        <Stack spacing={1.2}>
          {taskList.map((task) => (
            <Card
              key={task.id}
              variant="outlined"
              sx={{
                borderRadius: 2,
                cursor: 'pointer',
                borderColor: task.done ? 'success.main' : 'divider'
              }}
              onClick={() => toggleTaskStatus(task.id)}
            >
              <CardContent sx={{ py: '12px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography
                    sx={{ textDecoration: task.done ? 'line-through' : 'none' }}
                  >
                    {task.title}
                  </Typography>
                  <Chip
                    label={task.done ? 'Done' : 'Pending'}
                    color={task.done ? 'success' : 'warning'}
                    size="small"
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderReports = () => (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Attendance Health</Typography>
            <Typography color="text.secondary">Current month average attendance</Typography>
            <Typography variant="h3" fontWeight={800} sx={{ mt: 1 }}>92%</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Recruitment Funnel</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label="Applied: 84" />
              <Chip label="Shortlisted: 26" color="primary" />
              <Chip label="Interviewed: 12" color="secondary" />
              <Chip label="Offered: 4" color="success" />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderSettings = () => (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Appearance</Typography>
            <Card variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {mode === 'dark' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
                  <Typography fontWeight={700}>Dark Mode</Typography>
                </Stack>
                <FormControlLabel
                  control={<Switch checked={mode === 'dark'} onChange={toggleColorMode} />}
                  label={mode === 'dark' ? 'On' : 'Off'}
                />
              </Stack>
            </Card>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Account Actions</Typography>
            <Stack spacing={1.5}>
              <Button
                color="error"
                variant="contained"
                startIcon={<LogoutRoundedIcon />}
                onClick={() => setLogoutDialogOpen(true)}
              >
                Logout
              </Button>
              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteForeverRoundedIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Account
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const sectionRenderer = {
    overview: renderOverview,
    profile: renderProfile,
    team: renderTeam,
    tasks: renderTasks,
    reports: renderReports,
    settings: renderSettings
  };

  const ActiveComponent = sectionRenderer[activeSection] || sectionRenderer.overview;
  const activeLabel = navItems.find((item) => item.key === activeSection)?.label || 'Overview';

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(140deg, #0d1220 0%, #151d34 100%)'
            : 'linear-gradient(140deg, #eef3ff 0%, #f8fbff 100%)'
      }}
    >
      <CssBaseline />
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${desktopCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { md: `${desktopCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(20,27,45,0.88)' : 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(6px)',
          transition: (theme) =>
            theme.transitions.create(['width', 'margin-left'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.shorter
            })
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDesktopCollapsed((prev) => !prev)}
            sx={{ mr: 2, display: { xs: 'none', md: 'inline-flex' } }}
          >
            {desktopCollapsed ? <MenuRoundedIcon /> : <MenuOpenRoundedIcon />}
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={700}>{activeLabel}</Typography>
            <Typography variant="body2" color="text.secondary">
              Hello {loginAs === 'employee' ? 'Team' : 'User'}, {name}
            </Typography>
          </Box>
          <Button variant="outlined" color="error" onClick={() => setLogoutDialogOpen(true)}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: desktopCollapsed ? collapsedDrawerWidth : drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: desktopCollapsed ? collapsedDrawerWidth : drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              overflowX: 'hidden',
              transition: (theme) =>
                theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.shorter
                })
            }
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, mt: 10 }}>
        <Stack spacing={2.5}>
          {ActiveComponent()}
        </Stack>
      </Box>

      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>Do you want to logout from your current session?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleLogout}>Logout</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography color="error" fontWeight={700} sx={{ mb: 1 }}>
            This action cannot be undone.
          </Typography>
          <Typography>
            Are you sure you want to permanently delete your account?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeletingAccount}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
          >
            {isDeletingAccount ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Dashboard;

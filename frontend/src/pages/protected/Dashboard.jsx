import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { useThemeMode } from '../../context/ThemeModeContext';
import API from '../../api/api';

const drawerWidth = 280;
const collapsedDrawerWidth = 84;

const navItems = [
  { key: 'overview', label: 'Overview', icon: <DashboardRoundedIcon /> },
  { key: 'profile', label: 'Profile', icon: <PersonRoundedIcon /> },
  { key: 'team', label: 'Team', icon: <GroupsRoundedIcon /> },
  { key: 'tasks', label: 'Tasks', icon: <TaskAltRoundedIcon /> },
  { key: 'reports', label: 'Reports', icon: <InsightsRoundedIcon /> },
  { key: 'settings', label: 'Settings', icon: <SettingsRoundedIcon /> }
];

function Dashboard() {
  const navigate = useNavigate();
  const { mode, toggleColorMode } = useThemeMode();
  const name = localStorage.getItem('name') || 'User';
  const userId = localStorage.getItem('userId') || 'N/A';
  const sessionExpiry = Number(localStorage.getItem('sessionExpiry'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
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
    if (!name || !sessionExpiry || now > sessionExpiry) {
      localStorage.removeItem('name');
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionExpiry');
      localStorage.removeItem('profileImage');
      navigate('/');
    }
  }, [name, sessionExpiry, now, navigate]);

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

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const closeToast = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleLogout = () => {
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionExpiry');
    localStorage.removeItem('profileImage');
    showToast('You have been logged out.', 'info');
    navigate('/');
  };

  const handleSectionChange = (sectionKey) => {
    setActiveSection(sectionKey);
    setMobileOpen(false);
  };

  const toggleTaskStatus = (taskId) => {
    setTaskList((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task))
    );
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
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>Team Snapshot</Typography>
        <Grid container spacing={2}>
          {[
            { name: 'Anshika Sharma', role: 'HR Executive', status: 'Active' },
            { name: 'Karan Sinha', role: 'Recruiter', status: 'In Meeting' },
            { name: 'Ravi Kumar', role: 'HRBP', status: 'On Leave' }
          ].map((member) => (
            <Grid key={member.name} size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography fontWeight={700}>{member.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{member.role}</Typography>
                  <Chip size="small" sx={{ mt: 1.2 }} label={member.status} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
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
              <Button variant="outlined" onClick={() => navigate('/change-password')}>
                Change Password
              </Button>
              <Button
                color="error"
                variant="contained"
                startIcon={<LogoutRoundedIcon />}
                onClick={() => setLogoutDialogOpen(true)}
              >
                Logout
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

  const ActiveComponent = sectionRenderer[activeSection];
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
              Welcome back, {name}
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

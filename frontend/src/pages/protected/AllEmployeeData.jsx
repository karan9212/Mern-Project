import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import API from '../../api/api';
import AppToast from '../../components/common/AppToast';
import EntityEditDialog from '../../components/data/EntityEditDialog';
import EntityTableToolbar from '../../components/data/EntityTableToolbar';
import PanelCard from '../../components/common/PanelCard';
import useToast from '../../hooks/useToast';
import {
  clearEmployeeActivity,
  formatCountdown,
  getEmployeeIdleRemainingMs,
  hasEmployeeActivityExpired,
  refreshEmployeeActivity
} from '../../utils/employeeSession';

const toDateInputValue = (value) => (value ? new Date(value).toISOString().split('T')[0] : '');
const toDisplayDate = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');
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

function AllEmployeeData() {
  const navigate = useNavigate();
  const name = localStorage.getItem('name');
  const userId = localStorage.getItem('userId');
  const loginAs = localStorage.getItem('loginAs') || 'user';
  const sessionExpiry = Number(localStorage.getItem('sessionExpiry'));
  const hasSessionLimit = loginAs === 'user';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState('');
  const [currentEmployeeRole, setCurrentEmployeeRole] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    gender: 'other',
    dateOfBirth: '',
    address: '',
    employeeType: ['team'],
    department: '',
    position: '',
    status: 'Not Active',
    dateOfExit: ''
  });
  const { toast, showToast, closeToast } = useToast();
  const initialLoadRef = useRef(true);

  const clearStoredSession = useCallback(() => {
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionExpiry');
    localStorage.removeItem('profileImage');
    localStorage.removeItem('loginAs');
    clearEmployeeActivity();
  }, []);

  const handleEmployeeIdleLogout = useCallback(async () => {
    try {
      if (userId) {
        await API.post('/logoutUser', { userId });
      }
    } catch (error) {
      // Local cleanup should still proceed.
    } finally {
      clearStoredSession();
      navigate('/');
    }
  }, [userId, clearStoredSession, navigate]);

  const recordEmployeeActivity = useCallback(() => {
    if (loginAs !== 'employee') return;
    refreshEmployeeActivity();
    setNow(Date.now());
  }, [loginAs]);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!name || !userId) {
        navigate('/');
        return;
      }

      if (!hasSessionLimit && hasEmployeeActivityExpired()) {
        await handleEmployeeIdleLogout();
        return;
      }

      if (hasSessionLimit && (!sessionExpiry || Date.now() > sessionExpiry)) {
        clearStoredSession();
        navigate('/');
        return;
      }

      try {
        const res = await API.get(`/user/${userId}`);
        const profile = res.data?.user || {};
        const role = getPrimaryEmployeeRole(profile.employeeType);
        const isElevatedEmployee = profile.loginAs === 'employee' && (role === 'admin' || role === 'subAdmin');
        setCurrentEmployeeRole(role);

        if (!isElevatedEmployee) {
          navigate('/dashboard');
        }
      } catch (error) {
        navigate('/dashboard');
      }
    };

    verifyAccess();
  }, [name, userId, hasSessionLimit, sessionExpiry, navigate, clearStoredSession, handleEmployeeIdleLogout]);

  useEffect(() => {
    if (loginAs === 'employee') {
      recordEmployeeActivity();
    }
  }, [loginAs, recordEmployeeActivity]);

  useEffect(() => {
    if (loginAs !== 'employee') return undefined;

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [loginAs]);

  useEffect(() => {
    if (loginAs !== 'employee') return undefined;

    const intervalId = setInterval(() => {
      if (hasEmployeeActivityExpired()) {
        handleEmployeeIdleLogout();
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [loginAs, handleEmployeeIdleLogout]);

  const fetchEmployees = useCallback(async (silent = false, manual = false) => {
    try {
      if (manual && loginAs === 'employee') {
        recordEmployeeActivity();
      }
      if (manual) setIsManualRefreshing(true);
      if (!silent && initialLoadRef.current) {
        setLoading(true);
      }
      const res = await API.get('/teams');
      setEmployees(res.data?.users || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch employees.', 'error');
    } finally {
      if (initialLoadRef.current) {
        setLoading(false);
        initialLoadRef.current = false;
      }
      if (manual) setIsManualRefreshing(false);
    }
  }, [showToast, loginAs, recordEmployeeActivity]);

  const employeeIdleRemainingMs = useMemo(() => {
    if (loginAs !== 'employee') return 0;
    return getEmployeeIdleRemainingMs(now);
  }, [loginAs, now]);

  const employeeIdleTimeLeft = useMemo(() => {
    if (loginAs !== 'employee') return '';
    return formatCountdown(employeeIdleRemainingMs);
  }, [loginAs, employeeIdleRemainingMs]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchEmployees(true);
    }, 10000);

    const handleWindowFocus = () => {
      fetchEmployees(true);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchEmployees]);

  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return employees;

    return employees.filter((employee) => {
      const fields = [
        employee.name,
        employee.employeeId,
        employee.phoneNo,
        employee.aadhaarNumber,
        employee.department,
        employee.position,
        employee.gender,
        employee.status
      ];
      return fields.some((f) => String(f || '').toLowerCase().includes(q));
    });
  }, [employees, searchTerm]);

  const pagedEmployees = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredEmployees.slice(start, start + rowsPerPage);
  }, [filteredEmployees, page, rowsPerPage]);

  const handleEditOpen = (employee) => {
    setEditingEmployeeId(employee.employeeId);
    setEditForm({
      name: employee.name || '',
      gender: employee.gender || 'other',
      dateOfBirth: toDateInputValue(employee.dateOfBirth),
      address: employee.address || '',
      employeeType: normalizeEmployeeTypes(employee.employeeType),
      department: employee.department || '',
      position: employee.position || '',
      status: employee.status || 'Not Active',
      dateOfExit: toDateInputValue(employee.dateOfExit)
    });
    setEditOpen(true);
  };

  const handleEditInput = (e) => {
    const { name: fieldName, value } = e.target;
    setEditForm((prev) => {
      if (fieldName === 'employeeType') {
        return {
          ...prev,
          employeeType: normalizeEmployeeTypes(value)
        };
      }
      if (fieldName === 'status' && value === 'Active') {
        return {
          ...prev,
          status: value,
          dateOfExit: ''
        };
      }
      return {
        ...prev,
        [fieldName]: value
      };
    });
  };

  const handleUpdateEmployee = async () => {
    const payload = {
      name: editForm.name.trim(),
      gender: editForm.gender,
      dateOfBirth: editForm.dateOfBirth || null,
      address: editForm.address.trim(),
      employeeType: editForm.employeeType,
      actingEmployeeId: userId,
      department: editForm.department.trim(),
      position: editForm.position.trim(),
      status: editForm.status,
      dateOfExit: editForm.status === 'Active' ? null : (editForm.dateOfExit || null)
    };

    if (!payload.name) {
      showToast('Name is required.', 'warning');
      return;
    }

    try {
      setSaving(true);
      await API.put(`/teams/${editingEmployeeId}`, payload);
      showToast('Employee updated successfully.', 'success');
      setEditOpen(false);
      await fetchEmployees();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update employee.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const canAssignAdmin = currentEmployeeRole === 'admin';
  const canEditEmployee = (employee) => getPrimaryEmployeeRole(employee.employeeType) !== 'admin';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(140deg, #0d1220 0%, #151d34 100%)'
            : 'linear-gradient(140deg, #eef3ff 0%, #f8fbff 100%)'
      }}
    >
      <Container maxWidth="xl">
        <PanelCard>
          <EntityTableToolbar
            title="All Employee Data"
            refreshLabel="Refresh"
            onRefresh={() => fetchEmployees(true, true)}
            isRefreshing={isManualRefreshing}
            searchLabel="Search employees"
            searchPlaceholder="Name / Emp ID / Mobile"
            searchValue={searchTerm}
            onSearchChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            onBack={() => {
              if (loginAs === 'employee') {
                recordEmployeeActivity();
              }
              navigate('/dashboard');
            }}
            showIdleCountdown={loginAs === 'employee'}
            idleRemainingMs={employeeIdleRemainingMs}
            idleTimeText={employeeIdleTimeLeft}
          />

          {loading ? (
            <Typography color="text.secondary">Loading employees...</Typography>
          ) : filteredEmployees.length === 0 ? (
            <Typography color="text.secondary">No employee yet.</Typography>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Employee ID</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Age</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Aadhaar</TableCell>
                      <TableCell>Employee Type</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>DOJ</TableCell>
                      <TableCell>DOE</TableCell>
                      <TableCell>Recruited Via</TableCell>
                      <TableCell>Referral By</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedEmployees.map((employee) => (
                      <TableRow
                        key={employee.employeeId}
                        sx={employee.status === 'Deleted' ? { opacity: 0.55, backgroundColor: 'action.disabledBackground' } : {}}
                      >
                        <TableCell>{employee.name || 'N/A'}</TableCell>
                        <TableCell>{employee.employeeId || 'N/A'}</TableCell>
                        <TableCell>{employee.gender || 'N/A'}</TableCell>
                        <TableCell>{typeof employee.age === 'number' ? employee.age : 'N/A'}</TableCell>
                        <TableCell>{employee.phoneNo || 'N/A'}</TableCell>
                        <TableCell>{employee.aadhaarNumber || 'N/A'}</TableCell>
                        <TableCell>{Array.isArray(employee.employeeType) ? employee.employeeType.join(', ') : 'team'}</TableCell>
                        <TableCell>{employee.department || 'N/A'}</TableCell>
                        <TableCell>{employee.position || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={employee.status || 'Not Active'}
                            color={employee.status === 'Active' ? 'success' : employee.status === 'Deleted' ? 'error' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{toDisplayDate(employee.dateOfJoining)}</TableCell>
                        <TableCell>{employee.dateOfExit ? toDisplayDate(employee.dateOfExit) : 'Still working'}</TableCell>
                        <TableCell>{employee.recruitedVia || 'N/A'}</TableCell>
                        <TableCell>{employee.referralBy?.name ? `${employee.referralBy.name} (${employee.referralBy.employeeId || 'N/A'})` : 'N/A'}</TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleEditOpen(employee)}
                            disabled={employee.status === 'Deleted' || !canEditEmployee(employee)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredEmployees.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 20]}
              />
            </>
          )}
        </PanelCard>
      </Container>

      <EntityEditDialog
        open={editOpen}
        title="Update Employee"
        onClose={() => setEditOpen(false)}
        onSave={handleUpdateEmployee}
        saving={saving}
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name" name="name" value={editForm.name} onChange={handleEditInput} fullWidth />
          <FormControl fullWidth>
            <InputLabel id="emp-gender-label">Gender</InputLabel>
            <Select labelId="emp-gender-label" name="gender" value={editForm.gender} label="Gender" onChange={handleEditInput}>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={editForm.dateOfBirth}
            onChange={handleEditInput}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField label="Address" name="address" value={editForm.address} onChange={handleEditInput} fullWidth multiline minRows={2} />
          <FormControl fullWidth>
            <InputLabel id="employee-type-edit-label">Employee Type</InputLabel>
            <Select
              labelId="employee-type-edit-label"
              name="employeeType"
              multiple
              value={editForm.employeeType}
              label="Employee Type"
              onChange={handleEditInput}
            >
              <MenuItem value="team">team</MenuItem>
              <MenuItem value="subAdmin">subAdmin</MenuItem>
              {canAssignAdmin ? <MenuItem value="admin">admin</MenuItem> : null}
            </Select>
          </FormControl>
          <TextField label="Department" name="department" value={editForm.department} onChange={handleEditInput} fullWidth />
          <TextField label="Position" name="position" value={editForm.position} onChange={handleEditInput} fullWidth />
          <FormControl fullWidth>
            <InputLabel id="working-status-edit-label">Status</InputLabel>
            <Select
              labelId="working-status-edit-label"
              name="status"
              value={editForm.status}
              label="Status"
              onChange={handleEditInput}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Not Active">Not Active</MenuItem>
              <MenuItem value="Deleted">Deleted</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Date of Exit"
            name="dateOfExit"
            type="date"
            value={editForm.dateOfExit}
            onChange={handleEditInput}
            disabled={editForm.status === 'Active'}
            InputLabelProps={{ shrink: true }}
            helperText={editForm.status === 'Active' ? 'Still working' : ''}
            fullWidth
          />
        </Stack>
      </EntityEditDialog>

      <AppToast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={closeToast}
      />
    </Box>
  );
}

export default AllEmployeeData;

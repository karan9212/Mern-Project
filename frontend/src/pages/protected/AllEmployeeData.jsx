import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
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

const toDateInputValue = (value) => (value ? new Date(value).toISOString().split('T')[0] : '');
const toDisplayDate = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');

function AllEmployeeData() {
  const navigate = useNavigate();
  const name = localStorage.getItem('name');
  const sessionExpiry = Number(localStorage.getItem('sessionExpiry'));

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState('');
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
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!name || !sessionExpiry || Date.now() > sessionExpiry) {
      localStorage.removeItem('name');
      localStorage.removeItem('userId');
      localStorage.removeItem('sessionExpiry');
      localStorage.removeItem('profileImage');
      localStorage.removeItem('loginAs');
      navigate('/');
    }
  }, [name, sessionExpiry, navigate]);

  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity });
  }, []);

  const closeToast = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  const fetchEmployees = useCallback(async (silent = false, manual = false) => {
    try {
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
  }, [showToast]);

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
      employeeType: Array.isArray(employee.employeeType) && employee.employeeType.length > 0 ? employee.employeeType : ['team'],
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
          employeeType: Array.isArray(value) ? value : String(value).split(',')
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
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5} mb={2}>
              <Typography variant="h5" fontWeight={700}>All Employee Data</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Button variant="outlined" onClick={() => fetchEmployees(true, true)} disabled={isManualRefreshing}>
                  {isManualRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <TextField
                  size="small"
                  label="Search employees"
                  placeholder="Name / Emp ID / Mobile"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  sx={{ width: { xs: '100%', sm: 260 } }}
                />
                <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
              </Stack>
            </Stack>

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
                          <TableCell>{Array.isArray(employee.employeeType) ? employee.employeeType.join(', ') : 'N/A'}</TableCell>
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
                              disabled={employee.status === 'Deleted'}
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
          </CardContent>
        </Card>
      </Container>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Update Employee</DialogTitle>
        <DialogContent>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleUpdateEmployee} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
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

export default AllEmployeeData;

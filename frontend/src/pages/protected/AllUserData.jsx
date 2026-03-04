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

function AllUserData() {
  const navigate = useNavigate();
  const name = localStorage.getItem('name');
  const sessionExpiry = Number(localStorage.getItem('sessionExpiry'));

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [editingUserId, setEditingUserId] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    gender: 'other',
    dateOfBirth: '',
    address: '',
    status: 'Not Active',
    dateOfDeletion: ''
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

  const fetchUsers = useCallback(async (silent = false, manual = false) => {
    try {
      if (manual) {
        setIsManualRefreshing(true);
      }
      if (!silent && initialLoadRef.current) {
        setLoading(true);
      }
      const res = await API.get('/users');
      setUsers(res.data?.users || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch users.', 'error');
    } finally {
      if (initialLoadRef.current) {
        setLoading(false);
        initialLoadRef.current = false;
      }
      if (manual) {
        setIsManualRefreshing(false);
      }
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchUsers(true);
    }, 10000);

    const handleWindowFocus = () => {
      fetchUsers(true);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;

    return users.filter((user) => {
      const fields = [
        user.name,
        user.userId,
        user.phoneNo,
        user.aadhaarNumber,
        user.userCategory,
        user.status,
        user.gender,
        user.address
      ];
      return fields.some((f) => String(f || '').toLowerCase().includes(q));
    });
  }, [users, searchTerm]);

  const pagedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  const handleEditOpen = (user) => {
    setEditingUserId(user.userId);
    setEditForm({
      name: user.name || '',
      gender: user.gender || 'other',
      dateOfBirth: toDateInputValue(user.dateOfBirth),
      address: user.address || '',
      status: user.status || 'Not Active',
      dateOfDeletion: toDateInputValue(user.dateOfDeletion)
    });
    setEditOpen(true);
  };

  const handleEditInput = (e) => {
    const { name: fieldName, value } = e.target;
    setEditForm((prev) => {
      if (fieldName === 'status' && value !== 'Deleted') {
        return {
          ...prev,
          status: value,
          dateOfDeletion: ''
        };
      }

      return {
        ...prev,
        [fieldName]: value
      };
    });
  };

  const handleUpdateUser = async () => {
    const payload = {
      name: editForm.name.trim(),
      gender: editForm.gender,
      dateOfBirth: editForm.dateOfBirth || null,
      address: editForm.address.trim(),
      status: editForm.status,
      dateOfDeletion: editForm.status === 'Deleted' ? (editForm.dateOfDeletion || new Date().toISOString()) : null
    };

    if (!payload.name) {
      showToast('Name is required.', 'warning');
      return;
    }

    try {
      setSaving(true);
      await API.put(`/users/${editingUserId}`, payload);
      showToast('User updated successfully.', 'success');
      setEditOpen(false);
      await fetchUsers();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update user.', 'error');
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
              <Typography variant="h5" fontWeight={700}>All User Data</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Button variant="outlined" onClick={() => fetchUsers(true, true)} disabled={isManualRefreshing}>
                  {isManualRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <TextField
                  size="small"
                  label="Search users"
                  placeholder="Name / User ID / Mobile"
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
              <Typography color="text.secondary">Loading users...</Typography>
            ) : filteredUsers.length === 0 ? (
              <Typography color="text.secondary">No user yet.</Typography>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>User ID</TableCell>
                        <TableCell>Gender</TableCell>
                        <TableCell>Age</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Aadhaar</TableCell>
                        <TableCell>User Category</TableCell>
                        <TableCell>Verified</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>DOJ</TableCell>
                        <TableCell>No. of Bookings</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date of Deletion</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedUsers.map((user) => (
                        <TableRow
                          key={user.userId}
                          sx={user.status === 'Deleted' ? { opacity: 0.55, backgroundColor: 'action.disabledBackground' } : {}}
                        >
                          <TableCell>{user.name || 'N/A'}</TableCell>
                          <TableCell>{user.userId || 'N/A'}</TableCell>
                          <TableCell>{user.gender || 'N/A'}</TableCell>
                          <TableCell>{typeof user.age === 'number' ? user.age : 'N/A'}</TableCell>
                          <TableCell>{user.phoneNo || 'N/A'}</TableCell>
                          <TableCell>{user.aadhaarNumber || 'N/A'}</TableCell>
                          <TableCell>{user.userCategory || 'N/A'}</TableCell>
                          <TableCell>{user.isVerified ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{user.address || 'N/A'}</TableCell>
                          <TableCell>{toDisplayDate(user.dateOfJoining)}</TableCell>
                          <TableCell>{String(user.noOfBookings ?? 0)}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={user.status || 'Not Active'}
                              color={user.status === 'Active' ? 'success' : user.status === 'Deleted' ? 'error' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>
                            {user.dateOfDeletion ? (
                              <Typography color="error.main">{toDisplayDate(user.dateOfDeletion)}</Typography>
                            ) : (
                              <Typography color="success.main">Not deleted</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleEditOpen(user)}
                              disabled={user.status === 'Deleted'}
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
                  count={filteredUsers.length}
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
        <DialogTitle>Update User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" name="name" value={editForm.name} onChange={handleEditInput} fullWidth />
            <FormControl fullWidth>
              <InputLabel id="user-gender-label">Gender</InputLabel>
              <Select labelId="user-gender-label" name="gender" value={editForm.gender} label="Gender" onChange={handleEditInput}>
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
              <InputLabel id="user-status-label">Status</InputLabel>
              <Select
                labelId="user-status-label"
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
              label="Date of Deletion"
              name="dateOfDeletion"
              type="date"
              value={editForm.dateOfDeletion}
              onChange={handleEditInput}
              InputLabelProps={{ shrink: true }}
              disabled={editForm.status !== 'Deleted'}
              helperText={editForm.status !== 'Deleted' ? 'Not deleted' : ''}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleUpdateUser} variant="contained" disabled={saving}>
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

export default AllUserData;

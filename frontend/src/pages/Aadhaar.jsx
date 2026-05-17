import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
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
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import API from '../api/api';
import AppToast from '../components/common/AppToast';
import PanelCard from '../components/common/PanelCard';
import useToast from '../hooks/useToast';

function Aadhaar() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'other',
    dateOfBirth: '',
    address: '',
    aadhaarNumber: '',
    mobile: ''
  });
  const { toast, showToast, closeToast } = useToast();

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/aadhaar');
      setRecords(res.data?.records || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch Aadhaar data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEdit = (record) => {
    setForm({
      name: record.name || '',
      age: typeof record.age === 'number' ? String(record.age) : '',
      gender: record.gender || 'other',
      dateOfBirth: record.dateOfBirth ? new Date(record.dateOfBirth).toISOString().split('T')[0] : '',
      address: record.address || '',
      aadhaarNumber: record.aadhaarNumber || '',
      mobile: record.mobile || ''
    });
  };

  const resetForm = () => {
    setForm({ name: '', age: '', gender: 'other', dateOfBirth: '', address: '', aadhaarNumber: '', mobile: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      age: form.age === '' ? null : Number(form.age),
      gender: form.gender,
      dateOfBirth: form.dateOfBirth || null,
      address: form.address.trim(),
      aadhaarNumber: form.aadhaarNumber.trim(),
      mobile: form.mobile.trim()
    };

    if (!payload.name || !payload.aadhaarNumber || !payload.mobile) {
      showToast('Name, Aadhaar number and mobile are required.', 'warning');
      return;
    }
    if (!/^\d{12}$/.test(payload.aadhaarNumber)) {
      showToast('Aadhaar number must be 12 digits.', 'warning');
      return;
    }
    if (!/^\d{10}$/.test(payload.mobile)) {
      showToast('Mobile number must be 10 digits.', 'warning');
      return;
    }
    if (payload.age !== null && (!Number.isFinite(payload.age) || payload.age < 0)) {
      showToast('Age must be a valid non-negative number.', 'warning');
      return;
    }

    try {
      setSaving(true);
      await API.post('/aadhaar', payload);
      showToast('Aadhaar data saved successfully.', 'success');
      resetForm();
      await fetchRecords();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save Aadhaar data.', 'error');
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
            : 'linear-gradient(140deg, #f6f9fc 0%, #e3ecf8 100%)'
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={2.5}>
          <PanelCard>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} mb={2}>
                <Typography variant="h5" fontWeight={700}>
                  Aadhaar Data Manager
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={fetchRecords} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/login')}>
                    Back to Login
                  </Button>
                </Stack>
              </Stack>

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={1.5}>
                  <TextField label="Name" name="name" value={form.name} onChange={handleChange} required fullWidth />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField label="Age" name="age" type="number" value={form.age} onChange={handleChange} fullWidth />
                    <TextField label="Mobile Number" name="mobile" value={form.mobile} onChange={handleChange} required fullWidth />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <FormControl fullWidth>
                      <InputLabel id="aadhaar-gender-label">Gender</InputLabel>
                      <Select
                        labelId="aadhaar-gender-label"
                        label="Gender"
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
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
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Stack>
                  <TextField label="Aadhaar Number" name="aadhaarNumber" value={form.aadhaarNumber} onChange={handleChange} required fullWidth />
                  <TextField label="Address" name="address" value={form.address} onChange={handleChange} fullWidth multiline minRows={2} />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button type="submit" variant="contained" disabled={saving}>
                      {saving ? 'Saving...' : 'Save / Update Aadhaar'}
                    </Button>
                    <Button type="button" variant="outlined" onClick={resetForm}>
                      Reset
                    </Button>
                  </Stack>
                </Stack>
              </Box>
          </PanelCard>

          <PanelCard>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Existing Aadhaar Records
              </Typography>
              {loading ? (
                <Typography color="text.secondary">Loading records...</Typography>
              ) : records.length === 0 ? (
                <Typography color="text.secondary">No Aadhaar records yet.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Age</TableCell>
                        <TableCell>Gender</TableCell>
                        <TableCell>DOB</TableCell>
                        <TableCell>Mobile</TableCell>
                        <TableCell>Aadhaar</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell>{record.name || 'N/A'}</TableCell>
                          <TableCell>{typeof record.age === 'number' ? record.age : 'N/A'}</TableCell>
                          <TableCell>{record.gender || 'N/A'}</TableCell>
                          <TableCell>{record.dateOfBirth ? new Date(record.dateOfBirth).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>{record.mobile || 'N/A'}</TableCell>
                          <TableCell>{record.aadhaarNumber || 'N/A'}</TableCell>
                          <TableCell>{record.address || 'N/A'}</TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="outlined" onClick={() => handleEdit(record)}>
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
          </PanelCard>
        </Stack>
      </Container>

      <AppToast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={closeToast}
      />
    </Box>
  );
}

export default Aadhaar;

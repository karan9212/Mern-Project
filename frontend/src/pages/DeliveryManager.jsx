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

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'deleted', label: 'Deleted' }
];

function DeliveryManager() {
  const navigate = useNavigate();
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({
    deliveryBoyName: '',
    deliveryBoyId: '',
    phoneNo: '',
    companyEmail: '',
    status: 'active',
    address: ''
  });
  const { toast, showToast, closeToast } = useToast();
  const backPath = localStorage.getItem('loginAs') === 'employee' ? '/dashboard' : '/login';

  const fetchDeliveryBoys = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.get('/delivery-boys');
      setDeliveryBoys(response.data?.deliveryBoys || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load delivery users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDeliveryBoys();
  }, [fetchDeliveryBoys]);

  const resetForm = () => {
    setEditingId('');
    setForm({
      deliveryBoyName: '',
      deliveryBoyId: '',
      phoneNo: '',
      companyEmail: '',
      status: 'active',
      address: ''
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (deliveryBoy) => {
    setEditingId(deliveryBoy.deliveryBoyId || '');
    setForm({
      deliveryBoyName: deliveryBoy.deliveryBoyName || '',
      deliveryBoyId: deliveryBoy.deliveryBoyId || '',
      phoneNo: deliveryBoy.phoneNo || '',
      companyEmail: deliveryBoy.companyEmail || '',
      status: deliveryBoy.status || 'active',
      address: deliveryBoy.address || ''
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      deliveryBoyName: form.deliveryBoyName.trim(),
      deliveryBoyId: form.deliveryBoyId.trim(),
      phoneNo: form.phoneNo.trim(),
      companyEmail: form.companyEmail.trim().toLowerCase(),
      status: form.status,
      address: form.address.trim()
    };

    if (!payload.deliveryBoyName || !payload.deliveryBoyId || !payload.phoneNo || !payload.companyEmail) {
      showToast('Name, delivery ID, phone number and company email are required.', 'warning');
      return;
    }

    if (!/^\d{10}$/.test(payload.phoneNo)) {
      showToast('Please enter a valid 10-digit phone number.', 'warning');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.companyEmail)) {
      showToast('Please enter a valid company email.', 'warning');
      return;
    }

    try {
      setSaving(true);
      await API.post('/delivery-boys', payload);
      showToast('Delivery user saved successfully.', 'success');
      resetForm();
      await fetchDeliveryBoys();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save delivery user.', 'error');
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
      <Container maxWidth="xl">
        <Stack spacing={2.5}>
          <PanelCard>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} mb={2}>
              <Typography variant="h5" fontWeight={700}>
                Delivery Manager
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={fetchDeliveryBoys} disabled={loading}>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button variant="outlined" onClick={() => navigate(backPath)}>
                  {backPath === '/dashboard' ? 'Back to Dashboard' : 'Back to Login'}
                </Button>
              </Stack>
            </Stack>

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={1.5}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <TextField label="Delivery Boy Name" name="deliveryBoyName" value={form.deliveryBoyName} onChange={handleChange} required fullWidth />
                  <TextField label="Delivery Boy ID" name="deliveryBoyId" value={form.deliveryBoyId} onChange={handleChange} required fullWidth />
                  <TextField label="Phone Number" name="phoneNo" value={form.phoneNo} onChange={handleChange} required fullWidth />
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <TextField label="Company Email" name="companyEmail" value={form.companyEmail} onChange={handleChange} required fullWidth />
                  <FormControl fullWidth>
                    <InputLabel id="delivery-status-label">Status</InputLabel>
                    <Select
                      labelId="delivery-status-label"
                      name="status"
                      value={form.status}
                      label="Status"
                      onChange={handleChange}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
                <TextField label="Address" name="address" value={form.address} onChange={handleChange} fullWidth multiline minRows={2} />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button type="submit" variant="contained" disabled={saving}>
                    {saving ? 'Saving...' : editingId ? 'Update Delivery User' : 'Create Delivery User'}
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
              Existing Delivery Users
            </Typography>
            {loading ? (
              <Typography color="text.secondary">Loading delivery users...</Typography>
            ) : deliveryBoys.length === 0 ? (
              <Typography color="text.secondary">No delivery user yet.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Delivery ID</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Company Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deliveryBoys.map((deliveryBoy) => (
                      <TableRow
                        key={deliveryBoy._id}
                        sx={
                          deliveryBoy.deliveryBoyId === editingId
                            ? {
                                backgroundColor: 'action.selected',
                                '& td': { fontWeight: 600 }
                              }
                            : {}
                        }
                      >
                        <TableCell>{deliveryBoy.deliveryBoyName || 'N/A'}</TableCell>
                        <TableCell>{deliveryBoy.deliveryBoyId || 'N/A'}</TableCell>
                        <TableCell>{deliveryBoy.phoneNo || 'N/A'}</TableCell>
                        <TableCell>{deliveryBoy.companyEmail || 'N/A'}</TableCell>
                        <TableCell>{STATUS_OPTIONS.find((option) => option.value === deliveryBoy.status)?.label || 'N/A'}</TableCell>
                        <TableCell>{deliveryBoy.address || 'N/A'}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" onClick={() => handleEdit(deliveryBoy)}>
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
      <AppToast open={toast.open} message={toast.message} severity={toast.severity} onClose={closeToast} />
    </Box>
  );
}

export default DeliveryManager;

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import API from '../../../api/api';

function EmployeeSupportSection({ employeeId, showToast }) {
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'HR',
    description: '',
    priority: 'Medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!employeeId) return;

    try {
      const res = await API.get(`/employee-portal/${employeeId}/support`);
      setRequests(res.data?.requests || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load support requests.', 'error');
    }
  }, [employeeId, showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      const res = await API.post(`/employee-portal/${employeeId}/support`, formData);
      showToast(res.data?.message || 'Support request submitted successfully.', 'success');
      setFormData({ subject: '', category: 'HR', description: '', priority: 'Medium' });
      fetchRequests();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to submit support request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Raise Support Request</Typography>
            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
              <TextField
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel id="support-category-label">Category</InputLabel>
                <Select
                  labelId="support-category-label"
                  name="category"
                  value={formData.category}
                  label="Category"
                  onChange={handleChange}
                >
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="IT">IT</MenuItem>
                  <MenuItem value="Payroll">Payroll</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Profile">Profile</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="support-priority-label">Priority</InputLabel>
                <Select
                  labelId="support-priority-label"
                  name="priority"
                  value={formData.priority}
                  label="Priority"
                  onChange={handleChange}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                multiline
                minRows={4}
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>My Requests</Typography>
            <Stack spacing={1.25}>
              {requests.length === 0 ? (
                <Typography color="text.secondary">No support requests raised yet.</Typography>
              ) : (
                requests.map((request) => (
                  <Card key={request._id} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ py: '12px !important' }}>
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                        <Stack spacing={0.5}>
                          <Typography fontWeight={700}>{request.subject}</Typography>
                          <Typography variant="body2" color="text.secondary">{request.description}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.category} • {new Date(request.createdAt).toLocaleDateString()}
                          </Typography>
                        </Stack>
                        <Stack spacing={0.75} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                          <Typography fontWeight={700}>{request.status}</Typography>
                          <Typography variant="caption" color="text.secondary">{request.priority}</Typography>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default EmployeeSupportSection;

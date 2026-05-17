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

const toDisplayDate = (value) => (value ? new Date(value).toLocaleDateString() : '--');

function EmployeeLeaveSection({ employeeId, showToast }) {
  const [leaveData, setLeaveData] = useState({ leaveBalance: [], leaves: [] });
  const [formData, setFormData] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeaves = useCallback(async () => {
    if (!employeeId) return;

    try {
      const res = await API.get(`/employee-portal/${employeeId}/leaves`);
      setLeaveData({
        leaveBalance: res.data?.leaveBalance || [],
        leaves: res.data?.leaves || []
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load leaves.', 'error');
    }
  }, [employeeId, showToast]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      const res = await API.post(`/employee-portal/${employeeId}/leaves`, formData);
      showToast(res.data?.message || 'Leave request submitted successfully.', 'success');
      setFormData({ leaveType: 'Casual', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to submit leave request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Apply Leave</Typography>
            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
              <FormControl fullWidth>
                <InputLabel id="leave-type-label">Leave Type</InputLabel>
                <Select
                  labelId="leave-type-label"
                  name="leaveType"
                  value={formData.leaveType}
                  label="Leave Type"
                  onChange={handleChange}
                >
                  <MenuItem value="Casual">Casual</MenuItem>
                  <MenuItem value="Sick">Sick</MenuItem>
                  <MenuItem value="Earned">Earned</MenuItem>
                  <MenuItem value="Work From Home">Work From Home</MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
              />
              <TextField
                label="End Date"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
              />
              <TextField
                label="Reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                multiline
                minRows={3}
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Stack spacing={2.5}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Leave Balance</Typography>
              <Grid container spacing={1.5}>
                {leaveData.leaveBalance.map((item) => (
                  <Grid key={item.type} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">{item.type}</Typography>
                        <Typography variant="h5" fontWeight={800}>{item.remaining}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Used {item.used} of {item.total}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Recent Leave Requests</Typography>
              <Stack spacing={1.25}>
                {leaveData.leaves.length === 0 ? (
                  <Typography color="text.secondary">No leave requests yet.</Typography>
                ) : (
                  leaveData.leaves.map((leave) => (
                    <Card key={leave._id} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ py: '12px !important' }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                          <Typography fontWeight={700}>{leave.leaveType}</Typography>
                          <Typography color="text.secondary">{toDisplayDate(leave.startDate)} - {toDisplayDate(leave.endDate)}</Typography>
                          <Typography color="text.secondary">{leave.days} day(s)</Typography>
                          <Typography fontWeight={700}>{leave.status}</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                          {leave.reason}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  );
}

export default EmployeeLeaveSection;

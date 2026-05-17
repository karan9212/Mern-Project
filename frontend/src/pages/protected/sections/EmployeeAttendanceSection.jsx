import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, CardContent, Grid, Stack, Typography, Chip } from '@mui/material';
import API from '../../../api/api';

const toDisplayDateTime = (value) => (value ? new Date(value).toLocaleString() : '--');

function BoxlessLabel({ label, value }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography fontWeight={600}>{value}</Typography>
    </Stack>
  );
}

function EmployeeAttendanceSection({ employeeId, showToast }) {
  const [attendanceData, setAttendanceData] = useState({
    todayAttendance: null,
    summary: null,
    records: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAttendance = useCallback(async () => {
    if (!employeeId) return;

    try {
      const res = await API.get(`/employee-portal/${employeeId}/attendance`);
      setAttendanceData({
        todayAttendance: res.data?.todayAttendance || null,
        summary: res.data?.summary || null,
        records: res.data?.records || []
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load attendance.', 'error');
    }
  }, [employeeId, showToast]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handlePunch = async () => {
    try {
      setIsSubmitting(true);
      const res = await API.post(`/employee-portal/${employeeId}/attendance/punch`);
      showToast(res.data?.message || 'Attendance updated successfully.', 'success');
      fetchAttendance();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update attendance.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkedIn = Boolean(attendanceData.summary?.checkedIn);

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Today</Typography>
            <Stack spacing={1.25}>
              <Chip
                label={checkedIn ? 'Checked In' : attendanceData.todayAttendance?.punchOut ? 'Completed' : 'Not Started'}
                color={checkedIn ? 'success' : attendanceData.todayAttendance?.punchOut ? 'primary' : 'warning'}
              />
              <Typography color="text.secondary">
                Punch In: {toDisplayDateTime(attendanceData.todayAttendance?.punchIn)}
              </Typography>
              <Typography color="text.secondary">
                Punch Out: {toDisplayDateTime(attendanceData.todayAttendance?.punchOut)}
              </Typography>
              <Typography color="text.secondary">
                Worked Hours: {attendanceData.todayAttendance?.workedHours ?? 0}
              </Typography>
              <Button variant="contained" onClick={handlePunch} disabled={isSubmitting} sx={{ mt: 1 }}>
                {isSubmitting ? 'Saving...' : checkedIn ? 'Punch Out' : 'Punch In'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Monthly Summary</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <Card variant="outlined" sx={{ borderRadius: 2, flex: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Present Days</Typography>
                  <Typography variant="h5" fontWeight={800}>{attendanceData.summary?.presentDaysThisMonth ?? 0}</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ borderRadius: 2, flex: 1 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Hours Logged</Typography>
                  <Typography variant="h5" fontWeight={800}>{attendanceData.summary?.monthlyWorkedHours ?? 0}</Typography>
                </CardContent>
              </Card>
            </Stack>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Recent Attendance</Typography>
            <Stack spacing={1.25}>
              {attendanceData.records.length === 0 ? (
                <Typography color="text.secondary">No attendance records yet.</Typography>
              ) : (
                attendanceData.records.map((record) => (
                  <Card key={record._id} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ py: '12px !important' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                        <BoxlessLabel label="Date" value={record.dateKey} />
                        <BoxlessLabel label="In" value={toDisplayDateTime(record.punchIn)} />
                        <BoxlessLabel label="Out" value={toDisplayDateTime(record.punchOut)} />
                        <BoxlessLabel label="Hours" value={record.workedHours} />
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

export default EmployeeAttendanceSection;

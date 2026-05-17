import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import API from '../../../api/api';

function EmployeeAnnouncementsSection({ showToast }) {
  const [announcements, setAnnouncements] = useState([]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await API.get('/employee-portal/announcements', { params: { audience: 'employee' } });
      setAnnouncements(res.data?.announcements || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load announcements.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>Announcements</Typography>
        <Stack spacing={1.25}>
          {announcements.length === 0 ? (
            <Typography color="text.secondary">No announcements available.</Typography>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement._id} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ py: '14px !important' }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={700}>{announcement.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{announcement.message}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Published on {announcement.publishDate ? new Date(announcement.publishDate).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Stack>
                    <Chip
                      size="small"
                      label={announcement.priority}
                      color={announcement.priority === 'high' ? 'error' : announcement.priority === 'normal' ? 'primary' : 'default'}
                    />
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default EmployeeAnnouncementsSection;

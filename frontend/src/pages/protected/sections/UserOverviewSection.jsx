import React from 'react';
import { Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';

const toDisplayDate = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');

function UserOverviewSection({ profileDetails }) {
  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Account Status</Typography>
            <Chip
              sx={{ mt: 1 }}
              label={profileDetails.status || 'Not Active'}
              color={profileDetails.status === 'Active' ? 'success' : profileDetails.status === 'Deleted' ? 'error' : 'warning'}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">User Category</Typography>
            <Typography variant="h5" fontWeight={800}>{profileDetails.userCategory || 'NP'}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Bookings Completed</Typography>
            <Typography variant="h5" fontWeight={800}>{profileDetails.noOfBookings ?? 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Member Since</Typography>
            <Typography variant="h6" fontWeight={700}>{toDisplayDate(profileDetails.dateOfJoining)}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card sx={{ borderRadius: 3, minHeight: 220 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Account Snapshot</Typography>
            <Stack spacing={1.25}>
              <Typography color="text.secondary">
                This dashboard is focused on your personal account access, profile details and activity summary.
              </Typography>
              <Typography color="text.secondary">
                Employee-only modules like attendance, leave, documents and support are hidden because this login is a normal user account.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Card sx={{ borderRadius: 3, minHeight: 220 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Quick Info</Typography>
            <Stack spacing={1.25}>
              <Chip label={`Phone: ${profileDetails.phoneNo || 'N/A'}`} />
              <Chip label={`Gender: ${profileDetails.gender || 'Other'}`} />
              <Chip label={`Joined: ${toDisplayDate(profileDetails.dateOfJoining)}`} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default UserOverviewSection;

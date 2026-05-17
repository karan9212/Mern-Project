import React from 'react';
import { Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';

function ReportsSection() {
  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Attendance Health</Typography>
            <Typography color="text.secondary">Current month average attendance</Typography>
            <Typography variant="h3" fontWeight={800} sx={{ mt: 1 }}>92%</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Recruitment Funnel</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label="Applied: 84" />
              <Chip label="Shortlisted: 26" color="primary" />
              <Chip label="Interviewed: 12" color="secondary" />
              <Chip label="Offered: 4" color="success" />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default ReportsSection;

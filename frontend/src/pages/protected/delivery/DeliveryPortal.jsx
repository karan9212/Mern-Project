import React from 'react';
import { Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material';

function DeliveryPortal() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2.5}>
        <Typography variant="h4" fontWeight={800}>
          Delivery Portal
        </Typography>
        <Typography color="text.secondary">
          Delivery operations portal is scaffolded. This will manage assignment, route execution,
          out-for-delivery status and completion updates that feed user-side tracking.
        </Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>Assigned Deliveries</Typography>
                <Typography color="text.secondary">
                  Delivery boys will see their shipment queue and confirm handoff to the user here.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>Live Route Flow</Typography>
                <Typography color="text.secondary">
                  Route and navigation tracking will connect to the user order-tracking timeline next.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>Delivery Confirmation</Typography>
                <Typography color="text.secondary">
                  Delivered state updates will be pushed from here back into rental orders.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}

export default DeliveryPortal;

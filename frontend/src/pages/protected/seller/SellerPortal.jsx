import React from 'react';
import { Card, CardContent, Container, Grid, Stack, Typography } from '@mui/material';

function SellerPortal() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2.5}>
        <Typography variant="h4" fontWeight={800}>
          Seller Portal
        </Typography>
        <Typography color="text.secondary">
          Seller operations portal is now scaffolded. This is where inventory control, order acceptance,
          packing confirmation, and seller-side order management will live next.
        </Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>Incoming Orders</Typography>
                <Typography color="text.secondary">
                  Orders assigned to sellers will appear here for confirmation and packing.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>Inventory Sync</Typography>
                <Typography color="text.secondary">
                  Product availability, rental stock and seller activity controls will be connected here.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>Customer Contact</Typography>
                <Typography color="text.secondary">
                  Seller-to-user contact and pickup/delivery coordination will be routed from this portal.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}

export default SellerPortal;

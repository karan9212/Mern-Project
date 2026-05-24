import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography
} from '@mui/material';
import API from '../../../../api/api';

function UserTrackOrdersSection({ userId, refreshKey = 0, showToast }) {
  const [orders, setOrders] = useState([]);

  const fetchTrackingOrders = useCallback(async () => {
    try {
      const res = await API.get(`/user-portal/${userId}/orders`);
      const nextOrders = res.data?.orders || [];
      setOrders((prev) => {
        const prevSerialized = JSON.stringify(prev);
        const nextSerialized = JSON.stringify(nextOrders);
        return prevSerialized === nextSerialized ? prev : nextOrders;
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load tracked orders.', 'error');
    }
  }, [showToast, userId]);

  useEffect(() => {
    fetchTrackingOrders();
    const intervalId = setInterval(fetchTrackingOrders, 15000);
    return () => clearInterval(intervalId);
  }, [fetchTrackingOrders, refreshKey]);

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Track Orders</Typography>
            <Typography color="text.secondary">
              Live order progress from seller confirmation to final delivery.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {orders.length === 0 ? (
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography color="text.secondary">
                No trackable orders yet. Place an order to see live fulfillment status here.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ) : null}

      {orders.map((order) => {
        const trackingSteps = order.trackingSnapshot?.steps || [];
        const activeStep = Number.isInteger(order.trackingSnapshot?.activeStep) ? order.trackingSnapshot.activeStep : 0;

        return (
          <Grid key={order.orderReference} size={{ xs: 12 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
                    <Stack spacing={0.35}>
                      <Typography fontWeight={700}>{order.productName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Seller: {order.sellerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Order Ref: {order.orderReference}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={order.paymentStatus} color={order.paymentStatus === 'paid' ? 'success' : 'warning'} />
                      <Chip label={order.trackingStatus?.replaceAll('_', ' ') || 'order placed'} variant="outlined" />
                    </Stack>
                  </Stack>

                  <Stepper
                    alternativeLabel
                    activeStep={activeStep < 0 ? 0 : activeStep}
                    sx={{ overflowX: 'auto', py: 1 }}
                  >
                    {trackingSteps.map((step) => (
                      <Step key={step.key} completed={step.completed}>
                        <StepLabel>{step.label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Estimated delivery
                      </Typography>
                      <Typography fontWeight={700}>
                        {order.estimatedDeliveryAt ? new Date(order.estimatedDeliveryAt).toLocaleString() : 'To be assigned'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Delivery partner
                      </Typography>
                      <Typography fontWeight={700}>
                        {order.assignedDeliveryBoy?.name || 'Awaiting assignment'}
                      </Typography>
                      {order.assignedDeliveryBoy?.phoneNo ? (
                        <Typography variant="caption" color="text.secondary">
                          {order.assignedDeliveryBoy.phoneNo}
                        </Typography>
                      ) : null}
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Rental schedule
                      </Typography>
                      <Typography fontWeight={700}>
                        {new Date(order.rentalStartDate).toLocaleDateString()} to {new Date(order.rentalEndDate).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default UserTrackOrdersSection;

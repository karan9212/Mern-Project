import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import API from '../../../../api/api';

function UserOrdersSection({ userId, refreshKey = 0, showToast }) {
  const [orders, setOrders] = useState([]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await API.get(`/user-portal/${userId}/orders`);
      const nextOrders = res.data?.orders || [];
      setOrders((prev) => {
        const prevSerialized = JSON.stringify(prev);
        const nextSerialized = JSON.stringify(nextOrders);
        return prevSerialized === nextSerialized ? prev : nextOrders;
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load orders.', 'error');
    }
  }, [showToast, userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refreshKey]);

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>My Rental Orders</Typography>
            {orders.length === 0 ? (
              <Typography color="text.secondary">
                You have not placed a rental order yet.
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                {orders.map((order) => (
                  <Card key={order.orderReference} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ py: '14px !important' }}>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, md: 5 }}>
                          <Typography fontWeight={700}>{order.productName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Seller: {order.sellerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Ref: {order.orderReference}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Rental: {new Date(order.rentalStartDate).toLocaleDateString()} to {new Date(order.rentalEndDate).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Quantity: {order.quantity} • Days: {order.rentalDays}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={0.75}>
                            <Typography fontWeight={700}>Rs. {order.pricing?.totalAmount || 0}</Typography>
                            <Chip size="small" label={order.paymentStatus} color={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'failed' ? 'error' : 'warning'} />
                            <Chip size="small" label={order.orderStatus} variant="outlined" />
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default UserOrdersSection;

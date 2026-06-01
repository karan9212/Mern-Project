import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import API from '../../../api/api';
import AppToast from '../../../components/common/AppToast';
import PanelCard from '../../../components/common/PanelCard';
import useToast from '../../../hooks/useToast';

const OrderRow = ({ order, children }) => (
  <PanelCard>
    <Stack spacing={1}>
      <Typography variant="h6" fontWeight={700}>
        {order.productName}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Order: {order.orderReference} | Customer: {order.userName}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Seller: {order.sellerName} | Qty: {order.quantity}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Tracking: {order.trackingStatus.replaceAll('_', ' ')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Address: {order.deliveryAddress || 'N/A'}
      </Typography>
      {children}
    </Stack>
  </PanelCard>
);

function DeliveryPortal() {
  const deliveryBoyId = localStorage.getItem('userId') || '';
  const deliveryName = localStorage.getItem('name') || 'Delivery User';
  const [tab, setTab] = useState('assigned');
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const { toast, showToast, closeToast } = useToast();

  const fetchDashboard = useCallback(async () => {
    if (!deliveryBoyId) {
      showToast('Delivery session is missing. Please login again.', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await API.get(`/delivery-portal/${deliveryBoyId}/dashboard`);
      setDashboard(response.data);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load delivery portal.', 'error');
    } finally {
      setLoading(false);
    }
  }, [deliveryBoyId, showToast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleOrderAction = async (orderReference, action) => {
    try {
      setActionKey(`${orderReference}-${action}`);
      await API.put(`/delivery-portal/${deliveryBoyId}/orders/${orderReference}/status`, { action });
      showToast('Delivery status updated successfully.', 'success');
      await fetchDashboard();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update delivery status.', 'error');
    } finally {
      setActionKey('');
    }
  };

  const stats = [
    { label: 'Assigned Orders', value: dashboard?.stats?.assignedOrders ?? 0 },
    { label: 'Return Orders', value: dashboard?.stats?.returnOrders ?? 0 },
    { label: 'Completed Handovers', value: dashboard?.stats?.completedHandovers ?? 0 }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(140deg, #0d1220 0%, #151d34 100%)'
            : 'linear-gradient(140deg, #f6f9fc 0%, #e3ecf8 100%)'
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={2.5}>
          <PanelCard>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h4" fontWeight={800}>
                  Delivery Portal
                </Typography>
                <Typography color="text.secondary">
                  {dashboard?.deliveryBoy?.deliveryBoyName || deliveryName} | {dashboard?.deliveryBoy?.deliveryBoyId || deliveryBoyId}
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button variant="outlined" onClick={fetchDashboard} disabled={loading}>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/login';
                  }}
                >
                  Logout
                </Button>
              </Stack>
            </Stack>
          </PanelCard>

          <Grid container spacing={2}>
            {stats.map((item) => (
              <Grid key={item.label} size={{ xs: 12, md: 4 }}>
                <PanelCard>
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {item.value}
                  </Typography>
                </PanelCard>
              </Grid>
            ))}
          </Grid>

          <PanelCard>
            <Tabs value={tab} onChange={(_, value) => setTab(value)}>
              <Tab label="Assigned Deliveries" value="assigned" />
              <Tab label="Return Orders" value="returns" />
              <Tab label="Completed Handovers" value="completed" />
            </Tabs>
          </PanelCard>

          {tab === 'assigned' ? (
            <Stack spacing={2}>
              {(dashboard?.assignedOrders || []).length === 0 ? (
                <PanelCard>
                  <Typography color="text.secondary">No assigned deliveries right now.</Typography>
                </PanelCard>
              ) : (
                dashboard.assignedOrders.map((order) => (
                  <OrderRow key={order.orderReference} order={order}>
                    <Button
                      variant="contained"
                      onClick={() =>
                        handleOrderAction(
                          order.orderReference,
                          order.trackingStatus === 'packed' ? 'start_delivery' : 'delivered_to_customer'
                        )
                      }
                      disabled={
                        actionKey === `${order.orderReference}-start_delivery` ||
                        actionKey === `${order.orderReference}-delivered_to_customer`
                      }
                    >
                      {order.trackingStatus === 'packed' ? 'Start Delivery' : 'Mark Delivered To Customer'}
                    </Button>
                  </OrderRow>
                ))
              )}
            </Stack>
          ) : null}

          {tab === 'returns' ? (
            <Stack spacing={2}>
              {(dashboard?.returnOrders || []).length === 0 ? (
                <PanelCard>
                  <Typography color="text.secondary">No return runs right now.</Typography>
                </PanelCard>
              ) : (
                dashboard.returnOrders.map((order) => (
                  <OrderRow key={order.orderReference} order={order}>
                    <Button
                      variant="contained"
                      onClick={() =>
                        handleOrderAction(
                          order.orderReference,
                          order.trackingStatus === 'delivered' ? 'pickup_return' : 'returned_to_seller'
                        )
                      }
                      disabled={
                        actionKey === `${order.orderReference}-pickup_return` ||
                        actionKey === `${order.orderReference}-returned_to_seller`
                      }
                    >
                      {order.trackingStatus === 'delivered' ? 'Pickup Return From Customer' : 'Hand Back To Seller'}
                    </Button>
                  </OrderRow>
                ))
              )}
            </Stack>
          ) : null}

          {tab === 'completed' ? (
            <Stack spacing={2}>
              {(dashboard?.completedHandovers || []).length === 0 ? (
                <PanelCard>
                  <Typography color="text.secondary">No completed handovers yet.</Typography>
                </PanelCard>
              ) : (
                dashboard.completedHandovers.map((order) => <OrderRow key={order.orderReference} order={order} />)
              )}
            </Stack>
          ) : null}
        </Stack>
      </Container>
      <AppToast open={toast.open} message={toast.message} severity={toast.severity} onClose={closeToast} />
    </Box>
  );
}

export default DeliveryPortal;

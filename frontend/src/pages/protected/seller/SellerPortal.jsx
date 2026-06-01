import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import API from '../../../api/api';
import SimpleLineTrendChart from '../../../components/charts/SimpleLineTrendChart';
import AppToast from '../../../components/common/AppToast';
import PanelCard from '../../../components/common/PanelCard';
import useToast from '../../../hooks/useToast';

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Date(2000, index, 1).toLocaleDateString('en-IN', { month: 'long' })
}));

const viewOptions = [
  { value: 'day', label: 'Day Wise' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' }
];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

const OrderCard = ({ order, children }) => (
  <PanelCard>
    <Stack spacing={1.2}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {order.productName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Order: {order.orderReference} | Customer: {order.userName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Qty: {order.quantity} | Rental: {order.rentalDays} day(s)
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={order.orderStatus} color={order.orderStatus === 'completed' ? 'success' : 'primary'} />
          <Chip label={order.trackingStatus.replaceAll('_', ' ')} variant="outlined" />
        </Stack>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Delivery Address: {order.deliveryAddress || 'N/A'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Delivery Boy: {order.assignedDeliveryBoy?.name || 'Not assigned'} {order.assignedDeliveryBoy?.phoneNo ? `(${order.assignedDeliveryBoy.phoneNo})` : ''}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Created: {formatDate(order.createdAt)} | ETA: {formatDate(order.estimatedDeliveryAt)}
      </Typography>
      {children}
    </Stack>
  </PanelCard>
);

function SellerPortal() {
  const sellerId = localStorage.getItem('userId') || '';
  const sellerName = localStorage.getItem('name') || 'Seller';
  const [tab, setTab] = useState('overview');
  const [view, setView] = useState('day');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const { toast, showToast, closeToast } = useToast();

  const fetchDashboard = useCallback(async () => {
    if (!sellerId) {
      showToast('Seller session is missing. Please login again.', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await API.get(`/seller-portal/${sellerId}/dashboard`, {
        params: { view, month, year }
      });
      setDashboardData(response.data);
      if (response.data?.salesChart?.year && response.data.salesChart.year !== year) {
        setYear(response.data.salesChart.year);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load seller dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, sellerId, showToast, view, year]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleOrderAction = async (orderReference, action) => {
    try {
      setActionKey(`${orderReference}-${action}`);
      await API.put(`/seller-portal/${sellerId}/orders/${orderReference}/status`, { action });
      showToast('Order updated successfully.', 'success');
      await fetchDashboard();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update seller order.', 'error');
    } finally {
      setActionKey('');
    }
  };

  const statCards = useMemo(
    () => [
      { label: 'Products Listed', value: dashboardData?.stats?.totalProducts ?? 0 },
      { label: 'Available Products', value: dashboardData?.stats?.availableProducts ?? 0 },
      { label: 'Out Of Stock', value: dashboardData?.stats?.outOfStockProducts ?? 0 },
      { label: 'Open Requests', value: dashboardData?.stats?.openRequests ?? 0 },
      { label: 'Running Orders', value: dashboardData?.stats?.runningOrders ?? 0 },
      { label: 'Awaiting Completion', value: dashboardData?.stats?.completionRequests ?? 0 }
    ],
    [dashboardData]
  );

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
                  Seller Portal
                </Typography>
                <Typography color="text.secondary">
                  {dashboardData?.seller?.sellerName || sellerName} | {dashboardData?.seller?.sellerId || sellerId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {dashboardData?.seller?.companyEmail || 'No company email'} | {dashboardData?.seller?.sellerContact || 'No phone'}
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
            {statCards.map((card) => (
              <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 2 }}>
                <PanelCard>
                  <Typography variant="body2" color="text.secondary">
                    {card.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {card.value}
                  </Typography>
                </PanelCard>
              </Grid>
            ))}
          </Grid>

          <PanelCard>
            <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ lg: 'center' }}>
              <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" allowScrollButtonsMobile>
                <Tab label="Overview" value="overview" />
                <Tab label="Order Requests" value="requests" />
                <Tab label="Running Orders" value="running" />
                <Tab label="Complete Order Requests" value="completed" />
              </Tabs>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="seller-view-label">View</InputLabel>
                  <Select labelId="seller-view-label" label="View" value={view} onChange={(event) => setView(event.target.value)}>
                    {viewOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {view === 'day' ? (
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel id="seller-month-label">Month</InputLabel>
                    <Select labelId="seller-month-label" label="Month" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
                      {monthOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : null}
                {view !== 'year' ? (
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel id="seller-year-label">Year</InputLabel>
                    <Select labelId="seller-year-label" label="Year" value={year} onChange={(event) => setYear(Number(event.target.value))}>
                      {(dashboardData?.salesChart?.availableYears || [year]).map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : null}
              </Stack>
            </Stack>
          </PanelCard>

          {tab === 'overview' ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <PanelCard>
                  <SimpleLineTrendChart
                    title="Order Trend"
                    subtitle={dashboardData?.salesChart?.rangeLabel || 'Seller order flow'}
                    data={dashboardData?.salesChart?.series || []}
                    lineColor="#1565c0"
                    fillColor="rgba(21, 101, 192, 0.12)"
                  />
                </PanelCard>
              </Grid>
              <Grid size={{ xs: 12, lg: 5 }}>
                <PanelCard>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Products This Seller Keeps
                  </Typography>
                  <Stack spacing={1}>
                    {(dashboardData?.inventory || []).length === 0 ? (
                      <Typography color="text.secondary">No products mapped to this seller yet.</Typography>
                    ) : (
                      dashboardData.inventory.map((item) => (
                        <Stack
                          key={`${item.productid}-${item.productName}`}
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          spacing={1}
                          sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
                        >
                          <Box>
                            <Typography fontWeight={700}>{item.productName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.category || 'N/A'} | {item.brand || 'N/A'}
                            </Typography>
                          </Box>
                          <Chip
                            label={item.status === 'active' ? 'Available' : 'Out Of Stock'}
                            color={item.status === 'active' ? 'success' : 'warning'}
                          />
                        </Stack>
                      ))
                    )}
                  </Stack>
                </PanelCard>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <PanelCard>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Available Products
                  </Typography>
                  <Stack spacing={1}>
                    {(dashboardData?.availableProducts || []).length === 0 ? (
                      <Typography color="text.secondary">No available products right now.</Typography>
                    ) : (
                      dashboardData.availableProducts.map((item) => (
                        <Typography key={`${item.productid}-${item.productName}`}>{item.productName}</Typography>
                      ))
                    )}
                  </Stack>
                </PanelCard>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <PanelCard>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Out Of Stock Products
                  </Typography>
                  <Stack spacing={1}>
                    {(dashboardData?.outOfStockProducts || []).length === 0 ? (
                      <Typography color="text.secondary">Everything mapped to this seller is currently available.</Typography>
                    ) : (
                      dashboardData.outOfStockProducts.map((item) => (
                        <Typography key={`${item.productid}-${item.productName}`}>{item.productName}</Typography>
                      ))
                    )}
                  </Stack>
                </PanelCard>
              </Grid>
            </Grid>
          ) : null}

          {tab === 'requests' ? (
            <Stack spacing={2}>
              {(dashboardData?.orderRequests || []).length === 0 ? (
                <PanelCard>
                  <Typography color="text.secondary">No pending order requests right now.</Typography>
                </PanelCard>
              ) : (
                dashboardData.orderRequests.map((order) => {
                  const action =
                    order.trackingStatus === 'order_placed'
                      ? { key: 'accept_order', label: 'Accept Order' }
                      : order.trackingStatus === 'seller_confirmed'
                        ? { key: 'getting_ready', label: 'Mark Getting Ready' }
                        : { key: 'packed', label: 'Mark Packed' };

                  return (
                    <OrderCard key={order.orderReference} order={order}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button
                          variant="contained"
                          onClick={() => handleOrderAction(order.orderReference, action.key)}
                          disabled={actionKey === `${order.orderReference}-${action.key}`}
                        >
                          {actionKey === `${order.orderReference}-${action.key}` ? 'Updating...' : action.label}
                        </Button>
                      </Stack>
                    </OrderCard>
                  );
                })
              )}
            </Stack>
          ) : null}

          {tab === 'running' ? (
            <Stack spacing={2}>
              {(dashboardData?.runningOrders || []).length === 0 ? (
                <PanelCard>
                  <Typography color="text.secondary">No running orders right now.</Typography>
                </PanelCard>
              ) : (
                dashboardData.runningOrders.map((order) => (
                  <OrderCard key={order.orderReference} order={order}>
                    <Typography variant="body2" color="text.secondary">
                      This order has moved beyond seller prep. Delivery-side updates will keep appearing here until the product comes back.
                    </Typography>
                  </OrderCard>
                ))
              )}
            </Stack>
          ) : null}

          {tab === 'completed' ? (
            <Stack spacing={2}>
              <PanelCard>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Awaiting Final Seller Completion
                </Typography>
                <Stack spacing={2}>
                  {(dashboardData?.completionRequests || []).length === 0 ? (
                    <Typography color="text.secondary">No returned orders are waiting for final completion.</Typography>
                  ) : (
                    dashboardData.completionRequests.map((order) => (
                      <OrderCard key={order.orderReference} order={order}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleOrderAction(order.orderReference, 'mark_completed')}
                          disabled={actionKey === `${order.orderReference}-mark_completed`}
                        >
                          {actionKey === `${order.orderReference}-mark_completed` ? 'Updating...' : 'Mark Order Completed'}
                        </Button>
                      </OrderCard>
                    ))
                  )}
                </Stack>
              </PanelCard>

              <PanelCard>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Completed Orders
                </Typography>
                <Stack spacing={2}>
                  {(dashboardData?.completedOrders || []).length === 0 ? (
                    <Typography color="text.secondary">No completed orders yet.</Typography>
                  ) : (
                    dashboardData.completedOrders.map((order) => (
                      <OrderCard key={order.orderReference} order={order} />
                    ))
                  )}
                </Stack>
              </PanelCard>
            </Stack>
          ) : null}
        </Stack>
      </Container>
      <AppToast open={toast.open} message={toast.message} severity={toast.severity} onClose={closeToast} />
    </Box>
  );
}

export default SellerPortal;

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import API from '../../../../api/api';
import RankedBarChart from '../../../../components/charts/RankedBarChart';

function UserPortalOverviewSection({ userId, showToast }) {
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    topOrderedProducts: [],
    topSearchedProducts: [],
    recentOrders: []
  });

  const fetchDashboard = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await API.get(`/user-portal/${userId}/dashboard`);
      const nextData = {
        stats: res.data?.stats || null,
        topOrderedProducts: res.data?.topOrderedProducts || [],
        topSearchedProducts: res.data?.topSearchedProducts || [],
        recentOrders: res.data?.recentOrders || []
      };

      setDashboardData((prev) => {
        const prevSerialized = JSON.stringify(prev);
        const nextSerialized = JSON.stringify(nextData);
        return prevSerialized === nextSerialized ? prev : nextData;
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load user dashboard.', 'error');
    }
  }, [showToast, userId]);

  useEffect(() => {
    fetchDashboard();
    const intervalId = setInterval(fetchDashboard, 20000);
    const handleFocus = () => fetchDashboard();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchDashboard]);

  const stats = dashboardData.stats || {};

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Orders Placed</Typography>
            <Typography variant="h4" fontWeight={800}>{stats.totalOrders ?? 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Total Spend</Typography>
            <Typography variant="h4" fontWeight={800}>Rs. {stats.totalSpent ?? 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Favorite Product</Typography>
            <Typography variant="h6" fontWeight={700}>{stats.favoriteProduct || 'No orders yet'}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Most Searched</Typography>
            <Typography variant="h6" fontWeight={700}>{stats.mostSearchedProduct || 'No searches yet'}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <RankedBarChart
          title="Most Ordered Products"
          subtitle="Products you have rented the most so far."
          items={dashboardData.topOrderedProducts}
          emptyMessage="No completed orders yet. Your most rented products will appear here."
          barGradient="linear-gradient(90deg, #0f766e 0%, #14b8a6 100%)"
        />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <RankedBarChart
          title="Most Searched Products"
          subtitle="Search terms with the highest frequency in your portal activity."
          items={dashboardData.topSearchedProducts}
          emptyMessage="No search activity yet. Search for products to build this insight."
          barGradient="linear-gradient(90deg, #7c3aed 0%, #c084fc 100%)"
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Recent Orders</Typography>
            {dashboardData.recentOrders.length === 0 ? (
              <Typography color="text.secondary">
                You have not placed any rental orders yet.
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                {dashboardData.recentOrders.map((order) => (
                  <Card key={order.orderReference} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ py: '14px !important' }}>
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        spacing={1.5}
                      >
                        <Stack spacing={0.4}>
                          <Typography fontWeight={700}>{order.productName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Seller: {order.sellerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Rental: {new Date(order.rentalStartDate).toLocaleDateString()} to {new Date(order.rentalEndDate).toLocaleDateString()}
                          </Typography>
                        </Stack>
                        <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={0.4}>
                          <Typography fontWeight={700}>Rs. {order.totalAmount}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {order.orderStatus}
                          </Typography>
                        </Stack>
                      </Stack>
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

export default UserPortalOverviewSection;

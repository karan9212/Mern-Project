import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import API from '../../../api/api';
import DailyProductSalesChart from '../../../components/charts/DailyProductSalesChart';
import SellerStatusMap from '../../../components/maps/SellerStatusMap';

const now = new Date();

function EmployeeOverviewSection({ employeeId, showToast }) {
  const [dashboardData, setDashboardData] = useState({
    summary: null,
    announcements: [],
    employee: null
  });
  const [salesFilter, setSalesFilter] = useState({
    view: 'day',
    month: now.getMonth() + 1,
    year: now.getFullYear()
  });
  const [detailState, setDetailState] = useState({
    mode: 'live',
    bucketKey: ''
  });
  const [salesData, setSalesData] = useState({
    series: [],
    summary: null,
    filters: {
      view: 'day',
      selectedMonth: now.getMonth() + 1,
      selectedYear: now.getFullYear(),
      availableYears: [now.getFullYear()]
    },
    productsByBucket: {},
    liveDetail: {
      label: 'Live Today',
      products: []
    }
  });

  const fetchDashboard = useCallback(async () => {
    if (!employeeId) return;

    try {
      const res = await API.get(`/employee-portal/${employeeId}/dashboard`);
      const nextData = {
        summary: res.data?.summary || null,
        announcements: res.data?.announcements || [],
        employee: res.data?.employee || null
      };

      setDashboardData((prev) => {
        const prevSerialized = JSON.stringify(prev);
        const nextSerialized = JSON.stringify(nextData);
        return prevSerialized === nextSerialized ? prev : nextData;
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load employee dashboard.', 'error');
    }
  }, [employeeId, showToast]);

  const fetchProductSales = useCallback(async () => {
    if (!employeeId) return;

    try {
      const res = await API.get(`/employee-portal/${employeeId}/product-sales`, {
        params: {
          view: salesFilter.view,
          month: salesFilter.month,
          year: salesFilter.year
        }
      });

      const nextData = {
        series: res.data?.series || [],
        summary: res.data?.summary || null,
        filters: res.data?.filters || {
          view: salesFilter.view,
          selectedMonth: salesFilter.month,
          selectedYear: salesFilter.year,
          availableYears: [salesFilter.year]
        },
        productsByBucket: res.data?.productsByBucket || {},
        liveDetail: res.data?.liveDetail || {
          label: 'Live Today',
          products: []
        }
      };

      setSalesData((prev) => {
        const prevSerialized = JSON.stringify(prev);
        const nextSerialized = JSON.stringify(nextData);
        return prevSerialized === nextSerialized ? prev : nextData;
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load product sales analytics.', 'error');
    }
  }, [employeeId, salesFilter.month, salesFilter.view, salesFilter.year, showToast]);

  useEffect(() => {
    fetchDashboard();

    const intervalId = setInterval(fetchDashboard, 15000);
    const handleFocus = () => fetchDashboard();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchDashboard]);

  useEffect(() => {
    fetchProductSales();
  }, [fetchProductSales]);

  useEffect(() => {
    const handleFocus = () => {
      if (detailState.mode === 'live') {
        fetchProductSales();
      }
    };

    let intervalId;
    if (detailState.mode === 'live') {
      intervalId = setInterval(fetchProductSales, 15000);
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, [detailState.mode, fetchProductSales]);

  const resetToLive = useCallback(() => {
    setDetailState({ mode: 'live', bucketKey: '' });
  }, []);

  const handleViewChange = useCallback((view) => {
    setSalesFilter((prev) => ({ ...prev, view }));
    resetToLive();
  }, [resetToLive]);

  const handleMonthChange = useCallback((month) => {
    setSalesFilter((prev) => ({ ...prev, month }));
    resetToLive();
  }, [resetToLive]);

  const handleYearChange = useCallback((year) => {
    setSalesFilter((prev) => ({ ...prev, year }));
    resetToLive();
  }, [resetToLive]);

  const handleSelectBucket = useCallback((bucket) => {
    setDetailState({
      mode: 'selection',
      bucketKey: bucket.bucketKey
    });
  }, []);

  const detailLabel = useMemo(() => {
    if (detailState.mode === 'live') {
      return salesData.liveDetail?.label || 'Live Today';
    }

    const selectedBucket = salesData.series.find((item) => item.bucketKey === detailState.bucketKey);
    if (!selectedBucket) return 'Selected Sales Detail';

    if (salesFilter.view === 'year') return `Products sold in ${selectedBucket.label}`;
    if (salesFilter.view === 'month') return `Products sold in ${selectedBucket.label} ${salesFilter.year}`;
    return `Products sold on ${selectedBucket.label} ${salesData.summary?.periodLabel || ''}`.trim();
  }, [detailState.bucketKey, detailState.mode, salesData.liveDetail?.label, salesData.series, salesData.summary?.periodLabel, salesFilter.view, salesFilter.year]);

  const detailProducts = useMemo(() => {
    if (detailState.mode === 'live') {
      return salesData.liveDetail?.products || [];
    }
    return salesData.productsByBucket?.[detailState.bucketKey] || [];
  }, [detailState.bucketKey, detailState.mode, salesData.liveDetail?.products, salesData.productsByBucket]);

  const summary = dashboardData.summary || {};
  const employee = dashboardData.employee || {};

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Today&apos;s Attendance</Typography>
            <Typography variant="h5" fontWeight={800}>{summary.attendanceStatus || '--'}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Hours This Month</Typography>
            <Typography variant="h5" fontWeight={800}>{summary.monthlyWorkedHours ?? '--'}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Pending Leaves</Typography>
            <Typography variant="h5" fontWeight={800}>{summary.pendingLeaves ?? 0}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Open Support Tickets</Typography>
            <Typography variant="h5" fontWeight={800}>{summary.openSupportCount ?? 0}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <DailyProductSalesChart
          view={salesFilter.view}
          selectedMonth={salesFilter.month}
          selectedYear={salesFilter.year}
          data={salesData.series}
          summary={salesData.summary || {}}
          filters={salesData.filters}
          selectedBucketKey={detailState.bucketKey}
          detailMode={detailState.mode}
          detailLabel={detailLabel}
          detailProducts={detailProducts}
          onViewChange={handleViewChange}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
          onSelectBucket={handleSelectBucket}
          onActivateLive={resetToLive}
        />
      </Grid>

      <SellerStatusMap showToast={showToast} />

      <Grid size={{ xs: 12, lg: 7 }}>
        <Card sx={{ borderRadius: 3, minHeight: 260 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Work Snapshot</Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Department</Typography>
                    <Typography fontWeight={700}>{employee.department || 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Role</Typography>
                    <Typography fontWeight={700}>{employee.position || 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Present Days This Month</Typography>
                    <Typography fontWeight={700}>{summary.presentDaysThisMonth ?? 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Documents On File</Typography>
                    <Typography fontWeight={700}>{summary.documentCount ?? 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 5 }}>
        <Card sx={{ borderRadius: 3, minHeight: 260 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Announcements</Typography>
            <Stack spacing={1.25}>
              {dashboardData.announcements.length === 0 ? (
                <Typography color="text.secondary">No announcements available.</Typography>
              ) : (
                dashboardData.announcements.map((announcement) => (
                  <Card key={announcement._id} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ py: '12px !important' }}>
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Typography fontWeight={700}>{announcement.title}</Typography>
                        <Chip
                          size="small"
                          label={announcement.priority}
                          color={announcement.priority === 'high' ? 'error' : announcement.priority === 'normal' ? 'primary' : 'default'}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        {announcement.message}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default EmployeeOverviewSection;

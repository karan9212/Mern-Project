import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import PanelCard from '../common/PanelCard';

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const VIEW_OPTIONS = [
  { value: 'day', label: 'Day Wise' },
  { value: 'month', label: 'Month Wise' },
  { value: 'year', label: 'Year Wise' }
];

function DailyProductSalesChart({
  view = 'day',
  selectedMonth,
  selectedYear,
  data = [],
  summary = {},
  filters = {},
  selectedBucketKey = '',
  detailMode = 'live',
  detailLabel = '',
  detailProducts = [],
  onViewChange,
  onMonthChange,
  onYearChange,
  onSelectBucket,
  onActivateLive
}) {
  const maxMainQuantity = useMemo(
    () => Math.max(...data.map((item) => item.totalQuantity || 0), 1),
    [data]
  );

  const maxDetailQuantity = useMemo(
    () => Math.max(...detailProducts.map((item) => item.totalQuantity || 0), 1),
    [detailProducts]
  );

  const yearOptions = useMemo(() => {
    const availableYears = Array.isArray(filters.availableYears) ? filters.availableYears : [];
    const nextYears = [...new Set([selectedYear, ...availableYears].filter(Boolean))];
    return nextYears.sort((a, b) => b - a);
  }, [filters.availableYears, selectedYear]);

  const selectedBucket = data.find((item) => item.bucketKey === selectedBucketKey) || null;
  const isLiveMode = detailMode === 'live';

  return (
    <PanelCard sx={{ minHeight: 520 }}>
      <Stack
        direction={{ xs: 'column', xl: 'row' }}
        justifyContent="space-between"
        spacing={1.5}
        mb={2.5}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>Product Sales Analytics</Typography>
          <Typography variant="body2" color="text.secondary">
            Switch between daily, monthly and yearly sales. Click any bar to inspect the products sold in that period.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="product-sales-view-label">View</InputLabel>
            <Select
              labelId="product-sales-view-label"
              value={view}
              label="View"
              onChange={(event) => onViewChange?.(event.target.value)}
            >
              {VIEW_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {view === 'day' ? (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="product-sales-month-label">Month</InputLabel>
              <Select
                labelId="product-sales-month-label"
                value={selectedMonth}
                label="Month"
                onChange={(event) => onMonthChange?.(Number(event.target.value))}
              >
                {MONTH_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          {view !== 'year' ? (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="product-sales-year-label">Year</InputLabel>
              <Select
                labelId="product-sales-year-label"
                value={selectedYear}
                label="Year"
                onChange={(event) => onYearChange?.(Number(event.target.value))}
              >
                {yearOptions.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
        <Chip label={`Period: ${summary.periodLabel || '--'}`} color="default" variant="outlined" />
        <Chip label={`Total Units: ${summary.totalUnits ?? 0}`} color="primary" variant="outlined" />
        <Chip label={`Products Sold: ${summary.uniqueProductsSold ?? 0}`} color="secondary" variant="outlined" />
        <Chip label={`${summary.averageLabel || 'Average'}: ${summary.averageUnitsPerBucket ?? 0}`} color="success" variant="outlined" />
        <Chip
          label={`Best ${view === 'year' ? 'Year' : view === 'month' ? 'Month' : 'Day'}: ${summary.bestBucket?.label || '--'} (${summary.bestBucket?.totalQuantity || 0})`}
          color="warning"
          variant="outlined"
        />
      </Stack>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <PanelCard variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Main Sales Graph
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Click a bar to inspect which products were sold in that selected period.
            </Typography>

            {data.length === 0 ? (
              <Typography color="text.secondary">No sales data available for this view.</Typography>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
                  gap: view === 'year' ? 1.5 : 0.85,
                  alignItems: 'end',
                  minHeight: 280
                }}
              >
                {data.map((item) => {
                  const isSelected = selectedBucket?.bucketKey === item.bucketKey && !isLiveMode;
                  const height = item.totalQuantity > 0 ? Math.max(18, (item.totalQuantity / maxMainQuantity) * 210) : 8;

                  return (
                    <Tooltip
                      key={item.bucketKey}
                      title={`${item.label}: ${item.totalQuantity} units | ${item.uniqueProducts || 0} products | Rs. ${item.totalRevenue || 0}`}
                      arrow
                    >
                      <Stack
                        spacing={0.75}
                        alignItems="center"
                        justifyContent="flex-end"
                        sx={{
                          minHeight: 280,
                          cursor: 'pointer'
                        }}
                        onClick={() => onSelectBucket?.(item)}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {item.totalQuantity}
                        </Typography>
                        <Box
                          sx={{
                            width: '100%',
                            maxWidth: view === 'year' ? 48 : 28,
                            height,
                            borderRadius: 2,
                            background: isSelected
                              ? 'linear-gradient(180deg, #b45309 0%, #f59e0b 100%)'
                              : item.totalQuantity > 0
                                ? 'linear-gradient(180deg, #0f766e 0%, #14b8a6 100%)'
                                : 'linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 100%)',
                            border: '1px solid',
                            borderColor: isSelected
                              ? 'rgba(180, 83, 9, 0.36)'
                              : item.totalQuantity > 0
                                ? 'rgba(15, 118, 110, 0.28)'
                                : 'divider',
                            boxShadow: isSelected
                              ? '0 12px 24px rgba(245, 158, 11, 0.28)'
                              : item.totalQuantity > 0
                                ? '0 10px 20px rgba(20, 184, 166, 0.18)'
                                : 'none',
                            transition: 'transform 160ms ease, box-shadow 160ms ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: isSelected
                                ? '0 14px 28px rgba(245, 158, 11, 0.34)'
                                : item.totalQuantity > 0
                                  ? '0 12px 24px rgba(20, 184, 166, 0.24)'
                                  : 'none'
                            }
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            writingMode: { xs: view === 'year' ? 'initial' : 'vertical-rl', md: 'initial' },
                            transform: { xs: view === 'year' ? 'none' : 'rotate(180deg)', md: 'none' },
                            textAlign: 'center'
                          }}
                        >
                          {item.label}
                        </Typography>
                      </Stack>
                    </Tooltip>
                  );
                })}
              </Box>
            )}
          </PanelCard>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          <PanelCard variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5} mb={1}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Product Count Detail
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {detailLabel || 'Live current product sales'}
                </Typography>
              </Box>
              <Button
                size="small"
                variant={isLiveMode ? 'contained' : 'outlined'}
                color={isLiveMode ? 'success' : 'inherit'}
                onClick={onActivateLive}
              >
                Live
              </Button>
            </Stack>

            {selectedBucket && !isLiveMode ? (
              <Chip
                size="small"
                label={`Selected: ${selectedBucket.label}`}
                color="warning"
                variant="outlined"
                sx={{ mb: 1.5 }}
              />
            ) : null}

            {detailProducts.length === 0 ? (
              <Typography color="text.secondary">No product counts are available for this selection.</Typography>
            ) : (
              <Stack spacing={1.1} sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                {detailProducts.map((product) => (
                  <Box
                    key={`${product.productid}-${product.productName}`}
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography fontWeight={700} noWrap>
                          {product.productName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.category || 'Uncategorized'}
                        </Typography>
                      </Box>
                      <Chip size="small" label={`${product.totalQuantity} sold`} color="primary" />
                    </Stack>
                    <Box
                      sx={{
                        mt: 1,
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: 'action.hover',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: `${Math.max((product.totalQuantity / maxDetailQuantity) * 100, 8)}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)'
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </PanelCard>
        </Grid>
      </Grid>
    </PanelCard>
  );
}

export default DailyProductSalesChart;

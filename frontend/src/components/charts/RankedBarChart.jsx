import React, { useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import PanelCard from '../common/PanelCard';

function RankedBarChart({
  title,
  subtitle,
  items = [],
  emptyMessage,
  barGradient = 'linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)'
}) {
  const maxCount = useMemo(() => Math.max(...items.map((item) => item.count || 0), 1), [items]);

  return (
    <PanelCard sx={{ minHeight: 320 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      ) : null}

      {items.length === 0 ? (
        <Typography color="text.secondary">{emptyMessage}</Typography>
      ) : (
        <Stack spacing={1.35}>
          {items.map((item) => (
            <Box
              key={item.label}
              sx={{
                p: 1.25,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper'
              }}
            >
              <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.75 }}>
                <Typography fontWeight={700} noWrap>
                  {item.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.count}
                </Typography>
              </Stack>
              <Box
                sx={{
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: 'action.hover',
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    width: `${Math.max((item.count / maxCount) * 100, 8)}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: barGradient
                  }}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </PanelCard>
  );
}

export default RankedBarChart;

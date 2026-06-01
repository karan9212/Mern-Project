import React, { useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';

function SimpleLineTrendChart({ title, subtitle, data = [], lineColor = '#1976d2', fillColor = 'rgba(25, 118, 210, 0.12)' }) {
  const chart = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return { points: '', areaPoints: '', maxCount: 1 };
    }

    const width = 100;
    const height = 44;
    const maxCount = Math.max(...data.map((item) => Number(item.count || 0)), 1);
    const stepX = data.length > 1 ? width / (data.length - 1) : width;

    const points = data
      .map((item, index) => {
        const x = data.length === 1 ? width / 2 : index * stepX;
        const y = height - ((Number(item.count || 0) / maxCount) * height);
        return `${x},${y}`;
      })
      .join(' ');

    const areaPoints = `0,44 ${points} 100,44`;

    return { points, areaPoints, maxCount };
  }, [data]);

  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {data.length === 0 ? (
        <Typography color="text.secondary">No graph data available.</Typography>
      ) : (
        <>
          <Box
            sx={{
              width: '100%',
              borderRadius: 3,
              p: 1.5,
              backgroundColor: 'background.default',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <svg viewBox="0 0 100 48" preserveAspectRatio="none" style={{ width: '100%', height: 220 }}>
              <line x1="0" y1="44" x2="100" y2="44" stroke="rgba(120,120,120,0.3)" strokeWidth="0.6" />
              <line x1="0" y1="0" x2="0" y2="44" stroke="rgba(120,120,120,0.3)" strokeWidth="0.6" />
              <polygon points={chart.areaPoints} fill={fillColor} />
              <polyline
                fill="none"
                stroke={lineColor}
                strokeWidth="1.8"
                points={chart.points}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {data.map((item, index) => {
                const x = data.length === 1 ? 50 : index * (100 / (data.length - 1));
                const y = 44 - ((Number(item.count || 0) / chart.maxCount) * 44);
                return (
                  <g key={`${item.key || item.label}-${index}`}>
                    <circle cx={x} cy={y} r="1.8" fill={lineColor} />
                    <title>{`${item.label}: ${item.count}`}</title>
                  </g>
                );
              })}
            </svg>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(data.length, 6)}, minmax(0, 1fr))`,
              gap: 1
            }}
          >
            {data.slice(0, 6).map((item) => (
              <Box key={item.key || item.label} sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography fontWeight={700}>{item.count}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Stack>
  );
}

export default SimpleLineTrendChart;

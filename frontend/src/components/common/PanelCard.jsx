import React from 'react';
import { Card, CardContent } from '@mui/material';

function PanelCard({ children, sx, contentSx, ...cardProps }) {
  return (
    <Card sx={{ borderRadius: 3, ...sx }} {...cardProps}>
      <CardContent sx={contentSx}>{children}</CardContent>
    </Card>
  );
}

export default PanelCard;

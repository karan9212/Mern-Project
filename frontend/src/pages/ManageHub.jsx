import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material';

function ManageHub() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: 4,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(140deg, #0d1220 0%, #151d34 100%)'
            : 'linear-gradient(140deg, #f6f9fc 0%, #e3ecf8 100%)'
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={8} sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Manager Hub
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Temporary page to access all manager sections.
            </Typography>

            <Stack spacing={1.5}>
              <Button variant="contained" onClick={() => navigate('/aadhaar')}>
                Open Aadhaar Manager
              </Button>
              <Button variant="contained" onClick={() => navigate('/products')}>
                Open Product Manager
              </Button>
              <Button variant="contained" onClick={() => navigate('/sellers')}>
                Open Seller Manager
              </Button>
              <Button variant="outlined" onClick={() => navigate('/login')}>
                Back to Login
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default ManageHub;

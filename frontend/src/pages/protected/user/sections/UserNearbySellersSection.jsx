import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import API from '../../../../api/api';
import NearbySellerMap from '../../../../components/maps/NearbySellerMap';
import { calculateDistanceKm, DEFAULT_USER_LOCATION } from '../../../../utils/geo';

function UserNearbySellersSection({ userId, selectedProduct, showToast }) {
  const [userLocation, setUserLocation] = useState(DEFAULT_USER_LOCATION);
  const [locationMessage, setLocationMessage] = useState('Using Delhi service location. Allow browser location for precise nearby sellers.');
  const [sellers, setSellers] = useState([]);

  const fetchSellers = useCallback(async () => {
    try {
      const res = await API.get(`/user-portal/${userId}/sellers`, {
        params: {
          productid: selectedProduct?.productid || ''
        }
      });

      const nextSellers = (res.data?.sellers || []).map((seller) => ({
        ...seller,
        distanceKm: calculateDistanceKm(userLocation, seller.sellerLocationCordinates)
      }));

      setSellers((prev) => {
        const prevSerialized = JSON.stringify(prev);
        const nextSerialized = JSON.stringify(nextSellers);
        return prevSerialized === nextSerialized ? prev : nextSellers;
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load nearby sellers.', 'error');
    }
  }, [selectedProduct?.productid, showToast, userId, userLocation]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        setLocationMessage('Showing nearest sellers from your current browser location.');
      },
      () => {
        setUserLocation(DEFAULT_USER_LOCATION);
        setLocationMessage('Location access denied. Showing nearest sellers from Delhi service location.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    fetchSellers();
    const intervalId = setInterval(fetchSellers, 20000);
    return () => clearInterval(intervalId);
  }, [fetchSellers]);

  const sortedSellers = useMemo(
    () =>
      [...sellers]
        .sort((a, b) => (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER))
        .slice(0, 10),
    [sellers]
  );

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12 }}>
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          {locationMessage}
        </Alert>
      </Grid>
      <Grid size={{ xs: 12, xl: 8 }}>
        <NearbySellerMap
          userLocation={userLocation}
          sellers={sortedSellers}
          title={selectedProduct ? `Nearby Sellers for ${selectedProduct.productName}` : 'Nearby Rental Sellers'}
          subtitle="Live seller locations filtered from active sellers in the marketplace."
        />
      </Grid>
      <Grid size={{ xs: 12, xl: 4 }}>
        <Card sx={{ borderRadius: 3, minHeight: 420 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Seller List
            </Typography>
            {sortedSellers.length === 0 ? (
              <Typography color="text.secondary">
                No active sellers match the current selection.
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                {sortedSellers.map((seller) => (
                  <Card key={seller.sellerId} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ py: '14px !important' }}>
                      <Typography fontWeight={700}>{seller.sellerName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {seller.sellerAddress}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Distance: {typeof seller.distanceKm === 'number' ? `${seller.distanceKm} km` : 'N/A'}
                      </Typography>
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

export default UserNearbySellersSection;

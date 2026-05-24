import React, { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import PanelCard from '../common/PanelCard';

const sellerIcon = L.divIcon({
  className: 'nearby-seller-marker',
  html: '<span style="display:block;width:18px;height:18px;border-radius:50%;background:#0f766e;border:3px solid #ffffff;box-shadow:0 0 0 1px rgba(0,0,0,0.18);"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const userIcon = L.divIcon({
  className: 'nearby-user-marker',
  html: '<span style="display:block;width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 0 1px rgba(0,0,0,0.18);"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

function FitMapBounds({ userLocation, sellers }) {
  const map = useMap();

  useEffect(() => {
    const bounds = [
      [userLocation.lat, userLocation.lng],
      ...sellers.map((seller) => [seller.sellerLocationCordinates.lat, seller.sellerLocationCordinates.lng])
    ];
    map.fitBounds(bounds, { padding: [36, 36] });
  }, [map, sellers, userLocation]);

  return null;
}

function NearbySellerMap({ userLocation, sellers = [], title = 'Nearby Sellers', subtitle = '' }) {
  const closestDistance = useMemo(() => {
    const distances = sellers.map((seller) => seller.distanceKm).filter((value) => typeof value === 'number');
    return distances.length > 0 ? Math.min(...distances) : null;
  }, [sellers]);

  return (
    <PanelCard sx={{ minHeight: 420 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5} mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle || 'Live seller locations around the current user position.'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`${sellers.length} sellers`} color="primary" variant="outlined" />
          {closestDistance !== null ? (
            <Chip label={`Closest seller: ${closestDistance} km`} color="success" variant="outlined" />
          ) : null}
        </Stack>
      </Stack>

      <Box
        sx={{
          height: 320,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          '& .leaflet-container': {
            height: '100%',
            width: '100%'
          }
        }}
      >
        <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={11} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitMapBounds userLocation={userLocation} sellers={sellers} />
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <Typography fontWeight={700}>You are here</Typography>
            </Popup>
          </Marker>
          {sellers.map((seller) => (
            <Marker
              key={seller.sellerId}
              position={[seller.sellerLocationCordinates.lat, seller.sellerLocationCordinates.lng]}
              icon={sellerIcon}
            >
              <Popup>
                <Stack spacing={0.5}>
                  <Typography fontWeight={700}>{seller.sellerName}</Typography>
                  <Typography variant="body2">{seller.sellerAddress}</Typography>
                  <Typography variant="body2">
                    Distance: {typeof seller.distanceKm === 'number' ? `${seller.distanceKm} km` : 'N/A'}
                  </Typography>
                </Stack>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </PanelCard>
  );
}

export default NearbySellerMap;

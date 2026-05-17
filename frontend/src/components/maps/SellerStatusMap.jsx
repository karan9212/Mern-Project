import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Box, Button, Chip, Grid, Stack, Typography } from '@mui/material';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import API from '../../api/api';
import PanelCard from '../common/PanelCard';
import { refreshEmployeeActivity } from '../../utils/employeeSession';
import { getSellerStatusMeta, normalizeSellerStatus, SELLER_STATUS_ORDER } from '../../utils/sellerStatus';

const DELHI_CENTER = [28.6139, 77.209];
const DELHI_BOUNDS = [
  [28.3, 76.8],
  [28.95, 77.45]
];

function FitMapToSellers({ sellers }) {
  const map = useMap();

  useEffect(() => {
    if (!sellers.length) {
      map.setView(DELHI_CENTER, 10);
      return;
    }

    const bounds = sellers.map((seller) => [seller.sellerLocationCordinates.lat, seller.sellerLocationCordinates.lng]);
    map.fitBounds(bounds, { padding: [36, 36] });
  }, [map, sellers]);

  return null;
}

function SellerStatusMap({ showToast }) {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState(SELLER_STATUS_ORDER);
  const initialLoadRef = useRef(true);

  const fetchSellers = useCallback(async (silent = false) => {
    try {
      if (!silent && initialLoadRef.current) {
        setLoading(true);
      }

      const res = await API.get('/sellers');
      const normalizedSellers = (res.data?.sellers || [])
        .map((seller) => {
          const lat = Number(seller.sellerLocationCordinates?.lat);
          const lng = Number(seller.sellerLocationCordinates?.lng);

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return null;
          }

          return {
            ...seller,
            sellerStatus: normalizeSellerStatus(seller.sellerStatus),
            sellerLocationCordinates: { lat, lng }
          };
        })
        .filter(Boolean);

      setSellers((prev) => {
        const nextSerialized = JSON.stringify(normalizedSellers);
        const prevSerialized = JSON.stringify(prev);
        return nextSerialized === prevSerialized ? prev : normalizedSellers;
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load seller locations.', 'error');
    } finally {
      if (initialLoadRef.current) {
        setLoading(false);
        initialLoadRef.current = false;
      }
    }
  }, [showToast]);

  useEffect(() => {
    fetchSellers();

    const intervalId = setInterval(() => fetchSellers(true), 15000);
    const handleFocus = () => fetchSellers(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchSellers]);

  const statusSummary = useMemo(() => {
    const summary = SELLER_STATUS_ORDER.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
    sellers.forEach((seller) => {
      summary[seller.sellerStatus] = (summary[seller.sellerStatus] || 0) + 1;
    });
    return summary;
  }, [sellers]);

  const filteredSellers = useMemo(
    () => sellers.filter((seller) => selectedStatuses.includes(seller.sellerStatus)),
    [sellers, selectedStatuses]
  );

  const markerIcons = useMemo(
    () =>
      SELLER_STATUS_ORDER.reduce((acc, status) => {
        const statusMeta = getSellerStatusMeta(status);
        acc[status] = L.divIcon({
          className: 'seller-status-marker',
          html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${statusMeta.mapColor};border:3px solid #ffffff;box-shadow:0 0 0 1px rgba(0,0,0,0.15);"></span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -10]
        });
        return acc;
      }, {}),
    []
  );

  const toggleStatus = (status) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((item) => item !== status);
      }
      return [...prev, status];
    });
  };

  const handleOpenSeller = (sellerId) => {
    if (localStorage.getItem('loginAs') === 'employee') {
      refreshEmployeeActivity();
    }
    navigate(`/sellers?sellerId=${encodeURIComponent(sellerId)}`);
  };

  return (
    <>
      <Grid size={{ xs: 12, lg: 8 }}>
        <PanelCard sx={{ minHeight: 420 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Seller Network Map</Typography>
              <Typography variant="body2" color="text.secondary">
                Live seller locations across Delhi, filtered by current account status.
              </Typography>
            </Box>
            <Chip
              label={`${filteredSellers.length} of ${sellers.length} mapped sellers`}
              color="primary"
              variant="outlined"
            />
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {SELLER_STATUS_ORDER.map((status) => {
              const statusMeta = getSellerStatusMeta(status);
              const isSelected = selectedStatuses.includes(status);
              return (
                <Chip
                  key={status}
                  label={`${statusMeta.label} (${statusSummary[status] || 0})`}
                  color={statusMeta.color}
                  variant={isSelected ? 'filled' : 'outlined'}
                  onClick={() => toggleStatus(status)}
                />
              );
            })}
            <Button
              size="small"
              variant="text"
              onClick={() => setSelectedStatuses(SELLER_STATUS_ORDER)}
              disabled={selectedStatuses.length === SELLER_STATUS_ORDER.length}
            >
              Reset Filters
            </Button>
          </Stack>

          {loading ? (
            <Typography color="text.secondary">Loading seller locations...</Typography>
          ) : filteredSellers.length === 0 ? (
            <Typography color="text.secondary">No seller locations are available yet.</Typography>
          ) : (
            <Box
              sx={{
                height: 340,
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
              <MapContainer
                center={DELHI_CENTER}
                zoom={10}
                minZoom={9}
                maxZoom={16}
                scrollWheelZoom
                maxBounds={DELHI_BOUNDS}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitMapToSellers sellers={filteredSellers} />
                {filteredSellers.map((seller) => {
                  const statusMeta = getSellerStatusMeta(seller.sellerStatus);
                  return (
                    <Marker
                      key={seller.sellerId}
                      position={[seller.sellerLocationCordinates.lat, seller.sellerLocationCordinates.lng]}
                      icon={markerIcons[seller.sellerStatus] || markerIcons.active}
                    >
                      <Popup>
                        <Stack spacing={0.75} sx={{ minWidth: 220 }}>
                          <Typography fontWeight={700}>{seller.sellerName}</Typography>
                          <Typography variant="body2">Seller ID: {seller.sellerId}</Typography>
                          <Typography variant="body2">Status: {statusMeta.label}</Typography>
                          <Typography variant="body2">Address: {seller.sellerAddress || 'N/A'}</Typography>
                          <Typography variant="body2">
                            Coordinates: {seller.sellerLocationCordinates.lat}, {seller.sellerLocationCordinates.lng}
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleOpenSeller(seller.sellerId)}
                          >
                            Open Seller Manager
                          </Button>
                        </Stack>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </Box>
          )}
        </PanelCard>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <PanelCard sx={{ minHeight: 420 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Seller Status Summary</Typography>
          <Stack spacing={1.5}>
            {SELLER_STATUS_ORDER.map((status) => {
              const statusMeta = getSellerStatusMeta(status);
              return (
                <PanelCard
                  key={status}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    cursor: 'pointer',
                    borderColor: selectedStatuses.includes(status) ? `${statusMeta.color}.main` : 'divider'
                  }}
                  onClick={() => toggleStatus(status)}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        {statusMeta.label}
                      </Typography>
                      <Typography variant="h5" fontWeight={800}>
                        {statusSummary[status] || 0}
                      </Typography>
                    </Stack>
                    <Chip
                      label={statusMeta.label}
                      color={statusMeta.color}
                      variant="filled"
                    />
                  </Stack>
                </PanelCard>
              );
            })}
          </Stack>

          {/* <Stack spacing={1} sx={{ mt: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>Legend</Typography>
            {SELLER_STATUS_ORDER.map((status) => {
              const statusMeta = getSellerStatusMeta(status);
              return (
                <Stack key={status} direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: statusMeta.mapColor
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {statusMeta.label}
                  </Typography>
                </Stack>
              );
            })}
          </Stack> */}
        </PanelCard>
      </Grid>
    </>
  );
}

export default SellerStatusMap;

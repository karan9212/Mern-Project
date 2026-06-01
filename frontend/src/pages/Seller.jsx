import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Autocomplete,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import API from '../api/api';
import AppToast from '../components/common/AppToast';
import PanelCard from '../components/common/PanelCard';
import useToast from '../hooks/useToast';
import { getSellerStatusMeta, normalizeSellerStatus, SELLER_STATUS_ORDER } from '../utils/sellerStatus';

function Seller() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focusedSellerId, setFocusedSellerId] = useState('');
  const [form, setForm] = useState({
    sellerName: '',
    sellerId: '',
    companyEmail: '',
    sellerCategory: [],
    sellerDescription: '',
    sellerStatus: 'active',
    sellerAddress: '',
    sellerContact: '',
    sellerGstIn: '',
    sellerProducts: [],
    lat: '28.6139',
    lng: '77.2090'
  });
  const { toast, showToast, closeToast } = useToast();
  const formSectionRef = useRef(null);
  const handledSellerQueryRef = useRef('');
  const sellerIdFromQuery = useMemo(
    () => new URLSearchParams(location.search).get('sellerId')?.trim() || '',
    [location.search]
  );
  const backPath = localStorage.getItem('loginAs') === 'employee' ? '/dashboard' : '/login';

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [sellerRes, productRes] = await Promise.all([API.get('/sellers'), API.get('/products')]);
      setSellers(sellerRes.data?.sellers || []);
      setProducts(productRes.data?.products || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch seller/product data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const categoryOptions = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products]
  );
  const productOptions = useMemo(
    () => [...new Set(products.map((p) => p.productName).filter(Boolean))].sort(),
    [products]
  );

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setForm({
      sellerName: '',
      sellerId: '',
      companyEmail: '',
      sellerCategory: [],
      sellerDescription: '',
      sellerStatus: 'active',
      sellerAddress: '',
      sellerContact: '',
      sellerGstIn: '',
      sellerProducts: [],
      lat: '28.6139',
      lng: '77.2090'
    });
  };

  const handleEdit = (seller) => {
    setFocusedSellerId(seller.sellerId || '');
    setForm({
      sellerName: seller.sellerName || '',
      sellerId: seller.sellerId || '',
      companyEmail: seller.companyEmail || '',
      sellerCategory: Array.isArray(seller.sellerCategory) ? seller.sellerCategory : [],
      sellerDescription: seller.sellerDescription || '',
      sellerStatus: normalizeSellerStatus(seller.sellerStatus || 'active'),
      sellerAddress: seller.sellerAddress || '',
      sellerContact: seller.sellerContact || '',
      sellerGstIn: seller.sellerGstIn || '',
      sellerProducts: Array.isArray(seller.sellerProducts) ? seller.sellerProducts : [],
      lat: String(seller.sellerLocationCordinates?.lat ?? 28.6139),
      lng: String(seller.sellerLocationCordinates?.lng ?? 77.2090)
    });
  };

  useEffect(() => {
    if (!sellerIdFromQuery) {
      handledSellerQueryRef.current = '';
      return;
    }

    if (loading || sellers.length === 0 || handledSellerQueryRef.current === sellerIdFromQuery) {
      return;
    }

    const targetSeller = sellers.find((seller) => seller.sellerId === sellerIdFromQuery);
    handledSellerQueryRef.current = sellerIdFromQuery;

    if (!targetSeller) {
      showToast(`Seller ${sellerIdFromQuery} was not found.`, 'warning');
      return;
    }

    handleEdit(targetSeller);
    showToast(`Loaded ${targetSeller.sellerName} in the seller manager.`, 'info');

    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [sellerIdFromQuery, sellers, loading, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      sellerName: form.sellerName.trim(),
      sellerId: form.sellerId.trim(),
      companyEmail: form.companyEmail.trim().toLowerCase(),
      sellerCategory: form.sellerCategory,
      sellerDescription: form.sellerDescription.trim(),
      sellerStatus: form.sellerStatus,
      sellerAddress: form.sellerAddress.trim(),
      sellerContact: form.sellerContact.trim(),
      sellerGstIn: form.sellerGstIn.trim(),
      sellerProducts: form.sellerProducts,
      sellerLocationCordinates: {
        lat: Number(form.lat),
        lng: Number(form.lng)
      }
    };

    if (!payload.sellerName || !payload.sellerId || !payload.companyEmail) {
      showToast('sellerName, sellerId and companyEmail are required.', 'warning');
      return;
    }

    if (!/^\d{10}$/.test(payload.sellerContact)) {
      showToast('sellerContact must be a valid 10-digit number.', 'warning');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.companyEmail)) {
      showToast('Please enter a valid company email.', 'warning');
      return;
    }

    if (
      !Number.isFinite(payload.sellerLocationCordinates.lat) ||
      !Number.isFinite(payload.sellerLocationCordinates.lng)
    ) {
      showToast('Location coordinates must be valid numbers.', 'warning');
      return;
    }

    try {
      setSaving(true);
      await API.post('/sellers', payload);
      showToast('Seller saved successfully.', 'success');
      resetForm();
      await fetchInitialData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save seller.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(140deg, #0d1220 0%, #151d34 100%)'
            : 'linear-gradient(140deg, #f6f9fc 0%, #e3ecf8 100%)'
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={2.5}>
          <PanelCard>
            <Box ref={formSectionRef}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} mb={2}>
                <Typography variant="h5" fontWeight={700}>
                  Seller Manager
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={fetchInitialData} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Button variant="outlined" onClick={() => navigate(backPath)}>
                    {backPath === '/dashboard' ? 'Back to Dashboard' : 'Back to Login'}
                  </Button>
                </Stack>
              </Stack>

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                    <TextField label="Seller Name" name="sellerName" value={form.sellerName} onChange={handleChange} required fullWidth />
                    <TextField label="Seller ID" name="sellerId" value={form.sellerId} onChange={handleChange} required fullWidth />
                    <TextField label="Company Email" name="companyEmail" value={form.companyEmail} onChange={handleChange} required fullWidth />
                    <TextField label="Seller Contact" name="sellerContact" value={form.sellerContact} onChange={handleChange} required fullWidth />
                  </Stack>
                  <TextField label="Seller GSTIN" name="sellerGstIn" value={form.sellerGstIn} onChange={handleChange} fullWidth />

                  <Autocomplete
                    multiple
                    options={categoryOptions}
                    value={form.sellerCategory}
                    onChange={(_, value) => setForm((prev) => ({ ...prev, sellerCategory: value }))}
                    renderInput={(params) => <TextField {...params} label="Seller Category (multi-select with search)" />}
                  />

                  <Autocomplete
                    multiple
                    options={productOptions}
                    value={form.sellerProducts}
                    onChange={(_, value) => setForm((prev) => ({ ...prev, sellerProducts: value }))}
                    renderInput={(params) => <TextField {...params} label="Seller Products (multi-select with search)" />}
                  />

                  <TextField label="Seller Description" name="sellerDescription" value={form.sellerDescription} onChange={handleChange} fullWidth multiline minRows={2} />
                  <TextField label="Seller Address" name="sellerAddress" value={form.sellerAddress} onChange={handleChange} fullWidth multiline minRows={2} />

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                    <FormControl fullWidth>
                      <InputLabel id="seller-status-label">Seller Status</InputLabel>
                      <Select
                        labelId="seller-status-label"
                        label="Seller Status"
                        name="sellerStatus"
                        value={form.sellerStatus}
                        onChange={handleChange}
                      >
                        {SELLER_STATUS_ORDER.map((status) => (
                          <MenuItem key={status} value={status}>
                            {getSellerStatusMeta(status).label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField label="Latitude (Delhi)" name="lat" value={form.lat} onChange={handleChange} fullWidth />
                    <TextField label="Longitude (Delhi)" name="lng" value={form.lng} onChange={handleChange} fullWidth />
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button type="submit" variant="contained" disabled={saving}>
                      {saving ? 'Saving...' : 'Save / Update Seller'}
                    </Button>
                    <Button type="button" variant="outlined" onClick={resetForm}>
                      Reset
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Box>
          </PanelCard>

          <PanelCard>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Existing Sellers
              </Typography>
              {loading ? (
                <Typography color="text.secondary">Loading sellers...</Typography>
              ) : sellers.length === 0 ? (
                <Typography color="text.secondary">No sellers yet.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Seller Name</TableCell>
                        <TableCell>Seller ID</TableCell>
                        <TableCell>Company Email</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Contact</TableCell>
                        <TableCell>Categories</TableCell>
                        <TableCell>Products</TableCell>
                        <TableCell>Coordinates</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sellers.map((seller) => (
                        <TableRow
                          key={seller._id}
                          sx={
                            seller.sellerId === focusedSellerId
                              ? {
                                  backgroundColor: 'action.selected',
                                  '& td': {
                                    fontWeight: 600
                                  }
                                }
                              : {}
                          }
                        >
                          <TableCell>{seller.sellerName || 'N/A'}</TableCell>
                          <TableCell>{seller.sellerId || 'N/A'}</TableCell>
                          <TableCell>{seller.companyEmail || 'N/A'}</TableCell>
                          <TableCell>{getSellerStatusMeta(seller.sellerStatus).label}</TableCell>
                          <TableCell>{seller.sellerContact || 'N/A'}</TableCell>
                          <TableCell>{Array.isArray(seller.sellerCategory) ? seller.sellerCategory.join(', ') : 'N/A'}</TableCell>
                          <TableCell>{Array.isArray(seller.sellerProducts) ? seller.sellerProducts.join(', ') : 'N/A'}</TableCell>
                          <TableCell>{`${seller.sellerLocationCordinates?.lat ?? 'N/A'}, ${seller.sellerLocationCordinates?.lng ?? 'N/A'}`}</TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="outlined" onClick={() => handleEdit(seller)}>
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
          </PanelCard>
        </Stack>
      </Container>

      <AppToast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={closeToast}
      />
    </Box>
  );
}

export default Seller;

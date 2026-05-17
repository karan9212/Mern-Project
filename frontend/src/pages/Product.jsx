import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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

const toCsv = (arr) => (Array.isArray(arr) ? arr.join(', ') : '');

function Product() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    productName: '',
    hsnCode: '',
    productid: '',
    category: '',
    subcategory: '',
    brand: '',
    description: '',
    productImages: '',
    tags: '',
    status: 'active',
    sellingPrice: '',
    height: '',
    width: '',
    weight: '',
    color: ''
  });
  const { toast, showToast, closeToast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/products');
      setProducts(res.data?.products || []);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to fetch products.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setForm({
      productName: '',
      hsnCode: '',
      productid: '',
      category: '',
      subcategory: '',
      brand: '',
      description: '',
      productImages: '',
      tags: '',
      status: 'active',
      sellingPrice: '',
      height: '',
      width: '',
      weight: '',
      color: ''
    });
  };

  const handleEdit = (product) => {
    setForm({
      productName: product.productName || '',
      hsnCode: product.hsnCode || '',
      productid: product.productid || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      brand: product.brand || '',
      description: product.description || '',
      productImages: toCsv(product.productImages),
      tags: toCsv(product.tags),
      status: product.status || 'active',
      sellingPrice: String(product.sellingPrice ?? ''),
      height: String(product.height ?? ''),
      width: String(product.width ?? ''),
      weight: String(product.weight ?? ''),
      color: product.color || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      productName: form.productName.trim(),
      hsnCode: form.hsnCode.trim(),
      productid: form.productid.trim(),
      category: form.category.trim(),
      subcategory: form.subcategory.trim(),
      brand: form.brand.trim(),
      description: form.description.trim(),
      productImages: form.productImages.trim() ? form.productImages.split(',').map((x) => x.trim()).filter(Boolean) : [],
      tags: form.tags.trim() ? form.tags.split(',').map((x) => x.trim()).filter(Boolean) : [],
      status: form.status,
      sellingPrice: form.sellingPrice === '' ? 0 : Number(form.sellingPrice),
      height: form.height === '' ? 0 : Number(form.height),
      width: form.width === '' ? 0 : Number(form.width),
      weight: form.weight === '' ? 0 : Number(form.weight),
      color: form.color.trim()
    };

    if (!payload.productName || !payload.hsnCode || !payload.productid) {
      showToast('productName, hsnCode and productid are required.', 'warning');
      return;
    }

    if ([payload.sellingPrice, payload.height, payload.width, payload.weight].some((v) => !Number.isFinite(v) || v < 0)) {
      showToast('Price, height, width and weight must be non-negative numbers.', 'warning');
      return;
    }

    try {
      setSaving(true);
      await API.post('/products', payload);
      showToast('Product saved successfully.', 'success');
      resetForm();
      await fetchProducts();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save product.', 'error');
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
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} mb={2}>
                <Typography variant="h5" fontWeight={700}>
                  Product Manager
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={fetchProducts} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/login')}>
                    Back to Login
                  </Button>
                </Stack>
              </Stack>

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                    <TextField label="Product Name" name="productName" value={form.productName} onChange={handleChange} required fullWidth />
                    <TextField label="HSN Code" name="hsnCode" value={form.hsnCode} onChange={handleChange} required fullWidth />
                    <TextField label="Product ID" name="productid" value={form.productid} onChange={handleChange} required fullWidth />
                  </Stack>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                    <TextField label="Category" name="category" value={form.category} onChange={handleChange} fullWidth />
                    <TextField label="Subcategory" name="subcategory" value={form.subcategory} onChange={handleChange} fullWidth />
                    <TextField label="Brand" name="brand" value={form.brand} onChange={handleChange} fullWidth />
                    <TextField label="Color" name="color" value={form.color} onChange={handleChange} fullWidth />
                  </Stack>
                  <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth multiline minRows={2} />
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                    <TextField
                      label="Product Images (comma separated URLs)"
                      name="productImages"
                      value={form.productImages}
                      onChange={handleChange}
                      fullWidth
                    />
                    <TextField label="Tags (comma separated)" name="tags" value={form.tags} onChange={handleChange} fullWidth />
                  </Stack>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                    <FormControl fullWidth>
                      <InputLabel id="product-status-label">Status</InputLabel>
                      <Select
                        labelId="product-status-label"
                        label="Status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                      >
                        <MenuItem value="active">active</MenuItem>
                        <MenuItem value="inactive">inactive</MenuItem>
                        <MenuItem value="discontinued">discontinued</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField label="Selling Price" name="sellingPrice" type="number" value={form.sellingPrice} onChange={handleChange} fullWidth />
                    <TextField label="Height (cm)" name="height" type="number" value={form.height} onChange={handleChange} fullWidth />
                    <TextField label="Width (cm)" name="width" type="number" value={form.width} onChange={handleChange} fullWidth />
                    <TextField label="Weight" name="weight" type="number" value={form.weight} onChange={handleChange} fullWidth />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button type="submit" variant="contained" disabled={saving}>
                      {saving ? 'Saving...' : 'Save / Update Product'}
                    </Button>
                    <Button type="button" variant="outlined" onClick={resetForm}>
                      Reset
                    </Button>
                  </Stack>
                </Stack>
              </Box>
          </PanelCard>

          <PanelCard>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Existing Products
              </Typography>
              {loading ? (
                <Typography color="text.secondary">Loading products...</Typography>
              ) : products.length === 0 ? (
                <Typography color="text.secondary">No products yet.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product Name</TableCell>
                        <TableCell>Product ID</TableCell>
                        <TableCell>HSN</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Brand</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Selling Price</TableCell>
                        <TableCell>Dimensions</TableCell>
                        <TableCell>Weight</TableCell>
                        <TableCell>Color</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product._id}>
                          <TableCell>{product.productName || 'N/A'}</TableCell>
                          <TableCell>{product.productid || 'N/A'}</TableCell>
                          <TableCell>{product.hsnCode || 'N/A'}</TableCell>
                          <TableCell>{product.category || 'N/A'}</TableCell>
                          <TableCell>{product.brand || 'N/A'}</TableCell>
                          <TableCell>{product.status || 'N/A'}</TableCell>
                          <TableCell>{Number(product.sellingPrice || 0).toFixed(2)}</TableCell>
                          <TableCell>{`${product.height || 0} x ${product.width || 0} cm`}</TableCell>
                          <TableCell>{product.weight || 0}</TableCell>
                          <TableCell>{product.color || 'N/A'}</TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="outlined" onClick={() => handleEdit(product)}>
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

export default Product;

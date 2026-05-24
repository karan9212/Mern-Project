import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import API from '../../../../api/api';

function UserCatalogSection({
  userId,
  selectedProduct,
  cartItems = [],
  onSelectProduct,
  onAddToCart,
  onUpdateCartItemQuantity,
  showToast
}) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [catalogData, setCatalogData] = useState({
    products: [],
    filters: {
      categories: []
    }
  });

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await API.get(`/user-portal/${userId}/catalog`, {
        params: {
          q: query,
          category
        }
      });

      const nextData = {
        products: res.data?.products || [],
        filters: res.data?.filters || { categories: [] }
      };

      setCatalogData((prev) => {
        const prevSerialized = JSON.stringify(prev);
        const nextSerialized = JSON.stringify(nextData);
        return prevSerialized === nextSerialized ? prev : nextData;
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load products.', 'error');
    }
  }, [category, query, showToast, userId]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const cleanSearch = searchInput.trim();
    setQuery(cleanSearch);

    if (cleanSearch) {
      try {
        await API.post(`/user-portal/${userId}/search`, { searchTerm: cleanSearch });
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to log search.', 'warning');
      }
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setQuery('');
    setCategory('');
  };

  const getDraftQuantity = (product) =>
    quantityDrafts[product.productid] ||
    cartItems.find((item) => item.productid === product.productid)?.quantity ||
    1;

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box component="form" onSubmit={handleSearchSubmit}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField
                  label="Search products to rent"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  fullWidth
                />
                <TextField
                  select
                  label="Category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  sx={{ minWidth: { md: 220 } }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {(catalogData.filters.categories || []).map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
                <Button type="submit" variant="contained">
                  Search
                </Button>
                <Button type="button" variant="outlined" onClick={handleClearFilters}>
                  Clear
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {cartItems.length > 0 ? (
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Cart Ready</Typography>
                  <Typography color="text.secondary">
                    {cartItems.length} product(s) added. Continue shopping or move to checkout.
                  </Typography>
                </Box>
                <Button variant="contained" onClick={() => navigate('/user-portal/checkout')}>
                  Go To Checkout
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ) : null}

      {catalogData.products.map((product) => {
        const isSelected = selectedProduct?.productid === product.productid;
        const productInCart = cartItems.find((item) => item.productid === product.productid);
        const productQuantity = getDraftQuantity(product);

        return (
          <Grid key={product.productid} size={{ xs: 12, md: 6, xl: 4 }}>
            <Card
              sx={{
                borderRadius: 3,
                height: '100%',
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                boxShadow: isSelected ? '0 12px 32px rgba(31, 100, 255, 0.18)' : 'none'
              }}
            >
              <CardContent>
                <Stack spacing={1.5} height="100%">
                  <Box
                    sx={{
                      height: 180,
                      borderRadius: 2.5,
                      backgroundImage: `url(${product.productImages?.[0] || 'https://picsum.photos/seed/fallback-rent/800/600'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={700} noWrap>
                        {product.productName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.brand} • {product.category}
                      </Typography>
                    </Box>
                    <Chip label={`Rs. ${product.sellingPrice}/day`} color="primary" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {product.description}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={`${product.activeSellerCount || 0} active sellers`} />
                    <Chip size="small" label={product.subcategory || 'General'} />
                    {productInCart ? <Chip size="small" label={`In cart: ${productInCart.quantity}`} color="warning" /> : null}
                    {typeof product.nearestDistanceKm === 'number' ? (
                      <Chip size="small" label={`From ${product.nearestDistanceKm} km`} color="success" variant="outlined" />
                    ) : null}
                  </Stack>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ p: 1, borderRadius: 2, bgcolor: 'action.hover' }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      Quantity
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setQuantityDrafts((prev) => ({
                            ...prev,
                            [product.productid]: Math.max(1, getDraftQuantity(product) - 1)
                          }))
                        }
                      >
                        <RemoveRoundedIcon fontSize="small" />
                      </IconButton>
                      <Typography minWidth={24} textAlign="center" fontWeight={700}>
                        {productQuantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setQuantityDrafts((prev) => ({
                            ...prev,
                            [product.productid]: getDraftQuantity(product) + 1
                          }))
                        }
                      >
                        <AddRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 'auto' }}>
                    <Button
                      variant={productInCart ? 'outlined' : 'contained'}
                      color={productInCart ? 'warning' : 'primary'}
                      fullWidth
                      onClick={() => {
                        const quantityToAdd = Math.max(1, Number(productQuantity) || 1);
                        onAddToCart(product, quantityToAdd);
                        showToast(`${product.productName} added to cart.`, 'success');
                      }}
                    >
                      {productInCart ? 'Add More To Cart' : 'Add To Cart'}
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => {
                        if (!productInCart) {
                          onAddToCart(product, Math.max(1, Number(productQuantity) || 1));
                        } else if (productInCart.quantity !== productQuantity) {
                          onUpdateCartItemQuantity(product.productid, productQuantity);
                        }
                        onSelectProduct(product);
                        navigate('/user-portal/checkout');
                      }}
                    >
                      Rent This
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        onSelectProduct(product);
                        navigate('/user-portal/sellers');
                      }}
                    >
                      View Nearby Sellers
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        );
      })}

      {catalogData.products.length === 0 ? (
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography color="text.secondary">
                No products match the selected filters right now.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ) : null}
    </Grid>
  );
}

export default UserCatalogSection;

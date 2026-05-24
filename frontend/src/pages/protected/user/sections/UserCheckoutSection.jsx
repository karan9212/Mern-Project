import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import API from '../../../../api/api';
import { calculateDistanceKm, DEFAULT_USER_LOCATION } from '../../../../utils/geo';
import { loadRazorpayCheckout } from '../../../../utils/loadRazorpay';

function UserCheckoutSection({
  userId,
  selectedProduct,
  cartItems = [],
  profileDetails,
  onSelectProduct,
  onUpdateCartItemQuantity,
  onRemoveCartItem,
  showToast,
  onOrderPlaced
}) {
  const navigate = useNavigate();
  const checkoutItems = useMemo(() => {
    if (cartItems.length > 0) return cartItems;
    return selectedProduct ? [{ ...selectedProduct, quantity: 1 }] : [];
  }, [cartItems, selectedProduct]);

  const [sellerOptionsByProduct, setSellerOptionsByProduct] = useState({});
  const [sellerSelections, setSellerSelections] = useState({});
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    rentalStartDate: '',
    rentalEndDate: '',
    deliveryAddress: profileDetails.address || ''
  });

  const fetchSellerOptions = useCallback(async () => {
    if (checkoutItems.length === 0) return;

    try {
      const responses = await Promise.all(
        checkoutItems.map((item) =>
          API.get(`/user-portal/${userId}/sellers`, {
            params: { productid: item.productid }
          })
        )
      );

      const nextOptions = {};
      const nextSelections = {};

      responses.forEach((response, index) => {
        const item = checkoutItems[index];
        const sellers = (response.data?.sellers || []).map((seller) => ({
          ...seller,
          distanceKm: calculateDistanceKm(DEFAULT_USER_LOCATION, seller.sellerLocationCordinates)
        }));

        nextOptions[item.productid] = sellers;
        if (sellers.length > 0) {
          nextSelections[item.productid] = sellerSelections[item.productid] || sellers[0].sellerId;
        }
      });

      setSellerOptionsByProduct(nextOptions);
      setSellerSelections((prev) => ({ ...nextSelections, ...prev }));
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load seller options for checkout.', 'error');
    }
  }, [checkoutItems, sellerSelections, showToast, userId]);

  useEffect(() => {
    setCheckoutForm((prev) => ({
      ...prev,
      deliveryAddress: profileDetails.address || prev.deliveryAddress
    }));
  }, [profileDetails.address]);

  useEffect(() => {
    fetchSellerOptions();
  }, [fetchSellerOptions]);

  const orderEstimate = useMemo(() => {
    const startDate = checkoutForm.rentalStartDate ? new Date(checkoutForm.rentalStartDate) : null;
    const endDate = checkoutForm.rentalEndDate ? new Date(checkoutForm.rentalEndDate) : null;
    const rentalDays =
      startDate && endDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate >= startDate
        ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1)
        : 1;
    const subtotal = Number(
      checkoutItems.reduce((sum, item) => sum + Number(item.sellingPrice || 0) * Number(item.quantity || 1) * rentalDays, 0).toFixed(2)
    );
    const deliveryFee = checkoutItems.length > 0 ? 99 : 0;
    const gstAmount = Number((subtotal * 0.18).toFixed(2));
    const totalAmount = Number((subtotal + deliveryFee + gstAmount).toFixed(2));

    return {
      rentalDays,
      subtotal,
      deliveryFee,
      gstAmount,
      totalAmount
    };
  }, [checkoutForm.rentalEndDate, checkoutForm.rentalStartDate, checkoutItems]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCheckoutForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayNow = async () => {
    if (checkoutItems.length === 0) {
      showToast('Please add at least one product to cart before checkout.', 'warning');
      return;
    }

    if (!checkoutForm.rentalStartDate || !checkoutForm.rentalEndDate || !checkoutForm.deliveryAddress.trim()) {
      showToast('Please complete all checkout details.', 'warning');
      return;
    }

    const checkoutLoaded = await loadRazorpayCheckout();
    if (!checkoutLoaded || !window.Razorpay) {
      showToast('Unable to load Razorpay checkout right now.', 'error');
      return;
    }

    try {
      setIsCreatingOrder(true);
      const res = await API.post(`/user-portal/${userId}/checkout/create-order`, {
        items: checkoutItems.map((item) => ({
          productid: item.productid,
          sellerId: sellerSelections[item.productid] || '',
          quantity: Number(item.quantity) || 1
        })),
        rentalStartDate: checkoutForm.rentalStartDate,
        rentalEndDate: checkoutForm.rentalEndDate,
        deliveryAddress: checkoutForm.deliveryAddress
      });

      const order = res.data?.order;
      if (!order?.razorpayOrderId || !order?.keyId) {
        showToast('Payment gateway is not fully configured on the server yet.', 'error');
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amountInPaise,
        currency: order.currency || 'INR',
        name: 'HelpWiser Rentals',
        description: `Rental checkout for ${order.summary?.itemCount || checkoutItems.length} item(s)`,
        order_id: order.razorpayOrderId,
        prefill: order.prefill,
        notes: order.notes,
        theme: { color: '#1f64ff' },
        handler: async (response) => {
          try {
            await API.post(`/user-portal/${userId}/checkout/verify-payment`, {
              orderReference: order.orderReference,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            showToast('Rental order confirmed successfully.', 'success');
            onOrderPlaced?.({
              orderReference: order.orderReference,
              items: checkoutItems
            });
          } catch (error) {
            showToast(error.response?.data?.message || 'Payment verification failed.', 'error');
          }
        },
        modal: {
          ondismiss: () => {
            showToast('Payment window was closed before completion.', 'info');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to start checkout.', 'error');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>Checkout</Typography>
          <Typography color="text.secondary" mb={2}>
            Add products to cart from the catalog to begin your rental checkout.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/user-portal/catalog')}>
            Go To Rent Products
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5} mb={2}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Cart & Checkout</Typography>
                <Typography color="text.secondary">
                  Review products, adjust quantity, remove items, and continue to payment.
                </Typography>
              </Box>
              <Button variant="outlined" onClick={() => navigate('/user-portal/catalog')}>
                Add More Products
              </Button>
            </Stack>

            <Stack spacing={1.5}>
              {checkoutItems.map((item, index) => (
                <Card
                  key={item.productid}
                  variant="outlined"
                  sx={{
                    borderRadius: 2.5,
                    borderColor: selectedProduct?.productid === item.productid ? 'primary.main' : 'divider'
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
                        <Stack spacing={0.35}>
                          <Typography fontWeight={700}>{item.productName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.brand} • {item.category}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.75}>
                          <Button variant="text" onClick={() => onSelectProduct(item)}>
                            Focus
                          </Button>
                          <IconButton color="error" onClick={() => onRemoveCartItem(item.productid)}>
                            <DeleteOutlineRoundedIcon />
                          </IconButton>
                        </Stack>
                      </Stack>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography variant="body2" fontWeight={700}>Quantity</Typography>
                            <IconButton size="small" onClick={() => onUpdateCartItemQuantity(item.productid, Math.max(1, item.quantity - 1))}>
                              <RemoveRoundedIcon fontSize="small" />
                            </IconButton>
                            <Typography minWidth={20} textAlign="center" fontWeight={700}>{item.quantity}</Typography>
                            <IconButton size="small" onClick={() => onUpdateCartItemQuantity(item.productid, item.quantity + 1)}>
                              <AddRoundedIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                          <TextField
                            select
                            label="Choose Seller"
                            value={sellerSelections[item.productid] || ''}
                            onChange={(event) =>
                              setSellerSelections((prev) => ({
                                ...prev,
                                [item.productid]: event.target.value
                              }))
                            }
                            fullWidth
                          >
                            {(sellerOptionsByProduct[item.productid] || []).map((seller) => (
                              <MenuItem key={seller.sellerId} value={seller.sellerId}>
                                {seller.sellerName} {typeof seller.distanceKm === 'number' ? `(${seller.distanceKm} km)` : ''}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                      </Grid>

                      <Typography variant="body2" color="text.secondary">
                        Rate: Rs. {item.sellingPrice}/day
                      </Typography>
                    </Stack>
                  </CardContent>
                  {index !== checkoutItems.length - 1 ? <Divider /> : null}
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Delivery & Payment</Typography>
            <Stack spacing={1.5}>
              <TextField
                name="rentalStartDate"
                label="Rental Start Date"
                type="date"
                value={checkoutForm.rentalStartDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                name="rentalEndDate"
                label="Rental End Date"
                type="date"
                value={checkoutForm.rentalEndDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                name="deliveryAddress"
                label="Delivery Address"
                value={checkoutForm.deliveryAddress}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={3}
              />

              <Divider sx={{ my: 0.5 }} />

              <Typography color="text.secondary">Products in cart: {checkoutItems.length}</Typography>
              <Typography color="text.secondary">Rental days: {orderEstimate.rentalDays}</Typography>
              <Typography color="text.secondary">Subtotal: Rs. {orderEstimate.subtotal}</Typography>
              <Typography color="text.secondary">Delivery fee: Rs. {orderEstimate.deliveryFee}</Typography>
              <Typography color="text.secondary">GST: Rs. {orderEstimate.gstAmount}</Typography>
              <Typography variant="h5" fontWeight={800}>
                Rs. {orderEstimate.totalAmount}
              </Typography>
              <Button variant="contained" size="large" onClick={handlePayNow} disabled={isCreatingOrder}>
                {isCreatingOrder ? 'Preparing Checkout...' : 'Pay & Confirm Rental'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default UserCheckoutSection;

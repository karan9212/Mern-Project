import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Grid,
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
  profileDetails,
  showToast,
  onOrderPlaced
}) {
  const [sellerOptions, setSellerOptions] = useState([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    sellerId: '',
    quantity: 1,
    rentalStartDate: '',
    rentalEndDate: '',
    deliveryAddress: profileDetails.address || ''
  });

  const fetchSellerOptions = useCallback(async () => {
    if (!selectedProduct?.productid) return;

    try {
      const res = await API.get(`/user-portal/${userId}/sellers`, {
        params: { productid: selectedProduct.productid }
      });
      const nextSellers = (res.data?.sellers || []).map((seller) => ({
        ...seller,
        distanceKm: calculateDistanceKm(DEFAULT_USER_LOCATION, seller.sellerLocationCordinates)
      }));
      setSellerOptions(nextSellers);
      if (nextSellers.length > 0 && !checkoutForm.sellerId) {
        setCheckoutForm((prev) => ({ ...prev, sellerId: nextSellers[0].sellerId }));
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load seller options for checkout.', 'error');
    }
  }, [checkoutForm.sellerId, selectedProduct?.productid, showToast, userId]);

  useEffect(() => {
    setCheckoutForm((prev) => ({
      ...prev,
      sellerId: '',
      deliveryAddress: profileDetails.address || prev.deliveryAddress
    }));
  }, [profileDetails.address, selectedProduct?.productid]);

  useEffect(() => {
    fetchSellerOptions();
  }, [fetchSellerOptions]);

  const orderEstimate = useMemo(() => {
    if (!selectedProduct) return null;
    const startDate = checkoutForm.rentalStartDate ? new Date(checkoutForm.rentalStartDate) : null;
    const endDate = checkoutForm.rentalEndDate ? new Date(checkoutForm.rentalEndDate) : null;
    const rentalDays =
      startDate && endDate && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate >= startDate
        ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1)
        : 1;
    const quantity = Math.max(1, Number(checkoutForm.quantity) || 1);
    const subtotal = Number((selectedProduct.sellingPrice * quantity * rentalDays).toFixed(2));
    const deliveryFee = 99;
    const gstAmount = Number((subtotal * 0.18).toFixed(2));
    const totalAmount = Number((subtotal + deliveryFee + gstAmount).toFixed(2));

    return {
      rentalDays,
      subtotal,
      deliveryFee,
      gstAmount,
      totalAmount
    };
  }, [checkoutForm.quantity, checkoutForm.rentalEndDate, checkoutForm.rentalStartDate, selectedProduct]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCheckoutForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayNow = async () => {
    if (!selectedProduct?.productid) {
      showToast('Please select a product before starting checkout.', 'warning');
      return;
    }

    if (!checkoutForm.sellerId || !checkoutForm.rentalStartDate || !checkoutForm.rentalEndDate || !checkoutForm.deliveryAddress.trim()) {
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
        productid: selectedProduct.productid,
        sellerId: checkoutForm.sellerId,
        quantity: Number(checkoutForm.quantity) || 1,
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
        description: `Rental checkout for ${selectedProduct.productName}`,
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
              productName: selectedProduct.productName
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

  if (!selectedProduct) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>Checkout</Typography>
          <Typography color="text.secondary">
            Select a product from the catalog to begin a rental checkout.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Rental Checkout</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField label="Selected Product" value={selectedProduct.productName} fullWidth disabled />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  name="sellerId"
                  label="Choose Seller"
                  value={checkoutForm.sellerId}
                  onChange={handleChange}
                  fullWidth
                >
                  {sellerOptions.map((seller) => (
                    <MenuItem key={seller.sellerId} value={seller.sellerId}>
                      {seller.sellerName} {typeof seller.distanceKm === 'number' ? `(${seller.distanceKm} km)` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="quantity"
                  label="Quantity"
                  type="number"
                  value={checkoutForm.quantity}
                  onChange={handleChange}
                  inputProps={{ min: 1 }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="rentalStartDate"
                  label="Rental Start Date"
                  type="date"
                  value={checkoutForm.rentalStartDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="rentalEndDate"
                  label="Rental End Date"
                  type="date"
                  value={checkoutForm.rentalEndDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="deliveryAddress"
                  label="Delivery Address"
                  value={checkoutForm.deliveryAddress}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  minRows={3}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 5 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Payment Summary</Typography>
            <Stack spacing={1}>
              <Typography color="text.secondary">Daily rental price: Rs. {selectedProduct.sellingPrice}</Typography>
              <Typography color="text.secondary">Rental days: {orderEstimate?.rentalDays || 1}</Typography>
              <Typography color="text.secondary">Subtotal: Rs. {orderEstimate?.subtotal || 0}</Typography>
              <Typography color="text.secondary">Delivery fee: Rs. {orderEstimate?.deliveryFee || 0}</Typography>
              <Typography color="text.secondary">GST: Rs. {orderEstimate?.gstAmount || 0}</Typography>
              <Typography variant="h5" fontWeight={800} sx={{ pt: 1 }}>
                Rs. {orderEstimate?.totalAmount || 0}
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

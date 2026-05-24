import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'userCartItems';
const FOCUS_KEY = 'userSelectedProduct';

const parseStoredJson = (key, fallback) => {
  const rawValue = localStorage.getItem(key);
  if (!rawValue) return fallback;

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    localStorage.removeItem(key);
    return fallback;
  }
};

function useUserCart() {
  const [cartItems, setCartItems] = useState(() => parseStoredJson(STORAGE_KEY, []));
  const [focusedProductId, setFocusedProductId] = useState(() => {
    const storedProduct = parseStoredJson(FOCUS_KEY, null);
    return storedProduct?.productid || '';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const focusedProduct = useMemo(
    () => cartItems.find((item) => item.productid === focusedProductId) || cartItems[0] || null,
    [cartItems, focusedProductId]
  );

  useEffect(() => {
    if (focusedProduct) {
      localStorage.setItem(FOCUS_KEY, JSON.stringify(focusedProduct));
      return;
    }

    localStorage.removeItem(FOCUS_KEY);
  }, [focusedProduct]);

  const setFocusedProduct = useCallback((productOrId) => {
    if (!productOrId) {
      setFocusedProductId('');
      return;
    }

    setFocusedProductId(typeof productOrId === 'string' ? productOrId : productOrId.productid);
  }, []);

  const addToCart = useCallback((product, quantity = 1) => {
    if (!product?.productid) return;

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.productid === product.productid);
      if (existingItem) {
        return prev.map((item) =>
          item.productid === product.productid
            ? { ...item, quantity: Math.max(1, item.quantity + quantity) }
            : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          quantity: Math.max(1, quantity)
        }
      ];
    });
    setFocusedProductId(product.productid);
  }, []);

  const updateCartItemQuantity = useCallback((productid, quantity) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.productid === productid
            ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
            : item
        )
    );
  }, []);

  const removeCartItem = useCallback((productid) => {
    setCartItems((prev) => {
      const nextItems = prev.filter((item) => item.productid !== productid);
      if (focusedProductId === productid) {
        setFocusedProductId(nextItems[0]?.productid || '');
      }
      return nextItems;
    });
  }, [focusedProductId]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setFocusedProductId('');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FOCUS_KEY);
  }, []);

  const cartItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems]
  );

  return {
    cartItems,
    cartItemCount,
    focusedProduct,
    focusedProductId,
    setFocusedProduct,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart
  };
}

export default useUserCart;

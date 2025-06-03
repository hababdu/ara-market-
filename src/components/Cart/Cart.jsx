
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Snackbar, Alert as MuiAlert } from '@mui/material';
import { motion } from 'framer-motion';
import CartList from './CartList';
import CartSummary from './CartSummary';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import CouponDialog from './CouponDialog';
import EmptyCart from './EmptyCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CartIcon from '@mui/icons-material/ShoppingCart';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const calculateSubtotal = useCallback(() =>
    cart.reduce((total, item) => {
      const price = parseFloat(item.discounted_price || item.price);
      return total + price * item.quantity;
    }, 0),
    [cart]
  );

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal();
    return subtotal - discount;
  }, [calculateSubtotal, discount]);

  const updateQuantity = useCallback((id, delta) => {
    setLoading(true);
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
    setTimeout(() => setLoading(false), 300);
  }, []);

  const removeItem = useCallback((id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    setSnackbar({
      open: true,
      message: "Mahsulot savatdan o'chirildi!",
      severity: 'success',
    });
    setConfirmDelete(null);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSnackbar({
      open: true,
      message: 'Savat tozalandi!',
      severity: 'success',
    });
  }, []);

 

  const handleCheckout = useCallback(() => {
    navigate('/checkout', { state: { items: cart } });
  }, [cart, navigate]);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const totalItems = useMemo(() =>
    cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  if (cart.length === 0) {
    return <EmptyCart navigate={navigate} />;
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-[#FF6200] hover:text-[#FFAB40] mb-6 transition-colors"
        >
          <ArrowBackIcon className="mr-2" />
          Bosh sahifaga qaytish
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <CartIcon className="mr-3 text-[#FF6200]" />
          Savat
          <span className="ml-3 bg-orange-100 text-[#FF6200] text-sm font-medium px-1.5 py-0.5 rounded-full">
            {totalItems} ta
          </span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-6">
          <CartList
            cart={cart}
            updateQuantity={updateQuantity}
            setConfirmDelete={setConfirmDelete}
            clearCart={clearCart}
            loading={loading}
          />
          <CartSummary
            totalItems={totalItems}
            subtotal={calculateSubtotal()}
            discount={discount}
            total={calculateTotal()}
            handleCheckout={handleCheckout}
          />
        </div>

        <ConfirmDeleteModal
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          removeItem={removeItem}
        />

        <CouponDialog
          couponCode={couponCode}
          setCouponCode={setCouponCode}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <MuiAlert
            severity={snackbar.severity}
            onClose={handleSnackbarClose}
            elevation={6}
            variant="filled"
            sx={{ borderRadius: 8 }}
          >
            {snackbar.message}
          </MuiAlert>
        </Snackbar>
      </motion.div>
    </div>
  );
};

export default Cart;

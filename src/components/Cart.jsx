import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart as CartIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Close as CloseIcon,
  LocalShipping as ShippingIcon,
  Discount as DiscountIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showCouponInput, setShowCouponInput] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.discounted_price || item.price);
      return total + price * item.quantity;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - discount;
  };

  const updateQuantity = (id, delta) => {
    setLoading(true);
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
    setTimeout(() => setLoading(false), 300);
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    showSnackbar('Mahsulot savatdan o\'chirildi!', 'success');
    setConfirmDelete(null);
  };

  const clearCart = () => {
    setCart([]);
    showSnackbar('Savat tozalandi!', 'success');
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
    setTimeout(() => setSnackbarOpen(false), 3000);
  };

  const applyCoupon = () => {
    // Bu yerda kupon tekshirish logikasi bo'lishi kerak
    if (couponCode.trim() === '') {
      showSnackbar('Iltimos, kupon kodini kiriting', 'error');
      return;
    }
    
    // Demo uchun 10% chegirma
    setDiscount(calculateSubtotal() * 0.1);
    showSnackbar('Kupon qo\'llandi! 10% chegirma', 'success');
    setShowCouponInput(false);
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowBackIcon className="mr-2" />
          Bosh sahifaga qaytish
        </button>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-100 rounded-lg p-8 text-center"
        >
          <CartIcon className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Savat bo'sh</h2>
          <p className="text-gray-600 mb-6">Sizning savatingizda hozircha mahsulotlar yo'q</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md"
          >
            Mahsulotlarni ko'rish
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
      >
        <ArrowBackIcon className="mr-2" />
        Bosh sahifaga qaytish
      </button>

      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <CartIcon className="mr-3 text-blue-500" />
        Savat
        <span className="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
          {cart.reduce((sum, item) => sum + item.quantity, 0)} ta
        </span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Mahsulotlar ro'yxati */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {cart.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <img
                  src={item.photo ? `https://hosilbek.pythonanywhere.com${item.photo}` : 'https://via.placeholder.com/100x100?text=No+Image'}
                  alt={item.title}
                  className="w-24 h-24 object-contain rounded-lg mr-4 border border-gray-200"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {parseFloat(item.discounted_price || item.price).toLocaleString()} so'm
                  </p>
                  <div className="flex items-center">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      disabled={item.quantity === 1 || loading}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      <RemoveIcon className="text-gray-600" />
                    </button>
                    <span className="mx-3 font-medium text-gray-800 min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={loading}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <AddIcon className="text-gray-600" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmDelete(item.id)}
                  className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                  aria-label="O'chirish"
                >
                  <DeleteIcon />
                </button>
              </motion.div>
            ))}
          </div>

          <button
            onClick={clearCart}
            className="mt-4 flex items-center text-red-500 hover:text-red-700 transition-colors"
          >
            <DeleteIcon className="mr-1" />
            Savatni tozalash
          </button>
        </div>

        {/* Xulosa paneli */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Buyurtma xulosasi
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Mahsulotlar:</span>
                <span className="font-medium">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} ta
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Jami narx:</span>
                <span className="font-medium">
                  {calculateSubtotal().toLocaleString()} so'm
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Chegirma:</span>
                  <span>-{discount.toLocaleString()} so'm</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-800">
                <span>Umumiy:</span>
                <span>{calculateTotal().toLocaleString()} so'm</span>
              </div>
            </div>



            <button
              onClick={() => navigate('/checkout', { state: { items: cart } })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-colors shadow-md"
            >
              <PaymentIcon className="mr-2" />
              Buyurtma berish
            </button>

           
          </div>
        </div>
      </div>

      {/* O'chirishni tasdiqlash dialogi */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Mahsulotni o'chirish</h2>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>
              <p className="text-gray-600 mb-6">Haqiqatan ham bu mahsulotni savatdan o'chirmoqchimisiz?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={() => removeItem(confirmDelete)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center"
                >
                  <DeleteIcon className="mr-1" />
                  O'chirish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Xabar yorlig'i */}
      <AnimatePresence>
        {snackbarOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center ${
              snackbarSeverity === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            <span>{snackbarMessage}</span>
            <button
              onClick={() => setSnackbarOpen(false)}
              className="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;
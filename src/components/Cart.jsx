import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart as CartIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.discounted_price || item.price);
      return total + price * item.quantity;
    }, 0);
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
    showSnackbar('Mahsulot savatdan o‘chirildi!', 'success');
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
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowBackIcon className="mr-2" />
          Bosh sahifaga qaytish
        </button>
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 text-center">
          <CartIcon className="w-12 h-12 mx-auto mb-2" />
          <p>Savatda mahsulotlar yo‘q!</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Mahsulotlarni ko‘rish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowBackIcon className="mr-2" />
        Bosh sahifaga qaytish
      </button>

      <h1 className="text-2xl font-bold text-blue-600 mb-6">Savat</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center border-b py-4 last:border-b-0">
            <img
              src={item.photo ? `https://hosilbek.pythonanywhere.com${item.photo}` : 'https://via.placeholder.com/100x100?text=No+Image'}
              alt={item.title}
              className="w-20 h-20 object-cover rounded mr-4"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-gray-600">
                Narx: {parseFloat(item.discounted_price || item.price).toLocaleString()} so'm
              </p>
              <div className="flex items-center mt-2">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  disabled={item.quantity === 1 || loading}
                  className="p-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  <RemoveIcon />
                </button>
                <span className="mx-2">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  disabled={loading}
                  className="p-1 bg-gray-200 rounded"
                >
                  <AddIcon />
                </button>
              </div>
            </div>
            <button
              onClick={() => setConfirmDelete(item.id)}
              className="text-red-500 hover:text-red-700"
            >
              <DeleteIcon />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Savat xulosa</h2>
        <p>Jami mahsulotlar: {cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
        <p className="text-lg font-bold">Umumiy: {calculateTotal().toLocaleString()} so'm</p>
        <div className="flex gap-4 mt-4">
          <button
            onClick={clearCart}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Savatni tozalash
          </button>
          <button
            onClick={() => navigate('/checkout', { state: { items: cart } })}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Buyurtma berish
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Mahsulotni o‘chirish</h2>
            <p>Mahsulotni savatdan o‘chirmoqchimisiz?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => removeItem(confirmDelete)}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                O‘chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbarOpen && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded shadow-lg ${
          snackbarSeverity === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          <div className="flex items-center justify-between">
            <p>{snackbarMessage}</p>
            <button onClick={handleCloseSnackbar} className="ml-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
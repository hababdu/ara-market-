import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Payment as BuyIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import Register from './Register.jsx';

const Checkout = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [address, setAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState(JSON.parse(localStorage.getItem('addresses') || '[]'));
  const [payment, setPayment] = useState('karta');
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const items = state?.items || [];

  const axiosInstance = axios.create({
    baseURL: 'https://hosilbek.pythonanywhere.com/api/user/orders/',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });

  const handleRegister = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const price = parseFloat(item.discounted_price || item.price);
      return total + price * item.quantity;
    }, 0);
  };

  const handleSaveAddress = () => {
    if (address.trim()) {
      const updatedAddresses = [...savedAddresses, address.trim()];
      setSavedAddresses(updatedAddresses);
      localStorage.setItem('addresses', JSON.stringify(updatedAddresses));
      setAddress(address.trim());
      showSnackbar('Manzil saqlandi!', 'success');
    } else {
      showSnackbar('Iltimos, manzil kiriting!', 'error');
    }
  };

  const handleDeleteAddress = (addrToDelete) => {
    const updatedAddresses = savedAddresses.filter((addr) => addr !== addrToDelete);
    setSavedAddresses(updatedAddresses);
    localStorage.setItem('addresses', JSON.stringify(updatedAddresses));
    if (address === addrToDelete) setAddress('');
    showSnackbar('Manzil o‘chirildi!', 'success');
  };

  const confirmOrder = async () => {
    console.log('Confirm order:', { confirmOpen, snackbarOpen, items });
    if (!token) {
      showSnackbar('Iltimos, tizimga kiring!', 'error');
      return;
    }
    if (!address.trim()) {
      showSnackbar('Iltimos, yetkazib berish manzilini tanlang yoki kiriting!', 'error');
      return;
    }
    setLoading(true);
    setConfirmOpen(false); // Close modal before API call
    const payload = {
      order_items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
      payment,
    };
    try {
      const response = await axiosInstance.post('', payload);
      showSnackbar(`Buyurtma #${response.data.id} muvaffaqiyatli tasdiqlandi!`, 'success');
      localStorage.removeItem('cart');
      navigate('/');
    } catch (err) {
      console.error('API Error:', err.response?.status, err.response?.data);
      const errorMessage =
        err.response?.status === 401
          ? 'Tizimga qayta kirish kerak. Sessiya tugagan.'
          : err.response?.data?.message ||
            err.response?.data?.detail ||
            JSON.stringify(err.response?.data, null, 2) ||
            'Buyurtmani tasdiqlashda xatolik yuz berdi';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (!token) {
    return <Register onRegister={handleRegister} />;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowBackIcon className="mr-2" />
          Orqaga qaytish
        </button>
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
          <p>Buyurtma uchun mahsulotlar yo‘q!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <button
        onClick={() => navigate('/cart')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowBackIcon className="mr-2" />
        Savatga qaytish
      </button>

      <h1 className="text-2xl font-bold text-blue-600 mb-6">Buyurtma tasdiqlash</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Buyurtma ma‘lumotlari</h2>
        {items.map((item) => (
          <div key={`item-${item.id}`} className="flex items-center border-b py-4 last:border-b-0">
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
              <p className="text-gray-600">Miqdor: {item.quantity}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Yetkazib berish ma‘lumotlari</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">To‘lov usuli</label>
          <select
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="karta">Karta</option>
            <option value="naqd">Naqd</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Yetkazib berish manzili</label>
          <select
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border p-2 rounded mb-2"
          >
            <option value="">Manzil tanlang</option>
            {savedAddresses.map((addr, idx) => (
              <option key={`addr-${idx}`} value={addr}>{addr}</option>
            ))}
          </select>
          <div className="space-y-2">
            {savedAddresses.map((addr, idx) => (
              <div key={`addr-list-${idx}`} className="flex justify-between items-center">
                <span>{addr}</span>
                <button
                  onClick={() => handleDeleteAddress(addr)}
                  className="text-red-500 hover:text-red-700"
                >
                  <DeleteIcon />
                </button>
              </div>
            ))}
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Yangi manzil kiriting"
            className="w-full border p-2 rounded mt-2"
          />
          <button
            onClick={handleSaveAddress}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Manzilni saqlash
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Buyurtma xulosa</h2>
        <p>Jami mahsulotlar: {items.reduce((sum, item) => sum + item.quantity, 0)}</p>
        <p>Yetkazib berish haqqi: 0 so'm</p>
        <p className="text-lg font-bold">Umumiy: {calculateTotal().toLocaleString()} so'm</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full justify-center disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
          ) : (
            <BuyIcon className="w-5 h-5 mr-2" />
          )}
          Buyurtmani tasdiqlash
        </button>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Buyurtmani tasdiqlash</h2>
            <p>Buyurtmangizni tasdiqlamoqchimisiz?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmOrder}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

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

export default Checkout;
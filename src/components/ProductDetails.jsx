import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingCart as CartIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const token = localStorage.getItem('token');

  const axiosInstance = axios.create({
    baseURL: 'https://hosilbek.pythonanywhere.com/api/',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productRes, productsRes] = await Promise.all([
          axiosInstance.get(`user/products/${id}/`),
          axiosInstance.get('user/products/'),
        ]);
        setProduct(productRes.data);
        setRelatedProducts(
          productsRes.data
            .filter((p) => p.category?.id === productRes.data.category?.id && p.id !== Number(id))
            .slice(0, 4)
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
          err.response?.data?.detail ||
          'Mahsulotni yuklashda xatolik yuz berdi'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const addToCart = () => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    showSnackbar('Mahsulot savatga qo‘shildi!', 'success');
  };

  const buyNow = () => {
    if (!product) return;
    const cart = [{ ...product, quantity }];
    localStorage.setItem('cart', JSON.stringify(cart));
    navigate('/checkout', { state: { items: cart } });
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Yuklanmoqda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowBackIcon className="mr-2" />
          Orqaga qaytish
        </button>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
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

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <img
            src={product.photo ? `https://hosilbek.pythonanywhere.com${product.photo}` : 'https://via.placeholder.com/300x300?text=No+Image'}
            alt={product.title}
            className="w-full md:w-1/3 object-cover rounded"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-blue-600 mb-4">{product.title}</h1>
            <p className="text-gray-600 mb-4">{product.description || 'Tavsif mavjud emas'}</p>
            <p className="text-lg font-bold mb-2">
              Narx: {parseFloat(product.discounted_price || product.price).toLocaleString()} so'm
            </p>
            <p className="text-gray-600 mb-2">Kategoriya: {product.category?.name || 'Noma\'lum'}</p>
            <p className="text-gray-600 mb-4">Oshxona: {product.kitchen?.name || 'Noma\'lum'}</p>
            <div className="flex items-center gap-4 mb-4">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 border p-2 rounded"
              />
              <button
                onClick={addToCart}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded"
              >
                <CartIcon className="mr-2" />
                Savatga qo‘shish
              </button>
              <button
                onClick={buyNow}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Sotib olish
              </button>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Tavsiya etilgan mahsulotlar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                className="bg-gray-100 rounded-lg p-4 cursor-pointer hover:shadow-md"
              >
                <img
                  src={p.photo ? `https://hosilbek.pythonanywhere.com${p.photo}` : 'https://via.placeholder.com/150x150?text=No+Image'}
                  alt={p.title}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <h3 className="text-sm font-semibold">{p.title}</h3>
                <p className="text-gray-600">
                  {parseFloat(p.discounted_price || p.price).toLocaleString()} so'm
                </p>
              </div>
            ))}
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

export default ProductDetails;
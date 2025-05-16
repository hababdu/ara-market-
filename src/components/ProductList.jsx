import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Fastfood as FastfoodIcon,
  LocalDining as KitchenIcon,
  Category as CategoryIcon,
  AttachMoney as PriceIcon,
  Discount as DiscountIcon,
  Star as StarIcon,
  StarBorder as StarEmptyIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const API_URL = 'https://hosilbek.pythonanywhere.com/api/user/products/';

  // Get token from localStorage
  const token = localStorage.getItem('token');

  // Axios instance with default headers
  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });

  // Fetch products
  const fetchProducts = async () => {
    if (!token) {
      setError('Foydalanuvchi tizimga kirmagan');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('');
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Mahsulotlarni yuklab bo‘lmadi';
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Helper function to show snackbar
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle API errors
  const handleApiError = (err) => {
    if (err.response?.status === 400) {
      const errorMessage =
        err.response?.data?.message ||
        Object.values(err.response?.data || {})
          .flat()
          .join(', ') ||
        'Ma\'lumotlar noto\'g\'ri';
      showSnackbar(`Xatolik: ${errorMessage}`, 'error');
    } else if (err.response?.status === 401) {
      showSnackbar('Tizimga qayta kirish kerak. Sessiya tugagan.', 'error');
    } else {
      showSnackbar(err.response?.data?.message || 'Amalni bajarishda xatolik', 'error');
    }
  };

  // Render rating stars
  const renderRating = (rating) => {
    const stars = [];
    const maxStars = 5;
    const roundedRating = Math.round(rating * 2) / 2;

    for (let i = 1; i <= maxStars; i++) {
      if (i <= roundedRating) {
        stars.push(<StarIcon key={i} className="text-blue-500 w-4 h-4" />);
      } else if (i - 0.5 === roundedRating) {
        stars.push(<StarIcon key={i} className="text-blue-500 w-4 h-4 opacity-50" />);
      } else {
        stars.push(<StarEmptyIcon key={i} className="text-blue-500 w-4 h-4" />);
      }
    }

    return (
      <div className="flex items-center">
        {stars}
        <span className="text-gray-500 text-xs ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Conditional rendering
  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p>Iltimos, tizimga kiring!</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Mahsulotlar yuklanmoqda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
          <button 
            onClick={fetchProducts}
            className="mt-2 text-red-700 hover:text-red-900 font-medium"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">Barcha mahsulotlar</h1>
        <div className="flex gap-2">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            onClick={fetchProducts}
            disabled={loading}
          >
            <RefreshIcon className="mr-1" />
            Yangilash
          </button>
        </div>
      </div>

      {(!Array.isArray(products) || products.length === 0) ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4">
            <p>Mahsulotlar topilmadi.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              to={`/products/${product.id}`}
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200"
            >
              {product.photo ? (
                <img
                  src={`https://hosilbek.pythonanywhere.com${product.photo}`}
                  alt={product.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <FastfoodIcon className="text-gray-400 w-12 h-12" />
                </div>
              )}

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg truncate">
                    {product.title || 'Yangi mahsulot'}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {product.unit}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                  {product.description || 'Tavsif mavjud emas'}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded">
                    <KitchenIcon className="w-3 h-3 mr-1" />
                    {product.kitchen?.name || 'Noma\'lum'}
                  </span>
                  <span className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded">
                    <CategoryIcon className="w-3 h-3 mr-1" />
                    {product.category?.name || 'Noma\'lum'}
                  </span>
                  {product.subcategory && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {product.subcategory.name}
                    </span>
                  )}
                </div>

                <div className="mb-2">
                  <div className="flex items-center mb-1">
                    <PriceIcon className="text-blue-500 w-4 h-4 mr-1" />
                    <span className="font-bold">
                      {parseFloat(product.price).toLocaleString()} so'm
                    </span>
                  </div>

                  {parseFloat(product.discount) > 0 && (
                    <div className="flex items-center">
                      <DiscountIcon className="text-red-500 w-4 h-4 mr-1" />
                      <span className="text-red-500 line-through">
                        {parseFloat(product.discount).toLocaleString()} so'm
                      </span>
                    </div>
                  )}
                </div>

                {product.discounted_price && (
                  <p className="text-blue-600 font-bold text-sm mb-2">
                    Chegirmadagi narx: {parseFloat(product.discounted_price).toLocaleString()} so'm
                  </p>
                )}

                {renderRating(product.rating || 0)}

                <div className="flex justify-between text-xs text-gray-500 mt-3">
                  <span>
                    {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'Yangi'}
                  </span>
                  <span>ID: {product.id || '—'}</span>
                </div>
              </div>
            </Link>
          ))}
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsList;
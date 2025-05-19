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
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const API_URL = 'https://hosilbek.pythonanywhere.com/api/user/products/';

  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('');
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Mahsulotlarni yuklab bo‘lmadi';
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
    setTimeout(() => setSnackbarOpen(false), 3000);
  };

  const renderRating = (rating) => {
    const stars = [];
    const maxStars = 5;
    const roundedRating = Math.round(rating * 2) / 2;

    for (let i = 1; i <= maxStars; i++) {
      if (i <= roundedRating) {
        stars.push(<StarIcon key={i} className="text-yellow-500 w-3 h-3" />);
      } else if (i - 0.5 === roundedRating) {
        stars.push(<StarIcon key={i} className="text-yellow-500 w-3 h-3 opacity-50" />);
      } else {
        stars.push(<StarEmptyIcon key={i} className="text-yellow-500 w-3 h-3" />);
      }
    }

    return (
      <div className="flex items-center">
        {stars}
        <span className="text-gray-500 text-xs ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const filteredProducts = products.filter((product) =>
    product.title?.toLowerCase().includes(search.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="bg-white shadow-md rounded-lg px-6 py-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500"></div>
          <p className="text-blue-600 font-medium">Mahsulotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg max-w-md mx-4">
          <p>{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-2 text-red-700 hover:text-red-900 font-medium flex items-center"
          >
            <RefreshIcon className="mr-1" />
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4">
      {/* Mobile Header with Search and Filter */}
      <div className="sm:hidden mb-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold text-blue-600">
            Mahsulotlar ({products.length})
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 rounded-full bg-blue-100 text-blue-600"
            >
              <SearchIcon />
            </button>
            <button 
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="p-2 rounded-full bg-blue-100 text-blue-600"
            >
              <FilterIcon />
            </button>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Mahsulot qidirish..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-3 text-gray-400" />
            <button 
              onClick={() => setMobileSearchOpen(false)}
              className="absolute right-3 top-3 text-gray-400"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        {mobileFilterOpen && (
          <div className="bg-white p-3 rounded-lg shadow-md mb-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Tartiblash</h3>
              <button onClick={() => setMobileFilterOpen(false)}>
                <CloseIcon className="text-gray-500" />
              </button>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="default">Standart tartib</option>
              <option value="price-asc">Narx: pastdan yuqoriga</option>
              <option value="price-desc">Narx: yuqoridan pastga</option>
            </select>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-blue-600">
          Barcha mahsulotlar ({products.length})
        </h1>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Qidiruv..."
              className="border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-3 text-gray-400" />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="default">Tartiblash</option>
            <option value="price-asc">Narx: pastdan yuqoriga</option>
            <option value="price-desc">Narx: yuqoridan pastga</option>
          </select>

          <button
            onClick={fetchProducts}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            disabled={loading}
          >
            <RefreshIcon className="mr-1" />
            Yangilash
          </button>
        </div>
      </div>

      {sortedProducts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {search ? `"${search}" bo‘yicha hech narsa topilmadi` : 'Mahsulotlar topilmadi.'}
          <button 
            onClick={() => {
              setSearch('');
              setSortBy('default');
            }}
            className="block mx-auto mt-2 text-blue-600 hover:text-blue-800"
          >
            Filtrlarni tozalash
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedProducts.map((product) => (
            <Link
              to={`/products/${product.id}`}
              key={product.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
            >
              {product.photo ? (
                <div className="relative pt-[75%] overflow-hidden">
                  <img
                    src={`https://hosilbek.pythonanywhere.com${product.photo}`}
                    alt={product.title}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="relative pt-[75%] bg-gray-100 flex items-center justify-center">
                  <FastfoodIcon className="text-gray-400 w-12 h-12 absolute" />
                </div>
              )}

              <div className="p-3 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-base truncate" title={product.title}>
                    {product.title || 'Yangi mahsulot'}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    {product.unit}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">
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
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <PriceIcon className="text-blue-500 w-4 h-4 mr-1" />
                      <span className="font-bold text-sm">
                        {parseFloat(product.price).toLocaleString()} so'm
                      </span>
                    </div>
                    {parseFloat(product.discount) > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                        -{parseFloat(product.discount).toLocaleString()} so'm
                      </span>
                    )}
                  </div>

                  {product.discounted_price && (
                    <p className="text-green-600 font-bold text-sm mb-2">
                      {parseFloat(product.discounted_price).toLocaleString()} so'm
                    </p>
                  )}

                  {renderRating(product.rating || 0)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Snackbar Notification */}
      {snackbarOpen && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center ${
          snackbarSeverity === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white max-w-xs sm:max-w-md`}>
          <p className="flex-grow text-sm">{snackbarMessage}</p>
          <button onClick={() => setSnackbarOpen(false)} className="ml-2">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductsList;
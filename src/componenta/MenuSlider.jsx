import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Fastfood as FastfoodIcon, Close as CloseIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const ProductsList = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const API_URL = 'https://hosilbek.pythonanywhere.com/api/user/products/';
  const token = localStorage.getItem('authToken');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_URL, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      let productsData = Array.isArray(response.data) ? response.data : [];
      productsData = productsData.filter((product) => 
        product.is_aktiv === true && (!product.kitchen || product.kitchen?.is_aktiv !== false)
      );
      productsData = shuffleArray(productsData);

      const grouped = productsData.reduce((acc, product) => {
        const category = product.category?.name || product.kitchen?.name || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
      }, {});
      Object.keys(grouped).forEach((category) => {
        if (grouped[category].length === 0) delete grouped[category];
      });
      setCategories(grouped);
    } catch (err) {
      console.error('Fetch error:', err.response?.data || err.message);
      let errorMessage = err.response?.data?.message || "Mahsulotlarni yuklab bo‘lmadi";
      if (err.response?.status === 401) {
        errorMessage = "Autentifikatsiya xatosi: Iltimos, tizimga kiring.";
        localStorage.removeItem('authToken');
        navigate('/profile');
      }
      setError(errorMessage);
      setCategories({});
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCloseModal = () => setSelectedProduct(null);

  const handleModalDragEnd = (event, info) => {
    const dragDistance = info.offset.y;
    const dragVelocity = info.velocity.y;
    const closeThreshold = window.innerHeight * 0.3;
    const velocityThreshold = 500;
    if (dragDistance > closeThreshold || dragVelocity > velocityThreshold) handleCloseModal();
  };

  if (loading) return <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-[#FFF3E0]"><div className="bg-white shadow-md rounded-lg px-4 py-3 flex items-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-[#4CAF50]"></div><p className="text-[#4CAF50] font-medium text-sm">Mahsulotlar yuklanmoqda...</p></div></div>;
  if (error) return <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-[#FFF3E0] px-4"><div className="bg-[#ffebee] border-l-4 border-[#4CAF50] text-[#4CAF50] p-3 rounded-lg"><p className="text-sm">{error}</p><button onClick={fetchProducts} className="mt-2 text-[#4CAF50] hover:text-[#81C784] font-medium flex items-center text-sm">Qayta urinish</button></div></div>;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br  p-4">
      <div className="max-w-6xl mx-auto px-2 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <FastfoodIcon className="w-8 h-8 text-[#43A047] drop-shadow-md" />
          <h1 className="text-3xl font-extrabold text-[#388E3C] tracking-tight">Mahsulotlar</h1>
          <span className="ml-2 px-3 py-1 rounded-full bg-[#C8E6C9] text-[#388E3C] text-xs font-semibold shadow">({Object.values(categories).flat().length})</span>
        </div>
        <ul className="flex space-x-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
          {['Barchasi', 'Taomlar', 'Fast Food', 'Shirinliklar', 'Ichimliklar', 'Shashliklar', 'Salatlar'].map((category) => (
            <li key={category}>
              <button
                onClick={() => setSelectedCategory(category.toLowerCase() === 'barchasi' ? 'all' : category)}
                className={`px-5 py-2 text-sm rounded-full shadow transition-all duration-200 whitespace-nowrap font-semibold ${
                  selectedCategory === (category.toLowerCase() === 'barchasi' ? 'all' : category.toLowerCase())
                    ? 'bg-gradient-to-r from-[#43A047] to-[#66BB6A] text-white scale-105 shadow-lg'
                    : 'bg-white text-[#388E3C] border border-[#A5D6A7] hover:bg-[#E8F5E9]'
                }`}
              >
                {category}
              </button>
            </li>
          ))}
        </ul>

        {Object.keys(categories).length === 0 ? (
          <div className="text-center py-16 text-[#666] bg-white rounded-2xl shadow-lg">
            <FastfoodIcon className="w-16 h-16 mx-auto mb-4 text-[#A5D6A7]" />
            <p className="text-lg font-medium">Mahsulotlar topilmadi</p>
          </div>
        ) : (
          <div className="space-y-10">
            {(selectedCategory === 'all' ? Object.entries(categories) : [[selectedCategory, categories[selectedCategory]]]).map(([category, products]) =>
              products && (
                <div key={category} className="mb-8">
                  <h2 className="text-2xl font-bold text-[#388E3C] mb-5 pl-2 border-l-4 border-[#A5D6A7]">{category}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-7">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow cursor-pointer group"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="relative">
                          <img
                            src={`https://hosilbek.pythonanywhere.com${product.photo}`}
                            alt={product.title || 'Mahsulot rasmi'}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => { e.target.src = '/default-image.jpg'; }}
                          />
                         
                        </div>
                        <div className="p-4 text-center bg-gradient-to-r from-[#43A047] to-[#66BB6A] text-white">
                          <p className="text-lg font-semibold truncate">{product.title}</p>
                          <p className="text-2xl font-bold mt-1">
                            {(product.discounted_price || product.price).toLocaleString('uz-UZ')} <span className="text-base font-normal">so‘m</span>
                          </p>
                          
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {selectedProduct && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end sm:items-center sm:justify-center"
            onClick={handleCloseModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white w-full sm:w-[420px] rounded-t-3xl sm:rounded-3xl p-6 h-[90%] sm:h-auto overflow-y-auto shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
              onDragEnd={handleModalDragEnd}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex justify-center mb-3">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-[#43A047] hover:text-[#FF7043] bg-[#E8F5E9] rounded-full p-1 shadow"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
              <img
                src={`https://hosilbek.pythonanywhere.com${selectedProduct.photo}`}
                alt={selectedProduct.title || 'Mahsulot rasmi'}
                className="w-full h-60 object-cover rounded-xl mb-5 shadow"
              />
              <h2 className="text-2xl font-bold text-[#388E3C] mb-2">{selectedProduct.title}</h2>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-bold text-[#43A047]">
                  {(selectedProduct.discounted_price || selectedProduct.price).toLocaleString('uz-UZ')} so‘m
                </span>
                {selectedProduct.discounted_price && (
                  <span className="text-base line-through text-[#FF7043] opacity-70">
                    {selectedProduct.price.toLocaleString('uz-UZ')} so‘m
                  </span>
                )}
              </div>
              <p className="text-base text-[#666] mb-2">{selectedProduct.description || 'Tavsif mavjud emas'}</p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default ProductsList;
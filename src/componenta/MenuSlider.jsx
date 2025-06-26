import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Fastfood as FastfoodIcon, Close as CloseIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

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
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      let productsData = Array.isArray(response.data) ? response.data : [];

      productsData = productsData.filter((product) => 
        product.is_aktiv === true && 
        (!product.kitchen || product.kitchen?.is_aktiv !== false)
      );

      productsData = shuffleArray(productsData);

      const grouped = productsData.reduce((acc, product) => {
        const category = product.category?.name || product.kitchen?.name || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
      }, {});

      Object.keys(grouped).forEach((category) => {
        if (grouped[category].length === 0) {
          delete grouped[category];
        }
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

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  const handleModalDragEnd = (event, info) => {
    const dragDistance = info.offset.y;
    const dragVelocity = info.velocity.y;
    const closeThreshold = window.innerHeight * 0.3;
    const velocityThreshold = 500;

    if (dragDistance > closeThreshold || dragVelocity > velocityThreshold) {
      handleCloseModal();
    }
  };

  // Birinchi qator uchun slayder sozlamalari
  const sliderSettingsRow1 = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3, // Bir vaqtda 3 ta mahsulot ko'rinadi
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000, // 3 sekundda aylanish
    arrows: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  // Ikkinchi qator uchun slayder sozlamalari
  const sliderSettingsRow2 = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3, // Bir vaqtda 3 ta mahsulot ko'rinadi
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000, // 4 sekundda aylanish (birinchi qatordan farqli)
    arrows: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  // Mahsulotlarni ikki qatorga bo'lish funksiyasi
  const splitIntoRows = (products) => {
    const half = Math.ceil(products.length / 2);
    return {
      row1: products.slice(0, half),
      row2: products.slice(half),
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-[#FFF3E0]">
        <div className="bg-white shadow-md rounded-lg px-4 py-3 flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-[#FF6200]"></div>
          <p className="text-[#FF6200] font-medium text-sm">Mahsulotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-[#FFF3E0] px-4">
        <div className="bg-[#ffebee] border-l-4 border-[#FF6200] text-[#FF6200] p-3 rounded-lg">
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-2 text-[#FF6200] hover:text-[#FFAB40] font-medium flex items-center text-sm"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FFF3E0] p-4 relative">
      <div className="max-w-8xl mx-auto px-10">
       <div className=" flex  items-center mb-8 flex-col md:flex-row w-full justify-around">
         <div className="mb-6">
          <h1 className=" text-2xl font-bold text-[#FF6200] flex items-center">
            <FastfoodIcon className="w-6 h-6 mr-2" />
            ARA Cafe Menu
          </h1>
        </div>

        <div className="mb-6 w-full">
          <ul className="flex space-x-4 overflow-x-auto scrollbar-hide ">
            <li>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-3 text-sm rounded-full whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-[#FF6200] text-white'
                    : 'bg-white text-[#FF6200] border border-[#FF6200] hover:bg-[#FFF3E0]'
                } transition-colors`}
              >
                Barchasi
              </button>
            </li>
            {Object.keys(categories).map((category) => (
              <li key={category}>
                <button
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 text-sm rounded-full whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-[#FF6200] text-white'
                      : 'bg-white text-[#FF6200] border border-[#FF6200] hover:bg-[#FFF3E0]'
                  } transition-colors`}
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </div>
       </div>

        {Object.keys(categories).length === 0 ? (
          <div className="text-center py-12 text-[#666] bg-white rounded-lg shadow-sm">
            <FastfoodIcon className="w-12 h-12 mx-auto mb-2 text-[#FFAB40]" />
            <p className="text-base">Mahsulotlar topilmadi</p>
          </div>
        ) : (
          <div className="space-y-8">
            {(selectedCategory === 'all'
              ? Object.entries(categories)
              : [[selectedCategory, categories[selectedCategory]]]
            ).map(([category, products]) =>
              products && (
                <div key={category} className="mb-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-[#FF6200]">{category}</h2>
                  </div>
                  <div className="space-y-6">
                    {/* Birinchi qator slayderi */}
                    {splitIntoRows(products).row1.length > 0 && (
                      <Slider {...sliderSettingsRow1}>
                        {splitIntoRows(products).row1.map((product) => (
                          <div
                            key={product.id}
                            className="px-2"
                            onClick={() => setSelectedProduct(product)}
                            aria-label={`Mahsulot: ${product.title || 'Yangi mahsulot'}`}
                          >
                            <div className="relative">
                              <div className="w-full h-80 bg-white rounded-lg overflow-hidden">
                                {product.photo ? (
                                  <img
                                    src={`https://hosilbek.pythonanywhere.com${product.photo}`}
                                    alt={product.title || 'Mahsulot rasmi'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = '/default-image.jpg'; }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#FFF3E0] flex items-center justify-center">
                                    <FastfoodIcon className="w-16 h-16 text-[#FFAB40]" />
                                  </div>
                                )}
                              </div>
                              <div className="absolute top-0 left-0 bg-[#FF6200] text-white rounded-lg p-2 text-2xl font-bold">
                                Narx: {(product.discounted_price || product.price).toLocaleString('uz-UZ')} so‘m
                              </div>
                            </div>
                            <p className="mt-4 text-2xl text-[#333] font-extrabold text-center">{product.title}</p>
                          </div>
                        ))}
                      </Slider>
                    )}
                    {/* Ikkinchi qator slayderi */}
                    {splitIntoRows(products).row2.length > 0 && (
                      <Slider {...sliderSettingsRow2}>
                        {splitIntoRows(products).row2.map((product) => (
                          <div
                            key={product.id}
                            className="px-2"
                            onClick={() => setSelectedProduct(product)}
                            aria-label={`Mahsulot: ${product.title || 'Yangi mahsulot'}`}
                          >
                            <div className="relative">
                              <div className="w-full h-80 bg-white rounded-lg overflow-hidden">
                                {product.photo ? (
                                  <img
                                    src={`https://hosilbek.pythonanywhere.com${product.photo}`}
                                    alt={product.title || 'Mahsulot rasmi'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = '/default-image.jpg'; }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#FFF3E0] flex items-center justify-center">
                                    <FastfoodIcon className="w-16 h-16 text-[#FFAB40]" />
                                  </div>
                                )}
                              </div>
                              <div className="absolute top-0 left-0 bg-[#FF6200] text-white rounded-lg p-2 text-2xl font-bold">
                                Narx: {(product.discounted_price || product.price).toLocaleString('uz-UZ')} so‘m
                              </div>
                            </div>
                            <p className="mt-4 text-2xl text-[#333] font-extrabold text-center">{product.title}</p>
                          </div>
                        ))}
                      </Slider>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {selectedProduct && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
            onClick={handleCloseModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-[#FFF3E0] w-full rounded-t-2xl p-4 h-[90%] overflow-y-auto"
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
              <div className="flex justify-center mb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#FF6200]">{selectedProduct.title}</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-[#FF6200] hover:text-[#FFAB40]"
                  aria-label="Modalni yopish"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="relative mb-4">
                {selectedProduct.photo ? (
                  <img
                    src={`https://hosilbek.pythonanywhere.com${selectedProduct.photo}`}
                    alt={selectedProduct.title || 'Mahsulot rasmi'}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-[#FFF3E0] flex items-center justify-center rounded-lg">
                    <FastfoodIcon className="w-16 h-16 text-[#FFAB40]" />
                  </div>
                )}
              </div>
              <div className="mb-4">
                <span className="text-2xl font-bold text-[#FF6200]">
                  Narx: {(selectedProduct.discounted_price || product.price).toLocaleString('uz-UZ')} so‘m
                </span>
              </div>
              <div className="mb-4">
                <h3 className="text-base font-semibold text-[#333] mb-2">Tavsif</h3>
                <p className="text-sm text-[#666] whitespace-pre-line">
                  {selectedProduct.description || 'Tavsif mavjud emas'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Helper function to shuffle array
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default ProductsList;
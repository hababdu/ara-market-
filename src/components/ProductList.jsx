import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  Fastfood as FastfoodIcon,
  AttachMoney as PriceIcon,
  LocalOffer as DiscountIcon,
  Close as CloseIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Mahsulotlarni tasodifiy tartibda aralashtirish funksiyasi
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const ProductsList = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all'); // New state for selected category
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [inCart, setInCart] = useState(false);
  const [animations, setAnimations] = useState([]);
  const [cartPosition, setCartPosition] = useState(() => {
    const savedPosition = localStorage.getItem('productsCartButtonPosition');
    return savedPosition
      ? JSON.parse(savedPosition)
      : { x: window.innerWidth - 80, y: window.innerHeight - 160 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const API_URL = 'https://hosilbek.pythonanywhere.com/api/user/products/';
  const addToCartButtonRef = useRef(null);

  // Mahsulotlarni API dan yuklash
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_URL);
      let productsData = Array.isArray(response.data) ? response.data : [];
      productsData = shuffleArray(productsData);

      // Mahsulotlarni kategoriyalar bo'yicha guruhlash
      const grouped = productsData.reduce((acc, product) => {
        const category = product.category?.name || product.kitchen?.name || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
      }, {});

      setCategories(grouped);
    } catch (err) {
      setError(err.response?.data?.message || "Mahsulotlarni yuklab bo‘lmadi");
      setCategories({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Savat ma'lumotlarini yangilash
  const updateCartData = useCallback(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalItems);
    const cartItem = cart.find((item) => item.id === selectedProduct?.id);
    setInCart(!!cartItem);
  }, [selectedProduct]);

  useEffect(() => {
    updateCartData();
    window.addEventListener('storage', updateCartData);
    return () => window.removeEventListener('storage', updateCartData);
  }, [updateCartData]);

  // Savat tugmasini sudrab yurish funksiyalari
  useEffect(() => {
    localStorage.setItem('productsCartButtonPosition', JSON.stringify(cartPosition));
  }, [cartPosition]);

  const handleDragStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    setDragStart({
      x: clientX - cartPosition.x,
      y: clientY - cartPosition.y,
    });
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    let newX = clientX - dragStart.x;
    let newY = clientY - dragStart.y;

    const buttonWidth = 64;
    const buttonHeight = 64;
    const navBarHeight = 60;
    newX = Math.max(0, Math.min(newX, window.innerWidth - buttonWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - buttonHeight - navBarHeight));

    setCartPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, dragStart]);

  // Savatga qo'shish animatsiyasi
  const addToCart = useCallback(() => {
    if (!selectedProduct) return;

    const buttonRect = addToCartButtonRef.current?.getBoundingClientRect();
    if (!buttonRect) return;

    const cartX = cartPosition.x + 32;
    const cartY = cartPosition.y + 32;

    const animationId = Date.now();
    setAnimations((prev) => [
      ...prev,
      {
        id: animationId,
        startX: buttonRect.left + buttonRect.width / 2,
        startY: buttonRect.top + buttonRect.height / 2,
        endX: cartX,
        endY: cartY,
        photo: selectedProduct.photo,
      },
    ]);

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item) => item.id === selectedProduct.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      const cartItemId = crypto.randomUUID();
      cart.push({
        id: selectedProduct.id,
        cartItemId,
        kitchen_id: selectedProduct.kitchen?.id,
        product_id: selectedProduct.id,
        title: selectedProduct.title,
        price: selectedProduct.discounted_price || selectedProduct.price,
        original_price: selectedProduct.price,
        quantity: quantity,
        photo: selectedProduct.photo,
        user_id: userData.id,
        kitchen_location: {
          latitude: selectedProduct.kitchen?.latitude,
          longitude: selectedProduct.kitchen?.longitude,
        },
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    setInCart(true);

    setTimeout(() => {
      setAnimations((prev) => prev.filter((anim) => anim.id !== animationId));
      setSelectedProduct(null);
    }, 1500);
  }, [selectedProduct, quantity, cartPosition]);

  // Modalni yopish
  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  // Modalni sudrab yopish
  const handleModalDragEnd = (event, info) => {
    const dragDistance = info.offset.y;
    const dragVelocity = info.velocity.y;
    const closeThreshold = window.innerHeight * 0.3;
    const velocityThreshold = 500;

    if (dragDistance > closeThreshold || dragVelocity > velocityThreshold) {
      handleCloseModal();
    }
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
            <RefreshIcon className="w-4 h-4 mr-1" />
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#FFF3E0] px-2 py-4 relative">
      <div className="max-w-7xl mx-auto">
        {/* Sarlavha */}
        <div className="mb-4">
          <h1 className="text-lg font-bold text-[#FF6200] flex items-center">
            <FastfoodIcon className="w-5 h-5 mr-2" />
            Mahsulotlar (
            {selectedCategory === 'all'
              ? Object.values(categories).reduce((sum, prods) => sum + prods.length, 0)
              : categories[selectedCategory]?.length || 0}
            )
          </h1>
        </div>

        {/* Category Filter */}
        <div className="mb-4 max-w-sm">
          <ul className="flex space-x-2 overflow-x-auto scrollbar-hide">
            <li>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 text-sm rounded-full whitespace-nowrap ${
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
                  className={`px-4 py-2 text-sm rounded-full whitespace-nowrap ${
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

        {/* Kategoriyalar bo'limlari */}
        {Object.keys(categories).length === 0 ? (
          <div className="text-center py-12 text-[#666] bg-white rounded-lg shadow-sm">
            <FastfoodIcon className="w-12 h-12 mx-auto mb-2 text-[#FFAB40]" />
            <p className="text-base">Mahsulotlar topilmadi</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(selectedCategory === 'all'
              ? Object.entries(categories)
              : [[selectedCategory, categories[selectedCategory]]]
            ).map(([category, products]) => (
              products && (
                <div key={category} className="mb-6 max-w-sm mx-auto">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-[#FF6200]">{category}</h2>
                    <Link
                      to={`/category/${encodeURIComponent(category)}`}
                      className="text-[#FF6200] hover:text-[#FFAB40] text-sm flex items-center"
                    >
                      Barchasini ko‘rish
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                  <div className="overflow-x-auto flex gap-2 pb-2 scroll-smooth hide-scrollbar">
                    {products.map((product) => (
                      <div
                        style={{
                          background: 'linear-gradient(to bottom, #FFFFFF, #FFF3E0, #FFF3E0)',
                        }}
                        key={product.id}
                        className="w-40 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col flex-shrink-0 cursor-pointer"
                        onClick={() => setSelectedProduct(product)}
                        aria-label={`Mahsulot: ${product.title || 'Yangi mahsulot'}`}
                      >
                        {/* Mahsulot rasmi */}
                        <div className="relative pt-[75%] overflow-hidden">
                          {product.photo ? (
                            <img
                              src={`https://hosilbek.pythonanywhere.com${product.photo}`}
                              alt={product.title || 'Mahsulot rasmi'}
                              className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 hover:scale-100"
                            />
                          ) : (
                            <div className="absolute top-0 left-0 w-full h-full bg-[#FFF3E0] flex items-center justify-center">
                              <FastfoodIcon className="w-12 h-12" />
                            </div>
                          )}
                          {parseFloat(product.discount) > 0 && (
                            <div className="absolute top-2 right-2 bg-[#FF6200] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                              <DiscountIcon className="w-3 h-3 mr-1" />
                              {Math.round(
                                ((parseFloat(product.price) - parseFloat(product.discounted_price)) /
                                  parseFloat(product.price)) *
                                  100
                              )}
                              %
                            </div>
                          )}
                        </div>

                        {/* Mahsulot ma'lumotlari */}
                        <div
                          style={{
                            background: 'linear-gradient(to bottom, #FFFFFF, #FFF3E0)',
                          }}
                          className="p-3 flex flex-col items-start justify-between"
                        >
                          <h3
                            className="font-semibold text-center text-sm text-[#333] truncate"
                            title={product.title}
                          >
                            {product.title || 'Loading...'}
                          </h3>
                          <p className="text-[#666] text-xs mb-3 line-clamp-2 flex-grow">
                            {product.description || 'Tavsif mavjud emas'}
                          </p>
                          <div className="mt-auto">
                            <div className="flex items-center mb-1">
                              <span
                                className={`font-bold text-sm ${
                                  parseFloat(product.discount) > 0
                                    ? 'line-through text-[#666]'
                                    : 'text-[#333]'
                                }`}
                              >
                                {parseFloat(product.price).toLocaleString('uz-UZ')} so‘m
                              </span>
                            </div>
                            {parseFloat(product.discount) > 0 && (
                              <p className="text-[#FF6200] font-bold text-sm">
                                {parseFloat(product.discounted_price).toLocaleString('uz-UZ')} so‘m
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Mahsulot modali */}
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
              {/* Modalni sudrab yopish chizig'i */}
              <div className="flex justify-center mb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#FF6200]">{selectedProduct.title}</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-[#FF6200] hover:text-[#FFAB40]"
                  aria-label="Modalni yopish"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Mahsulot rasmi */}
              <div className="relative mb-4">
                {selectedProduct.photo ? (
                  <img
                    src={`https://hosilbek.pythonanywhere.com${selectedProduct.photo}`}
                    alt={selectedProduct.title || 'Mahsulot rasmi'}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-[#FFF3E0] flex items-center justify-center rounded-lg">
                    <FastfoodIcon className="w-16 h-16 text-[#FFAB40]" />
                  </div>
                )}
              </div>

              {/* Narx */}
              <div className="mb-4">
                {selectedProduct.discounted_price ? (
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-lg font-bold text-[#FF6200]">
                      {parseFloat(selectedProduct.discounted_price).toLocaleString('uz-UZ')} so‘m
                    </span>
                    <span className="text-sm text-[#666] line-through">
                      {parseFloat(selectedProduct.price).toLocaleString('uz-UZ')} so‘m
                    </span>
                    <span className="bg-[#FFF3E0] text-[#FF6200] text-xs font-semibold px-2 py-1 rounded-full">
                      {Math.round(
                        ((parseFloat(selectedProduct.price) -
                          parseFloat(selectedProduct.discounted_price)) /
                          parseFloat(selectedProduct.price)) *
                          100
                      )}
                      % chegirma
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-[#333]">
                    {parseFloat(selectedProduct.price).toLocaleString('uz-UZ')} so‘m
                  </span>
                )}
              </div>

              {/* Tavsif */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#333] mb-1">Tavsif</h3>
                <p className="text-sm text-[#666] whitespace-pre-line">
                  {selectedProduct.description || 'Tavsif mavjud emas'}
                </p>
              </div>

              {/* Miqdor tanlash va savatga qo'shish */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center border border-[#FFAB40] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className={`px-4 py-2 text-[#FF6200] text-lg ${
                      quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-lg text-[#333]">{quantity}</span>
                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="px-4 py-2 text-[#FF6200] text-lg"
                  >
                    +
                  </button>
                </div>
                <button
                  ref={addToCartButtonRef}
                  onClick={addToCart}
                  className="flex items-center border border-[#FFAB40] rounded-lg overflow-hidden p-2 bg-[#FF6200] text-white hover:bg-[#FFAB40] transition-colors"
                >
                  <CartIcon className="w-5 h-5 mr-2" />
                  Savatga qo'shish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Sudraladigan savat tugmasi */}
        <motion.button
          onClick={() => navigate('/cart')}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className={`fixed z-[60] bg-gradient-to-r from-[#FF6200] to-[#FFAB40] text-white p-4 rounded-full shadow-lg transition-transform ${
            isDragging ? 'cursor-grabbing' : 'cursor-pointer'
          } hover:scale-110`}
          style={{
            left: `${cartPosition.x}px`,
            top: `${cartPosition.y}px`,
            touchAction: 'none',
          }}
          aria-label="Savat"
          whileTap={{ scale: 0.9 }}
        >
          <div className="relative">
            <CartIcon className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
        </motion.button>

        {/* Animatsiya elementlari */}
        {animations.map((anim) => (
          <motion.div
            key={anim.id}
            className="fixed z-[100] pointer-events-none"
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: anim.endX - anim.startX,
              y: anim.endY - anim.startY,
              opacity: 0,
            }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              left: `${anim.startX}px`,
              top: `${anim.startY}px`,
            }}
          >
            {anim.photo ? (
              <img
                src={`https://hosilbek.pythonanywhere.com${anim.photo}`}
                alt="Product"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <CartIcon className="w-8 h-8 text-[#FF6200]" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProductsList;
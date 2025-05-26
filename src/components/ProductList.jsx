import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  Fastfood as FastfoodIcon,
  LocalDining as KitchenIcon,
  AttachMoney as PriceIcon,
  LocalOffer as DiscountIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';

// Shuffle function for products
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
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedKitchen, setSelectedKitchen] = useState(null);
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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_URL);
      let productsData = Array.isArray(response.data) ? response.data : [];
      productsData = shuffleArray(productsData);
      setProducts(productsData);
    } catch (err) {
      setError(err.response?.data?.message || "Mahsulotlarni yuklab bo‘lmadi");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on selected kitchen and search
  useEffect(() => {
    let result = [...products];
    if (selectedKitchen) {
      result = result.filter((product) => product.kitchen?.name === selectedKitchen);
    }
    if (search) {
      result = result.filter(
        (product) =>
          product.title?.toLowerCase().includes(search.toLowerCase()) ||
          product.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredProducts(result);
  }, [search, selectedKitchen, products]);

  // Update cart data
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

  // Reset filters
  const resetFilters = () => {
    setSearch('');
    setSelectedKitchen(null);
  };

  // Get unique kitchens
  const uniqueKitchens = useMemo(
    () => [...new Set(products.map((p) => p.kitchen?.name).filter(Boolean))],
    [products]
  );

  // Draggable cart button functionality
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
    newX = Math.max(0, Math.min(newX, window.innerWidth - buttonWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - buttonHeight));

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

  // Add to cart with animation targeting the current cart position
  const addToCart = useCallback(() => {
    if (!selectedProduct) return;

    const buttonRect = addToCartButtonRef.current?.getBoundingClientRect();
    if (!buttonRect) return;

    // Use the current cartPosition for the end position
    const cartX = cartPosition.x + 32; // Center of the cart button (width/2)
    const cartY = cartPosition.y + 32; // Center of the cart button (height/2)

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
        {/* Mobile Header */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-lg font-bold text-[#FF6200] flex items-center">
              <FastfoodIcon className="w-5 h-5 mr-2" />
              Mahsulotlar ({filteredProducts.length})
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="p-2 rounded-full bg-[#FF6200] text-white"
                aria-label={mobileSearchOpen ? 'Qidiruvni yopish' : 'Qidiruvni ochish'}
              >
                {mobileSearchOpen ? <CloseIcon className="w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="p-2 rounded-full bg-[#FF6200] text-white"
                aria-label={mobileFilterOpen ? 'Filtrlarni yopish' : 'Filtrlarni ochish'}
              >
                {mobileFilterOpen ? <CloseIcon className="w-5 h-5" /> : <FilterIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {mobileSearchOpen && (
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Mahsulot qidirish..."
                className="w-full border border-[#FFAB40] rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] placeholder-gray-600"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Mahsulot qidirish"
              />
              <SearchIcon className="w-5 h-5 absolute left-3 top-2.5 text-[#FFAB40]" />
            </div>
          )}

          {/* Mobile Filters */}
          {mobileFilterOpen && (
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-sm text-[#333] flex items-center">
                  <FilterIcon className="w-4 h-4 mr-1" />
                  Oshxonalar
                </h3>
                <button
                  onClick={resetFilters}
                  className="text-[#FF6200] text-xs flex items-center"
                  aria-label="Filtrlarni tozalash"
                >
                  <RefreshIcon className="w-4 h-4 mr-1" />
                  Tozalash
                </button>
              </div>
              <div className="space-y-2">
                {uniqueKitchens.map((kitchen) => (
                  <button
                    key={kitchen}
                    onClick={() => setSelectedKitchen(selectedKitchen === kitchen ? null : kitchen)}
                    className={`w-full text-left p-2 rounded text-sm ${
                      selectedKitchen === kitchen
                        ? 'bg-[#FF6200] text-white'
                        : 'bg-[#FFF3E0] text-[#333]'
                    }`}
                    aria-label={`Oshxona: ${kitchen}`}
                  >
                    {kitchen}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Kitchens Carousel */}
        <div className="overflow-x-auto whitespace-nowrap mb-4 pb-2">
          <ul className="flex gap-2">
            {uniqueKitchens.map((kitchen) => (
              <li
                key={kitchen}
                className={`inline-block px-4 py-2 rounded-full cursor-pointer text-sm ${
                  selectedKitchen === kitchen
                    ? 'bg-[#FF6200] text-white'
                    : 'bg-[#FFF3E0] text-[#333] border border-[#FFAB40]'
                }`}
                onClick={() => setSelectedKitchen(selectedKitchen === kitchen ? null : kitchen)}
              >
                {kitchen}
              </li>
            ))}
          </ul>
        </div>

        {/* Products or Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-[#666] bg-white rounded-lg shadow-sm">
            {search ? (
              <>
                <SearchIcon className="w-12 h-12 mx-auto mb-2 text-[#FFAB40]" />
                <p className="text-base">"{search}" bo‘yicha hech narsa topilmadi</p>
              </>
            ) : (
              <>
                <FastfoodIcon className="w-12 h-12 mx-auto mb-2 text-[#FFAB40]" />
                <p className="text-base">Mahsulotlar topilmadi</p>
              </>
            )}
            <button
              onClick={resetFilters}
              className="mt-4 bg-[#FF6200] hover:bg-[#FFAB40] text-white px-4 py-2 rounded-lg flex items-center mx-auto text-sm"
              aria-label="Barcha filtrlarni tozalash"
            >
              <RefreshIcon className="w-4 h-4 mr-1" />
              Barcha filtrlarni tozalash
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredProducts.map((product) => (
              <div
                style={{
                  background: 'linear-gradient(to bottom, #FFFFFF, #FFF3E0, #FFF3E0)',
                }}
                key={product.id}
                className="rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full cursor-pointer"
                onClick={() => setSelectedProduct(product)}
                aria-label={`Mahsulot: ${product.title || 'Yangi mahsulot'}`}
              >
                {/* Product Image */}
                <div className="relative pt-[75%] overflow-hidden">
                  {product.photo ? (
                    <img
                      src={`https://hosilbek.pythonanywhere.com${product.photo}`}
                      alt={product.title || 'Mahsulot rasmi'}
                      className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="absolute top-0 left-0 w-full h-full bg-[#FFF3E0] flex items-center justify-center">
                      <FastfoodIcon className="w-12 h-12 text-[#FFAB40]" />
                    </div>
                  )}
                  {parseFloat(product.discount) > 0 && (
                    <div className="absolute top-2 right-2 bg-[#FF6200] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                      <DiscountIcon className="w-3 h-3 mr-1" />
                      {Math.round((parseFloat(product.discount) / parseFloat(product.price)) * 100)}%
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div
                  style={{
                    background: 'linear-gradient(to bottom, #FFFFFF, #FFF3E0)',
                  }}
                  className="p-3 flex-grow flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm text-[#333] truncate" title={product.title}>
                      {product.title || 'Yangi mahsulot'}
                    </h3>
                    <span className="bg-[#FFF3E0] text-[#FF6200] text-xs px-2 py-0.5 rounded-full">
                      {product.unit}
                    </span>
                  </div>
                  <p className="text-[#666] text-xs mb-3 line-clamp-2 flex-grow">
                    {product.description || 'Tavsif mavjud emas'}
                  </p>
                  <div className="mt-auto">
                    <div className="flex items-center mb-1">
                      <PriceIcon className="w-4 h-4 mr-1 text-[#FF6200]" />
                      <span
                        className={`font-bold text-sm ${
                          parseFloat(product.discount) > 0
                            ? 'line-through text-[#666]'
                            : 'text-[#333]'
                        }`}
                      >
                        {parseFloat(product.price).toLocaleString()} so'm
                      </span>
                    </div>
                    {parseFloat(product.discount) > 0 && (
                      <p className="text-[#FF6200] font-bold text-sm">
                        {parseFloat(product.discounted_price).toLocaleString()} so'm
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-[#FFF3E0] w-full rounded-t-2xl p-4 h-[90%] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#FF6200]">{selectedProduct.title}</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-[#FF6200] hover:text-[#FFAB40]"
                aria-label="Modalni yopish"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Product Image */}
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

            {/* Price */}
            <div className="mb-4">
              {selectedProduct.discounted_price ? (
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-lg font-bold text-[#FF6200]">
                    {parseFloat(selectedProduct.discounted_price).toLocaleString('uz-UZ')} so'm
                  </span>
                  <span className="text-sm text-[#666] line-through">
                    {parseFloat(selectedProduct.price).toLocaleString('uz-UZ')} so'm
                  </span>
                  <span className="bg-[#FFF3E0] text-[#FF6200] text-xs font-semibold px-2 py-1 rounded-full">
                    {Math.round(
                      (1 - selectedProduct.discounted_price / selectedProduct.price) * 100
                    )}% chegirma
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-[#333]">
                  {parseFloat(selectedProduct.price).toLocaleString('uz-UZ')} so'm
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#333] mb-1">Tavsif</h3>
              <p className="text-sm text-[#666] whitespace-pre-line">
                {selectedProduct.description || 'Tavsif mavjud emas'}
              </p>
            </div>

            {/* Quantity Selector and Add to Cart Button */}
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
          </div>
        </div>
      )}

      {/* Draggable Floating Cart Button */}
      <button
        onClick={() => navigate('/cart')}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className={`fixed z-50 bg-gradient-to-r from-[#FF6200] to-[#FFAB40] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform ${
          isDragging ? 'cursor-grabbing' : 'cursor-pointer'
        }`}
        style={{
          left: `${cartPosition.x}px`,
          top: `${cartPosition.y}px`,
          touchAction: 'none',
        }}
        aria-label="Savat"
      >
        <div className="relative">
          <CartIcon className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </div>
      </button>

      {/* Animation Elements */}
      {animations.map((anim) => (
        <div
          key={anim.id}
          className="fixed z-[100] pointer-events-none animate-fly-to-cart"
          style={{
            left: `${anim.startX}px`,
            top: `${anim.startY}px`,
            '--end-x': `${anim.endX - anim.startX}px`,
            '--end-y': `${anim.endY - anim.startY}px`,
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
        </div>
      ))}
    </div>
  );
};

export default ProductsList;
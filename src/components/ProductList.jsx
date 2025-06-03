
import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Fastfood as FastfoodIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import CategorySection from './CategorySection';
import ProductModal from './ProductModal';
import CartButton from './CartButton';
import CartAnimation from './CartAnimation';

// Mahsulotlarni tasodifiy aralashtirish
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const ProductsList = memo(() => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
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
  const addToCartButtonRef = useRef(null);

  const API_URL = 'https://hosilbek.pythonanywhere.com/api/user/products/';
  const token = localStorage.getItem('authToken');

  // Mahsulotlarni yuklash
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

      // Faol mahsulotlarni filtrlash
      productsData = productsData.filter(
        (product) =>
          product.is_aktiv === true &&
          (!product.kitchen || product.kitchen?.is_aktiv !== false)
      );

      // Mahsulotlarni tasodifiy tartibda aralashtirish
      productsData = shuffleArray(productsData);

      // Kategoriyalar bo‘yicha guruhlash
      const grouped = productsData.reduce((acc, product) => {
        const category = product.category?.name || product.kitchen?.name || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
      }, {});

      // Bo‘sh kategoriyalarni o‘chirish
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

  // Savat tugmasini sudrab yurish
  useEffect(() => {
    localStorage.setItem('productsCartButtonPosition', JSON.stringify(cartPosition));
  }, [cartPosition]);

  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    setDragStart({
      x: clientX - cartPosition.x,
      y: clientY - cartPosition.y,
    });
  }, [cartPosition]);

  const handleDragMove = useCallback((e) => {
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
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

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
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Savatga qo'shish
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
      setQuantity(1);
    }, 1500);
  }, [selectedProduct, quantity, cartPosition]);

  // Modalni yopish
  const handleCloseModal = useCallback(() => {
    setSelectedProduct(null);
    setQuantity(1);
  }, []);

  // Kategoriyalar ro‘yxati va umumiy mahsulotlar soni
  const categoryList = useMemo(() => Object.keys(categories), [categories]);
  const totalProducts = useMemo(() => {
    return selectedCategory === 'all'
      ? Object.values(categories).reduce((sum, prods) => sum + prods.length, 0)
      : categories[selectedCategory]?.length || 0;
  }, [categories, selectedCategory]);

  // Yuklanish holati
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

  // Xato holati
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
            Mahsulotlar ({totalProducts})
          </h1>
        </div>

        {/* Kategoriya filtrlari */}
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
            {categoryList.map((category) => (
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

        {/* Kategoriyalar bo‘limlari */}
        {categoryList.length === 0 ? (
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
              <CategorySection
                key={category}
                category={category}
                products={products}
                onSelect={setSelectedProduct}
              />
            ))}
          </div>
        )}

        {/* Mahsulot modali */}
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            quantity={quantity}
            setQuantity={setQuantity}
            onClose={handleCloseModal}
            onAddToCart={addToCart}
            addToCartButtonRef={addToCartButtonRef}
          />
        )}

        {/* Sudraladigan savat tugmasi */}
        <CartButton
          cartCount={cartCount}
          cartPosition={cartPosition}
          isDragging={isDragging}
          onClick={() => navigate('/cart')}
          onDragStart={handleDragStart}
        />

        {/* Animatsiya elementlari */}
        {animations.map((anim) => (
          <CartAnimation key={anim.id} animation={anim} />
        ))}
      </div>
    </div>
  );
});

export default ProductsList;
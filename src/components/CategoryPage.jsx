
import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Fastfood as FastfoodIcon } from '@mui/icons-material';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import CartButton from './CartButton';
import CartAnimation from './CartAnimation';
import SubcategoryFilter from './SubcategoryFilter';
import ErrorBoundary from './ErrorBoundary';

const CategoryPage = memo(() => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
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
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');

  const API_URL = 'https://hosilbek.pythonanywhere.com/api/user/products/';
  const addToCartButtonRef = useRef(null);

  // Mahsulotlarni yuklash
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(API_URL, config);
      const productsData = Array.isArray(response.data) ? response.data : [];

      // Kategoriya bo‘yicha filtrlash
      const filteredByCategory = productsData.filter(
        (product) =>
          (product.category?.name || product.kitchen?.name || '').toLowerCase() ===
          decodeURIComponent(categoryName).toLowerCase()
      );

      // Unikal subkategoriyalarni olish
      const uniqueSubcategories = [
        'all',
        ...new Set(
          filteredByCategory
            .map((product) => product.subcategory?.name)
            .filter(Boolean)
        ),
      ];

      setProducts(filteredByCategory);
      setFilteredProducts(filteredByCategory);
      setSubcategories(uniqueSubcategories);
    } catch (err) {
      const message = err.response?.data?.message || 'Mahsulotlarni yuklab bo‘lmadi';
      setError(message);
      setProducts([]);
      setFilteredProducts([]);
      setSubcategories([]);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryName]);

  // Subkategoriya bo‘yicha filtrlash
  useEffect(() => {
    if (selectedSubcategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter(
          (product) =>
            (product.subcategory?.name || '').toLowerCase() ===
            selectedSubcategory.toLowerCase()
        )
      );
    }
  }, [selectedSubcategory, products]);

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

  // Kategoriya nomi
  const decodedCategoryName = useMemo(
    () => decodeURIComponent(categoryName),
    [categoryName]
  );

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

  return (
    <ErrorBoundary>
      <div className="min-h-[calc(100vh-64px)] bg-[#FFF3E0] px-2 py-4 relative">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-lg font-bold text-[#FF6200] mb-4 flex items-center">
            <FastfoodIcon className="w-5 h-5 mr-2" />
            {decodedCategoryName} ({filteredProducts.length})
          </h1>

          {/* Subkategoriya filtri */}
          <SubcategoryFilter
            subcategories={subcategories}
            selectedSubcategory={selectedSubcategory}
            onSelect={setSelectedSubcategory}
          />

          {error ? (
            <div className="flex justify-center items-center min-h-[calc(100vh-64px)] px-4">
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
          ) : (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-[#666] bg-white rounded-lg shadow-sm">
                  <FastfoodIcon className="w-12 h-12 mx-auto mb-2 text-[#FFAB40]" />
                  <p className="text-base">Mahsulotlar topilmadi</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={setSelectedProduct}
                    />
                  ))}
                </div>
              )}
            </>
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
    </ErrorBoundary>
  );
});

export default CategoryPage;

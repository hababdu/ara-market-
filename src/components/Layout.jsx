import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  ShoppingCart as CartIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  ListAlt as OrdersIcon,
  LocalOffer as PromoIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const Layout = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Savatdagi mahsulotlar sonini hisoblash
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalItems);
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    const interval = setInterval(updateCartCount, 1000);

    // Scrollni kuzatish
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Mobil menyuni yopish
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Navigatsiya funktsiyasi
  const handleNavigate = (path) => {
    navigate(path);
    closeMobileMenu();
  };

  return (
    <div className="min-h-screen bg-[#FFF3E0] flex flex-col">
      {/* Asosiy kontent */}
      <main className="flex-1 max-w-6xl mx-auto md:mt-20 mb-16 px-4">
        <Outlet />
      </main>

      {/* Mobil pastki navigatsiya (faqat ikonalar) */}
      <nav className="fixed bottom-0 w-full bg-gradient-to-r from-[#FF6200] to-[#FFAB40] text-white md:hidden flex justify-around items-center py-3 z-50 shadow-lg">
        <button
          onClick={() => handleNavigate('/')}
          className="flex flex-col items-center p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Bosh sahifa"
        >
          <HomeIcon className="text-white" style={{ fontSize: 24 }} />
        </button>
        <button
          onClick={() => handleNavigate('/profile')}
          className="flex flex-col items-center p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Profil"
        >
          <PersonIcon className="text-white" style={{ fontSize: 24 }} />
        </button>
        <button
          onClick={() => handleNavigate('/status')}
          className="flex flex-col items-center p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Faol buyurtmalar"
        >
          <OrdersIcon className="text-white" style={{ fontSize: 24 }} />
        </button>
        <button
          onClick={() => handleNavigate('/orders')}
          className="flex flex-col items-center p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Buyurtmalar"
        >
          <OrdersIcon className="text-white" style={{ fontSize: 24 }} />
        </button>
      </nav>

      {/* Suzib yuruvchi savat tugmasi */}
      <button
        onClick={() => handleNavigate('/cart')}
        className="fixed bottom-20 right-4 bg-gradient-to-r from-[#FF6200] to-[#FFAB40] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-50 md:hidden"
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
    </div>
  );
};

export default Layout;
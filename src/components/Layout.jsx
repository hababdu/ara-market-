import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  ShoppingCart as CartIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  ListAlt as OrdersIcon, // Correct icon
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
      <main className="flex-1 container mx-auto md:mt-20 mb-16">
        <Outlet />
      </main>

      {/* Mobil pastki navigatsiya (faqat ikonalar) */}
      <nav className="fixed bottom-0 w-full bg-[#FF6200] text-white md:hidden flex justify-around items-center py-2 z-50">
        <button
          onClick={() => handleNavigate('/')}
          className="flex flex-col items-center"
          aria-label="Bosh sahifa"
        >
          <HomeIcon />
        </button>
        <button
          onClick={() => handleNavigate('/profile')}
          className="flex flex-col items-center"
          aria-label="Profil"
        >
          <PersonIcon />
        </button>
        <button
          onClick={() => handleNavigate('/status')}
          className="flex flex-col items-center"
          aria-label="Faol buyurtmalar"
        >
          <OrdersIcon /> {/* Use OrdersIcon instead of ListAltIcon */}
        </button>
        <button
          onClick={() => handleNavigate('/orders')}
          className="flex flex-col items-center"
          aria-label="Buyurtmalar"
        >
          <OrdersIcon />
        </button>
       
        <button
          onClick={() => handleNavigate('/cart')}
          className="relative flex flex-col items-center"
          aria-label="Savat"
        >
          <CartIcon className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
};

export default Layout;
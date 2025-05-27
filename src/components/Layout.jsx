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
  const [position, setPosition] = useState(() => {
    const savedPosition = localStorage.getItem('cartButtonPosition');
    return savedPosition
      ? JSON.parse(savedPosition)
      : { x: window.innerWidth - 80, y: window.innerHeight - 160 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalItems);
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    const interval = setInterval(updateCartCount, 1000);

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

  useEffect(() => {
    localStorage.setItem('cartButtonPosition', JSON.stringify(position));
  }, [position]);

  const handleDragStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
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

    setPosition({ x: newX, y: newY });
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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    closeMobileMenu();
  };

  return (
    <div className="min-h-screen bg-[#FFF3E0] flex flex-col">
      <main className="flex-1 max-w-6xl mx-auto md:mt-20 mb-16 px-4">
        <Outlet />
      </main>

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

    </div>
  );
};

export default Layout;
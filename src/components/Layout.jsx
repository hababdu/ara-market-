import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart as CartIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  ListAlt as OrdersIcon,
  History as HistoryIcon,
  LocalOffer as PromoIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

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
    const navBarHeight = 60; // Approximate height of bottom navigation bar
    newX = Math.max(0, Math.min(newX, window.innerWidth - buttonWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - buttonHeight - navBarHeight));

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

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Bosh sahifa' },
    { path: '/profile', icon: PersonIcon, label: 'Profil' },
    { path: '/status', icon: OrdersIcon, label: 'Buyurtmalar' },
    { path: '/orders', icon: HistoryIcon, label: 'Tarix'},
  ];

  return (
    <div className="min-h-screen bg-[#FFF3E0] flex flex-col">
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          .nav-active-indicator {
            animation: pulse 1.5s infinite;
          }
        `}
      </style>
      <main className="flex-1 max-w-6xl mx-auto md:mt-20 mb-16 px-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full bg-gradient-to-r from-[#FF6200] to-[#FFAB40] text-white md:hidden z-50 shadow-lg">
        <div className="flex justify-around items-center py-3">
          {navItems.map(({ path, icon: Icon, label, ariaLabel }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex flex-col items-center p-2 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-white/20' : 'hover:bg-white/10'
                }`
              }
              onClick={closeMobileMenu}
              aria-label={ariaLabel}
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            >
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  className="flex flex-col items-center"
                >
                  <Icon className="text-white" style={{ fontSize: 24 }} />
                  {isActive && (
                    <motion.div
                      className="w-1 h-1 bg-white rounded-full mt-1 nav-active-indicator"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

    
    </div>
  );
};

export default Layout;
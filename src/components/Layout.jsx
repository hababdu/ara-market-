
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  ListAlt as OrdersIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import MobileNav from './MobileNav';
import CartButton from './CartButton';

const Layout = memo(() => {
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

  // Savat ma'lumotlarini yangilash
  const updateCartCount = useCallback(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalItems);
  }, []);

  useEffect(() => {
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
  }, [updateCartCount]);

  // Savat tugmasi pozitsiyasini saqlash
  useEffect(() => {
    localStorage.setItem('cartButtonPosition', JSON.stringify(position));
  }, [position]);

  // Savat tugmasini sudrab yurish
  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  }, [position]);

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

    setPosition({ x: newX, y: newY });
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

  // Mobil menyuni yopish
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Navigatsiya elementlari
  const navItems = useMemo(
    () => [
      { path: '/', icon: HomeIcon, label: 'Bosh sahifa', ariaLabel: 'Bosh sahifa' },
      { path: '/profile', icon: PersonIcon, label: 'Profil', ariaLabel: 'Profil' },
      { path: '/status', icon: OrdersIcon, label: 'Buyurtmalar', ariaLabel: 'Buyurtmalar' },
      { path: '/orders', icon: HistoryIcon, label: 'Tarix', ariaLabel: 'Buyurtma tarixi' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#FFF3E0] flex flex-col">
      <main className="flex-1 max-w-6xl mx-auto md:mt-20 mb-16">
        <Outlet />
      </main>

      <MobileNav navItems={navItems} closeMobileMenu={closeMobileMenu} />

      <CartButton
        cartCount={cartCount}
        cartPosition={position}
        isDragging={isDragging}
        onClick={() => navigate('/cart')}
        onDragStart={handleDragStart}
      />
    </div>
  );
});

export default Layout;

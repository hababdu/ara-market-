import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  ShoppingCart as CartIcon,
  Home as HomeIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  ListAlt as OrdersIcon,
  LocalOffer as PromoIcon,
  Close as CloseIcon
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-blue-600 shadow-lg' : 'bg-blue-600'}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo va mobil menyu tugmasi */}
            <div className="flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white mr-4"
                aria-label="Menyu"
              >
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
              <h1
                className="text-xl font-bold text-white cursor-pointer flex items-center"
                onClick={() => handleNavigate('/')}
              >
                <HomeIcon className="mr-2" />
                <span className="hidden sm:inline">Ara Kafe</span>
              </h1>
            </div>

            {/* Desktop navigatsiya */}
            <nav className="hidden md:flex items-center gap-4">
              <button onClick={() => handleNavigate('/profile')} className="text-white hover:text-blue-200 flex items-center">
                <PersonIcon className="mr-1" />
                <span>Profil</span>
              </button>
              <button onClick={() => handleNavigate('/orders')} className="text-white hover:text-blue-200 flex items-center">
                <OrdersIcon className="mr-1" />
                <span>Buyurtmalar</span>
              </button>
              <button onClick={() => handleNavigate('/promotions')} className="text-white hover:text-blue-200 flex items-center">
                <PromoIcon className="mr-1" />
                <span>Aksiyalar</span>
              </button>
              <button
                onClick={() => handleNavigate('/cart')}
                className="relative text-white hover:text-blue-200 flex items-center"
              >
                <CartIcon className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Mobil savat tugmasi */}
            <button
              onClick={() => handleNavigate('/cart')}
              className="md:hidden relative text-white"
              aria-label="Savat"
            >
              <CartIcon className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobil menyu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-blue-700 px-4 py-3">
            <nav className="flex flex-col space-y-3">
              <button 
                onClick={() => handleNavigate('/profile')} 
                className="text-white hover:text-blue-200 flex items-center py-2"
              >
                <PersonIcon className="mr-3" />
                Profil
              </button>
              <button 
                onClick={() => handleNavigate('/orders')} 
                className="text-white hover:text-blue-200 flex items-center py-2"
              >
                <OrdersIcon className="mr-3" />
                Buyurtmalar
              </button>
              <button 
                onClick={() => handleNavigate('/promotions')} 
                className="text-white hover:text-blue-200 flex items-center py-2"
              >
                <PromoIcon className="mr-3" />
                Aksiyalar
              </button>
              <button 
                onClick={() => handleNavigate('/')} 
                className="text-white hover:text-blue-200 flex items-center py-2"
              >
                <HomeIcon className="mr-3" />
                Bosh sahifa
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Asosiy kontent */}
      <main className="flex-1 container mx-auto py-6 px-4 mt-16 md:mt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 text-center">
        <div className="container mx-auto px-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} Ara Kafe. Barcha huquqlar himoyalangan.</p>
          <div className="flex justify-center space-x-6 mt-3">
            <button className="text-sm hover:text-blue-300">Foydalanish shartlari</button>
            <button className="text-sm hover:text-blue-300">Maxfiylik siyosati</button>
            <button className="text-sm hover:text-blue-300">Biz bilan bog'lanish</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
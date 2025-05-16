import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart as CartIcon, Home as HomeIcon } from '@mui/icons-material';

const Layout = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  // Savatdagi mahsulotlar sonini hisoblash
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalItems);
    };

    updateCartCount();
    // localStorage o'zgarishini kuzatish
    window.addEventListener('storage', updateCartCount);
    // Komponent yangilanganda ham yangilash
    const interval = setInterval(updateCartCount, 1000);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1
            className="text-xl font-bold cursor-pointer flex items-center"
            onClick={() => navigate('/')}
          >
            <HomeIcon className="mr-2" />
            Ara Kafe
          </h1>
          <nav className="flex items-center gap-4">
          <button onClick={() => navigate('/profile')} className="hover:text-blue-200">
  Profil
</button>
<button onClick={() => navigate('/orders')} className="hover:text-blue-200">
  Buyurtmalar
</button>
<button onClick={() => navigate('/promotions')} className="hover:text-blue-200">
  Aksiyalar
</button>
            <button
              onClick={() => navigate('/')}
              className="hover:text-blue-200 flex items-center"
            >
              Bosh sahifa
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="relative hover:text-blue-200 flex items-center"
            >
              <CartIcon className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Asosiy kontent */}
      <main className="flex-1 container mx-auto py-6 px-4">
        <Outlet />
      </main>

      {/* Footer (ixtiyoriy) */}
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2025 Ara Kafe. Barcha huquqlar himoyalangan.</p>
      </footer>
    </div>
  );
};

export default Layout;
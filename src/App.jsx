import React, { lazy, Suspense, memo } from 'react';
import { Routes, Route } from 'react-router-dom';
import './index.css';

// Lazy loading orqali komponentlarni import qilish
const Layout = lazy(() => import('./components/Layout.jsx'));
const Home = lazy(() => import('./components/Home.jsx'));
const Cart = lazy(() => import('./components/Cart/Cart.jsx'));
const Checkout = lazy(() => import('./components/Checkout.jsx'));
const Profile = lazy(() => import('./components/Profile.jsx'));
const Orders = lazy(() => import('./components/Orders.jsx'));
const Statuses = lazy(() => import('./components/Statuses.jsx'));
const CategoryPage = lazy(() => import('./components/CategoryPage.jsx'));

// App komponentini memo bilan o'rash (ortiqcha re-renderlarni oldini olish)
const App = memo(() => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/status" element={<Statuses />} />
        </Route>
      </Routes>
    </Suspense>
  );
});

// Fallback komponenti (alohida qilib optimallashtirish uchun)
const LoadingFallback = memo(() => (
  <div className="loading">
    <div className="spinner">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width="50"
        height="50"
        fill="none"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#4caf50"
          strokeWidth="10"
          strokeDasharray="283"
          strokeDashoffset="75"
          strokeLinecap="round"
          animation="spin 1.5s linear infinite"
        />
      </svg>
    </div>
    <span style={{ marginTop: '10px', fontSize: '16px', color: '#4caf50' }}>
      Yuklanmoqda, iltimos kuting...
    </span>
    <style>
      {`
        @keyframes spin {
          0% {
            stroke-dashoffset: 283;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background-color: #f9f9f9;
        }
      `}
    </style>
  </div>
));

export default App;
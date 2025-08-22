
import React, { useEffect, useState, useCallback, memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import OrderCard from './OrderCard';
import OrderModal from './OrderModal';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const OrderPage = memo(() => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Buyurtmalarni yuklash
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token topilmadi. Iltimos, tizimga kiring.');
      }

      const response = await fetch('https://hosilbek02.pythonanywhere.com/api/user/order-history/', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Ruxsat berilmadi. Token noto‘g‘ri yoki muddati o‘tgan.');
        }
        throw new Error(`Ma'lumotlarni olishda xato yuz berdi: ${response.statusText}`);
      }

      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Sana formatlash
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Status rangini olish
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'buyurtma_topshirildi':
        return 'bg-green-100 text-green-800';
      case 'qabul_qilindi':
        return 'bg-blue-100 text-blue-800';
      case 'tayyorlanmoqda':
        return 'bg-yellow-100 text-yellow-800';
      case 'yetkazilmoqda':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Statusni tarjima qilish
  const translateStatus = useCallback((status) => {
    switch (status) {
      case 'buyurtma_topshirildi':
        return 'Buyurtma topshirildi';
      case 'qabul_qilindi':
        return 'Qabul qilindi';
      case 'tayyorlanmoqda':
        return 'Tayyorlanmoqda';
      case 'yetkazilmoqda':
        return 'Yetkazilmoqda';
      default:
        return status;
    }
  }, []);

  // Buyurtmalar yo‘q bo‘lsa chiqadigan UI
  const emptyState = useMemo(
    () => (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-[#FFAB40]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-[#333]">Buyurtmalar topilmadi</h3>
        <p className="mt-1 text-sm text-[#666]">Hozircha hech qanday buyurtma qilmagansiz.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#FF6200] hover:bg-[#FFAB40] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6200]"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    ),
    []
  );

  return (
    <div className="bg-[#FFF3E0] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-[#FF6200] sm:text-4xl">
            Buyurtmalar tarixi
          </h1>
          <p className="mt-3 text-xl text-[#666]">
            Barcha qilgan buyurtmalaringiz
          </p>
        </div>

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage error={error} />}
        {!loading && !error && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {orders.length > 0 ? (
              <ul className="divide-y divide-[#FFAB40]">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onSelect={setSelectedOrder}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                    translateStatus={translateStatus}
                  />
                ))}
              </ul>
            ) : (
              emptyState
            )}
          </div>
        )}

        {selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            formatDate={formatDate}
          />
        )}
      </div>
    </div>
  );
});

export default OrderPage;

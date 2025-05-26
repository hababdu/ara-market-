import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Token topilmadi. Iltimos, tizimga kiring.');
        }

        const response = await fetch('https://hosilbek.pythonanywhere.com/api/user/order-history/', {
          headers: {
            'Authorization': `Bearer ${token}`,
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
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
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
  };

  const translateStatus = (status) => {
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
  };

  return (
    <div className=" bg-[#FFF3E0] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-[#FF6200] sm:text-4xl">
            Buyurtmalar tarixi
          </h1>
          <p className="mt-3 text-xl text-[#666]">
            Barcha qilgan buyurtmalaringiz
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6200] mb-4"></div>
            <p className="text-lg text-[#666]">Buyurtmalar yuklanmoqda...</p>
          </div>
        )}

        {error && (
          <div className="bg-[#ffebee] border-l-4 border-[#FF6200] p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-[#FF6200]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-[#FF6200]">
                  {error}
                  {error.includes('Token topilmadi') && (
                    <Link to="/login" className="ml-2 text-[#FFAB40] hover:text-[#FF6200] font-medium">
                      Tizimga kirish
                    </Link>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {orders.length > 0 ? (
              <ul className="divide-y divide-[#FFAB40]">
                {orders.map((order) => (
                  <li
                    key={order.id}
                    className="px-4 py-6 sm:px-6 cursor-pointer hover:bg-[#FFF3E0]"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex items-center space-x-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-medium text-[#333]">
                            Buyurtma #{order.id}
                          </h3>
                          <p className="mt-1 text-sm text-[#666]">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 sm:ml-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {translateStatus(order.status)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
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
            )}
          </div>
        )}
      </div>

      {/* Order Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-[#FFF3E0] w-full rounded-t-2xl p-4 h-[90%] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#FF6200]">
                Buyurtma #{selectedOrder.id}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#FF6200] hover:text-[#FFAB40]"
                aria-label="Modalni yopish"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Details */}
              <div>
                <h4 className="text-md font-medium text-[#333] mb-3">Buyurtma ma'lumotlari</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#666]">Umumiy summa:</span>
                      <span className="text-sm font-medium">{selectedOrder.total_amount} so'm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#666]">To'lov usuli:</span>
                      <span className="text-sm font-medium">{selectedOrder.payment === 'naqd' ? 'Naqd pul' : selectedOrder.payment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#666]">Telefon raqam:</span>
                      <span className="text-sm font-medium">{selectedOrder.contact_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#666]">Buyurtma vaqti:</span>
                      <span className="text-sm font-medium">{formatDate(selectedOrder.created_at)}</span>
                    </div>
                    {selectedOrder.detected_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-[#666]">Qabul qilingan vaqt:</span>
                        <span className="text-sm font-medium">{formatDate(selectedOrder.detected_at)}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#666]">Manzil:</span>
                      <span className="text-sm font-medium">{selectedOrder.shipping_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#666]">Restoran:</span>
                      <span className="text-sm font-medium">{selectedOrder.kitchen?.name || 'N/A'}</span>
                    </div>
                    {selectedOrder.notes && (
                      <div className="flex justify-between">
                        <span className="text-sm text-[#666]">Qo'shimcha izoh:</span>
                        <span className="text-sm font-medium">{selectedOrder.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-md font-medium text-[#333] mb-3">Buyurtma mahsulotlari</h4>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-[#FFAB40]">
                    <thead className="bg-[#FFF3E0]">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#333] sm:pl-6">
                          Mahsulot
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#333]">
                          Narxi
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#333]">
                          Miqdori
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#333]">
                          Summa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FFAB40] bg-white">
                      {selectedOrder.items.map((item) => (
                        <tr key={`${selectedOrder.id}-${item.product.id}`}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-[#333] sm:pl-6">
                            {item.product.title}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-[#666]">
                            {item.price} so'm
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-[#666]">
                            {item.quantity}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-[#666]">
                            {(parseFloat(item.price) * item.quantity).toFixed(2)} so'm
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-right py-3 pl-4 pr-3 text-sm font-medium text-[#333] sm:pl-6">
                          Jami:
                        </td>
                        <td className="px-3 py-3 text-sm font-bold text-[#FF6200]">
                          {selectedOrder.total_amount} so'm
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;
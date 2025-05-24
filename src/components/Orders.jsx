import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

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

  const toggleOrderDetails = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Buyurtmalar tarixi
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Barcha qilgan buyurtmalaringiz
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-lg text-gray-600">Buyurtmalar yuklanmoqda...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                  {error.includes('Token topilmadi') && (
                    <Link to="/login" className="ml-2 text-blue-600 hover:text-blue-500 font-medium">
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
              <ul className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <li key={order.id} className="px-4 py-6 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex items-center space-x-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            Buyurtma #{order.id}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
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

                    <div className="mt-4">
                      <button
                        onClick={() => toggleOrderDetails(order.id)}
                        className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                      >
                        {expandedOrder === order.id ? 'Tafsilotlarni yopish' : 'Tafsilotlarni ko‘rish'}
                      </button>
                    </div>

                    {expandedOrder === order.id && (
                      <div className="mt-6 border-t border-gray-200 pt-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <h4 className="text-md font-medium text-gray-900 mb-3">Buyurtma ma'lumotlari</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Umumiy summa:</span>
                                <span className="text-sm font-medium">{order.total_amount} so'm</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">To'lov usuli:</span>
                                <span className="text-sm font-medium">{order.payment === 'naqd' ? 'Naqd pul' : order.payment}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Telefon raqam:</span>
                                <span className="text-sm font-medium">{order.contact_number}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Buyurtma vaqti:</span>
                                <span className="text-sm font-medium">{formatDate(order.created_at)}</span>
                              </div>
                              {order.detected_at && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Qabul qilingan vaqt:</span>
                                  <span className="text-sm font-medium">{formatDate(order.detected_at)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-md font-medium text-gray-900 mb-3">Yetkazib berish</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Manzil:</span>
                                <span className="text-sm font-medium text-right">{order.shipping_address}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Restoran:</span>
                                <span className="text-sm font-medium">{order.kitchen?.name || 'N/A'}</span>
                              </div>
                              {order.notes && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Qo'shimcha izoh:</span>
                                  <span className="text-sm font-medium">{order.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-8">
                          <h4 className="text-md font-medium text-gray-900 mb-3">Buyurtma mahsulotlari</h4>
                          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                    Mahsulot
                                  </th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Narxi
                                  </th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Miqdori
                                  </th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Summa
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {order.items.map((item) => (
                                  <tr key={`${order.id}-${item.product.id}`}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                      {item.product.title}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {item.price} so'm
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {item.quantity}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {(parseFloat(item.price) * item.quantity).toFixed(2)} so'm
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colSpan="3" className="text-right py-3 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                    Jami:
                                  </td>
                                  <td className="px-3 py-3 text-sm font-bold text-gray-900">
                                    {order.total_amount} so'm
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-2 text-lg font-medium text-gray-900">Buyurtmalar topilmadi</h3>
                <p className="mt-1 text-sm text-gray-500">Hozircha hech qanday buyurtma qilmagansiz.</p>
                <div className="mt-6">
                  <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Bosh sahifaga qaytish
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPage;
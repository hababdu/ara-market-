import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AccessTime,
  Cancel,
  CheckCircle,
  LocalShipping,
  LocationOn,
  Phone,
  Payment,
  Person as PersonIcon,
  Restaurant,
  Search,
  Close as CloseIcon,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ACTIVE_ORDERS_API = 'https://hosilbek.pythonanywhere.com/api/user/active-orders/';
const BASE_URL = 'https://hosilbek.pythonanywhere.com';

// Default avatar for missing product images
const defaultAvatar = 'https://via.placeholder.com/32x32?text=No+Image';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center bg-[#FFF3E0] min-h-screen flex items-center justify-center">
          <div>
            <h2 className="text-lg font-bold text-[#d32f2f] mb-2">
              Xatolik yuz berdi: {this.state.error?.message || "Noma'lum xatolik"}
            </h2>
            <p className="text-xs text-gray-600">Iltimos, sahifani yangilang yoki qayta urinib ko‘ring.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ActiveOrdersDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastFetch, setLastFetch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState({ type: null, order: null });
  const token = localStorage.getItem('authToken');

  const statusMap = useMemo(
    () => ({
      buyurtma_tushdi: {
        label: 'Yangi',
        color: '#FF6200', // Matches Checkout primary
        icon: <AccessTime fontSize="small" />,
        message: 'Buyurtma qabul qilindi!',
      },
      oshxona_vaqt_belgiladi: {
        label: 'Tayyorlanmoqda',
        color: '#0288d1', // Complements orange theme
        icon: <AccessTime fontSize="small" />,
        message: 'Oshxonada tayyorlanmoqda.',
      },
      kuryer_oldi: {
        label: 'Kuryer oldi',
        color: '#FFAB40', // Matches Checkout secondary
        icon: <CheckCircle fontSize="small" />,
        message: 'Kuryer buyurtmani oldi.',
      },
      kuryer_yolda: {
        label: 'Yetkazilmoqda',
        color: '#f57c00', // Complements orange theme
        icon: <LocalShipping fontSize="small" />,
        message: 'Buyurtma yetkazilmoqda!',
      },
      buyurtma_topshirildi: {
        label: 'Yetkazildi',
        color: '#388e3c', // Matches Checkout success
        icon: <CheckCircle fontSize="small" />,
        message: 'Buyurtma yetkazildi. Rahmat!',
      },
      qaytarildi: {
        label: 'Qaytarildi',
        color: '#d32f2f', // Matches Checkout error
        icon: <Cancel fontSize="small" />,
        message: 'Buyurtma qaytarildi.',
      },
    }),
    []
  );

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (!token) {
      setError('Tizimga kirish kerak');
      localStorage.setItem('authError', 'Tizimga kirish kerak.');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(ACTIVE_ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(response.data) ? response.data : []);
      setLastFetch(new Date().toISOString());
    } catch (err) {
      let errorMessage = 'Buyurtmalarni olishda xato';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Sessiya tugagan';
          localStorage.setItem('authError', errorMessage);
          localStorage.removeItem('authToken');
          navigate('/login', { replace: true });
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || 'Xato yuz berdi';
        }
      } else if (err.request) {
        errorMessage = 'Internet yo‘q';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const returnOrder = async (orderId) => {
    const confirm = window.confirm('Buyurtmani qaytarishni xohlaysizmi?');
    if (!confirm) return;

    setError('');
    setSuccess('');

    if (!token) {
      setError('Tizimga kirish kerak');
      navigate('/login', { replace: true });
      return;
    }

    try {
      await axios.patch(
        `${ACTIVE_ORDERS_API}${orderId}/`,
        { status: 'qaytarildi' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Buyurtma qaytarildi!');
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.detail || 'Qaytarishda xato');
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
  }, []);

  const isReturnDisabled = (status) =>
    ['kuryer_oldi', 'kuryer_yolda', 'buyurtma_topshirildi', 'qaytarildi'].includes(status);

  const getStatusChip = (status) => {
    const config = statusMap[status] || {
      label: status,
      color: '#6b7280',
      icon: null,
      message: 'Holati noma’lum',
    };
    return (
      <span
        className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold border"
        style={{ color: config.color, borderColor: config.color }}
      >
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </span>
    );
  };

  const getStatusMessage = (status) =>
    statusMap[status]?.message || 'Holati noma’lum';

  const getStatusColor = (status) =>
    statusMap[status]?.color || '#6b7280';

  const formatTime = (kitchenTime) => {
    if (!kitchenTime) return 'Noma’lum';
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      return (
        `${hours > 0 ? `${hours} soat ` : ''}${minutes > 0 ? `${minutes} min` : ''}`.trim()
      );
    }
    const hours = Math.floor(kitchenTime / 60);
    const mins = kitchenTime % 60;
    return `${hours > 0 ? `${hours} soat ` : ''}${mins > 0 ? `${mins} min` : ''}`.trim();
  };

  const getEstimatedDelivery = (kitchenTime, createdAt) => {
    if (!kitchenTime || !createdAt) return 'Yetkazish vaqti noma’lum';
    let deliveryMinutes;
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      deliveryMinutes = hours * 60 + minutes;
    } else {
      deliveryMinutes = parseInt(kitchenTime) || 60;
    }
    const created = new Date(createdAt);
    const estimated = new Date(created.getTime() + deliveryMinutes * 60000);
    return `Taxminiy: ${estimated.toLocaleString('uz-UZ')}`;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => order.id.toString().includes(searchQuery));
  }, [searchQuery, orders]);

  const handleOpenModal = (type, order = null) => {
    setModalState({ type, order });
  };

  const handleCloseModal = () => {
    setModalState({ type: null, order: null });
  };

  const handleSnackbarClose = () => {
    setError('');
    setSuccess('');
  };

  // Handle drag end to close modal based on drag distance or velocity
  const handleDragEnd = (event, info) => {
    const dragDistance = info.offset.y;
    const dragVelocity = info.velocity.y;
    const closeThreshold = window.innerHeight * 0.3; // Close if dragged 30% of screen height
    const velocityThreshold = 500; // Close if drag velocity is high

    if (dragDistance > closeThreshold || dragVelocity > velocityThreshold) {
      handleCloseModal();
    }
  };

  if (loading && orders.length === 0) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 text-[#FF6200] mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h-8z"
              />
            </svg>
            <h2 className="mt-4 text-sm text-gray-600">Buyurtmalar yuklanmoqda...</h2>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#FFF3E0] pb-16">
        <div className="max-w-[400px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="mt-12">
              <h1 className="text-base font-bold text-[#FF6200]">Buyurtmalar</h1>
              <p className="mt-1 text-xs text-gray-600">
                Buyurtma holatini kuzating yoki ID bo‘yicha qidiring.
              </p>
              <div className="flex flex-col gap-2 mt-3">
                <div className="relative">
                  <Search className="absolute top-2.5 left-3 text-gray-500" fontSize="small" />
                  <input
                    type="text"
                    placeholder="Buyurtma ID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200]"
                    aria-label="Buyurtma ID bo‘yicha qidirish"
                  />
                </div>
                <button
                  className="bg-[#FF6200] text-white px-4 py-2 rounded-lg text-xs font-medium shadow-md hover:bg-[#FFAB40] hover:scale-105 transition-all flex items-center justify-center"
                  onClick={fetchOrders}
                >
                  <svg
                    className="mr-1 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h5m11 0V4h-5m0 5h5m-5 5v5h5m-5 0h-5m0-5H4"
                    />
                  </svg>
                  Yangilash
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="mt-4 space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 text-center">
                  <p className="text-xs text-gray-600 mb-3">Faol buyurtma yo‘q</p>
                  <button
                    className="bg-[#FF6200] text-white px-4 py-2 rounded-lg text-xs font-medium shadow-md hover:bg-[#FFAB40] hover:scale-105 transition-all"
                    onClick={() => navigate('/')}
                  >
                    Buyurtma berish
                  </button>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    className="bg-white rounded-2xl shadow-md border border-gray-100 p-4"
                    onClick={() => handleOpenModal('order', order)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-sm font-bold text-gray-800">
                        Buyurtma #{order.id}
                      </h2>
                      <div className="flex items-center gap-2">
                        {getStatusChip(order.status)}
                        <button
                          className="text-[#FF6200] hover:text-[#FFAB40]"
                          aria-label="Buyurtma tafsilotlarini ko‘rish"
                        >
                          {modalState.order?.id === order.id ? (
                            <ExpandLess fontSize="small" />
                          ) : (
                            <ExpandMore fontSize="small" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {getStatusMessage(order.status)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getEstimatedDelivery(order.kitchen_time, order.created_at)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Jami: {parseFloat(order.total_amount || 0).toLocaleString('uz-UZ')} so‘m
                    </p>
                    <button
                      className="mt-3 border border-[#FF6200] text-[#FF6200] px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:bg-[#FF6200] hover:text-white hover:scale-105 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        returnOrder(order.id);
                      }}
                      disabled={isReturnDisabled(order.status)}
                    >
                      <Cancel className="mr-1" fontSize="small" />
                      Qaytarish
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Last Fetch Time */}
            {lastFetch && (
              <p className="mt-3 text-center text-xs text-gray-500">
                Yangilandi: {new Date(lastFetch).toLocaleString('uz-UZ')}
              </p>
            )}
          </motion.div>
        </div>

        {/* Modal for Order Details */}
        {modalState.type === 'order' && modalState.order && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
            onClick={handleCloseModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white w-full max-w-[400px] rounded-t-2xl p-4 h-[90%] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
              onDragEnd={handleDragEnd}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center mb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-bold text-[#FF6200]">
                  Buyurtma #{modalState.order.id}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-[#FF6200] hover:text-[#FFAB40] transition-colors"
                  aria-label="Modalni yopish"
                >
                  <CloseIcon fontSize="small" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-700">Holati</p>
                  <p className="text-xs text-gray-600">{getStatusMessage(modalState.order.status)}</p>
                  <div className="mt-1">{getStatusChip(modalState.order.status)}</div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">Yetkazish vaqti</p>
                  <p className="text-xs text-gray-600">
                    {getEstimatedDelivery(modalState.order.kitchen_time, modalState.order.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">Jami</p>
                  <p className="text-xs text-gray-600">
                    {parseFloat(modalState.order.total_amount || 0).toLocaleString('uz-UZ')} so‘m
                  </p>
                </div>
                <hr className="border-gray-200" />
                <div>
                  <p className="text-xs font-semibold text-gray-700">Tafsilotlar</p>
                  <ul className="space-y-2 mt-1">
                    <li className="flex items-center">
                      <Phone className="text-[#FF6200] mr-2" fontSize="small" />
                      <p className="text-xs text-gray-600">
                        {modalState.order.contact_number || 'Noma’lum'}
                      </p>
                    </li>
                    <li className="flex items-center">
                      <LocationOn className="text-[#FF6200] mr-2" fontSize="small" />
                      <p className="text-xs text-gray-600">
                        {modalState.order.shipping_address || 'Noma’lum'}
                      </p>
                    </li>
                    <li className="flex items-center">
                      <Payment className="text-[#FF6200] mr-2" fontSize="small" />
                      <p className="text-xs text-gray-600">
                        To‘lov:{' '}
                        {modalState.order.payment === 'naqd'
                          ? 'Naqd'
                          : modalState.order.payment === 'karta'
                          ? 'Karta'
                          : 'Noma’lum'}
                      </p>
                    </li>
                    {modalState.order.notes && (
                      <li className="flex items-center">
                        <p className="text-xs text-gray-600">Izoh: {modalState.order.notes}</p>
                      </li>
                    )}
                    {modalState.order.status === 'kuryer_oldi' && (
                      <>
                        <li className="flex items-center">
                          <PersonIcon className="text-[#FF6200] mr-2" fontSize="small" />
                          <p className="text-xs text-gray-600">
                            Kuryer: {modalState.order.courier?.user.username || 'Ma’lumot mavjud emas'}
                          </p>
                        </li>
                        <li className="flex items-center">
                          <Phone className="text-[#FF6200] mr-2" fontSize="small" />
                          {modalState.order.courier?.phone_number ? (
                            <a
                              href={`tel:${modalState.order.courier.phone_number}`}
                              className="text-xs text-[#FF6200] hover:underline"
                              aria-label={`Call courier at ${modalState.order.courier.phone_number}`}
                            >
                              Kuryer telefoni: {modalState.order.courier.phone_number}
                            </a>
                          ) : (
                            <p className="text-xs text-gray-600">
                              Kuryer telefoni: Ma’lumot mavjud emas
                            </p>
                          )}
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                <hr className="border-gray-200" />
                <div className="mb-8 border-b border-gray-200 pb-4">
                  <p className="text-xs font-semibold text-gray-700">
                    Mahsulotlar ({modalState.order.items?.length || 0})
                  </p>
                  <ul className="space-y-2 mt-1">
                    {modalState.order.items && modalState.order.items.length > 0 ? (
                      modalState.order.items.map((item, index) => (
                        <li key={index} className="flex items-center">
                          <div className="flex items-center">
                            <img
                              src={item.product?.photo ? `${BASE_URL}${item.product?.photo}` : defaultAvatar}
                              alt={item.product?.title || 'Mahsulot'}
                              className="w-6 h-6 rounded mr-2 object-cover"
                              onError={(e) => (e.target.src = defaultAvatar)}
                            />
                            <div className="flex-1">
                              <p className="text-xs text-gray-600">{item.product?.title || 'Noma’lum'}</p>
                              <p className="text-xs text-gray-500">
                                {item.quantity} × {parseFloat(item.price || 0).toLocaleString('uz-UZ')} so‘m
                              </p>
                            </div>
                            <p className="text-xs font-bold text-gray-600">
                              {(item.quantity * parseFloat(item.price || 0)).toLocaleString('uz-UZ')} so‘m
                            </p>
                          </div>
                        </li>
                      ))
                    ) : (
                      <p className="text-xs text-gray-600">Mahsulot yo‘q</p>
                    )}
                    ) : (
                      <p className="text-xs text-gray-600">Mahsulot yo‘q</p>
                  </ul>
                </div>
                <button
                  className="mt-3 border border-[#FF6200] text-[#FF6200] px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:bg-[#FF6200] hover:text-white hover:scale-105 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                  onClick={() => returnOrder(modalState.order.id)}
                  disabled={isReturnDisabled(modalState.order.status)}
                >
                  <Cancel className="mr-1" fontSize="small" />
                  Qaytarish
                </button>
                  className="mt-3 border border-[#FF6200] text-[#FF6200] px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:bg-[#FF6200] hover:text-white hover:scale-105 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                <button onClick={() => returnOrder(modalState.order.id)}
                  disabled={isReturnDisabled(modalState.order.status)}
                >
                  <Cancel className="mr-1" fontSize="small" />
                  Qaytarish
                </button>
               
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Snackbar for success/error messages */}
        {(error || success) && (
          <motion.div
            className={`fixed top-4 left-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white text-xs flex items-center justify-between ${error ? 'bg-[#d32f2f]' : 'bg-[#388e3c]'}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span>{error || success}</span>
            <button
              onClick={handleSnackbarClose}
              className="text-white hover:text-gray-200"
              aria-label="Xabarni yopish"
            >
              <CloseIcon fontSize="small" />
            </button>
          </motion.div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ActiveOrdersDashboard;
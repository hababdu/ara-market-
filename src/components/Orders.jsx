import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowBack as ArrowBackIcon, Delete as DeleteIcon } from '@mui/icons-material';

const DeleteModal = ({ orderId, onConfirm, onCancel }) => {
  console.log('DeleteModal render:', { orderId });
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-4">Buyurtmani o‘chirish</h2>
        <p>Buyurtma #{orderId} ni o‘chirmoqchimisiz?</p>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Bekor qilish
          </button>
          <button
            onClick={() => onConfirm(orderId)}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            O‘chirish
          </button>
        </div>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      console.error('ErrorBoundary caught:', this.state.error);
      return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">Xatolik yuz berdi!</div>;
    }
    return this.props.children;
  }
}

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const token = localStorage.getItem('token');

  const axiosInstance = axios.create({
    baseURL: 'https://hosilbek.pythonanywhere.com/api/',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });

  useEffect(() => {
    const fetchOrdersAndProducts = async () => {
      if (!token) {
        showSnackbar('Iltimos, tizimga kiring!', 'error');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const ordersResponse = await axiosInstance.get('user/orders/');
        const ordersData = ordersResponse.data;
        console.log('Orders data:', ordersData);
        setOrders(ordersData);

        const productIds = [
          ...new Set(
            ordersData.flatMap((order) =>
              order.order_items.map((item) => item.product.id)
            )
          ),
        ];
        const productPromises = productIds.map((id) =>
          axiosInstance.get(`user/products/${id}/`)
        );
        const productResponses = await Promise.all(productPromises);
        const productsData = productResponses.reduce((acc, res) => {
          acc[res.data.id] = res.data;
          return acc;
        }, {});
        setProducts(productsData);
      } catch (err) {
        console.error('Orders API Error:', err.response?.status, err.response?.data);
        const errorMessage =
          err.response?.status === 401
            ? 'Tizimga qayta kirish kerak. Sessiya tugagan.'
            : err.response?.data?.message ||
              err.response?.data?.detail ||
              JSON.stringify(err.response?.data, null, 2) ||
              'Buyurtmalarni yuklashda xatolik yuz berdi';
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrdersAndProducts();
  }, [token]);

  const deleteOrder = async (orderId) => {
    console.log('Starting deleteOrder:', { orderId, deleteConfirm });
    try {
      await axiosInstance.delete(`user/orders/${orderId}/`);
      console.log('Delete successful, updating orders');
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
      showSnackbar('Buyurtma o‘chirildi!', 'success');
    } catch (err) {
      console.error('Delete API Error:', err.response?.status, err.response?.data);
      const errorMessage =
        err.response?.status === 401
          ? 'Tizimga qayta kirish kerak. Sessiya tugagan.'
          : err.response?.data?.message ||
            err.response?.data?.detail ||
            'Buyurtmani o‘chirishda xatolik yuz berdi';
      showSnackbar(errorMessage, 'error');
    } finally {
      console.log('Closing deleteConfirm:', { orderId });
      setDeleteConfirm(null);
    }
  };

  const handleOpenDeleteConfirm = (orderId) => {
    console.log('Opening deleteConfirm:', { orderId });
    setTimeout(() => setDeleteConfirm(orderId), 0); // Debounce to avoid render conflicts
  };

  const calculateOrderTotal = (order) => {
    return order.order_items.reduce((total, item) => {
      const price = parseFloat(item.price || item.product.price);
      return total + price * item.quantity;
    }, 0);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  console.log('Orders render:', { orders, deleteConfirm, snackbarOpen, products });

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Yuklanmoqda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowBackIcon className="mr-2" />
          Bosh sahifaga qaytish
        </button>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto py-6 px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowBackIcon className="mr-2" />
          Bosh sahifaga qaytish
        </button>
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 text-center">
          <p>Buyurtmalar mavjud emas!</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Mahsulotlarni ko‘rish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowBackIcon className="mr-2" />
        Bosh sahifaga qaytish
      </button>

      <h1 className="text-2xl font-bold text-blue-600 mb-6">Mening buyurtmalarim</h1>

      <ErrorBoundary>
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={`order-${order.id}-${order.created_at}`} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Buyurtma #{order.id}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">
                    {new Date(order.created_at).toLocaleString('uz-UZ')}
                  </span>
                  <button
                    onClick={() => handleOpenDeleteConfirm(order.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-medium">Mahsulotlar</h3>
                {order.order_items.map((item, idx) => (
                  <div
                    key={`item-${item.product.id}-${idx}`}
                    className="flex items-center py-2 border-b last:border-b-0"
                  >
                    <img
                      src={
                        products[item.product.id]?.photo
                          ? `https://hosilbek.pythonanywhere.com${products[item.product.id].photo}`
                          : 'https://via.placeholder.com/100x100?text=No+Image'
                      }
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded mr-4"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-gray-600">
                        Miqdor: {item.quantity} × {parseFloat(item.price).toLocaleString()} so'm
                      </p>
                      {products[item.product.id]?.description && (
                        <p className="text-gray-600">Tavsif: {products[item.product.id].description}</p>
                      )}
                      {products[item.product.id]?.category && (
                        <p className="text-gray-600">Kategoriya: {products[item.product.id].category.name}</p>
                      )}
                    </div>
                    <p className="font-semibold">
                      {(parseFloat(item.price) * item.quantity).toLocaleString()} so'm
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p><strong>Jami:</strong> {calculateOrderTotal(order).toLocaleString()} so'm</p>
                  <p><strong>Holati:</strong> {order.status}</p>
                  <p><strong>To‘lov usuli:</strong> {order.payment}</p>
                  <p><strong>Foydalanuvchi:</strong> {order.user}</p>
                </div>
                <div>
                  <p><strong>Manzil:</strong> {order.address || 'Mavjud emas'}</p>
                  <p><strong>Oshxona:</strong> {order.kitchen?.name || 'Noma‘lum'}</p>
                  <p><strong>Kuryer:</strong> {order.courier?.name || 'Belgillanmagan'}</p>
                  <p><strong>Umumiy xarajat:</strong> {parseFloat(order.full_salary).toLocaleString()} so'm</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ErrorBoundary>

      {deleteConfirm !== null && (
        <DeleteModal
          orderId={deleteConfirm}
          onConfirm={deleteOrder}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {snackbarOpen && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded shadow-lg ${
          snackbarSeverity === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          <div className="flex items-center justify-between">
            <p>{snackbarMessage}</p>
            <button onClick={handleCloseSnackbar} className="ml-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
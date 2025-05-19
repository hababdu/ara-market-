import axios from 'axios';
import { useState, useEffect } from 'react';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('authToken');
  
  const axiosInstance = axios.create({
    baseURL: 'https://hosilbek.pythonanywhere.com/api/',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axiosInstance.get('user/order-history/');
        console.log('Order History:', response.data);
        setOrders(response.data);
        if (Array.isArray(response.data) && response.data.length === 0) {
          setError('Hozircha buyurtmalaringiz yo‘q.');
        }
        setError(null);
      } catch (err) {
        console.error('Xatolik:', err);
        const errorMessage = err.response?.data?.message ||
                            err.response?.data?.detail ||
                            'Buyurtma tarixini yuklashda xatolik yuz berdi.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (!token) {
      setError('Iltimos, tizimga kiring.');
      setLoading(false);
      return;
    }

    fetchOrders();
  }, [token]);

  return (
    <div className="container mx-auto py-6 px-4">
      {loading && <p className="text-center">Yuklanmoqda...</p>}
      {error && <p className="text-red-600 text-center">{error}</p>}
      {!loading && !error && Array.isArray(orders) && orders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Buyurtma tarixi</h2>
          {orders.map((order) => (
            <div key={order.id} className="bg-gray-100 p-4 rounded shadow">
              <p><strong>Buyurtma #{order.id}</strong></p>
              <p>Status: {order.status}</p>
              <p>Jami: {order.total_amount} so‘m</p>
              <p>Sana: {new Date(order.created_at).toLocaleDateString()}</p>
              <p>Manzil: {order.shipping_address}</p>
              <p>Telefon: {order.contact_number}</p>
            </div>
          ))}
        </div>
      )}
      {!loading && !error && (!Array.isArray(orders) || orders.length === 0) && (
        <p className="text-center">Hozircha buyurtmalaringiz yo‘q.</p>
      )}
    </div>
  );
};

export default OrderHistory;
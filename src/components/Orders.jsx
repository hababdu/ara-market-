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
    let intervalId;

    const fetchOrders = async () => {
      try {
        const response = await axiosInstance.get('user/order-history/');
        const newOrders = response.data;

        // Agar buyurtmalar o‘zgargan bo‘lsa, yangilash
        setOrders((prevOrders) => {
          const prevIds = prevOrders.map(o => o.id).sort();
          const newIds = newOrders.map(o => o.id).sort();

          const isDifferent = JSON.stringify(prevIds) !== JSON.stringify(newIds);
          if (isDifferent) {
            console.log('🟢 Buyurtmalar yangilandi!');
            return newOrders;
          }
          return prevOrders;
        });

        setError(null);
      } catch (err) {
        console.error('Xatolik:', err);
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.detail ||
          'Buyurtma tarixini yuklashda xatolik yuz berdi.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchOrders(); // Dastlabki chaqiruv
      intervalId = setInterval(fetchOrders, 3000); // Har 3 soniyada tekshirish
    } else {
      setError('Iltimos, tizimga kiring.');
      setLoading(false);
    }

    return () => clearInterval(intervalId); // Cleanup
  }, [token]);

  return (
    <div className="container mx-auto py-6 px-4">
      {loading && <p className="text-center">⏳ Yuklanmoqda...</p>}

      {error && (
        <p className="text-red-600 text-center font-semibold">{error}</p>
      )}

      {!loading && !error && Array.isArray(orders) && orders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4 text-center">🧾 Buyurtma tarixi</h2>
          {orders.map((order) => (
            <div key={order.id} className="bg-white border p-4 rounded shadow">
              <p><strong>Buyurtma raqami:</strong> #{order.id}</p>
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Jami:</strong> {order.total_amount} so‘m</p>
              <p><strong>Sana:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
              <p><strong>Manzil:</strong> {order.shipping_address}</p>
              <p><strong>Telefon:</strong> {order.contact_number}</p>

              {/* Mahsulotlar ro'yxati (agar mavjud bo‘lsa) */}
              {Array.isArray(order.items) && order.items.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">📦 Mahsulotlar:</p>
                  <ul className="list-disc list-inside">
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.product_name} – {item.quantity} dona – {item.price} so‘m
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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

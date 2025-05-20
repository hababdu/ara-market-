import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Agar React Router ishlatilsa, login sahifasiga yo‘naltirish uchun

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('authToken'); // localStorage dan tokenni olish
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
        console.log(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Foydalanuvchi Buyurtmalari</h1>

        {loading && (
          <div className="text-center text-gray-600 italic">Yuklanmoqda...</div>
        )}

        {error && (
          <div className="text-center text-red-500 font-medium mb-4">
            {error}
            {error.includes('Token topilmadi') && (
              <div className="mt-2">
                <Link
                  to="/login"
                  className="text-blue-600 hover:underline"
                >
                  Tizimga kirish
                </Link>
              </div>
            )}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">Sana</th>
                  <th className="py-3 px-4 text-left">Umumiy Narx</th>
                  <th className="py-3 px-4 text-left">Holati</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">{order.id}</td>
                      <td className="py-3 px-4">{order.date || 'N/A'}</td>
                      <td className="py-3 px-4">{order.total_price || 'N/A'}</td>
                      <td className="py-3 px-4">{order.status || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-3 px-4 text-center text-gray-500">
                      Buyurtmalar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPage;
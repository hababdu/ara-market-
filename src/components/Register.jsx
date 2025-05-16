import React, { useState } from 'react';

function Register({ onRegister }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const userData = {
      adres: 'Toshkent, Yunusobod',
      telefon_raqami: '+998901234567',
      location: '41.3111, 69.2797',
      foydalanuvchi_nomi: 'newuser',
      email: 'newuser@example.com',
      parol: 'newuser:exp3',
    };

    try {
      const response = await fetch('https://hosilbek.pythonanywhere.com/api/user/user-profiles/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Ro‘yxatdan o‘tishda xatolik yuz berdi');
      }

      const data = await response.json();
      const token = data.token; // API dan token qaytadi deb faraz qilamiz
      if (!token) {
        throw new Error('Token olinmadi');
      }

      onRegister(token);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Ro‘yxatdan o‘tish</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-gray-600">Quyidagi ma‘lumotlar bilan ro‘yxatdan o‘tasiz:</p>
        <p className="text-sm text-gray-500">Manzil: Toshkent, Yunusobod</p>
        <p className="text-sm text-gray-500">Telefon: +998901234567</p>
        <p className="text-sm text-gray-500">Joylashuv: 41.3111, 69.2797</p>
        <p className="text-sm text-gray-500">Foydalanuvchi nomi: newuser</p>
        <p className="text-sm text-gray-500">Email: newuser@example.com</p>
        <p className="text-sm text-gray-500">Parol: newuser:exp3</p>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Yuklanmoqda...' : 'Ro‘yxatdan o‘tish'}
        </button>
      </form>
    </div>
  );
}

export default Register;
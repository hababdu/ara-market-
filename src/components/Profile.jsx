// src/components/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Person as PersonIcon, ExitToApp as LogoutIcon } from '@mui/icons-material';
import axios from 'axios';
import Register from './Register.jsx';

const Profile = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      axios
        .get('https://hosilbek.pythonanywhere.com/api/user/profile/', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUser(res.data);
          setLoading(false);
        })
        .catch((err) => {
          setError('Ma’lumotlarni yuklab bo‘lmadi');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/');
  };

  const handleRegister = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  if (!token) return <Register onRegister={handleRegister} />;
  if (loading) return <div className="text-center py-6">Yuklanmoqda...</div>;
  if (error) return <div className="text-red-500 text-center py-6">{error}</div>;

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold text-blue-600 mb-6 flex items-center">
        <PersonIcon className="mr-2" /> Profil
      </h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p><strong>Ism:</strong> {user?.foydalanuvchi_nomi || 'Noma’lum'}</p>
        <p><strong>Email:</strong> {user?.email || 'Noma’lum'}</p>
        <p><strong>Telefon:</strong> {user?.telefon_raqami || 'Noma’lum'}</p>
        <p><strong>Manzil:</strong> {user?.adres || 'Noma’lum'}</p>
        <button
          onClick={handleLogout}
          className="mt-4 flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          <LogoutIcon className="mr-2" /> Chiqish
        </button>
      </div>
    </div>
  );
};

export default Profile;
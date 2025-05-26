import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Person as PersonIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Edit as EditIcon,
  Logout as LogoutIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Default avatar URL
const defaultAvatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600">
            Xatolik yuz berdi: {this.state.error?.message || 'Noma\'lum xatolik'}
          </h2>
          <p className="mt-4 text-gray-600">Iltimos, sahifani yangilang yoki qayta urinib ko‘ring.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalState, setModalState] = useState({ type: null });
  const [formData, setFormData] = useState({
    username: '',
    address: '',
    phone_number: '',
    location: '',
    password: '',
    selectedProfile: '',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        if (!token) {
          if (isMounted) {
            setError('Tizimga kirish talab qilinadi');
            setLoading(false);
          }
          return;
        }

        const response = await axios.get('https://hosilbek.pythonanywhere.com/api/user/user-profiles/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        let profileData = response.data;
        if (Array.isArray(response.data) && response.data.length === 0) {
          throw new Error('Profil ma\'lumotlari topilmadi');
        } else if (Array.isArray(response.data) && response.data.length > 0) {
          profileData = response.data[0];
        } else if (!profileData || !profileData.id) {
          throw new Error('Profil ma\'lumotlari topilmadi');
        }

        if (isMounted) {
          setUserData({
            ...profileData,
            avatar: profileData.avatar || defaultAvatar,
            stats: {
              orders: profileData.orders?.length || 0,
              favorites: profileData.favorites?.length || 0,
              notifications: profileData.notifications?.length || 0,
            },
          });
          localStorage.setItem('userData', JSON.stringify(profileData));
        }
      } catch (err) {
        console.error('Fetch user data error:', err.response ? err.response.data : err.message);
        let errorMessage = 'Profil ma\'lumotlarini yuklashda xato yuz berdi';
        if (err.response?.status === 401) {
          errorMessage = 'Sessiya muddati tugagan. Iltimos, qayta kiring';
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
          navigate('/login');
        } else if (err.response?.status === 404) {
          errorMessage = 'Profil ma\'lumotlari topilmadi';
        } else if (err.response?.status === 500) {
          errorMessage = 'Server xatosi. Keyinroq urinib ko\'ring';
        }
        if (isMounted) {
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const fetchAvailableProfiles = async () => {
      try {
        const response = await axios.get('https://hosilbek.pythonanywhere.com/api/user/user-profiles/', {
          headers: { 'Content-Type': 'application/json' },
        });

        if (Array.isArray(response.data)) {
          setAvailableProfiles(response.data);
        } else {
          setAvailableProfiles([]);
        }
      } catch (err) {
        console.error('Fetch available profiles error:', err);
        setAvailableProfiles([]);
      }
    };

    fetchUserData();
    fetchAvailableProfiles();

    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    setUserData(null);
    setModalState({ type: null });
    setSnackbar({ open: true, message: 'Tizimdan chiqildi!', severity: 'success' });
    navigate('/');
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'selectedProfile' && value) {
      const selected = availableProfiles.find((profile) => profile.id === parseInt(value));
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          username: selected.user.username || '',
          password: '',
          selectedProfile: value,
        }));
      }
    }
  };

  const handleDetectLocation = (retries = 3, delay = 2000) => {
    setIsFormLoading(true);
    setFormError('');

    if (!navigator.geolocation) {
      setFormError("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
      setIsFormLoading(false);
      return;
    }

    const attemptLocation = (attemptsLeft) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = `Kenglik: ${latitude.toFixed(4)}, Uzunlik: ${longitude.toFixed(4)}`;
          setFormData({ ...formData, location });
          setFormSuccess('Joylashuv muvaffaqiyatli aniqlandi!');
          setIsFormLoading(false);
        },
        (err) => {
          console.error('Geolokatsiya xatosi:', err.message, 'Kod:', err.code);
          if (err.code === 1) {
            setFormError("Joylashuvga ruxsat berilmadi. Qo'lda kiriting.");
          } else if (err.code === 2) {
            if (attemptsLeft > 0) {
              setTimeout(() => attemptLocation(attemptsLeft - 1), delay);
            } else {
              setFormError('Joylashuvni aniqlash imkonsiz. Internet aloqasini tekshiring.');
            }
          } else if (err.code === 3) {
            setFormError('Joylashuvni aniqlash vaqti o‘tdi. Qayta urinib ko‘ring.');
          } else {
            setFormError('Joylashuvni aniqlashda noma‘lum xatolik yuz berdi.');
          }
          setIsFormLoading(false);
        },
        { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
      );
    };

    attemptLocation(retries);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsFormLoading(true);

    if (formData.username.length < 3) {
      setFormError("Foydalanuvchi ismi kamida 3 belgidan iborat bo'lishi kerak.");
      setIsFormLoading(false);
      return;
    }
    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      setFormError("Telefon raqami +998 bilan boshlanib, 9 ta raqamdan iborat bo'lishi kerak.");
      setIsFormLoading(false);
      return;
    }
    if (!formData.location) {
      setFormError("Joylashuv maydonini to'ldiring (masalan, Toshkent shahri).");
      setIsFormLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setFormError("Parol kamida 6 belgidan iborat bo'lishi kerak.");
      setIsFormLoading(false);
      return;
    }

    const payload = {
      username: formData.username.trim(),
      address: formData.address,
      phone_number: formData.phone_number,
      location: formData.location,
      password: formData.password,
      email: 'user@gmail.com',
    };

    try {
      const registerResponse = await axios.post(
        'https://hosilbek.pythonanywhere.com/api/user/user-profiles/',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const loginResponse = await axios.post(
        'https://hosilbek.pythonanywhere.com/api/token/',
        {
          username: formData.username.trim(),
          password: formData.password,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { access: authToken, refresh: refreshToken } = loginResponse.data;

      localStorage.setItem('authToken', authToken);
      localStorage.setItem('refreshToken', refreshToken);

      setFormSuccess("Ro'yxatdan o'tish muvaffaqiyatli!");
      setTimeout(() => {
        handleCloseModal();
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Registration Error:', err.response?.data);
      let errorMessage = "Ro'yxatdan o'tishda xatolik yuz berdi.";
      if (err.response) {
        if (err.response.status === 400) {
          if (err.response.data.username) {
            errorMessage = `Foydalanuvchi nomi band: ${err.response.data.username.join(' ')}`;
          } else {
            errorMessage = err.response.data.message || "Noto'g'ri ma'lumotlar kiritildi.";
          }
        } else if (err.response.status === 500) {
          errorMessage = "Server xatosi. Iltimos, keyinroq urinib ko'ring.";
        }
      } else if (err.request) {
        errorMessage = 'Tarmoq xatosi. Internet aloqangizni tekshiring.';
      }
      setFormError(errorMessage);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsFormLoading(true);

    if (!formData.username.trim()) {
      setFormError('Foydalanuvchi ismini kiriting.');
      setIsFormLoading(false);
      return;
    }
    if (!formData.password) {
      setFormError('Parolni kiriting.');
      setIsFormLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'https://hosilbek.pythonanywhere.com/api/token/',
        {
          username: formData.username.trim(),
          password: formData.password,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { access: authToken, refresh: refreshToken } = response.data;

      localStorage.setItem('authToken', authToken);
      localStorage.setItem('refreshToken', refreshToken);

      setFormSuccess('Tizimga kirish muvaffaqiyatli!');
      setTimeout(() => {
        handleCloseModal();
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Login Error:', err.response?.data);
      let errorMessage = 'Tizimga kirishda xatolik yuz berdi.';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Noto‘g‘ri foydalanuvchi ismi yoki parol.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.detail/kg || 'Noto‘g‘ri ma‘lumotlar kiritildi.';
        } else if (err.response.status === 500) {
          errorMessage = 'Server xatosi. Iltimos, keyinroq urinib ko‘ring.';
        }
      } else if (err.request) {
        errorMessage = 'Tarmoq xatosi. Internet aloqangizni tekshiring.';
      }
      setFormError(errorMessage);
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleFormClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setFormError('');
    setFormSuccess('');
  };

  const handleOpenModal = (type) => {
    setModalState({ type });
  };

  const handleCloseModal = () => {
    setModalState({ type: null });
    setFormData({
      username: '',
      address: '',
      phone_number: '',
      location: '',
      password: '',
      selectedProfile: '',
    });
    setFormError('');
    setFormSuccess('');
  };

  if (loading) {
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
            <h2 className="mt-4 text-xl text-gray-600">Profil yuklanmoqda...</h2>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className=" bg-[#FFF3E0] pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {userData ? (
              <div className="mt-16 sm:mt-20">
                {/* Profile Card */}
                <div  style={{
                background: 'linear-gradient(to bottom, #FFFFFF, #FFFFFF, #FFF3E0)',
              }}
               className="relative rounded-2xl  p-6">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 sm:-translate-y-1/3">
                    <img
                      src={userData.avatar}
                      alt={userData.user.username || 'Foydalanuvchi'}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
                    />
                  </div>
                  <div className="pt-16 pb-6 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {userData.user.username || 'Foydalanuvchi'}
                    </h2>
                    
                  </div>

                  {/* Profile Details */}
                  <div className="mt-6">
                    <ul className="space-y-4">
                      {userData.phone_number && (
                        <>
                          <li className="flex items-center">
                            <PhoneIcon className="text-[#FF6200] mr-3" />
                            <div>
                              <p className="font-semibold text-gray-700">Telefon</p>
                              <p className="text-gray-600">{userData.phone_number}</p>
                            </div>
                          </li>
                          <hr className="ml-12 border-gray-300" />
                        </>
                      )}
                      {userData.address && (
                        <>
                          <li className="flex items-center">
                            <HomeIcon className="text-[#FF6200] mr-3" />
                            <div>
                              <p className="font-semibold text-gray-700">Manzil</p>
                              <p className="text-gray-600">{userData.address}</p>
                            </div>
                          </li>
                          <hr className="ml-12 border-gray-300" />
                        </>
                      )}
                      {userData.location && (
                        <li className="flex items-center">
                          <LocationOnIcon className="text-[#FF6200] mr-3" />
                          <div>
                            <p className="font-semibold text-gray-700">Joylashuv</p>
                            <p className="text-gray-600">{userData.location}</p>
                          </div>
                        </li>
                      )}
                    </ul>
                    <div className="flex justify-center gap-4 mt-6">
                      <button
                        className="bg-[#FFAB40] mt-7 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:scale-105 transition-transform flex items-center"
                        onClick={handleLogout}
                        aria-label="Tizimdan chiqish"
                      >
                        <LogoutIcon className="mr-2" fontSize="small" />
                        Chiqish
                      </button>
                    
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-2xl text-center text-red-600 mb-6">
                  {error || 'Tizimga kirish talab qilinadi'}
                </h2>
                <div className="flex justify-center gap-4">
                  <button
                    className="bg-[#FF6200] text-white px-6 py-3 rounded-lg font-medium shadow-md hover:scale-105 transition-transform"
                    onClick={() => handleOpenModal('login')}
                    aria-label="Tizimga kirish"
                  >
                    Tizimga kirish
                  </button>
                  <button
                    className="border border-[#FFAB40] text-[#FFAB40] px-6 py-3 rounded-lg font-medium shadow-md hover:scale-105 transition-transform"
                    onClick={() => handleOpenModal('register')}
                    aria-label="Ro‘yxatdan o‘tish"
                  >
                    Ro‘yxatdan o‘tish
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Modal for Login/Register */}
        {modalState.type && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center"
            onClick={handleCloseModal}
          >
            <div
              className="bg-[#FFF3E0] w-full sm:w-[90%] sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 h-[90%] sm:h-auto overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[#FF6200]">
                  {modalState.type === 'register' ? "Ro'yxatdan o'tish" : 'Tizimga kirish'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-[#FF6200] hover:text-[#FFAB40] transition-colors"
                  aria-label="Modalni yopish"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="flex justify-center mb-6">
                <div className="bg-[#FF6200] rounded-full p-4">
                  <PersonIcon className="text-white" fontSize="large" />
                </div>
              </div>

              <form
                onSubmit={modalState.type === 'register' ? handleRegisterSubmit : handleLoginSubmit}
                className="space-y-4"
              >
                {modalState.type === 'login' && availableProfiles.length > 0 && (
                  <div className="relative">
                    <PersonIcon className="absolute top-3 left-3 text-gray-500" />
                    <select
                      name="selectedProfile"
                      value={formData.selectedProfile}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200]"
                      aria-label="Foydalanuvchi profilini tanlash"
                    >
                      <option value="">Profilni tanlang</option>
                      {availableProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.user.username}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="relative">
                  <PersonIcon className="absolute top-3 left-3 text-gray-500" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleFormChange}
                    placeholder="Foydalanuvchi ismi"
                    required
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200]"
                    aria-label="Foydalanuvchi ismi"
                  />
                </div>

                {modalState.type === 'register' && (
                  <>
                    <div className="relative">
                      <HomeIcon className="absolute top-3 left-3 text-gray-500" />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleFormChange}
                        placeholder="Manzil"
                        required
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200]"
                        aria-label="Manzil"
                      />
                    </div>
                    <div className="relative">
                      <PhoneIcon className="absolute top-3 left-3 text-gray-500" />
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleFormChange}
                        placeholder="+998901234567"
                        required
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200]"
                        aria-label="Telefon raqami"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <LocationOnIcon className="absolute top-3 left-3 text-gray-500" />
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleFormChange}
                          placeholder="Joylashuv (masalan, Toshkent shahri)"
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200]"
                          aria-label="Joylashuv"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDetectLocation()}
                        disabled={isFormLoading}
                        className="text-[#FF6200] hover:text-[#FFAB40] transition-colors"
                        title="Joriy joylashuvni aniqlash"
                        aria-label="Joriy joylashuvni aniqlash"
                      >
                        <MyLocationIcon />
                      </button>
                    </div>
                  </>
                )}

                <div className="relative">
                  <LockIcon className="absolute top-3 left-3 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    placeholder="Parol"
                    required
                    autoComplete={modalState.type === 'register' ? 'new-password' : 'current-password'}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200]"
                    aria-label="Parol"
                  />
                  <button
                    type="button"
                    onClick={handleClickShowPassword}
                    className="absolute top-3 right-3 text-gray-500"
                    aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>

                {isFormLoading && (
                  <div className="h-1 w-full bg-gray-200 rounded">
                    <div className="h-full bg-[#FF6200] rounded animate-pulse"></div>
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-[#FF6200] text-white py-3 rounded-lg font-medium shadow-md hover:scale-105 transition-transform disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isFormLoading}
                >
                  {isFormLoading
                    ? 'Yuklanmoqda...'
                    : modalState.type === 'register'
                    ? "Ro'yxatdan o'tish"
                    : 'Kirish'}
                </button>
                <button
                  type="button"
                  className="w-full border border-[#FFAB40] text-[#FFAB40] py-3 rounded-lg font-medium shadow-md hover:scale-105 transition-transform disabled:bg-gray-200 disabled:cursor-not-allowed"
                  onClick={() =>
                    handleOpenModal(modalState.type === 'register' ? 'login' : 'register')
                  }
                  disabled={isFormLoading}
                >
                  {modalState.type === 'register' ? 'Tizimga kirish' : "Ro'yxatdan o'tish"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Snackbar for success/error messages */}
        {snackbar.open && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
            {snackbar.message}
            <button
              onClick={handleSnackbarClose}
              className="ml-4 text-white hover:text-gray-200"
              aria-label="Xabarni yopish"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>
        )}
        {(formError || formSuccess) && (
          <div
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white ${
              formError ? 'bg-red-600' : 'bg-green-600'
            } flex items-center`}
          >
            {formError || formSuccess}
            <button
              onClick={handleFormClose}
              className="ml-4 text-white hover:text-gray-200"
              aria-label="Xabarni yopish"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ProfilePage;
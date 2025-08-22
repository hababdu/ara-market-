
   import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
   import { useNavigate } from 'react-router-dom';
   import axios from 'axios';
   import { Snackbar, Alert as MuiAlert } from '@mui/material';
   import ErrorBoundary from './ErrorBoundary';
   import LoadingSpinner from './LoadingSpinner';
   import ErrorMessage from './ErrorMessage';
   import ProfileCard from './ProfileCard';
   import AuthModal from './AuthModal';

   const defaultAvatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';

   const ProfilePage = memo(() => {
     const navigate = useNavigate();
     const [userData, setUserData] = useState(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState('');
     const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
     const [modalState, setModalState] = useState({ type: null });
     const [formData, setFormData] = useState({
       username: '',
       phone_number: '',
       password: '',
       selectedProfile: '',
     });
     const [formError, setFormError] = useState('');
     const [formSuccess, setFormSuccess] = useState('');
     const [isFormLoading, setIsFormLoading] = useState(false);
     const [showPassword, setShowPassword] = useState(false);
     const [availableProfiles, setAvailableProfiles] = useState([]);
     const [isOnline, setIsOnline] = useState(navigator.onLine);
     const token = localStorage.getItem('authToken');
     const isMounted = useRef(true);

     // Monitor network status
     useEffect(() => {
       const handleOnline = () => setIsOnline(true);
       const handleOffline = () => setIsOnline(false);
       window.addEventListener('online', handleOnline);
       window.addEventListener('offline', handleOffline);
       return () => {
         window.removeEventListener('online', handleOnline);
         window.removeEventListener('offline', handleOffline);
       };
     }, []);

     // Cleanup on unmount
     useEffect(() => {
       return () => {
         isMounted.current = false;
       };
     }, []);

     // Refresh token
     const refreshAccessToken = useCallback(async () => {
       const refreshToken = localStorage.getItem('refreshToken');
       if (!refreshToken) return false;
       try {
         const response = await axios.post(
           'https://hosilbek02.pythonanywhere.com/api/token/refresh/',
           { refresh: refreshToken },
           { headers: { 'Content-Type': 'application/json' } }
         );
         localStorage.setItem('authToken', response.data.access);
         return true;
       } catch (err) {
         localStorage.removeItem('authToken');
         localStorage.removeItem('refreshToken');
         localStorage.removeItem('userData');
         return false;
       }
     }, []);

     // Authenticated request
     const makeAuthenticatedRequest = useCallback(
       async (config, retries = 1) => {
         let attempt = 0;
         while (attempt <= retries) {
           try {
             const currentToken = localStorage.getItem('authToken');
             if (!currentToken) throw new Error('No auth token');
             return await axios({
               ...config,
               headers: {
                 ...config.headers,
                 Authorization: `Bearer ${currentToken}`,
               },
             });
           } catch (err) {
             if (err.response?.status === 401 && attempt < retries) {
               const refreshed = await refreshAccessToken();
               if (refreshed) {
                 attempt++;
                 continue;
               }
             }
             throw err;
           }
         }
       },
       [refreshAccessToken]
     );

     // Fetch user data and profiles
     const fetchUserData = useCallback(async () => {
       try {
         setLoading(true);
         if (!token) throw new Error('Tizimga kirish talab qilinadi');
         let profileData;
         try {
           const response = await makeAuthenticatedRequest({
             method: 'get',
             url: 'https://hosilbek02.pythonanywhere.com/api/user/user-profiles/',
           });
           profileData = response.data;
         } catch (err) {
           const storedUserData = localStorage.getItem('userData');
           if (storedUserData) profileData = JSON.parse(storedUserData);
         }

         if (Array.isArray(profileData)) profileData = profileData[0] || {};
         if (!profileData.id) throw new Error('Profil ma‘lumotlari topilmadi');

         const formattedUserData = {
           ...profileData,
           avatar: profileData.avatar || defaultAvatar,
           user: profileData.user || { username: profileData.username || 'Foydalanuvchi' },
           stats: {
             orders: profileData.orders?.length || 0,
             favorites: profileData.favorites?.length || 0,
             notifications: profileData.notifications?.length || 0,
           },
           phone_number: profileData.phone_number || '',
           address: profileData.address || '',
           location: profileData.location || '',
           email: profileData.email || '',
           is_aktsya: profileData.is_aktsya || false,
         };

         if (isMounted.current) {
           setUserData(formattedUserData);
           localStorage.setItem('userData', JSON.stringify(formattedUserData));
           setError('');
           setLoading(false);
         }
       } catch (err) {
         let errorMessage = 'Profil ma‘lumotlarini yuklashda xato';
         if (err.response?.status === 401) {
           errorMessage = 'Sessiya tugagan. Qayta kiring';
           localStorage.removeItem('authToken');
           localStorage.removeItem('refreshToken');
           localStorage.removeItem('userData');
           navigate('/profile');
         } else if (err.response?.status === 404) {
           errorMessage = 'Profil topilmadi';
         } else if (err.response?.status === 500) {
           errorMessage = 'Server xatosi';
         }
         if (isMounted.current) {
           setError(errorMessage);
           setLoading(false);
         }
       }
     }, [token, navigate, makeAuthenticatedRequest]);

     const fetchAvailableProfiles = useCallback(async () => {
       try {
         const response = await makeAuthenticatedRequest({
           method: 'get',
           url: 'https://hosilbek02.pythonanywhere.com/api/user/user-profiles/',
         });
         if (Array.isArray(response.data) && isMounted.current) {
           setAvailableProfiles(response.data);
         } else if (isMounted.current) {
           setAvailableProfiles([]);
         }
       } catch (err) {
         if (isMounted.current) {
           setAvailableProfiles([]);
           setError('Profillarni yuklashda xato');
         }
       }
     }, [makeAuthenticatedRequest]);

     useEffect(() => {
       fetchUserData();
       fetchAvailableProfiles();
     }, [fetchUserData, fetchAvailableProfiles]);

     // Logout
     const handleLogout = useCallback(() => {
       localStorage.removeItem('authToken');
       localStorage.removeItem('refreshToken');
       localStorage.removeItem('userData');
       setUserData(null);
       setModalState({ type: null });
       setSnackbar({ open: true, message: 'Tizimdan chiqildi!', severity: 'success' });
       navigate('/profile');
     }, [navigate]);

     // Form handlers
     const handleFormChange = useCallback((e) => {
       const { name, value } = e.target;
       setFormData((prev) => ({
         ...prev,
         [name]: value,
         ...(name === 'selectedProfile' && {
           username: availableProfiles.find((p) => p.id === value)?.user?.username || prev.username,
         }),
       }));
     }, [availableProfiles]);

     const handleTogglePassword = useCallback(() => {
       setShowPassword((prev) => !prev);
     }, []);

     const handleRegisterSubmit = useCallback(
       async (e) => {
         e.preventDefault();
         setFormError('');
         setFormSuccess('');
         setIsFormLoading(true);

         if (!isOnline) {
           setFormError('Internet aloqasi yo‘q');
           setIsFormLoading(false);
           return;
         }

         if (formData.username.length < 3) {
           setFormError('Ism 3 belgidan ko‘p bo‘lishi kerak');
           setIsFormLoading(false);
           return;
         }
         const phoneRegex = /^\+998\d{9}$/;
         if (!phoneRegex.test(formData.phone_number)) {
           setFormError('Telefon raqami +998 bilan 9 raqam bo‘lishi kerak');
           setIsFormLoading(false);
           return;
         }
         if (formData.password.length < 6) {
           setFormError('Parol 6 belgidan ko‘p bo‘lishi kerak');
           setIsFormLoading(false);
           return;
         }

         const payload = {
           username: formData.username.trim(),
           email: 'user@example.com',
           password: formData.password,
           address: 'Baliqchi',
           phone_number: formData.phone_number,
           location: 'Baliqchi',
           is_aktsya: false,
         };

         try {
           await axios.post('https://hosilbek02.pythonanywhere.com/api/user/user-profiles/', payload);
           const loginResponse = await axios.post('https://hosilbek02.pythonanywhere.com/api/token/', {
             username: formData.username.trim(),
             password: formData.password,
           });

           localStorage.setItem('authToken', loginResponse.data.access);
           localStorage.setItem('refreshToken', loginResponse.data.refresh);

           const profileData = (await makeAuthenticatedRequest({
             method: 'get',
             url: 'https://hosilbek02.pythonanywhere.com/api/user/user-profiles/',
           })).data[0] || {};

           if (!profileData.id) throw new Error('Invalid profile');

           const formattedUserData = {
             ...profileData,
             avatar: profileData.avatar || defaultAvatar,
             user: { username: formData.username.trim() },
             stats: { orders: 0, favorites: 0, notifications: 0 },
             phone_number: formData.phone_number,
             address: 'Baliqchi',
             location: 'Baliqchi',
             email: 'user@example.com',
             is_aktsya: false,
           };

           if (isMounted.current) {
             localStorage.setItem('userData', JSON.stringify(formattedUserData));
             setFormSuccess('Ro‘yxatdan o‘tish muvaffaqiyatli!');
             setTimeout(() => {
               if (isMounted.current) {
                 setModalState({ type: null });
                 setUserData(formattedUserData);
                 setError('');
                 navigate('/profile');
               }
             }, 2000);
           }
         } catch (err) {
           let errorMessage = 'Ro‘yxatdan o‘tishda xato';
           if (err.response?.status === 400) {
             errorMessage = err.response.data.username || err.response.data.email || err.response.data.message || 'Noto‘g‘ri ma‘lumotlar';
           } else if (err.response?.status === 500) {
             errorMessage = 'Server xatosi';
           } else if (err.message.includes('Network Error')) {
             errorMessage = 'Internet aloqasi yo‘q';
           }
           if (isMounted.current) {
             setFormError(errorMessage);
             setIsFormLoading(false);
           }
         }
       },
       [formData, isOnline, navigate, makeAuthenticatedRequest]
     );

     const handleLoginSubmit = useCallback(
       async (e) => {
         e.preventDefault();
         setFormError('');
         setFormSuccess('');
         setIsFormLoading(true);

         if (!isOnline) {
           setFormError('Internet aloqasi yo‘q');
           setIsFormLoading(false);
           return;
         }

         if (!formData.username.trim()) {
           setFormError('Foydalanuvchi ismini kiriting');
           setIsFormLoading(false);
           return;
         }
         if (!formData.password) {
           setFormError('Parolni kiriting');
           setIsFormLoading(false);
           return;
         }

         try {
           const response = await axios.post('https://hosilbek02.pythonanywhere.com/api/token/', {
             username: formData.username.trim(),
             password: formData.password,
           });

           localStorage.setItem('authToken', response.data.access);
           localStorage.setItem('refreshToken', response.data.refresh);

           const profileData = (await makeAuthenticatedRequest({
             method: 'get',
             url: 'https://hosilbek02.pythonanywhere.com/api/user/user-profiles/',
           })).data[0] || {};

           if (!profileData.id) throw new Error('No valid profile');

           const formattedUserData = {
             ...profileData,
             avatar: profileData.avatar || defaultAvatar,
             user: profileData.user || { username: formData.username.trim() },
             stats: {
               orders: profileData.orders?.length || 0,
               favorites: profileData.favorites?.length || 0,
               notifications: profileData.notifications?.length || 0,
             },
             phone_number: profileData.phone_number || '',
             address: profileData.address || '',
             location: profileData.location || '',
             email: profileData.email || '',
             is_aktsya: profileData.is_aktsya || false,
           };

           if (isMounted.current) {
             localStorage.setItem('userData', JSON.stringify(formattedUserData));
             setFormSuccess('Tizimga kirish muvaffaqiyatli!');
             setTimeout(() => {
               if (isMounted.current) {
                 setModalState({ type: null });
                 setUserData(formattedUserData);
                 setError('');
                 navigate('/profile');
               }
             }, 2000);
           }
         } catch (err) {
           let errorMessage = 'Tizimga kirishda xato';
           if (err.response?.status === 401) {
             errorMessage = 'Noto‘g‘ri ism yoki parol';
           } else if (err.response?.status === 400) {
             errorMessage = err.response.data.detail || 'Noto‘g‘ri ma‘lumotlar';
           } else if (err.response?.status === 500) {
             errorMessage = 'Server xatosi';
           } else if (err.message.includes('Network Error')) {
             errorMessage = 'Internet aloqasi yo‘q';
           }
           if (isMounted.current) {
             setFormError(errorMessage);
             setIsFormLoading(false);
           }
         }
       },
       [formData, isOnline, navigate, makeAuthenticatedRequest]
     );

     const handleOpenModal = useCallback((type) => {
       setModalState({ type });
     }, []);

     const handleCloseModal = useCallback(() => {
       setModalState({ type: null });
       setFormData({ username: '', phone_number: '', password: '', selectedProfile: '' });
       setFormError('');
       setFormSuccess('');
     }, []);

     if (loading) return (
       <ErrorBoundary>
         <LoadingSpinner />
       </ErrorBoundary>
     );

     return (
       <ErrorBoundary>
         <div className="bg-[#FFF3E0] pb-8">
           <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
             {userData ? (
               <ProfileCard userData={userData} onLogout={handleLogout} />
             ) : (
               <div className="flex flex-col items-center justify-center min-h-[50vh]">
                 <ErrorMessage error={error || 'Tizimga kirish talab qilinadi'} />
                 <div className="flex justify-center gap-4">
                   <button
                     className="bg-[#FF6200] text-white px-6 py-3 rounded-lg font-medium shadow-md hover:scale-105 transition-transform"
                     onClick={() => handleOpenModal('profile')}
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

             {modalState.type && (
               <AuthModal
                 type={modalState.type}
                 formData={formData}
                 onFormChange={handleFormChange}
                 onSubmit={modalState.type === 'register' ? handleRegisterSubmit : handleLoginSubmit}
                 onClose={handleCloseModal}
                 onSwitchType={handleOpenModal}
                 isFormLoading={isFormLoading}
                 isOnline={isOnline}
                 showPassword={showPassword}
                 onTogglePassword={handleTogglePassword}
                 availableProfiles={availableProfiles}
                 formError={formError}
                 formSuccess={formSuccess}
               />
             )}

             <Snackbar
               open={snackbar.open}
               autoHideDuration={6000}
               onClose={() => setSnackbar({ ...snackbar, open: false })}
               anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
             >
               <MuiAlert
                 onClose={() => setSnackbar({ ...snackbar, open: false })}
                 severity={snackbar.severity}
                 elevation={6}
                 variant="filled"
                 sx={{ borderRadius: 8 }}
               >
                 {snackbar.message}
               </MuiAlert>
             </Snackbar>
           </div>
         </div>
       </ErrorBoundary>
     );
   });

   export default ProfilePage;
   
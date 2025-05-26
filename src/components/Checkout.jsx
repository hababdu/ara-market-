import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowBack as ArrowBackIcon,
  ShoppingCart as ShoppingCartIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Notes as NotesIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  LocalAtm as CashIcon,
  Fastfood as FastfoodIcon,
  LocationSearching as LocationSearchingIcon,
  GpsFixed as GpsFixedIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalShipping as DeliveryIcon,
} from '@mui/icons-material';

const steps = ['Savat', 'Yetkazish', "To'lov"];

const Checkout = () => {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 640; // Simple mobile detection for Tailwind
  const [activeStep, setActiveStep] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    phone: '',
    notes: '',
    latitude: null,
    longitude: null,
    detected_at: null,
  });

  // Minimum kuryer narxi va kilometr narxi
  const MIN_DELIVERY_FEE = 10000;
  const PER_KM_FEE = 1000;

  const user = localStorage.getItem('userData');
  const cart = localStorage.getItem('cart') || '[]';
  const token = localStorage.getItem('authToken');

  const parsedData = useMemo(() => {
    try {
      const parsedUser = JSON.parse(user || '{}');
      const parsedCart = JSON.parse(cart);
      return {
        user: parsedUser,
        cart: Array.isArray(parsedCart) ? parsedCart : [],
      };
    } catch (e) {
      console.error('Error parsing localStorage:', e);
      return { user: null, cart: [] };
    }
  }, [user, cart]);

  useEffect(() => {
    if (!token) {
      navigate('/profile');
      return;
    }

    const loadData = async () => {
      try {
        const { user: parsedUser, cart: parsedCart } = parsedData;

        if (!parsedUser || !parsedUser.id) {
          setError("Foydalanuvchi ma'lumotlari noto'g'ri. Qayta kirish kerak.");
          setLoading(false);
          navigate('/profile');
          return;
        }

        setUserData(parsedUser);
        setCartItems(parsedCart);
        setDeliveryInfo(prev => ({
          ...prev,
          address: parsedUser.address || '',
          phone: parsedUser.phone_number || '',
        }));
        setLoading(false);
      } catch (err) {
        console.error('Data loading error:', err);
        setError("Ma'lumotlarni yuklashda xatolik");
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, token, parsedData]);

  const calculateTotal = useMemo(() => {
    if (!cartItems || !Array.isArray(cartItems)) return 0;
    return cartItems.reduce((sum, item) => {
      const price = Number(item?.price) || 0;
      const quantity = Number(item?.quantity) || 0;
      return sum + price * quantity;
    }, 0);
  }, [cartItems]);

  const calculateDistanceAndCourierFee = useCallback(() => {
    if (!deliveryInfo.latitude || !deliveryInfo.longitude || !cartItems[0]?.kitchen_location) {
      return { distance: null, courierFee: MIN_DELIVERY_FEE };
    }

    const userLat = deliveryInfo.latitude;
    const userLon = deliveryInfo.longitude;
    const kitchenLat = cartItems[0].kitchen_location.latitude;
    const kitchenLon = cartItems[0].kitchen_location.longitude;

    // Haversine formula to calculate distance
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((kitchenLat - userLat) * Math.PI) / 180;
    const dLon = ((kitchenLon - userLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLat * Math.PI) / 180) * Math.cos((kitchenLat * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    // Calculate courier fee: minimum 10,000 so'm + 1,000 so'm per km
    const courierFee = MIN_DELIVERY_FEE + Math.round(distance * PER_KM_FEE);

    return {
      distance: distance.toFixed(1), // Round to 1 decimal place
      courierFee,
    };
  }, [deliveryInfo.latitude, deliveryInfo.longitude, cartItems]);

  const { distance, courierFee } = calculateDistanceAndCourierFee();

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setDeliveryInfo(prev => ({ ...prev, [name]: value }));
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Brauzer geolokatsiyani qo'llab-quvvatlamaydi");
      setLocationPermissionDenied(true);
      setShowLocationDialog(true);
      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    setLocationPermissionDenied(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const detectedAt = new Date().toISOString();

          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          const address = response.data.display_name || "Manzil aniqlanmadi";

          setDeliveryInfo(prev => ({
            ...prev,
            address,
            latitude,
            longitude,
            detected_at: detectedAt,
          }));
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setDeliveryInfo(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            detected_at: new Date().toISOString(),
          }));
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        setLocationError(`Joylashuv xatosi: ${error.message}`);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermissionDenied(true);
          setShowLocationDialog(true);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const handleNextStep = useCallback(() => {
    if (activeStep === 0) {
      if (cartItems.length === 0) {
        setError("Savat bo'sh. Mahsulot qo'shing.");
        return;
      }
      setActiveStep(1);
    } else if (activeStep === 1) {
      if (!deliveryInfo.address || !deliveryInfo.phone) {
        setError("Manzil va telefon raqami kerak");
        return;
      }
      if (!deliveryInfo.latitude || !deliveryInfo.longitude) {
        setError("Joylashuv aniqlanishi shart");
        setShowLocationDialog(true);
        return;
      }
      if (!deliveryInfo.phone.match(/^\+?\d{10,12}$/)) {
        setError("Telefon 10-12 raqam bo'lishi kerak (+ bilan boshlanishi shart emas)");
        return;
      }
      setError(null);
      setActiveStep(2);
    }
  }, [activeStep, deliveryInfo, cartItems]);

  const handlePrevStep = useCallback(() => {
    setActiveStep(prev => prev - 1);
  }, []);

  const handleSubmitOrder = useCallback(async () => {
    if (!deliveryInfo.latitude || !deliveryInfo.longitude) {
      setError("Joylashuv aniqlanishi shart");
      setShowLocationDialog(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const totalAmount = calculateTotal;
      const kitchenId = cartItems[0]?.kitchen_id;
      const { courierFee } = calculateDistanceAndCourierFee();

      if (!kitchenId) {
        setError("Oshxona ma'lumotlari topilmadi.");
        setSubmitting(false);
        return;
      }

      const orderData = {
        user_id: userData.id,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        total_amount: totalAmount,
        shipping_address: deliveryInfo.address,
        contact_number: deliveryInfo.phone,
        notes: deliveryInfo.notes,
        payment: "naqd",
        kitchen_id: kitchenId,
        kitchen_salary: totalAmount.toFixed(2),
        courier_salary: courierFee ? courierFee.toFixed(2) : MIN_DELIVERY_FEE.toFixed(2),
        full_salary: (totalAmount + (courierFee || MIN_DELIVERY_FEE)).toFixed(2),
        latitude: deliveryInfo.latitude,
        longitude: deliveryInfo.longitude,
        detected_at: deliveryInfo.detected_at,
        distance: distance,
      };

      const response = await axios.post(
        'https://hosilbek.pythonanywhere.com/api/user/create-order/',
        orderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.id) {
        localStorage.removeItem('cart');
        setSuccess(`Buyurtma qabul qilindi! Raqam: #${response.data.id}`);
        setTimeout(() => navigate('/orders'), 1500);
      } else {
        throw new Error("Buyurtma yaratish xatosi");
      }
    } catch (err) {
      console.error('Order submission error:', err.response ? err.response.data : err.message);
      let errorMessage = "Buyurtma jo'natishda xatolik.";
      if (err.response?.data) {
        errorMessage = Object.values(err.response.data).flat().join(' ') || err.response.data.detail || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [cartItems, deliveryInfo, navigate, userData, calculateTotal, token, calculateDistanceAndCourierFee, distance]);

  const handleBack = useCallback(() => {
    setShowBackDialog(true);
  }, []);

  const handleBackConfirm = useCallback(() => {
    navigate(-1);
    setShowBackDialog(false);
  }, [navigate]);

  const handleBackCancel = useCallback(() => {
    setShowBackDialog(false);
  }, []);

  const handleLocationDialogClose = useCallback(() => {
    setShowLocationDialog(false);
  }, []);

  const handleBrowserSettingsRedirect = useCallback(() => {
    if (navigator.userAgent.includes('Chrome')) {
      window.open('chrome://settings/content/location');
    } else if (navigator.userAgent.includes('Firefox')) {
      window.open('about:preferences#privacy');
    } else if (navigator.userAgent.includes('Safari')) {
      window.open('x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices');
    }
    setShowLocationDialog(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <svg
          className="animate-spin h-10 w-10 text-[#FF6200]"
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
      </div>
    );
  }

  if (error && !cartItems.length && activeStep === 0) {
    return (
      <div className="max-w-xs mx-auto py-6 flex flex-col justify-center min-h-screen">
        <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg mb-6 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-white hover:text-gray-200">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => navigate('/products')}
          className="bg-[#FF6200] hover:bg-[#FFAB40] text-white px-6 py-3 rounded-lg font-medium transition-transform shadow-md hover:scale-105 flex items-center justify-center mx-auto"
        >
          <ShoppingCartIcon className="mr-2" fontSize="small" />
          Mahsulotlarga
        </button>
      </div>
    );
  }

  const totalWithCourier = calculateTotal + (courierFee || MIN_DELIVERY_FEE);

  return (
    <div className="max-w-xs mx-auto py-6 pb-[120px] sm:pb-6">
      {/* Fixed Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="flex items-center justify-between px-4 py-2">
          <button onClick={handleBack} className="text-[#FF6200] hover:text-[#FFAB40] p-2">
            <ArrowBackIcon fontSize="small" />
          </button>
          <h1 className="text-sm font-bold text-gray-800">Buyurtma berish</h1>
          <div className="w-6"></div> {/* Placeholder for alignment */}
        </div>
      </div>
      <div className="mt-14 sm:mt-16" />

      {/* Stepper */}
      <div className="flex justify-between mb-6">
        {steps.map((label, index) => (
          <div key={label} className="flex-1 text-center">
            <div
              className={`h-2 rounded-full mb-2 ${
                index <= activeStep ? 'bg-[#FF6200]' : 'bg-gray-300'
              }`}
            />
            <span
              className={`text-xs font-medium ${
                index <= activeStep ? 'text-[#FF6200]' : 'text-gray-500'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg mb-6 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-white hover:text-gray-200">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {locationError && (
        <div className="bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg mb-6 flex items-center justify-between">
          {locationError}
          <button onClick={() => setLocationError(null)} className="ml-4 text-white hover:text-gray-200">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg mb-6 flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess(null)} className="ml-4 text-white hover:text-gray-200">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4">
        {activeStep === 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Savat</h2>
            <hr className="mb-4 border-gray-200" />
            <ul className="space-y-2">
              {cartItems.slice(0, summaryExpanded ? cartItems.length : 2).map((item, index) => (
                <li key={index} className="flex items-center border-b border-gray-200 py-2 last:border-b-0">
                  <div className="relative mr-2">
                    <img
                      src={item.photo ? `https://hosilbek.pythonanywhere.com${item.photo}` : undefined}
                      alt={item.title}
                      className="w-7 h-7 rounded object-cover"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/28x28?text=No+Image')}
                    />
                    <span className="absolute -top-1 -right-1 bg-[#FF6200] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-600">{(item.price || 0).toLocaleString()} so'm</p>
                  </div>
                  <p className="text-xs font-bold text-gray-800">
                    {(item.quantity * (item.price || 0)).toLocaleString()} so'm
                  </p>
                </li>
              ))}
            </ul>
            {cartItems.length > 2 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                  className="text-[#FF6200] hover:text-[#FFAB40] text-xs font-medium flex items-center mx-auto"
                >
                  {summaryExpanded ? "Kamroq" : `+${cartItems.length - 2} ta`}
                  {summaryExpanded ? (
                    <ExpandLessIcon fontSize="small" className="ml-1" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" className="ml-1" />
                  )}
                </button>
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={handleNextStep}
                className="bg-[#FF6200] hover:bg-[#FFAB40] text-white px-6 py-2 rounded-lg font-medium transition-transform shadow-md hover:scale-105"
              >
                Davom etish
              </button>
            </div>
          </div>
        )}

        {activeStep === 1 && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Yetkazish ma'lumotlari</h2>
            <hr className="mb-4 border-gray-200" />

            {/* Location Section */}
            <div className="mb-4 p-2 bg-[#FFF3E0] rounded-lg border border-orange-100">
              <p className="text-xs flex items-center mb-2">
                <GpsFixedIcon className="text-[#FF6200] mr-1" style={{ fontSize: 16 }} />
                Joylashuv
              </p>
              <button
                onClick={detectLocation}
                disabled={locationLoading}
                className="w-full bg-[#FF6200] hover:bg-[#FFAB40] text-white py-2 rounded-lg font-medium transition-transform shadow-md hover:scale-105 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {locationLoading ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white mr-2"
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
                ) : (
                  <LocationSearchingIcon fontSize="small" className="mr-2" />
                )}
                {deliveryInfo.latitude ? "Joylashuvni yangilash" : "Joylashuvni aniqlash"}
              </button>
              {deliveryInfo.latitude && (
                <div className="mt-2 flex gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold text-green-600 border border-green-600">
                    <CheckCircleIcon fontSize="small" className="mr-1" />
                    Joylashuv aniqlangan
                  </span>
                  {distance && (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold text-[#FF6200] border border-[#FF6200]">
                      <DeliveryIcon fontSize="small" className="mr-1" />
                      Masofa: {distance} km
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="relative mb-4">
              <PhoneIcon className="absolute top-3 left-3 text-gray-500" style={{ fontSize: 16 }} />
              <input
                type="text"
                name="phone"
                value={deliveryInfo.phone}
                onChange={handleInputChange}
                placeholder="Telefon raqam (masalan: 901234567)"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200] text-sm"
              />
            </div>
            <div className="relative mb-4">
              <LocationIcon className="absolute top-3 left-3 text-gray-500" style={{ fontSize: 16 }} />
              <input
                type="text"
                name="address"
                value={deliveryInfo.address}
                onChange={handleInputChange}
                placeholder="To'liq manzil"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200] text-sm"
              />
            </div>
            <div className="relative mb-4">
              <NotesIcon className="absolute top-3 left-3 text-gray-500" style={{ fontSize: 16 }} />
              <textarea
                name="notes"
                value={deliveryInfo.notes}
                onChange={handleInputChange}
                placeholder="Qo'shimcha izoh (ixtiyoriy)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200] text-sm resize-none h-20"
              />
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={handlePrevStep}
                className="border border-[#FF6200] text-[#FF6200] px-6 py-2 rounded-lg font-medium transition-transform shadow-md hover:scale-105"
              >
                Ortga
              </button>
              <button
                onClick={handleNextStep}
                disabled={!deliveryInfo.latitude || !deliveryInfo.longitude}
                className="bg-[#FF6200] hover:bg-[#FFAB40] text-white px-6 py-2 rounded-lg font-medium transition-transform shadow-md hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Davom etish
              </button>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4">To'lov usuli</h2>
            <hr className="mb-4 border-gray-200" />

            {/* Payment Method */}
            <div className="p-2 border border-gray-200 rounded-lg mb-4">
              <div className="flex items-center">
                <CashIcon className="text-[#FF6200] mr-2" style={{ fontSize: 20 }} />
                <div>
                  <p className="text-xs font-bold text-gray-800">Naqd pul</p>
                  <p className="text-xs text-gray-600">Yetkazib berilganda to'lov</p>
                </div>
                <CheckCircleIcon className="ml-auto text-[#FF6200]" style={{ fontSize: 18 }} />
              </div>
            </div>

            {/* Delivery Info */}
            <p className="text-xs font-bold text-gray-800 mb-2">Yetkazish ma'lumotlari</p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center">
                <PhoneIcon className="text-gray-600 mr-2" style={{ fontSize: 16 }} />
                <p className="text-xs text-gray-600">{deliveryInfo.phone}</p>
              </li>
              <li className="flex items-center">
                <LocationIcon className="text-gray-600 mr-2" style={{ fontSize: 16 }} />
                <p className="text-xs text-gray-600">{deliveryInfo.address}</p>
              </li>
              {deliveryInfo.notes && (
                <li className="flex items-center">
                  <NotesIcon className="text-gray-600 mr-2" style={{ fontSize: 16 }} />
                  <p className="text-xs text-gray-600">{deliveryInfo.notes}</p>
                </li>
              )}
            </ul>

            <div className="flex justify-between mt-6">
              <button
                onClick={handlePrevStep}
                className="border border-[#FF6200] text-[#FF6200] px-6 py-2 rounded-lg font-medium transition-transform shadow-md hover:scale-105"
              >
                Ortga
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="bg-[#FF6200] hover:bg-[#FFAB40] text-white px-6 py-2 rounded-lg font-medium transition-transform shadow-md hover:scale-105 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white mr-2"
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
                ) : (
                  <PaymentIcon fontSize="small" className="mr-2" />
                )}
                {submitting ? "Jo'natilyapti..." : "Buyurtma berish"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Summary Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg z-50 sm:hidden transition-all duration-300 ${
          summaryExpanded ? 'h-[50%]' : 'h-16'
        }`}
      >
        <div className="flex justify-between items-center p-4 bg-white rounded-t-2xl">
          <div>
            <p className="text-xs text-gray-600">Jami:</p>
            <p className="text-sm font-bold text-gray-800">{totalWithCourier.toLocaleString()} so'm</p>
          </div>
          <button
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="text-[#FF6200] hover:text-[#FFAB40]"
          >
            {summaryExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </button>
        </div>
        {summaryExpanded && (
          <div className="p-4">
            <ul className="space-y-2 mb-4">
              {cartItems.map((item, index) => (
                <li key={index} className="flex items-center">
                  <div className="relative mr-2">
                    <img
                      src={item.photo ? `https://hosilbek.pythonanywhere.com${item.photo}` : undefined}
                      alt={item.title}
                      className="w-6 h-6 rounded object-cover"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/24x24?text=No+Image')}
                    />
                    <span className="absolute -top-1 -right-1 bg-[#FF6200] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-600">{(item.price || 0).toLocaleString()} so'm</p>
                  </div>
                  <p className="text-xs font-bold text-gray-800">
                    {(item.quantity * (item.price || 0)).toLocaleString()} so'm
                  </p>
                </li>
              ))}
            </ul>
            <hr className="my-2 border-gray-200" />
            <div className="space-y-1">
              <div className="flex justify-between">
                <p className="text-xs text-gray-600">Mahsulotlar:</p>
                <p className="text-xs text-gray-600">{calculateTotal.toLocaleString()} so'm</p>
              </div>
              <div className="flex justify-between">
                <p className="text-xs text-gray-600">Yetkazib berish:</p>
                <p className="text-xs text-gray-600">{courierFee.toLocaleString()} so'm</p>
              </div>
              {distance && (
                <div className="flex justify-between">
                  <p className="text-xs text-gray-600">Masofa:</p>
                  <p className="text-xs text-gray-600">{distance} km</p>
                </div>
              )}
              <hr className="my-1 border-gray-200" />
              <div className="flex justify-between">
                <p className="text-xs font-bold text-gray-800">Umumiy summa:</p>
                <p className="text-xs font-bold text-[#FF6200]">{totalWithCourier.toLocaleString()} so'm</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showLocationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center mb-4">
              <ErrorIcon className="text-red-500 mr-2" style={{ fontSize: 18 }} />
              <h2 className="text-sm font-semibold text-gray-800">Joylashuv ruxsati</h2>
            </div>
            <p className="text-xs text-gray-600 mb-6">
              Buyurtma berish uchun joylashuv ma'lumotlari kerak. Iltimos, brauzer sozlamalarida joylashuv ruxsatini yoqing.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleLocationDialogClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                Yopish
              </button>
              <button
                onClick={handleBrowserSettingsRedirect}
                className="bg-[#FF6200] hover:bg-[#FFAB40] text-white px-4 py-2 rounded-lg font-medium transition-transform shadow-md hover:scale-105 text-sm"
              >
                Sozlamalarga o'tish
              </button>
            </div>
          </div>
        </div>
      )}

      {showBackDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Buyurtmani bekor qilish</h2>
            <p className="text-xs text-gray-600 mb-6">
              Rostan ham buyurtmani bekor qilmoqchimisiz? Barcha ma'lumotlar yo'qoladi.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleBackCancel}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleBackConfirm}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
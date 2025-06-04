import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
  LocalShipping as DeliveryIcon,
  LocationSearching as LocationSearchingIcon,
  GpsFixed as GpsFixedIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

// Steps for checkout process
const steps = ['Savat', 'Yetkazish', "To'lov"];

// Yandex Maps API key (replace with your own key from https://developer.tech.yandex.com/)
const YANDEX_MAPS_API_KEY = ''; // Replace with your actual Yandex Maps API key

// Map container styles
const mapContainerStyle = {
  height: '300px',
  width: '100%',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

// Default center for the map (e.g., Namangan, Uzbekistan)
const defaultCenter = {
  lat: 40.901058,
  lng: 71.850070,
};

// Fallback bonus product for ID 175
const fallbackBonusProduct = {
  id: 175,
  title: 'Cola 0.5L',
  price: 0,
  quantity: 1,
  photo: 'https://hosilbek.pythonanywhere.com/media/products/cola_0.5L.jpg',
  kitchen_id: 1,
  kitchen_location: { latitude: 40.901058, longitude: 71.850070 },
};

// Axios instance for API calls
const api = axios.create({
  baseURL: 'https://hosilbek.pythonanywhere.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor to handle token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post('https://hosilbek.pythonanywhere.com/api/user/token/refresh/', {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('authToken', newAccessToken);
        api.defaults.headers['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        window.location.href = '/';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

const Checkout = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeStep, setActiveStep] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isAktsya, setIsAktsya] = useState(false);
  const [bonusProduct, setBonusProduct] = useState(null);
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
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    phone: '',
    notes: '',
    latitude: null,
    longitude: null,
    detected_at: null,
  });
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [yandexMap, setYandexMap] = useState(null);
  const [yandexMarker, setYandexMarker] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null); // Store route-based distance

  const MIN_DELIVERY_FEE = 8000; // 8000 so‘m
  const PER_KM_FEE = 1000; // Kilometriga 1000 so‘m

  // Load Yandex Maps API script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_API_KEY}&lang=uz_UZ`;
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(() => {
        // Initialize map when modal is opened
      });
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const parsedData = useMemo(() => {
    try {
      const parsedUser = JSON.parse(localStorage.getItem('userData') || '{}');
      const parsedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      return {
        user: parsedUser,
        cart: Array.isArray(parsedCart) ? parsedCart : [],
      };
    } catch (e) {
      console.error('Error parsing localStorage:', e);
      return { user: null, cart: [] };
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Sessiya tugagan. Iltimos, qayta kiring.');
      setLoading(false);
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

        // Fetch user profile to get is_aktsya
        let isAktsya = false;
        try {
          const profileResponse = await api.get(`user/user-profiles/${parsedUser.id}/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          isAktsya = profileResponse.data.is_aktsya || false;
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
          if (err.response?.status === 404) {
            setError("Foydalanuvchi profili topilmadi. Iltimos, administrator bilan bog'laning.");
          } else if (err.code === 'ERR_NETWORK') {
            setError("Server bilan bog'lanishda xatolik. Iltimos, internet aloqangizni tekshiring.");
          } else {
            setError("Foydalanuvchi ma'lumotlarini yuklashda xatolik.");
          }
          isAktsya = parsedUser.is_aktsya || false;
        }

        // Fetch bonus product (ID 175)
        let bonusProductData = fallbackBonusProduct;
        try {
          const productResponse = await api.get('user/products/175/', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const product = productResponse.data;
          bonusProductData = {
            id: product.id,
            title: product.title,
            price: 0,
            quantity: 1,
            photo: product.photo ? `https://hosilbek.pythonanywhere.com${product.photo}` : fallbackBonusProduct.photo,
            kitchen_id: product.kitchen_id || 1,
            kitchen_location: product.kitchen_location || { latitude: 40.901058, longitude: 71.850070 },
          };
        } catch (err) {
          console.warn('Failed to fetch bonus product (ID 175):', err);
          setError("Bonus mahsulotni yuklashda xatolik. Standart bonus ishlatiladi.");
        }

        setBonusProduct(bonusProductData);

        // Add bonus product to cart if is_aktsya is false
        const updatedCart = isAktsya ? parsedCart : [...parsedCart, bonusProductData];

        setIsAktsya(isAktsya);
        setUserData(parsedUser);
        setCartItems(updatedCart);
        setDeliveryInfo((prev) => ({
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
  }, [navigate, parsedData]);

  const calculateTotal = useMemo(() => {
    if (!cartItems || !Array.isArray(cartItems)) return 0;
    return cartItems.reduce((sum, item) => {
      const price = Number(item?.price) || 0;
      const quantity = Number(item?.quantity) || 0;
      return sum + price * quantity;
    }, 0);
  }, [cartItems]);

  // Calculate route-based distance and courier fee using Yandex Maps API
  const calculateDistanceAndCourierFee = useCallback(async () => {
    if (
      !deliveryInfo.latitude ||
      !deliveryInfo.longitude ||
      !cartItems[0]?.kitchen_location?.latitude ||
      !cartItems[0]?.kitchen_location?.longitude ||
      !window.ymaps
    ) {
      return { distance: null, courierFee: MIN_DELIVERY_FEE };
    }

    try {
      const userCoords = [deliveryInfo.latitude, deliveryInfo.longitude];
      const kitchenCoords = [cartItems[0].kitchen_location.latitude, cartItems[0].kitchen_location.longitude];

      // Use Yandex Maps routing API
      const route = await window.ymaps.route([userCoords, kitchenCoords], {
        mapStateAutoApply: true,
        routingMode: 'auto', // Use road-based routing
      });

      // Get distance in kilometers
      const distanceInMeters = route.getLength();
      const distance = (distanceInMeters / 1000).toFixed(2); // Convert to kilometers
      const courierFee = Math.max(MIN_DELIVERY_FEE, Math.round(parseFloat(distance) * PER_KM_FEE));

      setRouteDistance(distance);
      return {
        distance,
        courierFee,
      };
    } catch (err) {
      console.error('Yandex Maps routing error:', err);
      return { distance: null, courierFee: MIN_DELIVERY_FEE };
    }
  }, [deliveryInfo.latitude, deliveryInfo.longitude, cartItems]);

  const { distance, courierFee } = useMemo(() => {
    const result = calculateDistanceAndCourierFee();
    return result instanceof Promise
      ? { distance: routeDistance, courierFee: MIN_DELIVERY_FEE }
      : result;
  }, [calculateDistanceAndCourierFee, routeDistance]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setDeliveryInfo((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Initialize Yandex Map when modal opens
  const initializeYandexMap = useCallback(() => {
    if (window.ymaps && showMapModal && !yandexMap) {
      const map = new window.ymaps.Map('yandex-map', {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: 13,
        controls: ['zoomControl', 'geolocationControl'],
      });

      const marker = new window.ymaps.Placemark(
        [markerPosition.lat, markerPosition.lng],
        { hintContent: 'Tanlangan joy' },
        { draggable: true }
      );

      map.geoObjects.add(marker);
      setYandexMap(map);
      setYandexMarker(marker);

      // Handle map click
      map.events.add('click', (e) => {
        const coords = e.get('coords');
        const lat = coords[0].toFixed(6);
        const lng = coords[1].toFixed(6);
        setMarkerPosition({ lat: parseFloat(lat), lng: parseFloat(lng) });
        setDeliveryInfo((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          detected_at: new Date().toISOString(),
        }));

        // Reverse geocoding with Yandex
        window.ymaps.geocode(coords).then((res) => {
          const firstGeoObject = res.geoObjects.get(0);
          const address = firstGeoObject ? firstGeoObject.getAddressLine() : 'Manzil aniqlanmadi';
          setDeliveryInfo((prev) => ({ ...prev, address }));
          // Calculate distance and show summary modal
          calculateDistanceAndCourierFee().then(() => {
            if (cartItems[0]?.kitchen_location?.latitude && cartItems[0]?.kitchen_location?.longitude) {
              setShowSummaryModal(true);
            }
          });
        }).catch((err) => {
          console.error('Yandex reverse geocoding error:', err);
          setDeliveryInfo((prev) => ({ ...prev, address: 'Manzil aniqlanmadi' }));
        });
      });

      // Handle marker drag
      marker.events.add('dragend', () => {
        const coords = marker.geometry.getCoordinates();
        const lat = coords[0].toFixed(6);
        const lng = coords[1].toFixed(6);
        setMarkerPosition({ lat: parseFloat(lat), lng: parseFloat(lng) });
        setDeliveryInfo((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          detected_at: new Date().toISOString(),
        }));

        // Reverse geocoding with Yandex
        window.ymaps.geocode(coords).then((res) => {
          const firstGeoObject = res.geoObjects.get(0);
          const address = firstGeoObject ? firstGeoObject.getAddressLine() : 'Manzil aniqlanmadi';
          setDeliveryInfo((prev) => ({ ...prev, address }));
          // Calculate distance and show summary modal
          calculateDistanceAndCourierFee().then(() => {
            if (cartItems[0]?.kitchen_location?.latitude && cartItems[0]?.kitchen_location?.longitude) {
              setShowSummaryModal(true);
            }
          });
        }).catch((err) => {
          console.error('Yandex reverse geocoding error:', err);
          setDeliveryInfo((prev) => ({ ...prev, address: 'Manzil aniqlanmadi' }));
        });
      });

      return () => {
        map.destroy();
        setYandexMap(null);
        setYandexMarker(null);
      };
    }
  }, [showMapModal, mapCenter, markerPosition, yandexMap, cartItems, calculateDistanceAndCourierFee]);

  useEffect(() => {
    if (showMapModal) {
      initializeYandexMap();
    }
  }, [showMapModal, initializeYandexMap]);

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

          // Use Yandex Maps for reverse geocoding
          const response = await window.ymaps.geocode([latitude, longitude]);
          const firstGeoObject = response.geoObjects.get(0);
          const address = firstGeoObject ? firstGeoObject.getAddressLine() : 'Manzil aniqlanmadi';

          setDeliveryInfo((prev) => ({
            ...prev,
            address,
            latitude,
            longitude,
            detected_at: detectedAt,
          }));
          setMapCenter({ lat: latitude, lng: longitude });
          setMarkerPosition({ lat: latitude, lng: longitude });

          // Calculate distance and show summary modal
          if (cartItems[0]?.kitchen_location?.latitude && cartItems[0]?.kitchen_location?.longitude) {
            await calculateDistanceAndCourierFee();
            setShowSummaryModal(true);
          }
        } catch (err) {
          console.error('Yandex geocoding error:', err);
          setDeliveryInfo((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            detected_at: new Date().toISOString(),
          }));
          setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
          setMarkerPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
          if (cartItems[0]?.kitchen_location?.latitude && cartItems[0]?.kitchen_location?.longitude) {
            await calculateDistanceAndCourierFee();
            setShowSummaryModal(true);
          }
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
        timeout: 8000,
        maximumAge: 0,
      }
    );
  }, [cartItems, calculateDistanceAndCourierFee]);

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
    setActiveStep((prev) => prev - 1);
  }, []);

  const handleSubmitOrder = useCallback(async () => {
    if (!deliveryInfo.latitude || !deliveryInfo.longitude) {
      setError("Joylashuv aniqlanishi shart");
      setShowLocationDialog(true);
      return;
    }

    if (!userData?.id) {
      setError('Foydalanuvchi maʼlumotlari topilmadi.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const totalAmount = calculateTotal;
      const kitchenId = cartItems[0]?.kitchen_id;

      if (!kitchenId) {
        setError("Oshxona ma'lumotlari topilmadi.");
        setSubmitting(false);
        return;
      }

      const orderData = {
        user_id: userData.id,
        items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        total_amount: totalAmount.toFixed(2),
        shipping_address: deliveryInfo.address,
        contact_number: deliveryInfo.phone,
        notes: deliveryInfo.notes,
        payment: 'naqd',
        kitchen_id: kitchenId,
        kitchen_salary: totalAmount.toFixed(2),
        courier_salary: courierFee ? courierFee.toFixed(2) : MIN_DELIVERY_FEE.toFixed(2),
        full_salary: (totalAmount + (courierFee || MIN_DELIVERY_FEE)).toFixed(2),
        latitude: deliveryInfo.latitude,
        longitude: deliveryInfo.longitude,
        detected_at: deliveryInfo.detected_at,
        distance: routeDistance ? parseFloat(routeDistance) : null,
        bonus_applied: !isAktsya ? bonusProduct?.title || 'Bonus' : null,
      };

      const response = await api.post('user/create-order/', orderData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.data?.id) {
        if (!isAktsya) {
          try {
            await api.patch(
              `user/user-profiles/${userData.id}/`,
              { is_aktsya: true },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                },
              }
            );
            setIsAktsya(true);
          } catch (err) {
            console.error('Error updating is_aktsya:', err);
            setError("Bonus mahsulot qo'shildi, lekin foydalanuvchi ma'lumotlari yangilanmadi.");
          }
        }

        localStorage.removeItem('cart');
        setSuccess(`Buyurtma qabul qilindi! Raqam: #${response.data.id}`);
        setTimeout(() => navigate('/status'), 500);
      } else {
        throw new Error('Invalid response from server');
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
  }, [cartItems, deliveryInfo, navigate, userData, calculateTotal, courierFee, routeDistance, isAktsya, bonusProduct]);

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

  const handleSummaryModalClose = useCallback(() => {
    setShowSummaryModal(false);
  }, []);

  const handleMapModalClose = useCallback(() => {
    setShowMapModal(false);
    if (yandexMap) {
      yandexMap.destroy();
      setYandexMap(null);
      setYandexMarker(null);
    }
  }, [yandexMap]);

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

  const handleSelectLocation = useCallback(() => {
    setDeliveryInfo((prev) => ({
      ...prev,
      latitude: markerPosition.lat.toFixed(6),
      longitude: markerPosition.lng.toFixed(6),
      detected_at: new Date().toISOString(),
    }));
    setShowMapModal(false);
    if (cartItems[0]?.kitchen_location?.latitude && cartItems[0]?.kitchen_location?.longitude) {
      calculateDistanceAndCourierFee().then(() => {
        setShowSummaryModal(true);
      });
    }
  }, [markerPosition, cartItems, calculateDistanceAndCourierFee]);

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
      <div className="mx-auto py-6 flex flex-col items-center justify-center min-h-screen max-w-sm">
        <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg mb-6 flex items-center justify-between w-full">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-[#FF6200] hover:bg-[#FFAB40] text-white px-6 py-2 rounded-lg font-medium transition-all shadow-md hover:scale-105 flex items-center gap-2"
        >
          <ShoppingCartIcon fontSize="small" />
          Mahsulotlarga
        </button>
      </div>
    );
  }

  const totalWithCourier = calculateTotal + (courierFee || MIN_DELIVERY_FEE);

  return (
    <div className="mx-auto py-6 pb-[120px] sm:pb-16 max-w-[1440px]">
      {/* Fixed Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={handleBack} className="text-[#FF6200] hover:text-[#FFAB40] p-1">
            <ArrowBackIcon fontSize="small" />
          </button>
          <h2 className="text-sm font-bold text-gray-800">Buyurtma berish</h2>
          <div className="w-6" />
        </div>
      </div>
      <div className="mt-12 sm:mt-14" />

      {/* Stepper */}
      <div className="flex justify-between mb-6">
        {steps.map((label, index) => (
          <div key={label} className="flex-1 text-center">
            <div
              className={`h-2 rounded-full mb-2 ${
                index <= activeStep ? 'bg-[#FF6200]' : 'bg-gray-200'
              }`}
            />
            <span
              className={`text-xs font-semibold ${
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
        <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {locationError && (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-md mb-4 flex items-center justify-between">
          <span>{locationError}</span>
          <button onClick={() => setLocationError(null)} className="ml-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-md mb-4 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {!isAktsya && activeStep === 2 && bonusProduct && (
        <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-md mb-4 flex items-center justify-between">
          <span>Ilk buyurtmangiz uchun bonus sifatida {bonusProduct.title} qo'shildi!</span>
          <button onClick={() => setSuccess(null)} className="ml-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4">
        {activeStep === 0 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Savatdagi mahsulotlar</h3>
            <hr className="mb-4 border-gray-200" />
            <ul className="space-y-2">
              {cartItems.slice(0, summaryExpanded ? cartItems.length : 5).map((item, index) => (
                <li key={item.id || index} className="flex items-center border-b border-gray-200 py-2 last:border-b-0">
                  <div className="relative mr-2">
                    <img
                      src={item.photo || 'https://via.placeholder.com/28x28?text=Image'}
                      alt={item.title}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <span className="absolute -top-1 -right-1 bg-[#FF6200] text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 truncate">{item.title}</p>
                    <p className="text-sm text-gray-600">{(item.price || 0).toLocaleString()} so'm</p>
                    {item.id === bonusProduct?.id && (
                      <p className="text-sm text-green-600">Bonus</p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    {(item.quantity * (item.price || 0)).toLocaleString()} so'm
                  </p>
                </li>
              ))}
            </ul>
            {cartItems.length > 5 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                  className="text-[#FF6200] hover:text-[#FFAB40] text-sm font-medium flex items-center mx-auto"
                >
                  {summaryExpanded ? 'Kamroq' : `+${cartItems.length - 5} ta`}
                  {summaryExpanded ? (
                    <ExpandLessIcon fontSize="small" className="ml-1" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" className="ml-1" />
                  )}
                </button>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={handleNextStep}
                className="bg-[#FF6200] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#FFAB40] hover:scale-105 transition-all shadow-md"
              >
                Davom etish
              </button>
            </div>
          </div>
        )}

        {activeStep === 1 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Yetkazish ma'lumotlari</h3>
            <hr className="mb-4 border-gray-200" />
            <div className="mb-4 p-4 bg-[#FFF3E0] rounded-lg border border-orange-100">
              <p className="text-sm font-medium flex items-center mb-2">
                <GpsFixedIcon className="text-[#FF6200] mr-2" fontSize="small" />
                Joylashuv
              </p>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={detectLocation}
                  disabled={locationLoading}
                  className="flex-1 bg-[#FF6200] text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed transition-all hover:bg-[#FFAB40] hover:scale-105 shadow-sm"
                >
                  {locationLoading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="opacity-25"
                      />
                      <path
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V8H4z"
                        className="opacity-75"
                      />
                    </svg>
                  ) : (
                    <LocationSearchingIcon fontSize="small" className="mr-2" />
                  )}
                  {deliveryInfo.latitude ? "Joylashuvni yangilash" : "Avtomatik aniqlash"}
                </button>
                <button
                  onClick={() => setShowMapModal(true)}
                  className="flex-1 bg-[#FF6200] text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center transition-all hover:bg-[#FFAB40] hover:scale-105 shadow-sm"
                >
                  <LocationIcon fontSize="small" className="mr-2" />
                  Qo'lda tanlash
                </button>
              </div>
              {deliveryInfo.latitude && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2 py-1 rounded-sm text-sm font-semibold text-green-700 border border-green-700">
                    <CheckCircleIcon fontSize="small" className="mr-1" />
                    Joylashuv aniqlangan
                  </span>
                  {routeDistance && (
                    <span className="inline-flex items-center px-2 py-1 rounded-sm text-sm font-semibold text-[#FF6200] border border-[#FF6200]">
                      <DeliveryIcon fontSize="small" className="mr-1" />
                      Masofa: {routeDistance} km
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="relative mb-4">
              <PhoneIcon className="absolute top-3 left-3 text-gray-500" fontSize="small" />
              <input
                type="text"
                name="phone"
                value={deliveryInfo.phone}
                onChange={handleInputChange}
                placeholder="Telefon raqami (masalan: +998901234567)"
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200] text-sm"
              />
            </div>
            <div className="relative mb-4">
              <LocationIcon className="absolute top-3 left-3 text-gray-500" fontSize="small" />
              <input
                type="text"
                name="address"
                value={deliveryInfo.address}
                onChange={handleInputChange}
                placeholder="To'liq manzil (masalan: Chilanzar, 45A)"
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200] text-sm"
              />
            </div>
            <div className="relative mb-4">
              <NotesIcon className="absolute top-3 left-3 text-gray-400" fontSize="small" />
              <textarea
                name="notes"
                value={deliveryInfo.notes}
                onChange={handleInputChange}
                placeholder="Qo'shimcha izohlar (ixtiyori)"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200] text-sm h-20 resize-none"
              />
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={handlePrevStep}
                className="border border-[#FF6200] text-[#FF6200] px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Ortga
              </button>
              <button
                onClick={handleNextStep}
                disabled={!deliveryInfo.latitude || !deliveryInfo.longitude}
                className="bg-[#FF6200] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#FFAB40] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
              >
                Davom etish
              </button>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">To'lov usuli</h2>
            <hr className="mb-4 border-gray-200" />
            <div className="p-3 border rounded-lg mb-4 bg-gray-50">
              <div className="flex items-center">
                <CashIcon className="text-[#FF6200] mr-2" fontSize="small" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Naqd pul</p>
                  <p className="text-xs text-gray-500">Yetkazib berilganda to‘lash</p>
                </div>
                <CheckCircleIcon className="ml-auto text-[#FF6200]" fontSize="small" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Yetkazish ma'lumotlari</h3>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center">
                <PhoneIcon className="text-gray-500 mr-2" fontSize="small" />
                <p className="text-sm text-gray-600">{deliveryInfo.phone}</p>
              </li>
              <li className="flex items-center">
                <LocationIcon className="text-gray-500 mr-2" fontSize="small" />
                <p className="text-sm text-gray-600">{deliveryInfo.address}</p>
              </li>
              {deliveryInfo.notes && (
                <li className="items-center">
                  <NotesIcon className="text-gray-500 mr-2" fontSize="small" />
                  <p className="text-sm text-gray-600">{deliveryInfo.notes}</p>
                </li>
              )}
            </ul>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Xulosa</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <p className="text-sm text-gray-600">Oshxonaga narx:</p>
                <p className="text-sm text-gray-600">{calculateTotal.toLocaleString()} so'm</p>
              </div>
              {!isAktsya && bonusProduct && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">Bonus:</p>
                  <div className="flex items-center">
                    <img
                      src={bonusProduct.photo}
                      alt="Bonus Product"
                      className="w-6 h-6 rounded-lg object-cover mr-2"
                    />
                    <p className="text-sm text-green-600">{bonusProduct.title} (Bonus)</p>
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <p className="text-sm text-gray-600">Yo‘l xaqqi:</p>
                <p className="text-sm text-gray-600">{(courierFee || MIN_DELIVERY_FEE).toLocaleString()} so'm</p>
              </div>
              {routeDistance && (
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Masofa:</p>
                  <p className="text-sm text-gray-600">{routeDistance} km</p>
                </div>
              )}
              <hr className="my-2 border-gray-200" />
              <div className="flex justify-between">
                <p className="text-sm font-semibold text-gray-800">Jami summa:</p>
                <p className="text-sm font-semibold text-[#FF6200]">{totalWithCourier.toLocaleString()} so'm</p>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={handlePrevStep}
                className="border border-[#FF6200] text-[#FF6200] px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Ortga
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="bg-[#FF6200] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#FFAB40] flex items-center disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {submitting ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-25"
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V8H4z"
                      className="opacity-75"
                    />
                  </svg>
                ) : (
                  <PaymentIcon className="mr-2" fontSize="small" />
                )}
                {submitting ? 'Jo‘natilmoqda...' : 'Buyurtma berish'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Summary Bottom Sheet */}
      {isMobile && (
        <div
          className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-md z-40 transition-all duration-300 ${summaryExpanded ? 'h-[300px]' : 'h-16'}`}
        >
          <div className="flex items-center justify-between p-4">
            <div className="text-sm">
              <p className="text-gray-500">Jami summa:</p>
              <p className="font-bold text-[#FF6200]">{totalWithCourier.toLocaleString()} so'm</p>
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
              <hr className="mb-2 border-gray-200" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Oshxonaga narx:</p>
                  <p className="text-sm text-gray-600">{calculateTotal.toLocaleString()} so'm</p>
                </div>
                {!isAktsya && bonusProduct && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Bonus:</p>
                    <div className="flex items-center">
                      <img
                        src={bonusProduct.photo}
                        alt="Bonus Product"
                        className="w-6 h-6 rounded-lg object-cover mr-2"
                      />
                      <p className="text-sm text-green-600">{bonusProduct.title} (Bonus)</p>
                    </div>
                  </div>
                )}
                {routeDistance && (
                  <>
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-600">Yo‘l xaqqi:</p>
                      <p className="text-sm text-gray-600">{courierFee.toLocaleString()} so'm</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-600">Masofa:</p>
                      <p className="text-sm text-gray-600">{routeDistance} km</p>
                    </div>
                  </>
                )}
                <hr className="my-2 border-gray-200" />
                <div className="flex justify-between">
                  <p className="text-sm font-semibold text-gray-800">Jami summa:</p>
                  <p className="text-sm font-semibold text-[#FF6200]">{totalWithCourier.toLocaleString()} so'm</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="summary-modal-title">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <CheckCircleIcon className="text-green-600 mr-2" fontSize="small" />
              <h3 id="summary-modal-title" className="text-sm font-semibold text-gray-800">Buyurtma xulosasi</h3>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <p className="text-sm text-gray-600">Oshxonaga narx:</p>
                <p className="text-sm text-gray-600">{calculateTotal.toLocaleString()} so'm</p>
              </div>
              {!isAktsya && bonusProduct && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">Bonus:</p>
                  <div className="flex items-center">
                    <img
                      src={bonusProduct.photo}
                      alt="Bonus Product"
                      className="w-6 h-6 rounded-lg object-cover mr-2"
                    />
                    <p className="text-sm text-green-600">{bonusProduct.title} (Bonus)</p>
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <p className="text-sm text-gray-600">Yo‘l xaqqi:</p>
                <p className="text-sm text-gray-600">{(courierFee || MIN_DELIVERY_FEE).toLocaleString()} so'm</p>
              </div>
              {routeDistance && (
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Masofa:</p>
                  <p className="text-sm text-gray-600">{routeDistance} km</p>
                </div>
              )}
              <div className="flex justify-between">
                <p className="text-sm text-gray-600">Telefon raqami:</p>
                <p className="text-sm text-gray-600">{deliveryInfo.phone || 'N/A'}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-600">Manzil:</p>
                <p className="text-sm text-gray-600">{deliveryInfo.address || 'N/A'}</p>
              </div>
              {deliveryInfo.notes && (
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Izohlar:</p>
                  <p className="text-sm text-gray-600">{deliveryInfo.notes}</p>
                </div>
              )}
              <hr className="my-2 border-gray-200" />
              <div className="flex justify-between">
                <p className="text-sm font-semibold text-gray-800">Jami summa:</p>
                <p className="text-sm font-semibold text-[#FF6200]">{totalWithCourier.toLocaleString()} so'm</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSummaryModalClose}
                className="bg-[#FF6200] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#FFAB40] transition-colors shadow-sm text-sm"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="map-modal-title">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <LocationIcon className="text-[#FF6200] mr-2" fontSize="small" />
              <h3 id="map-modal-title" className="text-sm font-semibold text-gray-800">Joylashuvni tanlash</h3>
            </div>
            <div id="yandex-map" style={mapContainerStyle}></div>
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Tanlangan manzil: {deliveryInfo.address}</p>
              <div className="flex justify-between gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kenglik (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={deliveryInfo.latitude || ''}
                    onChange={(e) =>
                      setDeliveryInfo((prev) => ({ ...prev, latitude: e.target.value }))
                    }
                    className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200] text-sm"
                    readOnly
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uzunlik (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={deliveryInfo.longitude || ''}
                    onChange={(e) =>
                      setDeliveryInfo((prev) => ({ ...prev, longitude: e.target.value }))
                    }
                    className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200] text-sm"
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleMapModalClose}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSelectLocation}
                className="bg-[#FF6200] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#FFAB40] transition-colors shadow-sm text-sm"
              >
                Tanlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {showLocationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-xs">
            <div className="flex items-center mb-4">
              <ErrorIcon className="text-red-600 mr-2" fontSize="small" />
              <h3 className="text-sm font-semibold text-gray-800">Joylashuv ruxsati</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Buyurtma berish uchun joylashuv ma'lumotlari kerak. Iltimos, brauzer sozlamalarida joylashuv ruxsatini yoqing yoki xaritadan qo'lda tanlang.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleLocationDialogClose}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold"
              >
                Yopish
              </button>
              <button
                onClick={handleBrowserSettingsRedirect}
                className="bg-[#FF6200] text-white px-4 py-2 rounded-lg hover:bg-[#FFAB40] transition-colors font-semibold text-sm"
              >
                Sozlamalarga o‘tish
              </button>
            </div>
          </div>
        </div>
      )}

      {showBackDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-xs">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Buyurtmani bekor qilish</h3>
            <p className="text-sm text-gray-600 mb-4">
              Rostan ham buyurtmani bekor qilmoqchimisiz? Barcha ma'lumotlar yo‘qoladi.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleBackCancel}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleBackConfirm}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
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

export default memo(Checkout);
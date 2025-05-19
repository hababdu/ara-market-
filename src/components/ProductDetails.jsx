import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingCart as CartIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Star as StarIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  Chip,
  Snackbar,
  Alert,
  Badge
} from '@mui/material';
import { useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:768px)');

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const axiosInstance = axios.create({
    baseURL: 'https://hosilbek.pythonanywhere.com/api/',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Savatdagi mahsulotlar sonini hisoblash
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalItems);
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productRes, productsRes] = await Promise.all([
        axiosInstance.get(`user/products/${id}/`),
        axiosInstance.get('user/products/'),
      ]);
      setProduct(productRes.data);
      setRelatedProducts(
        productsRes.data
          .filter((p) => p.category?.id === productRes.data.category?.id && p.id !== Number(id))
          .slice(0, 4)
      );
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Mahsulotni yuklashda xatolik yuz berdi'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Sevgililarga qo'shilganligini tekshirish (demo uchun)
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(Number(id)));
  }, [id]);

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const addToCart = (qty = quantity) => {
    if (!product) return;

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        id: product.id,
        kitchen_id: product.kitchen?.id,
        product_id: product.id,
        title: product.title,
        price: product.discounted_price || product.price,
        original_price: product.price,
        quantity: qty,
        photo: product.photo,
        user_id: userData.id,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    showSnackbar('Mahsulot savatga qo\'shildi!', 'success');
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isFavorite) {
      const newFavorites = favorites.filter(favId => favId !== Number(id));
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      showSnackbar('Sevimlilardan o\'chirildi', 'info');
    } else {
      favorites.push(Number(id));
      localStorage.setItem('favorites', JSON.stringify(favorites));
      showSnackbar('Sevimlilarga qo\'shildi', 'success');
    }
    setIsFavorite(!isFavorite);
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSnackbar('Havola nusxalandi!', 'info');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Yuklanmoqda...</p>
      </div>
    );
  }

  if (error && typeof error === 'string') {
    return (
      <div className="container mx-auto py-6 px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowBackIcon className="mr-2" />
          Orqaga qaytish
        </button>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 max-w-6xl">
      {/* Orqaga qaytish tugmasi */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <ArrowBackIcon className="mr-2" />
        Orqaga
      </button>

      {/* Asosiy kontent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6"
      >
        <div className="flex flex-col md:flex-row">
          {/* Mahsulot rasmi */}
          <div className="w-full md:w-1/2 lg:w-2/5 relative">
            <img
              src={product.photo ? `https://hosilbek.pythonanywhere.com${product.photo}` : '/placeholder-product.jpg'}
              alt={product.title}
              className="w-full h-64 md:h-96 object-contain p-4"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-product.jpg';
              }}
            />
            
            {/* Mobil uchun tezkor amallar */}
            {isMobile && (
              <div className="absolute top-2 right-2 flex gap-2">
                <IconButton
                  onClick={toggleFavorite}
                  size="small"
                  sx={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                >
                  {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                </IconButton>
                <IconButton
                  onClick={shareProduct}
                  size="small"
                  sx={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                >
                  <ShareIcon />
                </IconButton>
              </div>
            )}
          </div>

          {/* Mahsulot ma'lumotlari */}
          <div className="w-full md:w-1/2 lg:w-3/5 p-4 md:p-6">
            <div className="flex justify-between items-start">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                {product.title}
              </h1>
              
              {/* Desktop uchun amallar */}
              {!isMobile && (
                <div className="flex gap-2">
                  <IconButton onClick={toggleFavorite}>
                    {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                  </IconButton>
                  <IconButton onClick={shareProduct}>
                    <ShareIcon />
                  </IconButton>
                </div>
              )}
            </div>

            {/* Reyting (demo) */}
            <div className="flex items-center mb-3">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} fontSize="small" />
                ))}
              </div>
              <span className="text-gray-500 text-sm ml-1">(24 baho)</span>
            </div>

            {/* Narx */}
            <div className="mb-4">
              {product.discounted_price ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-2xl font-bold text-red-600">
                    {parseFloat(product.discounted_price).toLocaleString('uz-UZ')} so'm
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    {parseFloat(product.price).toLocaleString('uz-UZ')} so'm
                  </span>
                  <Chip
                    label={`${Math.round((1 - product.discounted_price / product.price) * 100)}% chegirma`}
                    color="error"
                    size="small"
                  />
                </div>
              ) : (
                <span className="text-2xl font-bold text-gray-800">
                  {parseFloat(product.price).toLocaleString('uz-UZ')} so'm
                </span>
              )}
            </div>

            {/* Tavsif */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Tavsif</h3>
              <p className="text-gray-600 whitespace-pre-line">
                {product.description || 'Tavsif mavjud emas'}
              </p>
            </div>

            {/* Kategoriya va oshxona */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm text-gray-500 mb-1">Kategoriya</h4>
                <p className="font-medium">{product.category?.name || 'Noma\'lum'}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500 mb-1">Oshxona</h4>
                <p className="font-medium">{product.kitchen?.name || 'Noma\'lum'}</p>
              </div>
            </div>

            {/* Miqdor va savatga qo'shish */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-lg transition-colors"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-2 w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-lg transition-colors"
                >
                  +
                </button>
              </div>

              <Button
                onClick={() => {
                  setModalQuantity(quantity);
                  setModalOpen(true);
                }}
                variant="contained"
                color="primary"
                size="large"
                startIcon={<CartIcon />}
                sx={{ flex: 1, minWidth: '200px' }}
              >
                Savatga qo'shish
                {cartCount > 0 && (
                  <Badge
                    badgeContent={cartCount}
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        right: -10,
                        top: -10,
                      },
                    }}
                  />
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tegishli mahsulotlar */}
      {relatedProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6"
        >
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
            O'xshash mahsulotlar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow flex flex-col"
              >
                <img
                  src={p.photo ? `https://hosilbek.pythonanywhere.com${p.photo}` : '/placeholder-product.jpg'}
                  alt={p.title}
                  className="w-full h-32 object-contain rounded mb-2"
                />
                <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">{p.title}</h3>
                <div className="mt-auto">
                  <p className="font-semibold text-gray-900">
                    {parseFloat(p.discounted_price || p.price).toLocaleString('uz-UZ')} so'm
                  </p>
                  {p.discounted_price && (
                    <p className="text-xs text-gray-500 line-through">
                      {parseFloat(p.price).toLocaleString('uz-UZ')} so'm
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Miqdor modali */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          Mahsulot miqdori
          <IconButton
            aria-label="close"
            onClick={() => setModalOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <p className="mb-4">{product?.title} dan nechta qo'shmoqchisiz?</p>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outlined"
              onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
              size="large"
              sx={{ minWidth: '40px' }}
            >
              -
            </Button>
            <TextField
              value={modalQuantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setModalQuantity(Math.max(1, val));
              }}
              inputProps={{ 
                style: { textAlign: 'center', fontSize: '1.2rem' },
                min: 1,
                type: 'number'
              }}
              size="medium"
              sx={{ width: '80px' }}
            />
            <Button
              variant="outlined"
              onClick={() => setModalQuantity(q => q + 1)}
              size="large"
              sx={{ minWidth: '40px' }}
            >
              +
            </Button>
          </div>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setModalOpen(false)} 
            color="secondary"
            size="large"
          >
            Bekor qilish
          </Button>
          <Button 
            onClick={() => {
              addToCart(modalQuantity);
              setModalOpen(false);
            }} 
            variant="contained" 
            color="primary"
            size="large"
            startIcon={<CartIcon />}
          >
            Qo'shish ({modalQuantity})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Xabar yorlig'i */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ProductDetails;
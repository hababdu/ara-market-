import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingCart as CartIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  AddShoppingCart as AddToCartIcon,
  RemoveShoppingCart as RemoveFromCartIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon,
  MoreVert as MoreIcon
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
  Badge,
  Box,
  Typography,
  Divider,
  Rating,
  Skeleton,
  MenuItem,
  FormControl,
  Select,
  Tooltip,
  Card,
  CardContent,
  CardMedia,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  // State
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [inCart, setInCart] = useState(false);
  const [cartItemId, setCartItemId] = useState(null);
  const [bottomNavValue, setBottomNavValue] = useState(0);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Axios instance
  const axiosInstance = axios.create({
    baseURL: 'https://hosilbek.pythonanywhere.com/api/',
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  // Update cart data
  const updateCartData = useCallback(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalItems);
    const cartItem = cart.find(item => item.id === product?.id);
    setInCart(!!cartItem);
    setCartItemId(cartItem?.cartItemId);
  }, [product]);

  useEffect(() => {
    updateCartData();
    window.addEventListener('storage', updateCartData);
    return () => window.removeEventListener('storage', updateCartData);
  }, [updateCartData]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productRes, productsRes, categoriesRes] = await Promise.all([
        axiosInstance.get(`user/products/${id}/`),
        axiosInstance.get('user/products/'),
        axiosInstance.get('user/categories/'),
      ]);

      setProduct(productRes.data);
      setAllProducts(productsRes.data);
      setCategories([{ id: 'all', name: 'Barcha kategoriyalar' }, ...categoriesRes.data]);
      setSelectedCategory(productRes.data.category?.id || 'all');
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message === 'Network Error'
          ? 'Internet aloqasi yo‘q. Iltimos, qayta urinib ko‘ring.'
          : 'Mahsulot ma\'lumotlarini yuklashda xato'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(Number(id)));
  }, [id, fetchData]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!product || !allProducts.length) return [];
    let filtered = allProducts.filter(p => p.id !== Number(id));
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category?.id === selectedCategory);
    }
    return filtered.slice(0, 4);
  }, [selectedCategory, allProducts, product, id]);

  // Handlers
  const showSnackbar = useCallback((message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const addToCart = useCallback((qty) => {
    if (!product) return;
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += qty;
    } else {
      const cartItemId = crypto.randomUUID();
      cart.push({
        id: product.id,
        cartItemId,
        kitchen_id: product.kitchen?.id,
        product_id: product.id,
        title: product.title,
        price: product.discounted_price || product.price,
        original_price: product.price,
        quantity: qty,
        photo: product.photo,
        user_id: userData.id,
        kitchen_location: {
          latitude: product.kitchen?.latitude,
          longitude: product.kitchen?.longitude,
        },
      });
      setCartItemId(cartItemId);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    showSnackbar(`${qty} ta ${product.title} savatga qo‘shildi!`, 'success');
    setInCart(true);
  }, [product, showSnackbar]);

  const removeFromCart = useCallback(() => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const itemToRemove = cart.find(item => item.id === product.id);
    const updatedCart = cart.filter(item => item.id !== product.id);

    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('storage'));
    showSnackbar(`${product.title} savatdan o‘chirildi`, 'info');
    setInCart(false);
    setCartItemId(null);
  }, [product, showSnackbar]);

  const toggleFavorite = useCallback(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isFavorite) {
      const newFavorites = favorites.filter(favId => favId !== Number(id));
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      showSnackbar('Sevimlilardan o‘chirildi', 'info');
    } else {
      favorites.push(Number(id));
      localStorage.setItem('favorites', JSON.stringify(favorites));
      showSnackbar('Sevimlilarga qo‘shildi', 'success');
    }
    setIsFavorite(!isFavorite);
  }, [id, isFavorite, showSnackbar]);

  const shareProduct = useCallback(() => {
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
  }, [product, showSnackbar]);

  const handleCategoryChange = useCallback((event) => {
    setSelectedCategory(event.target.value);
  }, []);

  const openMap = useCallback(() => {
    if (!product?.kitchen?.latitude || !product?.kitchen?.longitude) {
      showSnackbar('Manzil ma\'lumotlari mavjud emas', 'error');
      return;
    }
    const lat = product.kitchen.latitude;
    const lon = product.kitchen.longitude;
    const url = `geo:${lat},${lon}?q=${lat},${lon}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [product, showSnackbar]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" width={100} height={24} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Skeleton variant="rectangular" height={300} />
          <Box>
            <Skeleton variant="text" width="80%" height={32} />
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="20%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="100%" height={60} />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Skeleton variant="rectangular" width={100} height={36} />
              <Skeleton variant="rectangular" width={150} height={36} />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Orqaga
        </Button>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={fetchData}
          fullWidth
        >
          Qayta urinish
        </Button>
      </Box>
    );
  }

  // Speed dial actions
  const actions = [
    {
      icon: isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />,
      name: isFavorite ? 'Sevimlilardan o‘chirish' : 'Sevimlilarga qo‘shish',
      action: toggleFavorite
    },
    {
      icon: <ShareIcon />,
      name: 'Ulashish',
      action: shareProduct
    },
    {
      icon: inCart ? <RemoveFromCartIcon color="error" /> : <AddToCartIcon />,
      name: inCart ? 'Savatdan o‘chirish' : 'Savatga qo‘shish',
      action: inCart ? removeFromCart : () => addToCart(1)
    }
  ];

  return (
    <Box sx={{ pb: 7 }}>
     

      {/* Main content */}
      <Box sx={{ p: 2 }}>
        {/* Product image */}
        <Box sx={{
          position: 'relative',
          bgcolor: '#f5f5f5',
          borderRadius: 2,
          overflow: 'hidden',
          mb: 2,
          height: 300,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {imageLoading && <Skeleton variant="rectangular" width="100%" height="100%" />}
          <img
            src={product.photo ? `https://hosilbek.pythonanywhere.com${product.photo}` : '/placeholder-product.jpg'}
            alt={product.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: imageLoading ? 'none' : 'block'
            }}
            onLoad={() => setImageLoading(false)}
            onError={(e) => {
              e.target.src = '/placeholder-product.jpg';
              setImageLoading(false);
            }}
          />
        </Box>

        {/* Product details */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {product.title}
            </Typography>
          </Box>

          {/* Rating */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating
              value={4.5}
              precision={0.5}
              readOnly
              size="small"
              emptyIcon={<StarBorderIcon fontSize="inherit" />}
              sx={{ color: 'warning.main' }}
            />
            <Typography variant="body2" sx={{ ml: 0.5, color: 'text.secondary' }}>
              (24)
            </Typography>
          </Box>

          {/* Price */}
          <Box sx={{ mb: 2 }}>
            {product.discounted_price ? (
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {parseFloat(product.discounted_price).toLocaleString('uz-UZ')} so'm
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>
                  {parseFloat(product.price).toLocaleString('uz-UZ')} so'm
                </Typography>
                <Chip
                  label={`${Math.round((1 - product.discounted_price / product.price) * 100)}% chegirma`}
                  color="error"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            ) : (
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {parseFloat(product.price).toLocaleString('uz-UZ')} so'm
              </Typography>
            )}
          </Box>

          {/* Description */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Tavsif
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>
              {product.description || 'Tavsif mavjud emas'}
            </Typography>
          </Box>

          {/* Category and kitchen */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                Kategoriya
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {product.category?.name || 'Noma\'lum'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                Oshxona
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {product.kitchen?.name || 'Noma\'lum'}
              </Typography>
              {product.kitchen?.latitude && product.kitchen?.longitude && (
                <Button
                  variant="text"
                  size="small"
                  startIcon={<LocationIcon fontSize="small" />}
                  onClick={openMap}
                  sx={{ p: 0, textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Xaritada ko'rish
                </Button>
              )}
            </Box>
          </Box>

          {/* Quantity selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Miqdor
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden'
            }}>
              <Button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
                sx={{ minWidth: 32, px: 0, '&:disabled': { opacity: 0.5 } }}
                size="small"
              >
                -
              </Button>
              <Typography sx={{ width: 32, textAlign: 'center', fontSize: '0.875rem' }}>
                {quantity}
              </Typography>
              <Button
                onClick={() => setQuantity((prev) => prev + 1)}
                sx={{ minWidth: 32, px: 0 }}
                size="small"
              >
                +
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Related products */}
        {filteredProducts.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                O'xshash mahsulotlar
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  size="small"
                  sx={{ fontSize: '0.75rem' }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id} sx={{ fontSize: '0.75rem' }}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2
            }}>
              {filteredProducts.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    onClick={() => navigate(`/products/${p.id}`)}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="100"
                      image={p.photo ? `https://hosilbek.pythonanywhere.com${p.photo}` : '/placeholder-product.jpg'}
                      alt={p.title}
                      sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
                    />
                    <CardContent sx={{ p: 1 }}>
                      <Typography variant="body2" sx={{
                        fontWeight: 500,
                        mb: 0.5,
                        height: 36,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        fontSize: '0.75rem'
                      }}>
                        {p.title}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {parseFloat(p.discounted_price || p.price).toLocaleString('uz-UZ')} so'm
                      </Typography>
                      {p.discounted_price && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>
                          {parseFloat(p.price).toLocaleString('uz-UZ')} so'm
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Bottom navigation for actions */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={bottomNavValue}
          onChange={(event, newValue) => {
            setBottomNavValue(newValue);
          }}
        >
          <BottomNavigationAction
            label={inCart ? "Savatda" : "Savatga"}
            icon={
              <Badge badgeContent={inCart ? null : cartCount} color="error">
                {inCart ? <RemoveFromCartIcon color="error" /> : <AddToCartIcon />}
              </Badge>
            }
            onClick={inCart ? removeFromCart : () => addToCart(quantity)}
          />
          <BottomNavigationAction
            label={isFavorite ? "Sevimli" : "Sevimliga"}
            icon={isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
            onClick={toggleFavorite}
          />
          <BottomNavigationAction label="Ulashish" icon={<ShareIcon />} onClick={shareProduct} />
        </BottomNavigation>
      </Paper>

      {/* Speed dial for additional actions (alternative to bottom nav) */}
      <SpeedDial
        ariaLabel="Product actions"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        icon={<SpeedDialIcon />}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
        open={speedDialOpen}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
          />
        ))}
      </SpeedDial>

      {/* Quantity modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Miqdorni tanlang
            <IconButton onClick={() => setModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>{product?.title}</strong> dan nechta qo'shmoqchisiz?
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
              size="large"
              sx={{ minWidth: 40 }}
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
                style: { textAlign: 'center', fontSize: '1rem', padding: '8px' },
                min: 1,
                type: 'number'
              }}
              size="small"
              sx={{ width: 80 }}
            />
            <Button
              variant="outlined"
              onClick={() => setModalQuantity(q => q + 1)}
              size="large"
              sx={{ minWidth: 40 }}
            >
              +
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={() => setModalOpen(false)}
            color="inherit"
            size="small"
            sx={{ mr: 1 }}
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
            size="small"
            startIcon={<CartIcon />}
          >
            Qo'shish ({modalQuantity})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
          elevation={6}
          iconMapping={{
            success: <CheckCircleIcon fontSize="inherit" />,
            info: <CartIcon fontSize="inherit" />,
            error: <RemoveFromCartIcon fontSize="inherit" />
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductDetails;
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
  FilterAlt as FilterIcon,
  AddShoppingCart as AddToCartIcon,
  RemoveShoppingCart as RemoveFromCartIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon
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
  CardMedia
} from '@mui/material';
import { useMediaQuery, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

// Types (for reference, not enforced in JSX)
// interface Product {
//   id: number;
//   title: string;
//   description: string;
//   price: number;
//   discounted_price?: number;
//   photo: string;
//   category: { id: string; name: string };
//   kitchen: { id: number; name: string; latitude?: number; longitude?: number };
// }
// interface Category {
//   id: string;
//   name: string;
// }
// interface CartItem {
//   id: number;
//   cartItemId: string;
//   kitchen_id: number;
//   product_id: number;
//   title: string;
//   price: number;
//   original_price: number;
//   quantity: number;
//   photo: string;
//   user_id: number;
// }

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  // Axios instance
  const axiosInstance = axios.create({
    baseURL: 'https://hosilbek.pythonanywhere.com/api/',
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000, // 10s timeout
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
      const cartItemId = crypto.randomUUID(); // Unique ID
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
    showSnackbar(`${product.title} savatdan o‘chirildi`, 'info', {
      action: (
        <Button
          color="inherit"
          size="small"
          onClick={() => {
            addToCart(itemToRemove.quantity);
            setSnackbarOpen(false);
          }}
        >
          Qaytarish
        </Button>
      ),
    });
    setInCart(false);
    setCartItemId(null);
  }, [product, showSnackbar, addToCart]);

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
    const url = isMobile
      ? `geo:${lat},${lon}?q=${lat},${lon}`
      : `https://www.google.com/maps?q=${lat},${lon}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [product, isMobile, showSnackbar]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: isMobile ? 2 : 3 }}>
        <Skeleton variant="rectangular" width={100} height={24} sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 4 }}>
          <Box sx={{ width: isMobile ? '100%' : '50%' }}>
            <Skeleton variant="rectangular" height={isMobile ? 300 : 400} />
          </Box>
          <Box sx={{ width: isMobile ? '100%' : '50%' }}>
            <Skeleton variant="text" width="80%" height={40} />
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="40%" height={32} sx={{ mb: 3 }} />
            <Skeleton variant="text" width="20%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="100%" height={80} />
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Skeleton variant="rectangular" width={120} height={40} />
              <Skeleton variant="rectangular" width={200} height={40} />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: isMobile ? 2 : 3 }}>
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
          aria-label="Orqaga"
        >
          Orqaga
        </Button>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={fetchData}
          sx={{ mt: 2 }}
          aria-label="Qayta urinish"
        >
          Qayta urinish
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: isMobile ? 2 : 3 }}>
      {/* Back button */}
      <Button
        onClick={() => navigate(-1)}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 3 }}
        aria-label="Orqaga"
      >
        Orqaga
      </Button>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card sx={{ boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Product image */}
            <Box sx={{
              width: isMobile ? '100%' : '50%',
              position: 'relative',
              bgcolor: '#f5f5f5',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: isMobile ? 2 : 4,
              minHeight: isMobile ? 300 : 400
            }}>
              {imageLoading && <Skeleton variant="rectangular" width="100%" height="100%" />}
              <img
                src={product.photo ? `https://hosilbek.pythonanywhere.com${product.photo}` : '/placeholder-product.jpg'}
                alt={product.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: isMobile ? 300 : 400,
                  objectFit: 'contain',
                  display: imageLoading ? 'none' : 'block'
                }}
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  e.target.src = '/placeholder-product.jpg';
                  setImageLoading(false);
                }}
              />
              {isMobile && (
                <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
                  <Tooltip title={isFavorite ? "Sevimlilardan o‘chirish" : "Sevimlilarga qo‘shish"}>
                    <IconButton
                      onClick={toggleFavorite}
                      size="small"
                      sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
                      aria-label={isFavorite ? "Sevimlilardan o‘chirish" : "Sevimlilarga qo‘shish"}
                    >
                      {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ulashish">
                    <IconButton
                      onClick={shareProduct}
                      size="small"
                      sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
                      aria-label="Ulashish"
                    >
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                  {inCart ? (
                    <Tooltip title="Savatdan o‘chirish">
                      <IconButton
                        onClick={removeFromCart}
                        size="small"
                        sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
                        aria-label="Savatdan o‘chirish"
                      >
                        <RemoveFromCartIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Savatga qo‘shish">
                      <IconButton
                        onClick={() => addToCart(1)}
                        size="small"
                        sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
                        aria-label="Savatga qo‘shish"
                      >
                        <AddToCartIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )}
            </Box>

            {/* Product details */}
            <Box sx={{ width: isMobile ? '100%' : '50%', p: isMobile ? 2 : 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                  {product.title}
                </Typography>
                {!isMobile && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={isFavorite ? "Sevimlilardan o‘chirish" : "Sevimlilarga qo‘shish"}>
                      <IconButton
                        onClick={toggleFavorite}
                        aria-label={isFavorite ? "Sevimlilardan o‘chirish" : "Sevimlilarga qo‘shish"}
                      >
                        {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Ulashish">
                      <IconButton onClick={shareProduct} aria-label="Ulashish">
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                    {inCart ? (
                      <Tooltip title="Savatdan o‘chirish">
                        <IconButton onClick={removeFromCart} aria-label="Savatdan o‘chirish">
                          <RemoveFromCartIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Savatga qo‘shish">
                        <IconButton onClick={() => addToCart(1)} aria-label="Savatga qo‘shish">
                          <AddToCartIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Box>

              {/* Rating */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Rating
                  value={4.5} // Placeholder; replace with product.rating if available
                  precision={0.5}
                  readOnly
                  emptyIcon={<StarBorderIcon fontSize="inherit" />}
                  sx={{ color: 'warning.main' }}
                />
                <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                  (24 sharh)
                </Typography>
              </Box>

              {/* Price */}
              <Box sx={{ mb: 3 }}>
                {product.discounted_price ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                      {parseFloat(product.discounted_price).toLocaleString('uz-UZ')} so'm
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>
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
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {parseFloat(product.price).toLocaleString('uz-UZ')} so'm
                  </Typography>
                )}
              </Box>

              {/* Description */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Tavsif
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>
                  {product.description || 'Tavsif mavjud emas'}
                </Typography>
              </Box>

              {/* Category, kitchen, and map */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 4 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
                    Kategoriya
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {product.category?.name || 'Noma\'lum'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
                    Oshxona
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {product.kitchen?.name || 'Noma\'lum'}
                  </Typography>
                  {product.kitchen?.latitude && product.kitchen?.longitude && (
                    <Button
                      variant="text"
                      startIcon={<LocationIcon />}
                      onClick={openMap}
                      sx={{ mt: 1, p: 0, textTransform: 'none' }}
                      aria-label="Oshxona manzilini xaritada ko‘rish"
                    >
                      Xaritada ko‘rish
                    </Button>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Quantity and cart actions */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
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
                    sx={{ minWidth: 40, px: 1, '&:disabled': { opacity: 0.5 } }}
                    aria-label="Miqdorni kamaytirish"
                  >
                    -
                  </Button>
                  <Typography sx={{ width: 40, textAlign: 'center' }}>
                    {quantity}
                  </Typography>
                  <Button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    sx={{ minWidth: 40, px: 1 }}
                    aria-label="Miqdorni ko‘paytirish"
                  >
                    +
                  </Button>
                </Box>

                {inCart ? (
                  <Button
                    onClick={removeFromCart}
                    variant="outlined"
                    color="error"
                    size="large"
                    startIcon={<RemoveFromCartIcon />}
                    sx={{ flex: 1, minWidth: 200, py: 1.5 }}
                    aria-label="Savatdan o‘chirish"
                  >
                    Savatdan o‘chirish
                    <Badge
                      badgeContent={cartCount}
                      color="error"
                      sx={{ ml: 1, '& .MuiBadge-badge': { right: -10, top: -10 } }}
                    />
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setModalQuantity(quantity);
                      setModalOpen(true);
                    }}
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<CartIcon />}
                    sx={{ flex: 1, minWidth: 200, py: 1.5 }}
                    aria-label="Savatga qo‘shish"
                  >
                    Savatga qo‘shish
                    <Badge
                      badgeContent={cartCount}
                      color="error"
                      sx={{ ml: 1, '& .MuiBadge-badge': { right: -10, top: -10 } }}
                    />
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Card>
      </motion.div>

      {/* Related products */}
      {filteredProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card sx={{ p: isMobile ? 2 : 3, mt: 4, boxShadow: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                O‘xshash mahsulotlar
              </Typography>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  IconComponent={FilterIcon}
                  sx={{ '& .MuiSelect-icon': { color: 'primary.main' } }}
                  aria-label="Kategoriyani tanlash"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: isSmallMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? 2 : 3
            }}>
              {filteredProducts.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    onClick={() => navigate(`/products/${p.id}`)}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="120"
                      image={p.photo ? `https://hosilbek.pythonanywhere.com${p.photo}` : '/placeholder-product.jpg'}
                      alt={p.title}
                      sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Typography variant="body2" sx={{
                        fontWeight: 500,
                        mb: 1,
                        height: 40,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {p.title}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {parseFloat(p.discounted_price || p.price).toLocaleString('uz-UZ')} so'm
                      </Typography>
                      {p.discounted_price && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>
                          {parseFloat(p.price).toLocaleString('uz-UZ')} so'm
                        </Typography>
                      )}
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(1);
                        }}
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' }
                        }}
                        aria-label="Savatga qo‘shish"
                      >
                        <AddToCartIcon fontSize="small" />
                      </IconButton>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </Card>
        </motion.div>
      )}

      {/* Quantity modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="quantity-dialog-title"
      >
        <DialogTitle id="quantity-dialog-title" sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          Miqdorni tanlang
          <IconButton
            onClick={() => setModalOpen(false)}
            size="small"
            aria-label="Yopish"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            <strong>{product?.title}</strong> dan nechta qo‘shmoqchisiz?
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
              size="large"
              sx={{ minWidth: 40 }}
              aria-label="Miqdorni kamaytirish"
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
                style: { textAlign: 'center', fontSize: '1.2rem', padding: '8px' },
                min: 1,
                type: 'number'
              }}
              size="medium"
              sx={{ width: 80 }}
              aria-label="Miqdor"
            />
            <Button
              variant="outlined"
              onClick={() => setModalQuantity(q => q + 1)}
              size="large"
              sx={{ minWidth: 40 }}
              aria-label="Miqdorni ko‘paytirish"
            >
              +
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={() => setModalOpen(false)}
            color="inherit"
            size="large"
            sx={{ mr: 2 }}
            aria-label="Bekor qilish"
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
            sx={{ px: 3 }}
            aria-label={`Savatga ${modalQuantity} ta qo‘shish`}
          >
            Qo‘shish ({modalQuantity})
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
          action={snackbarSeverity === 'info' && (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                const itemToRestore = cart.find(item => item.id === product.id);
                if (itemToRestore) {
                  addToCart(itemToRestore.quantity);
                }
                setSnackbarOpen(false);
              }}
            >
              Qaytarish
            </Button>
          )}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductDetails;
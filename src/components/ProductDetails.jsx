import React, { useState, useEffect } from 'react';
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
  CheckCircle as CheckCircleIcon
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
  Tooltip
} from '@mui/material';
import { useMediaQuery, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
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

  const axiosInstance = axios.create({
    baseURL: 'https://hosilbek.pythonanywhere.com/api/',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Calculate cart items count and check if current product is in cart
  useEffect(() => {
    const updateCartData = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalItems);
      
      // Check if current product is in cart
      const cartItem = cart.find(item => item.id === product?.id);
      setInCart(!!cartItem);
      setCartItemId(cartItem?.cartItemId);
    };
    
    updateCartData();
    window.addEventListener('storage', updateCartData);
    return () => window.removeEventListener('storage', updateCartData);
  }, [product]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productRes, productsRes, categoriesRes] = await Promise.all([
        axiosInstance.get(`user/products/${id}/`),
        axiosInstance.get('user/products/'),
        axiosInstance.get('user/categories/'),
      ]);
      
      setProduct(productRes.data);
      setAllProducts(productsRes.data);
      
      // Set categories with "All" option
      const cats = [{ id: 'all', name: 'All Categories' }, ...categoriesRes.data];
      setCategories(cats);
      
      // Set initial category to current product's category
      setSelectedCategory(productRes.data.category?.id || 'all');
      
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Failed to load product details'
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on selected category
  useEffect(() => {
    if (!product || !allProducts.length) return;
    
    let filtered = allProducts.filter(p => p.id !== Number(id));
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category?.id === selectedCategory);
    }
    
    setFilteredProducts(filtered.slice(0, 4));
  }, [selectedCategory, allProducts, product, id]);

  useEffect(() => {
    fetchData();
    // Check if product is in favorites
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
      const cartItemId = Date.now(); // Generate unique ID for cart item
      cart.push({
        id: product.id,
        cartItemId, // Add unique identifier
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
    showSnackbar(`${qty} ${product.title} added to cart!`, 'success');
    setInCart(true);
  };

  const removeFromCart = () => {
    if (!product) return;
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const updatedCart = cart.filter(item => item.id !== product.id);
    
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('storage'));
    showSnackbar(`${product.title} removed from cart`, 'info');
    setInCart(false);
    setCartItemId(null);
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isFavorite) {
      const newFavorites = favorites.filter(favId => favId !== Number(id));
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      showSnackbar('Removed from favorites', 'info');
    } else {
      favorites.push(Number(id));
      localStorage.setItem('favorites', JSON.stringify(favorites));
      showSnackbar('Added to favorites', 'success');
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
      showSnackbar('Link copied to clipboard!', 'info');
    }
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: isMobile ? 2 : 3 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" width={100} height={24} />
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 4 }}>
          {/* Image placeholder */}
          <Box sx={{ width: isMobile ? '100%' : '50%' }}>
            <Skeleton variant="rectangular" height={isMobile ? 300 : 400} />
          </Box>
          
          {/* Content placeholder */}
          <Box sx={{ width: isMobile ? '100%' : '50%' }}>
            <Skeleton variant="text" width="80%" height={40} />
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="40%" height={32} sx={{ mb: 3 }} />
            
            <Box sx={{ mb: 3 }}>
              <Skeleton variant="text" width="20%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="100%" height={80} />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Skeleton variant="rectangular" width={120} height={40} />
              <Skeleton variant="rectangular" width={200} height={40} />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: isMobile ? 2 : 3 }}>
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
        >
          Back
        </Button>
        
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        
        <Button
          variant="contained"
          onClick={fetchData}
          sx={{ mt: 2 }}
        >
          Retry
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
      >
        Back
      </Button>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1,
          overflow: 'hidden',
          mb: 4
        }}>
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Product image */}
            <Box sx={{
              width: isMobile ? '100%' : '50%',
              position: 'relative',
              bgcolor: '#f9f9f9',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: isMobile ? 2 : 4,
              minHeight: isMobile ? 300 : 400
            }}>
              {imageLoading && (
                <Skeleton variant="rectangular" width="100%" height="100%" />
              )}
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
                  e.target.onerror = null;
                  e.target.src = '/placeholder-product.jpg';
                }}
              />
              
              {/* Quick actions for mobile */}
              {isMobile && (
                <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
                  <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                    <IconButton
                      onClick={toggleFavorite}
                      size="small"
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      {isFavorite ? (
                        <FavoriteIcon color="error" />
                      ) : (
                        <FavoriteBorderIcon />
                      )}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Share">
                    <IconButton
                      onClick={shareProduct}
                      size="small"
                      sx={{ 
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {inCart ? (
                    <Tooltip title="Remove from cart">
                      <IconButton
                        onClick={removeFromCart}
                        size="small"
                        sx={{ 
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <RemoveFromCartIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Add to cart">
                      <IconButton
                        onClick={() => addToCart(1)}
                        size="small"
                        sx={{ 
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <AddToCartIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )}
            </Box>

            {/* Product details */}
            <Box sx={{
              width: isMobile ? '100%' : '50%',
              p: isMobile ? 2 : 4
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" component="h1" sx={{ 
                  fontWeight: 700,
                  color: 'text.primary'
                }}>
                  {product.title}
                </Typography>
                
                {/* Desktop actions */}
                {!isMobile && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                      <IconButton 
                        onClick={toggleFavorite}
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        {isFavorite ? (
                          <FavoriteIcon color="error" />
                        ) : (
                          <FavoriteBorderIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Share">
                      <IconButton 
                        onClick={shareProduct}
                        aria-label="Share"
                      >
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {inCart ? (
                      <Tooltip title="Remove from cart">
                        <IconButton 
                          onClick={removeFromCart}
                          aria-label="Remove from cart"
                        >
                          <RemoveFromCartIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Add to cart">
                        <IconButton 
                          onClick={() => addToCart(1)}
                          aria-label="Add to cart"
                        >
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
                  value={4.5}
                  precision={0.5}
                  readOnly
                  emptyIcon={<StarBorderIcon fontSize="inherit" />}
                  sx={{ color: 'warning.main' }}
                />
                <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                  (24 reviews)
                </Typography>
              </Box>

              {/* Price */}
              <Box sx={{ mb: 3 }}>
                {product.discounted_price ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700,
                      color: 'error.main'
                    }}>
                      {parseFloat(product.discounted_price).toLocaleString('uz-UZ')} so'm
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: 'text.secondary',
                      textDecoration: 'line-through'
                    }}>
                      {parseFloat(product.price).toLocaleString('uz-UZ')} so'm
                    </Typography>
                    <Chip
                      label={`${Math.round((1 - product.discounted_price / product.price) * 100)}% off`}
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
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 600,
                  mb: 1,
                  color: 'text.primary'
                }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: 'text.secondary',
                  whiteSpace: 'pre-line'
                }}>
                  {product.description || 'No description available'}
                </Typography>
              </Box>

              {/* Category and kitchen */}
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2,
                mb: 4
              }}>
                <Box>
                  <Typography variant="caption" sx={{ 
                    display: 'block',
                    color: 'text.secondary',
                    mb: 0.5
                  }}>
                    Category
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {product.category?.name || 'Unknown'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ 
                    display: 'block',
                    color: 'text.secondary',
                    mb: 0.5
                  }}>
                    Kitchen
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {product.kitchen?.name || 'Unknown'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Quantity and add to cart */}
              <Box sx={{ 
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 2
              }}>
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
                    sx={{ 
                      minWidth: 40,
                      px: 1,
                      '&:disabled': { opacity: 0.5 }
                    }}
                  >
                    -
                  </Button>
                  <Typography sx={{ 
                    width: 40,
                    textAlign: 'center'
                  }}>
                    {quantity}
                  </Typography>
                  <Button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    sx={{ minWidth: 40, px: 1 }}
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
                    sx={{ 
                      flex: 1,
                      minWidth: 200,
                      py: 1.5
                    }}
                  >
                    Remove from Cart
                    <Badge
                      badgeContent={cartCount}
                      color="error"
                      sx={{
                        ml: 1,
                        '& .MuiBadge-badge': {
                          right: -10,
                          top: -10,
                        },
                      }}
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
                    sx={{ 
                      flex: 1,
                      minWidth: 200,
                      py: 1.5
                    }}
                  >
                    Add to Cart
                    <Badge
                      badgeContent={cartCount}
                      color="error"
                      sx={{
                        ml: 1,
                        '& .MuiBadge-badge': {
                          right: -10,
                          top: -10,
                        },
                      }}
                    />
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Related products */}
      {filteredProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Box sx={{ 
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
            p: isMobile ? 2 : 3,
            mb: 4
          }}>
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                color: 'text.primary'
              }}>
                Similar Products
              </Typography>
              
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  IconComponent={FilterIcon}
                  sx={{
                    '& .MuiSelect-icon': {
                      color: 'primary.main'
                    }
                  }}
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
                  <Box
                    onClick={() => navigate(`/products/${p.id}`)}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        boxShadow: 2,
                      }
                    }}
                  >
                    <Box sx={{ 
                      height: 120,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mb: 2,
                      bgcolor: '#f9f9f9',
                      borderRadius: 1,
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <img
                        src={p.photo ? `https://hosilbek.pythonanywhere.com${p.photo}` : '/placeholder-product.jpg'}
                        alt={p.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                      
                      {/* Quick add to cart button */}
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
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText'
                          }
                        }}
                      >
                        <AddToCartIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
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
                    
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="body1" sx={{ 
                        fontWeight: 700,
                        color: 'text.primary'
                      }}>
                        {parseFloat(p.discounted_price || p.price).toLocaleString('uz-UZ')} so'm
                      </Typography>
                      {p.discounted_price && (
                        <Typography variant="caption" sx={{ 
                          color: 'text.secondary',
                          textDecoration: 'line-through'
                        }}>
                          {parseFloat(p.price).toLocaleString('uz-UZ')} so'm
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Box>
        </motion.div>
      )}

      {/* Quantity modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          Select Quantity
          <IconButton
            aria-label="close"
            onClick={() => setModalOpen(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            How many <strong>{product?.title}</strong> would you like to add?
          </Typography>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}>
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
                style: { 
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  padding: '8px'
                },
                min: 1,
                type: 'number'
              }}
              size="medium"
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
        <DialogActions sx={{ 
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            onClick={() => setModalOpen(false)} 
            color="inherit"
            size="large"
            sx={{ mr: 2 }}
          >
            Cancel
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
          >
            Add ({modalQuantity})
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
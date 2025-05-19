import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Paper,
  Chip,
  Avatar,
  Badge,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  useTheme,
} from '@mui/material';
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
} from '@mui/icons-material';

const steps = ['Savat', 'Yetkazish', 'Tasdiqlash'];

const Checkout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
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
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    phone: '',
    notes: '',
    coordinates: null,
    locationData: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('userData');
        const cart = localStorage.getItem('cart') || '[]';

        if (!token || !user) {
          navigate('/register');
          return;
        }

        const parsedUser = JSON.parse(user);
        const parsedCart = JSON.parse(cart);

        if (!Array.isArray(parsedCart) || parsedCart.length === 0) {
          setError("Savat bo'sh. Iltimos, mahsulot qo'shing.");
          setLoading(false);
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
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);
  const calculateTotal = () =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo((prev) => ({ ...prev, [name]: value }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationPermissionDenied(true);
      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    setLocationPermissionDenied(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          setDeliveryInfo(prev => ({
            ...prev,
            locationData: {
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            }
          }));
        } catch (err) {
          console.error("Error processing location:", err);
          setDeliveryInfo(prev => ({
            ...prev,
            locationData: {
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            }
          }));
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        setLocationError(`Joylashuvni aniqlashda xatolik: ${error.message}`);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermissionDenied(true);
          setShowLocationDialog(true);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleNextStep = () => {
    if (activeStep === 0) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      if (!deliveryInfo.address || !deliveryInfo.phone) {
        setError("Iltimos, yetkazib berish manzili va telefon raqamini to'ldiring");
        return;
      }
      if (!deliveryInfo.locationData) {
        setError("Iltimos, joylashuvingizni aniqlang");
        setShowLocationDialog(true);
        return;
      }
      setError(null);
      setActiveStep(2);
    }
  };

  const handlePrevStep = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmitOrder = async () => {
    if (!deliveryInfo.locationData) {
      setError("Iltimos, joylashuvingizni aniqlang");
      setShowLocationDialog(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const totalAmount = calculateTotal();
      const kitchenId = cartItems[0]?.kitchen_id;
      
      if (!kitchenId) {
        setError("Oshxona ma'lumotlari topilmadi. Iltimos, mahsulotni qayta tanlang.");
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
        total_amount: totalAmount,
        shipping_address: deliveryInfo.address,
        contact_number: deliveryInfo.phone,
        notes: deliveryInfo.notes,
        payment: "naqd",
        kitchen_id: kitchenId,
        kitchen_salary: totalAmount.toFixed(2),
        courier_salary: "0.00",
        full_salary: totalAmount.toFixed(2),
        latitude: deliveryInfo.locationData.latitude,
        longitude: deliveryInfo.locationData.longitude,
        detected_at: new Date().toISOString(),
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
        setSuccess(`Buyurtma muvaffaqiyatli qabul qilindi! Buyurtma raqami: #${response.data.id}`);
        setTimeout(() => navigate('/orders'), 3000);
      } else {
        throw new Error("Buyurtma yaratishda xatolik yuz berdi");
      }
    } catch (err) {
      console.error('Order submission error:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})[0] ||
        "Buyurtma jo'natishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleLocationDialogClose = () => {
    setShowLocationDialog(false);
  };

  const handleBrowserSettingsRedirect = () => {
    if (navigator.userAgent.includes('Chrome')) {
      window.open('chrome://settings/content/location');
    } else if (navigator.userAgent.includes('Firefox')) {
      window.open('about:preferences#privacy');
    } else if (navigator.userAgent.includes('Safari')) {
      window.open('x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices');
    }
    setShowLocationDialog(false);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={isMobile ? 40 : 60} />
      </Container>
    );
  }

  if (error && !cartItems.length) {
    return (
      <Container maxWidth="md" sx={{ py: 4, minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/products')}
          startIcon={<ShoppingCartIcon />}
          sx={{ alignSelf: 'center' }}
        >
          Mahsulotlar sahifasiga qaytish
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4, px: isMobile ? 1 : 2 }}>
      {/* Header Section */}
      <Box display="flex" alignItems="center" mb={isMobile ? 2 : 4}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon fontSize={isMobile ? "medium" : "large"} />
        </IconButton>
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
          Buyurtma berish
        </Typography>
      </Box>

      {/* Stepper - Optimized for mobile */}
      <Stepper 
        activeStep={activeStep} 
        alternativeLabel 
        sx={{ 
          mb: isMobile ? 3 : 5,
          '& .MuiStepLabel-label': {
            fontSize: isMobile ? theme.typography.caption.fontSize : theme.typography.body2.fontSize
          }
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{isMobile ? label.substring(0, 3) : label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: isMobile ? theme.typography.caption.fontSize : 'inherit' }}>
          {error}
        </Alert>
      )}
      {locationError && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: isMobile ? theme.typography.caption.fontSize : 'inherit' }}>
          {locationError}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, fontSize: isMobile ? theme.typography.caption.fontSize : 'inherit' }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={isMobile ? 1 : 4}>
        {/* Left Column - Main Content */}
        <Grid item xs={12} md={7}>
          {activeStep === 0 && (
            <Card sx={{ borderRadius: 2, boxShadow: isMobile ? 'none' : theme.shadows[1] }}>
              <CardContent sx={{ p: isMobile ? 1 : 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                  Savat tarkibi
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense={isMobile}>
                  {cartItems.map((item, index) => (
                    <ListItem 
                      key={index} 
                      divider
                      sx={{
                        py: isMobile ? 1 : 2,
                        px: isMobile ? 0 : 1
                      }}
                    >
                      <Avatar
                        src={item.photo ? `https://hosilbek.pythonanywhere.com${item.photo}` : undefined}
                        variant="rounded"
                        sx={{ 
                          width: isMobile ? 40 : 56, 
                          height: isMobile ? 40 : 56, 
                          mr: isMobile ? 1 : 2 
                        }}
                      >
                        {!item.photo && <FastfoodIcon fontSize={isMobile ? "small" : "medium"} />}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Typography 
                            variant={isMobile ? "body2" : "body1"} 
                            sx={{ fontWeight: 500 }}
                          >
                            {item.title}
                          </Typography>
                        }
                        secondary={`${item.quantity} x ${item.price.toLocaleString()} so'm`}
                        sx={{
                          '& .MuiListItemText-secondary': {
                            fontSize: isMobile ? theme.typography.caption.fontSize : 'inherit'
                          }
                        }}
                      />
                      <Typography 
                        fontWeight="bold" 
                        sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                      >
                        {(item.quantity * item.price).toLocaleString()} so'm
                      </Typography>
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleNextStep}
                    size={isMobile ? "small" : "medium"}
                  >
                    Davom etish
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {activeStep === 1 && (
            <Card sx={{ borderRadius: 2, boxShadow: isMobile ? 'none' : theme.shadows[1] }}>
              <CardContent sx={{ p: isMobile ? 1 : 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                  Yetkazib berish ma'lumotlari
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {/* Location Detection Card */}
                <Paper 
                  sx={{ 
                    mb: 2, 
                    p: isMobile ? 1 : 2, 
                    borderRadius: 2, 
                    border: '1px solid', 
                    borderColor: 'primary.main',
                    backgroundColor: theme.palette.background.paper
                  }}
                >
                  <Box display="flex" alignItems="center" mb={1}>
                    <GpsFixedIcon 
                      color="primary" 
                      sx={{ 
                        mr: 1,
                        fontSize: isMobile ? '1.2rem' : '1.5rem'
                      }} 
                    />
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: isMobile ? '0.95rem' : '1rem'
                      }}
                    >
                      Joylashuvingizni aniqlang
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      fontSize: isMobile ? '0.8rem' : '0.875rem'
                    }}
                  >
                    Buyurtma berish uchun joylashuvingizni aniqlash majburiy
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={
                      locationLoading ? 
                        <CircularProgress size={isMobile ? 16 : 20} /> : 
                        <LocationSearchingIcon fontSize={isMobile ? "small" : "medium"} />
                    }
                    onClick={detectLocation}
                    disabled={locationLoading}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                  >
                    {deliveryInfo.coordinates ? "Yangilash" : "Joylashuvni aniqlash"}
                  </Button>
                  {deliveryInfo.coordinates && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        icon={<CheckCircleIcon fontSize={isMobile ? "small" : "medium"} />}
                        label="Aniqlangan"
                        color="success"
                        variant="outlined"
                        size={isMobile ? "small" : "medium"}
                        sx={{ mr: 1 }}
                      />
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                      >
                        Aniqlik: ±{deliveryInfo.locationData?.accuracy?.toFixed(2) || 'Noma\'lum'} metr
                      </Typography>
                    </Box>
                  )}
                </Paper>

                {/* Form Fields */}
                <TextField
                  fullWidth 
                  label="Telefon raqam" 
                  name="phone" 
                  value={deliveryInfo.phone}
                  onChange={handleInputChange} 
                  margin="normal" 
                  required
                  size={isMobile ? "small" : "medium"}
                  InputProps={{ 
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon fontSize={isMobile ? "small" : "medium"} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth 
                  label="Yetkazib berish manzili" 
                  name="address" 
                  value={deliveryInfo.address}
                  onChange={handleInputChange} 
                  margin="normal" 
                  required 
                  multiline 
                  rows={isMobile ? 2 : 3}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{ 
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon fontSize={isMobile ? "small" : "medium"} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth 
                  label="Qo'shimcha izohlar (ixtiyoriy)" 
                  name="notes" 
                  value={deliveryInfo.notes}
                  onChange={handleInputChange} 
                  margin="normal" 
                  multiline 
                  rows={isMobile ? 1 : 2}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{ 
                    startAdornment: (
                      <InputAdornment position="start">
                        <NotesIcon fontSize={isMobile ? "small" : "medium"} />
                      </InputAdornment>
                    ),
                  }}
                />
                
                {/* Location Details */}
                {deliveryInfo.coordinates && (
                  <Paper sx={{ 
                    p: isMobile ? 1 : 2, 
                    mt: 2, 
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper
                  }}>
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom
                      sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                    >
                      Joylashuv tafsilotlari:
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    >
                      Kenglik: {deliveryInfo.coordinates.latitude.toFixed(6)}
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    >
                      Uzunlik: {deliveryInfo.coordinates.longitude.toFixed(6)}
                    </Typography>
                  </Paper>
                )}

                {/* Navigation Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  mt: 3,
                  gap: 1
                }}>
                  <Button 
                    variant="outlined" 
                    onClick={handlePrevStep}
                    size={isMobile ? "small" : "medium"}
                    fullWidth={isMobile}
                  >
                    Ortga
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleNextStep}
                    disabled={!deliveryInfo.coordinates}
                    size={isMobile ? "small" : "medium"}
                    fullWidth={isMobile}
                  >
                    Davom etish
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {activeStep === 2 && (
            <Card sx={{ borderRadius: 2, boxShadow: isMobile ? 'none' : theme.shadows[1] }}>
              <CardContent sx={{ p: isMobile ? 1 : 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                  To'lov usuli
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {/* Payment Method Card */}
                <Paper 
                  sx={{ 
                    p: isMobile ? 1.5 : 3, 
                    mb: 2, 
                    borderRadius: 2,
                    border: '1px solid', 
                    borderColor: 'primary.main',
                    backgroundColor: theme.palette.background.paper
                  }}
                >
                  <Box display="flex" alignItems="center">
                    <CashIcon 
                      color="primary" 
                      sx={{ 
                        fontSize: isMobile ? 30 : 40, 
                        mr: isMobile ? 1 : 2 
                      }} 
                    />
                    <Box>
                      <Typography 
                        variant={isMobile ? "subtitle1" : "h6"}
                        sx={{ fontWeight: 'bold' }}
                      >
                        Naqd pul bilan to'lash
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                      >
                        Mahsulotni olganingizdan so'ng to'lov qilasiz
                      </Typography>
                    </Box>
                    <CheckCircleIcon 
                      color="primary" 
                      sx={{ 
                        ml: 'auto',
                        fontSize: isMobile ? '1.2rem' : '1.5rem'
                      }} 
                    />
                  </Box>
                </Paper>

                {/* Delivery Information */}
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold"
                  sx={{ fontSize: isMobile ? '0.95rem' : '1rem' }}
                >
                  Yetkazib berish ma'lumotlari
                </Typography>
                <Paper 
                  sx={{ 
                    p: isMobile ? 1 : 2, 
                    mb: 2, 
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper
                  }}
                >
                  <Typography sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon 
                      fontSize={isMobile ? "small" : "medium"} 
                      sx={{ mr: 1 }} 
                    />
                    {deliveryInfo.phone}
                  </Typography>
                  <Typography sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon 
                      fontSize={isMobile ? "small" : "medium"} 
                      sx={{ mr: 1 }} 
                    />
                    {deliveryInfo.address}
                  </Typography>
                  {deliveryInfo.coordinates && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontSize: isMobile ? '0.7rem' : '0.75rem'
                      }}
                    >
                      <GpsFixedIcon 
                        fontSize={isMobile ? "small" : "medium"} 
                        sx={{ mr: 1 }} 
                      />
                      Kenglik: {deliveryInfo.coordinates.latitude.toFixed(6)}, 
                      Uzunlik: {deliveryInfo.coordinates.longitude.toFixed(6)}
                    </Typography>
                  )}
                  {deliveryInfo.notes && (
                    <Typography 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mt: 1
                      }}
                    >
                      <NotesIcon 
                        fontSize={isMobile ? "small" : "medium"} 
                        sx={{ mr: 1 }} 
                      />
                      {deliveryInfo.notes}
                    </Typography>
                  )}
                </Paper>

                {/* Navigation Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  gap: 1
                }}>
                  <Button 
                    variant="outlined" 
                    onClick={handlePrevStep}
                    size={isMobile ? "small" : "medium"}
                    fullWidth={isMobile}
                  >
                    Ortga
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    startIcon={submitting && <CircularProgress size={isMobile ? 16 : 24} />}
                    size={isMobile ? "small" : "medium"}
                    fullWidth={isMobile}
                  >
                    {submitting ? "Jo'natilyapti..." : "Tasdiqlash"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column - Order Summary */}
        <Grid item xs={12} md={5}>
          <Card 
            sx={{ 
              borderRadius: 2, 
              position: isMobile ? 'static' : 'sticky', 
              top: 20,
              boxShadow: isMobile ? 'none' : theme.shadows[1]
            }}
          >
            <CardContent sx={{ p: isMobile ? 1 : 2 }}>
              <Typography 
                variant="h6" 
                fontWeight="bold"
                sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
              >
                Buyurtma xulosasi
              </Typography>
              <Divider sx={{ my: 1 }} />
              
              {/* Order Items List */}
              <List dense>
                {cartItems.map((item, index) => (
                  <ListItem 
                    key={index} 
                    divider
                    sx={{
                      py: isMobile ? 0.5 : 1,
                      px: 0
                    }}
                  >
                    <Badge 
                      badgeContent={item.quantity} 
                      color="primary" 
                      sx={{ mr: 1 }}
                    >
                      <Avatar
                        src={item.photo ? `https://hosilbek.pythonanywhere.com${item.photo}` : undefined}
                        variant="rounded"
                        sx={{ 
                          width: isMobile ? 32 : 40, 
                          height: isMobile ? 32 : 40 
                        }}
                      >
                        {!item.photo && <FastfoodIcon fontSize={isMobile ? "small" : "medium"} />}
                      </Avatar>
                    </Badge>
                    <ListItemText 
                      primary={
                        <Typography 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: isMobile ? '0.8rem' : '0.875rem'
                          }}
                        >
                          {item.title}
                        </Typography>
                      } 
                      secondary={`${item.price.toLocaleString()} so'm`}
                      sx={{
                        '& .MuiListItemText-secondary': {
                          fontSize: isMobile ? '0.7rem' : '0.75rem'
                        }
                      }}
                    />
                    <Typography 
                      fontWeight="bold"
                      sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                    >
                      {(item.price * item.quantity).toLocaleString()} so'm
                    </Typography>
                  </ListItem>
                ))}
              </List>
              
              {/* Order Summary */}
              <Box sx={{ 
                mt: 2, 
                p: isMobile ? 1 : 2, 
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper
              }}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                    Mahsulotlar:
                  </Typography>
                  <Typography sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                    {cartItems.reduce((sum, i) => sum + i.quantity, 0)} ta
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                    Yetkazib berish:
                  </Typography>
                  <Typography sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                    0 so'm
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography 
                    fontWeight="bold"
                    sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
                  >
                    Jami:
                  </Typography>
                  <Typography 
                    fontWeight="bold" 
                    color="primary"
                    sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
                  >
                    {calculateTotal().toLocaleString()} so'm
                  </Typography>
                </Box>
              </Box>
              
              {/* Payment Method Chip */}
              <Box sx={{ mt: 2 }}>
                <Chip 
                  icon={<PaymentIcon fontSize={isMobile ? "small" : "medium"} />} 
                  label="Naqd to'lov" 
                  variant="outlined" 
                  color="primary"
                  size={isMobile ? "small" : "medium"}
                />
              </Box>
              
              {/* Location Status */}
              {deliveryInfo.coordinates && (
                <Box sx={{ 
                  mt: 1, 
                  p: isMobile ? 0.5 : 1, 
                  borderRadius: 2,
                  backgroundColor: theme.palette.action.hover
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontSize: isMobile ? '0.7rem' : '0.75rem'
                    }}
                  >
                    <CheckCircleIcon 
                      color="success" 
                      fontSize={isMobile ? "small" : "medium"} 
                      sx={{ mr: 0.5 }} 
                    />
                    Joylashuv aniqlangan
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Location Permission Dialog */}
      <Dialog
        open={showLocationDialog}
        onClose={handleLocationDialogClose}
        aria-labelledby="location-permission-dialog"
        fullScreen={isMobile}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: isMobile ? '1.1rem' : '1.25rem'
          }}
        >
          <ErrorIcon color="error" sx={{ mr: 1 }} />
          Joylashuv ruxsati kerak
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>
            Buyurtma berish uchun joylashuvingizni aniqlash majburiy. Iltimos, brauzer sozlamalariga o'tib, joylashuv xizmatlariga ruxsat bering.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleLocationDialogClose}
            size={isMobile ? "small" : "medium"}
          >
            Yopish
          </Button>
          <Button 
            onClick={handleBrowserSettingsRedirect}
            variant="contained"
            color="primary"
            autoFocus
            size={isMobile ? "small" : "medium"}
          >
            Sozlamalarga o'tish
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Checkout;
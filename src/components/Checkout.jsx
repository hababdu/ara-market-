import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Collapse,
  useMediaQuery,
  AppBar,
  Toolbar,
  ThemeProvider,
  createTheme,
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

const steps = ['Savat', 'Yetkazish', 'Tasdiqlash'];

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    success: { main: '#2e7d32' },
    warning: { main: '#ed6c02' },
    error: { main: '#d32f2f' },
    background: { default: '#f5f5f5', paper: '#fff' },
  },
  typography: {
    subtitle1: { fontSize: '1rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600 },
    body2: { fontSize: '0.75rem' },
    caption: { fontSize: '0.6875rem' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', minHeight: 40 },
        sizeSmall: { fontSize: '0.75rem', padding: '8px 12px' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { '& .MuiInputBase-root': { fontSize: '0.75rem', padding: '4px' } },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: { fontSize: '0.6875rem' },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: { fontSize: '1rem' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontSize: '0.6875rem', height: 24 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { fontSize: '0.75rem', padding: '8px' },
      },
    },
  },
});

const Checkout = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      navigate('/register');
      return;
    }

    const loadData = async () => {
      try {
        const { user: parsedUser, cart: parsedCart } = parsedData;

        if (!parsedUser || !parsedUser.id) {
          setError("Foydalanuvchi ma'lumotlari noto'g'ri. Qayta kirish kerak.");
          setLoading(false);
          navigate('/register');
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
      return { distance: null, courierFee: null };
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

    // Courier fee: 2,000 so'm per kilometer
    const courierFee = distance * 2000;

    return {
      distance: distance.toFixed(2), // Round to 2 decimal places
      courierFee: Math.round(courierFee), // Round to nearest integer
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
      if (!deliveryInfo.phone.match(/^\+\d{10,12}$/)) {
        setError("Telefon + bilan boshlanib, 10-12 raqam bo'lishi kerak");
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
        courier_salary: courierFee ? courierFee.toFixed(2) : "0.00",
        full_salary: (totalAmount + (courierFee || 0)).toFixed(2),
        latitude: deliveryInfo.latitude,
        longitude: deliveryInfo.longitude,
        detected_at: deliveryInfo.detected_at,
        full_time: distance, // Adding the distance between kitchen and customer
         
      };
console.log('Order Data:', orderData);
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
        setTimeout(() => navigate('/status'), 1500);
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
  }, [cartItems, deliveryInfo, navigate, userData, calculateTotal, token, calculateDistanceAndCourierFee]);

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error && !cartItems.length && activeStep === 0) {
    return (
      <Container maxWidth="xs" sx={{ py: 1.5, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/products')}
          startIcon={<ShoppingCartIcon />}
          sx={{ alignSelf: 'center', borderRadius: 2, minHeight: 40, fontSize: '0.75rem' }}
        >
          Mahsulotlarga
        </Button>
      </Container>
    );
  }

  const totalWithCourier = calculateTotal + (courierFee || 0);

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xs" sx={{ py: 1.5, pb: isMobile ? 14 : 1.5 }}>
        {/* Fixed Top Bar */}
        <AppBar position="fixed" color="default" elevation={1}>
          <Toolbar sx={{ minHeight: 48, px: 1 }}>
            <IconButton onClick={handleBack} edge="start" sx={{ mr: 1, p: 0.5 }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="subtitle2" fontWeight="bold" noWrap>
              Buyurtma
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ mt: isMobile ? 7 : 8 }} />

        {/* Stepper */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2, '& .MuiStepLabel-label': { fontSize: '0.6875rem' } }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepIcon-root': { fontSize: isMobile ? 18 : 20 } }}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {locationError && (
          <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }} onClose={() => setLocationError(null)}>
            {locationError}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Main Content */}
        <Grid container spacing={isMobile ? 1 : 1.5}>
          <Grid item xs={12}>
            {activeStep === 0 && (
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Savat</Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <List dense>
                    {cartItems.slice(0, summaryExpanded ? cartItems.length : 2).map((item, index) => (
                      <ListItem key={index} divider sx={{ py: 0.5 }}>
                        <Badge badgeContent={item.quantity} color="primary" sx={{ mr: 1 }}>
                          <Avatar
                            src={item.photo ? `https://hosilbek.pythonanywhere.com${item.photo}` : undefined}
                            variant="rounded"
                            sx={{ width: 28, height: 28 }}
                          >
                            {!item.photo && <FastfoodIcon fontSize="small" />}
                          </Avatar>
                        </Badge>
                        <ListItemText
                          primary={item.title}
                          secondary={`${(item.price || 0).toLocaleString()} so'm`}
                          primaryTypographyProps={{ variant: 'caption', noWrap: true }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                        <Typography variant="caption" fontWeight="bold">
                          {(item.quantity * (item.price || 0)).toLocaleString()} so'm
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                  {cartItems.length > 2 && (
                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                      <Button
                        size="small"
                        onClick={() => setSummaryExpanded(!summaryExpanded)}
                        endIcon={summaryExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        sx={{ fontSize: '0.6875rem' }}
                      >
                        {summaryExpanded ? "Kamroq" : `+${cartItems.length - 2} ta`}
                      </Button>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                    <Button
                      variant="contained"
                      onClick={handleNextStep}
                      size="small"
                      sx={{ minHeight: 40, borderRadius: 2, fontSize: '0.75rem' }}
                    >
                      Davom etish
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {activeStep === 1 && (
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Yetkazish</Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ mb: 1.5, p: 1, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'primary.main' }}>
                    <Typography variant="caption" sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}>
                      <GpsFixedIcon color="primary" sx={{ mr: 0.5, fontSize: 16 }} /> Joylashuv
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={locationLoading ? <CircularProgress size={14} /> : <LocationSearchingIcon fontSize="small" />}
                      onClick={detectLocation}
                      disabled={locationLoading}
                      fullWidth
                      size="small"
                      sx={{ minHeight: 40, borderRadius: 2, fontSize: '0.75rem' }}
                    >
                      {deliveryInfo.latitude ? "Yangilash" : "Aniqlash"}
                    </Button>
                    {deliveryInfo.latitude && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Aniqlangan"
                        color="success"
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>
                  <TextField
                    fullWidth
                    label="Telefon"
                    name="phone"
                    value={deliveryInfo.phone}
                    onChange={handleInputChange}
                    margin="dense"
                    required
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment>,
                    }}
                    helperText="Masalan: +998901234567"
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="Manzil"
                    name="address"
                    value={deliveryInfo.address}
                    onChange={handleInputChange}
                    margin="dense"
                    required
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LocationIcon fontSize="small" /></InputAdornment>,
                    }}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="Izoh"
                    name="notes"
                    value={deliveryInfo.notes}
                    onChange={handleInputChange}
                    margin="dense"
                    size="small"
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><NotesIcon fontSize="small" /></InputAdornment>,
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                    <Button
                      variant="outlined"
                      onClick={handlePrevStep}
                      size="small"
                      sx={{ minHeight: 40, borderRadius: 2, fontSize: '0.75rem' }}
                    >
                      Ortga
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNextStep}
                      disabled={!deliveryInfo.latitude || !deliveryInfo.longitude}
                      size="small"
                      sx={{ minHeight: 40, borderRadius: 2, fontSize: '0.75rem' }}
                    >
                      Davom etish
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {activeStep === 2 && (
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Tasdiqlash</Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Paper sx={{ p: 1, border: '1px solid', borderColor: 'primary.main', borderRadius: 2, mb: 1.5 }}>
                    <Box display="flex" alignItems="center">
                      <CashIcon color="primary" sx={{ fontSize: 20, mr: 1 }} />
                      <Box>
                        <Typography variant="caption">Naqd</Typography>
                        <Typography variant="caption" color="text.secondary">Olganda to'laysiz</Typography>
                      </Box>
                      <CheckCircleIcon color="primary" sx={{ ml: 'auto', fontSize: 18 }} />
                    </Box>
                  </Paper>
                  <Typography variant="caption" fontWeight="bold">Yetkazish</Typography>
                  <List dense sx={{ mb: 1.5 }}>
                    <ListItem sx={{ py: 0.25 }}>
                      <PhoneIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="caption">{deliveryInfo.phone}</Typography>
                    </ListItem>
                    <ListItem sx={{ py: 0.25 }}>
                      <LocationIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="caption">{deliveryInfo.address}</Typography>
                    </ListItem>
                    {deliveryInfo.notes && (
                      <ListItem sx={{ py: 0.25 }}>
                        <NotesIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption">{deliveryInfo.notes}</Typography>
                      </ListItem>
                    )}
                  </List>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                    <Button
                      variant="outlined"
                      onClick={handlePrevStep}
                      size="small"
                      sx={{ minHeight: 40, borderRadius: 2, fontSize: '0.75rem' }}
                    >
                      Ortga
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSubmitOrder}
                      disabled={submitting}
                      size="small"
                      startIcon={submitting && <CircularProgress size={14} />}
                      sx={{ minHeight: 40, borderRadius: 2, fontSize: '0.75rem' }}
                    >
                      {submitting ? "Jo'natilyapti" : "Tasdiqlash"}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* Mobile Summary Bottom Sheet */}
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            boxShadow: '0 -2px 6px rgba(0,0,0,0.08)',
            zIndex: 1000,
            display: isMobile ? 'block' : 'none',
          }}
        >
          <Box sx={{ p: 0.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" fontWeight="bold">
              Jami: {totalWithCourier ? totalWithCourier.toLocaleString() : '0'} so'm
            </Typography>
            <IconButton onClick={() => setSummaryExpanded(!summaryExpanded)} size="small">
              {summaryExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          <Collapse in={summaryExpanded}>
            <Box sx={{ p: 1, bgcolor: 'background.paper' }}>
              <List dense>
                {cartItems.map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.25 }}>
                    <Badge badgeContent={item.quantity} color="primary" sx={{ mr: 1 }}>
                      <Avatar
                        src={item.photo ? `https://hosilbek.pythonanywhere.com${item.photo}` : undefined}
                        variant="rounded"
                        sx={{ width: 24, height: 24 }}
                      >
                        {!item.photo && <FastfoodIcon fontSize="small" />}
                      </Avatar>
                    </Badge>
                    <ListItemText
                      primary={item.title}
                      secondary={`${(item.price || 0).toLocaleString()} so'm`}
                      primaryTypographyProps={{ variant: 'caption', noWrap: true }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Typography variant="caption" fontWeight="bold">
                      {(item.quantity * (item.price || 0)).toLocaleString()} so'm
                    </Typography>
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                <Chip
                  icon={<PaymentIcon />}
                  label="Naqd"
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                {deliveryInfo.latitude && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Joylashuv"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                )}
                {distance && (
                  <Chip
                    icon={<LocationIcon />}
                    label={`${distance} km`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
                {courierFee && (
                  <Chip
                    icon={<CashIcon />}
                    label={`${courierFee.toLocaleString()} so'm (kuriyer)`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
              </Box>
            </Box>
          </Collapse>
        </Paper>

        {/* Desktop Summary */}
        <Box sx={{ display: isMobile ? 'none' : 'block', mt: 1.5 }}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Xulosa</Typography>
              <Divider sx={{ mb: 1.5 }} />
              <List dense>
                {cartItems.map((item, index) => (
                  <ListItem key={index} divider sx={{ py: 0.5 }}>
                    <Badge badgeContent={item.quantity} color="primary" sx={{ mr: 1 }}>
                      <Avatar
                        src={item.photo ? `https://hosilbek.pythonanywhere.com${item.photo}` : undefined}
                        variant="rounded"
                        sx={{ width: 28, height: 28 }}
                      >
                        {!item.photo && <FastfoodIcon fontSize="small" />}
                      </Avatar>
                    </Badge>
                    <ListItemText
                      primary={item.title}
                      secondary={`${(item.price || 0).toLocaleString()} so'm`}
                      primaryTypographyProps={{ variant: 'caption' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Typography variant="caption" fontWeight="bold">
                      {(item.quantity * (item.price || 0)).toLocaleString()} so'm
                    </Typography>
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 1.5, p: 1, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={0.25}>
                  <Typography variant="caption">Mahsulotlar:</Typography>
                  <Typography variant="caption">{cartItems.reduce((sum, i) => sum + (Number(i?.quantity) || 0), 0)} ta</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.25}>
                  <Typography variant="caption">Yetkazib berish:</Typography>
                  <Typography variant="caption">{courierFee ? `${courierFee.toLocaleString()} so'm` : "0 so'm"}</Typography>
                </Box>
                {distance && (
                  <Box display="flex" justifyContent="space-between" mb={0.25}>
                    <Typography variant="caption">Masofa:</Typography>
                    <Typography variant="caption">{distance} km</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 0.5 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" fontWeight="bold">Jami:</Typography>
                  <Typography variant="caption" fontWeight="bold" color="primary">
                    {totalWithCourier ? totalWithCourier.toLocaleString() : '0'} so'm
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                <Chip icon={<PaymentIcon />} label="Naqd" variant="outlined" color="primary" size="small" />
                {deliveryInfo.latitude && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Joylashuv"
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Dialogs */}
        <Dialog open={showLocationDialog} onClose={handleLocationDialogClose}>
          <DialogTitle sx={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
            <ErrorIcon color="error" sx={{ mr: 0.5, fontSize: 18 }} /> Joylashuv
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '0.6875rem' }}>
              Buyurtma uchun joylashuv kerak. Brauzer sozlamalarida ruxsat bering.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleLocationDialogClose} size="small" sx={{ fontSize: '0.6875rem' }}>
              Yopish
            </Button>
            <Button
              onClick={handleBrowserSettingsRedirect}
              variant="contained"
              size="small"
              sx={{ fontSize: '0.6875rem' }}
            >
              Sozlamalar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showBackDialog} onClose={handleBackCancel}>
          <DialogTitle sx={{ fontSize: '0.875rem' }}>Ortga qaytish</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '0.6875rem' }}>
              Buyurtmani tark etmoqchimisiz? Ma'lumotlar saqlanmaydi.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleBackCancel} size="small" sx={{ fontSize: '0.6875rem' }}>
              Qolish
            </Button>
            <Button
              onClick={handleBackConfirm}
              variant="contained"
              size="small"
              color="error"
              sx={{ fontSize: '0.6875rem' }}
            >
              Tark etish
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
};

export default Checkout;
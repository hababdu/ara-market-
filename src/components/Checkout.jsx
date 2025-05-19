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
          
          // Get address from coordinates (reverse geocoding)
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          
          const address = response.data.display_name || "Manzil aniqlanmadi";
          
          setDeliveryInfo(prev => ({
            ...prev,
            address: address,
            coordinates: {
              latitude: latitude,
              longitude: longitude,
            },
            
          }));
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setDeliveryInfo(prev => ({
            ...prev,
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
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
      if (!deliveryInfo.coordinates) {
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
    if (!deliveryInfo.coordinates) {
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
        location_data: {
          coordinates: deliveryInfo.coordinates,
          detected_at: new Date().toISOString(),
        },
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
    // This is a best effort approach as there's no standard way to open browser settings
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
        <CircularProgress size={60} />
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon fontSize="medium" />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">Buyurtma berish</Typography>
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {locationError && <Alert severity="warning" sx={{ mb: 3 }}>{locationError}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={12} md={7}>
          {activeStep === 0 && (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Savat tarkibi</Typography>
                <Divider sx={{ mb: 3 }} />
                <List>
                  {cartItems.map((item, index) => (
                    <ListItem key={index} divider>
                      <Avatar
                        src={item.photo ? `https://hosilbek.pythonanywhere.com${item.photo}` : undefined}
                        variant="rounded"
                        sx={{ width: 56, height: 56, mr: 2 }}
                      >
                        {!item.photo && <FastfoodIcon />}
                      </Avatar>
                      <ListItemText
                        primary={item.title}
                        secondary={`${item.quantity} x ${item.price.toLocaleString()} so'm`}
                      />
                      <Typography fontWeight="bold">
                        {(item.quantity * item.price).toLocaleString()} so'm
                      </Typography>
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button variant="contained" onClick={handleNextStep}>Davom etish</Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {activeStep === 1 && (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Yetkazib berish ma'lumotlari</Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'primary.main' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <GpsFixedIcon color="primary" sx={{ mr: 1 }} />
                    <span style={{ fontWeight: 'bold' }}>Joylashuvingizni aniqlang</span>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Buyurtma berish uchun joylashuvingizni aniqlash majburiy
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={locationLoading ? <CircularProgress size={20} /> : <LocationSearchingIcon />}
                    onClick={detectLocation}
                    disabled={locationLoading}
                    fullWidth
                  >
                    {deliveryInfo.coordinates ? "Joylashuv yangilash" : "Joylashuvni aniqlash"}
                  </Button>
                  {deliveryInfo.coordinates && (
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Joylashuv aniqlangan"
                        color="success"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Aniqlik: ±{deliveryInfo.locationData?.accuracy?.toFixed(2) || 'Noma\'lum'} metr
                      </Typography>
                    </Box>
                  )}
                </Box>

                <TextField
                  fullWidth label="Telefon raqam" name="phone" value={deliveryInfo.phone}
                  onChange={handleInputChange} margin="normal" required
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment> }}
                />
                <TextField
                  fullWidth label="Yetkazib berish manzili" name="address" value={deliveryInfo.address}
                  onChange={handleInputChange} margin="normal" required multiline rows={3}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LocationIcon /></InputAdornment> }}
                />
                <TextField
                  fullWidth label="Qo'shimcha izohlar (ixtiyoriy)" name="notes" value={deliveryInfo.notes}
                  onChange={handleInputChange} margin="normal" multiline rows={2}
                  InputProps={{ startAdornment: <InputAdornment position="start"><NotesIcon /></InputAdornment> }}
                />
                
                {deliveryInfo.coordinates && (
                  <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Joylashuv tafsilotlari:</Typography>
                    <Typography variant="body2">
                      Kenglik: {deliveryInfo.coordinates.latitude.toFixed(6)}
                    </Typography>
                    <Typography variant="body2">
                      Uzunlik: {deliveryInfo.coordinates.longitude.toFixed(6)}
                    </Typography>
                    <Typography variant="body2">
                      Aniqlik: ±{deliveryInfo.locationData?.accuracy?.toFixed(2) || 'Noma\'lum'} metr
                    </Typography>
                  </Paper>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button variant="outlined" onClick={handlePrevStep}>Ortga</Button>
                  <Button 
                    variant="contained" 
                    onClick={handleNextStep}
                    disabled={!deliveryInfo.coordinates}
                  >
                    Davom etish
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {activeStep === 2 && (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>To'lov usuli</Typography>
                <Divider sx={{ mb: 3 }} />
                <Paper sx={{ p: 3, border: '1px solid', borderColor: 'primary.main', borderRadius: 2, mb: 3 }}>
                  <Box display="flex" alignItems="center">
                    <CashIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="h6">Naqd pul bilan to'lash</Typography>
                      <Typography variant="body2" color="text.secondary">Mahsulotni olganingizdan so'ng to'lov qilasiz</Typography>
                    </Box>
                    <CheckCircleIcon color="primary" sx={{ ml: 'auto' }} />
                  </Box>
                </Paper>

                <Typography variant="subtitle1" fontWeight="bold">Yetkazib berish ma'lumotlari</Typography>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography><PhoneIcon fontSize="small" /> {deliveryInfo.phone}</Typography>
                  <Typography><LocationIcon fontSize="small" /> {deliveryInfo.address}</Typography>
                  {deliveryInfo.coordinates && (
                    <Typography variant="body2" color="text.secondary">
                      <GpsFixedIcon fontSize="small" /> Kenglik: {deliveryInfo.coordinates.latitude.toFixed(6)}, 
                      Uzunlik: {deliveryInfo.coordinates.longitude.toFixed(6)}
                    </Typography>
                  )}
                  {deliveryInfo.notes && (
                    <Typography><NotesIcon fontSize="small" /> {deliveryInfo.notes}</Typography>
                  )}
                </Paper>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="outlined" onClick={handlePrevStep}>Ortga</Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    startIcon={submitting && <CircularProgress size={24} />}
                  >
                    {submitting ? "Jo'natilyapti..." : "Buyurtmani tasdiqlash"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column - Summary */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold">Buyurtma xulosasi</Typography>
              <Divider sx={{ mb: 3 }} />
              <List>
                {cartItems.map((item, index) => (
                  <ListItem key={index} divider>
                    <Badge badgeContent={item.quantity} color="primary" sx={{ mr: 2 }}>
                      <Avatar
                        src={item.photo ? `https://hosilbek.pythonanywhere.com${item.photo}` : undefined}
                        variant="rounded"
                        sx={{ width: 40, height: 40 }}
                      >
                        {!item.photo && <FastfoodIcon />}
                      </Avatar>
                    </Badge>
                    <ListItemText primary={item.title} secondary={`${item.price.toLocaleString()} so'm`} />
                    <Typography fontWeight="bold">
                      {(item.price * item.quantity).toLocaleString()} so'm
                    </Typography>
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Mahsulotlar:</Typography>
                  <Typography>{cartItems.reduce((sum, i) => sum + i.quantity, 0)} ta</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Yetkazib berish:</Typography>
                  <Typography>0 so'm</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography fontWeight="bold">Jami:</Typography>
                  <Typography fontWeight="bold" color="primary">
                    {calculateTotal().toLocaleString()} so'm
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Chip icon={<PaymentIcon />} label="Naqd to'lov" variant="outlined" color="primary" />
              </Box>
              {deliveryInfo.coordinates && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1 }} />
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
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <ErrorIcon color="error" sx={{ mr: 1 }} />
          Joylashuv ruxsati kerak
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Buyurtma berish uchun joylashuvingizni aniqlash majburiy. Iltimos, brauzer sozlamalariga o'tib, joylashuv xizmatlariga ruxsat bering.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLocationDialogClose}>Yopish</Button>
          <Button 
            onClick={handleBrowserSettingsRedirect}
            variant="contained"
            color="primary"
            autoFocus
          >
            Sozlamalarga o'tish
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Checkout;
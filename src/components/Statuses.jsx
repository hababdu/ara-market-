import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  LocalShipping,
  Restaurant,
  Payment,
  LocationOn,
  Phone,
  AccessTime,
  ExpandMore,
  ExpandLess,
  Search,
  Cancel,
} from '@mui/icons-material';

const ACTIVE_ORDERS_API = 'https://hosilbek.pythonanywhere.com/api/user/active-orders/';
const BASE_URL = 'https://hosilbek.pythonanywhere.com';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' }, // buyurtma_tushdi
    secondary: { main: '#7b1fa2' }, // kuryer_oldi
    warning: { main: '#f57c00' }, // kuryer_yolda
    success: { main: '#388e3c' }, // buyurtma_topshirildi
    info: { main: '#0288d1' }, // oshxona_vaqt_belgiladi
    error: { main: '#d32f2f' }, // qaytarildi
    background: { default: '#f5f7fa' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 6px 24px rgba(0,0,0,0.12)' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: '12px', textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: { fontWeight: 500 },
      },
    },
  },
});

const ActiveOrdersDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastFetch, setLastFetch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish kerak');
      localStorage.setItem('authError', 'Tizimga kirish kerak. Iltimos, login qiling.');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(ACTIVE_ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(response.data) ? response.data : []);
      console.log('Fetched orders:', response.data);
      setLastFetch(new Date().toISOString());
    } catch (err) {
      let errorMessage = 'Buyurtmalarni olishda xato';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Sessiya tugagan. Qayta kiring';
          localStorage.setItem('authError', errorMessage);
          localStorage.removeItem('authToken');
          navigate('/login', { replace: true });
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || 'Xato yuz berdi';
        }
      } else if (err.request) {
        errorMessage = 'Internet aloqasi yo‘q';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const returnOrder = async (orderId) => {
    const confirm = window.confirm('Buyurtmani qaytarishni xohlaysizmi?');
    if (!confirm) return;

    setError('');
    setSuccess('');

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish kerak');
      navigate('/login', { replace: true });
      return;
    }

    try {
      await axios.patch(
        `${ACTIVE_ORDERS_API}${orderId}/`,
        { status: 'qaytarildi' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Buyurtma muvaffaqiyatli qaytarildi!');
      fetchOrders(); // Refetch to ensure UI reflects API state
    } catch (err) {
      setError(err.response?.data?.detail || 'Qaytarishda xato yuz berdi');
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusChip = (status) => {
    const statusMap = {
      buyurtma_tushdi: {
        label: 'Yangi',
        color: 'primary',
        icon: <AccessTime />,
        message: 'Sizning buyurtmangiz qabul qilindi!',
      },
      oshxona_vaqt_belgiladi: {
        label: 'Tayyorlanmoqda',
        color: 'info',
        icon: <AccessTime />,
        message: 'Buyurtmangiz oshxonada tayyorlanmoqda.',
      },
      kuryer_oldi: {
        label: 'Kuryer oldi',
        color: 'secondary',
        icon: <CheckCircle />,
        message: 'Kuryer buyurtmangizni oldi.',
      },
      kuryer_yolda: {
        label: 'Yetkazilmoqda',
        color: 'warning',
        icon: <LocalShipping />,
        message: 'Buyurtmangiz yetkazib berilmoqda!',
      },
      buyurtma_topshirildi: {
        label: 'Yetkazildi',
        color: 'success',
        icon: <CheckCircle />,
        message: 'Buyurtmangiz yetkazib berildi. Rahmat!',
      },
      qaytarildi: {
        label: 'Qaytarildi',
        color: 'error',
        icon: <Cancel />,
        message: 'Buyurtmangiz qaytarildi.',
      },
    };
    const config = statusMap[status] || {
      label: status,
      color: 'default',
      icon: null,
      message: 'Holati noma’lum',
    };
    return (
      <Chip
        label={config.label}
        color={config.color}
        icon={config.icon}
        size="small"
        variant="filled"
        sx={{ fontWeight: 'bold', borderRadius: '8px' }}
      />
    );
  };

  const getStatusMessage = (status) => {
    const statusMap = {
      buyurtma_tushdi: 'Sizning buyurtmangiz qabul qilindi!',
      oshxona_vaqt_belgiladi: 'Buyurtmangiz oshxonada tayyorlanmoqda.',
      kuryer_oldi: 'Kuryer buyurtmangizni oldi.',
      kuryer_yolda: 'Buyurtmangiz yetkazib berilmoqda!',
      buyurtma_topshirildi: 'Buyurtmangiz yetkazib berildi. Rahmat!',
      qaytarildi: 'Buyurtmangiz qaytarildi.',
    };
    return statusMap[status] || 'Holati noma’lum';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'buyurtma_tushdi':
        return theme.palette.primary.main;
      case 'oshxona_vaqt_belgiladi':
        return theme.palette.info.main;
      case 'kuryer_oldi':
        return theme.palette.secondary.main;
      case 'kuryer_yolda':
        return theme.palette.warning.main;
      case 'buyurtma_topshirildi':
        return theme.palette.success.main;
      case 'qaytarildi':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getTimelineStep = (status) => {
    const steps = [
      'buyurtma_tushdi',
      'oshxona_vaqt_belgiladi',
      'kuryer_oldi',
      'kuryer_yolda',
      'buyurtma_topshirildi',
    ];
    const index = steps.indexOf(status);
    return index >= 0 ? index : status === 'qaytarildi' ? -1 : steps.length - 1;
  };

  const formatTime = (kitchenTime) => {
    if (!kitchenTime) return 'Noma’lum';
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      return `${hours > 0 ? `${hours} soat ` : ''}${minutes > 0 ? `${minutes} minut` : ''}`.trim();
    }
    const hours = Math.floor(kitchenTime / 60);
    const mins = kitchenTime % 60;
    return `${hours > 0 ? `${hours} soat ` : ''}${mins > 0 ? `${mins} minut` : ''}`.trim();
  };

  const getEstimatedDelivery = (kitchenTime, createdAt) => {
    if (!kitchenTime || !createdAt) return 'Taxminiy yetkazib berish vaqti noma’lum';
    let deliveryMinutes;
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      deliveryMinutes = hours * 60 + minutes;
    } else {
      deliveryMinutes = parseInt(kitchenTime) || 60; // Fallback to 60 minutes
    }
    const created = new Date(createdAt);
    const estimated = new Date(created.getTime() + deliveryMinutes * 60000);
    return `Taxminiy yetkazib berish: ${estimated.toLocaleString('uz-UZ')}`;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => order.id.toString().includes(searchQuery));
  }, [orders, searchQuery]);

  if (loading && orders.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} thickness= {4} />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: isMobile ? 2 : 4, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Header */}
        <Stack direction="column" spacing={2} mb={4}>
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold" color="primary.main">
            Buyurtmalaringiz
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Buyurtmalaringiz holatini bu yerda kuzatishingiz mumkin. ID bo‘yicha qidirib, tafsilotlarni ko‘ring.
          </Typography>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ mt: 2 }}>
            <TextField
              size="small"
              placeholder="Buyurtma ID bo‘yicha qidirish"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ width: isMobile ? '100%' : 300, bgcolor: 'white', borderRadius: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchOrders}
              sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Yangilash
            </Button>
          </Stack>
        </Stack>

        {/* Alerts */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setError('')}
          >
            {error}
            <Button onClick={fetchOrders} sx={{ ml: 2, color: 'error.main' }}>
              Qayta urinish
            </Button>
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}

        {/* Orders List */}
        <Box>
          {filteredOrders.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3, bgcolor: 'white' }}>
              <Typography variant="body1" color="text.secondary" mb={2}>
                Hozirda faol buyurtmalaringiz yo‘q
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/')}
              >
                Yangi buyurtma berish
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={isMobile ? 2 : 3}>
              {filteredOrders.map((order) => (
                <Grid item xs={12} key={order.id}>
                  <Card sx={{ borderLeft: `4px solid ${getStatusColor(order.status)}`, bgcolor: 'white' }}>
                    <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="bold">
                          Buyurtma #{order.id}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {getStatusChip(order.status)}
                          <IconButton
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          >
                            {expandedOrder === order.id ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Stack>
                      </Stack>
                      <Stack spacing={1.5} mb={2}>
                        <Typography variant="body1" fontWeight="medium">
                          {getStatusMessage(order.status)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getEstimatedDelivery(order.kitchen_time, order.created_at)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Umumiy: {parseFloat(order.total_amount || 0).toLocaleString('uz-UZ')} so‘m
                        </Typography>
                        <Stepper
                          activeStep={getTimelineStep(order.status)}
                          alternativeLabel
                          sx={{ mt: 2 }}
                        >
                          {[
                            { label: 'Yangi', status: 'buyurtma_tushdi' },
                            { label: 'Tayyorlanmoqda', status: 'oshxona_vaqt_belgiladi' },
                            { label: 'Kuryer oldi', status: 'kuryer_oldi' },
                            { label: 'Yetkazilmoqda', status: 'kuryer_yolda' },
                            { label: 'Yetkazildi', status: 'buyurtma_topshirildi' },
                          ].map((step, index) => (
                            <Step key={index}>
                              <StepLabel
                                sx={{
                                  '& .MuiStepLabel-label': {
                                    color:
                                      getTimelineStep(order.status) >= index
                                        ? getStatusColor(step.status)
                                        : 'text.secondary',
                                    fontWeight: getTimelineStep(order.status) >= index ? 600 : 400,
                                  },
                                }}
                              >
                                {step.label}
                              </StepLabel>
                            </Step>
                          ))}
                        </Stepper>
                        <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => returnOrder(order.id)}
                            disabled={
                              order.status === 'qaytarildi' ||
                              order.status === 'buyurtma_topshirildi'
                            }
                            sx={{ borderRadius: 2 }}
                          >
                            Qaytarish
                          </Button>
                        </Stack>
                      </Stack>
                      <Collapse in={expandedOrder === order.id}>
                        <Box sx={{ mt: 3 }}>
                          <Divider sx={{ mb: 3 }} />
                          <Grid container spacing={isMobile ? 2 : 3}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                                Buyurtma Tafsilotlari
                              </Typography>
                              <Stack spacing={2}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Phone fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    {order.contact_number || 'Noma’lum'}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <LocationOn fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    {order.shipping_address || 'Noma’lum'}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Payment fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    To‘lov:{' '}
                                    {order.payment === 'naqd'
                                      ? 'Naqd'
                                      : order.payment === 'karta'
                                      ? 'Karta'
                                      : 'Noma’lum'}
                                  </Typography>
                                </Stack>
                                {order.notes && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2">
                                      Eslatmalar: {order.notes}
                                    </Typography>
                                  </Stack>
                                )}
                              </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                                Mahsulotlar ({order.items?.length || 0})
                              </Typography>
                              <List dense>
                                {order.items && order.items.length > 0 ? (
                                  order.items.map((item, index) => (
                                    <ListItem key={index} sx={{ py: 1 }}>
                                      <ListItemAvatar>
                                        <Avatar
                                          variant="rounded"
                                          src={
                                            item.product?.photo
                                              ? `${BASE_URL}${item.product.photo}`
                                              : undefined
                                          }
                                          sx={{ bgcolor: 'grey.200', width: 32, height: 32 }}
                                        >
                                          <Restaurant fontSize="small" />
                                        </Avatar>
                                      </ListItemAvatar>
                                      <ListItemText
                                        primary={item.product?.title || 'Noma’lum'}
                                        secondary={`${item.quantity} × ${item.price || 0} so‘m`}
                                      />
                                      <Typography variant="body2" fontWeight="bold">
                                        {(item.quantity * parseFloat(item.price || 0)).toLocaleString(
                                          'uz-UZ'
                                        )}{' '}
                                        so‘m
                                      </Typography>
                                    </ListItem>
                                  ))
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Mahsulotlar yo‘q
                                  </Typography>
                                )}
                              </List>
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Last Fetch Time */}
        {lastFetch && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 3, display: 'block', textAlign: 'center' }}
          >
            Oxirgi yangilanish: {new Date(lastFetch).toLocaleString('uz-UZ')}
          </Typography>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default ActiveOrdersDashboard;
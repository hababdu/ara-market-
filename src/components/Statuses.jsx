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
  typography: {
    subtitle1: { fontSize: '1rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600 },
    body2: { fontSize: '0.75rem' },
    caption: { fontSize: '0.6875rem' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 500, minHeight: 40 },
        sizeSmall: { fontSize: '0.75rem', padding: '6px 10px' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontSize: '0.6875rem', height: 24, fontWeight: 500 },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: { fontSize: '0.6875rem', fontWeight: 500 },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: { fontSize: '1rem' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { fontSize: '0.75rem', padding: '6px 12px' },
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
  const token = localStorage.getItem('authToken');

  const statusMap = useMemo(
    () => ({
      buyurtma_tushdi: {
        label: 'Yangi',
        color: 'primary',
        icon: <AccessTime fontSize="small" />,
        message: 'Buyurtma qabul qilindi!',
      },
      oshxona_vaqt_belgiladi: {
        label: 'Tayyorlanmoqda',
        color: 'info',
        icon: <AccessTime fontSize="small" />,
        message: 'Oshxonada tayyorlanmoqda.',
      },
      kuryer_oldi: {
        label: 'Kuryer oldi',
        color: 'secondary',
        icon: <CheckCircle fontSize="small" />,
        message: 'Kuryer buyurtmani oldi.',
      },
      kuryer_yolda: {
        label: 'Yetkazilmoqda',
        color: 'warning',
        icon: <LocalShipping fontSize="small" />,
        message: 'Buyurtma yetkazilmoqda!',
      },
      buyurtma_topshirildi: {
        label: 'Yetkazildi',
        color: 'success',
        icon: <CheckCircle fontSize="small" />,
        message: 'Buyurtma yetkazildi. Rahmat!',
      },
      qaytarildi: {
        label: 'Qaytarildi',
        color: 'error',
        icon: <Cancel fontSize="small" />,
        message: 'Buyurtma qaytarildi.',
      },
    }),
    []
  );

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    if (!token) {
      setError('Tizimga kirish kerak');
      localStorage.setItem('authError', 'Tizimga kirish kerak.');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(ACTIVE_ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(response.data) ? response.data : []);
      setLastFetch(new Date().toISOString());
    } catch (err) {
      let errorMessage = 'Buyurtmalarni olishda xato';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Sessiya tugagan';
          localStorage.setItem('authError', errorMessage);
          localStorage.removeItem('authToken');
          navigate('/login', { replace: true });
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || 'Xato yuz berdi';
        }
      } else if (err.request) {
        errorMessage = 'Internet yo‘q';
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
      setSuccess('Buyurtma qaytarildi!');
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.detail || 'Qaytarishda xato');
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const isReturnDisabled = (status) =>
    [
      'kuryer_oldi',
      'kuryer_yolda',
      'buyurtma_topshirildi',
      'qaytarildi',
    ].includes(status);

  const getStatusChip = (status) => {
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
        sx={{ fontWeight: 500, borderRadius: '6px' }}
      />
    );
  };

  const getStatusMessage = (status) =>
    statusMap[status]?.message || 'Holati noma’lum';

  const getStatusColor = (status) =>
    theme.palette[statusMap[status]?.color]?.main || theme.palette.grey[500];

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
      return `${hours > 0 ? `${hours} soat ` : ''}${minutes > 0 ? `${minutes} min` : ''}`.trim();
    }
    const hours = Math.floor(kitchenTime / 60);
    const mins = kitchenTime % 60;
    return `${hours > 0 ? `${hours} soat ` : ''}${mins > 0 ? `${mins} min` : ''}`.trim();
  };

  const getEstimatedDelivery = (kitchenTime, createdAt) => {
    if (!kitchenTime || !createdAt) return 'Yetkazish vaqti noma’lum';
    let deliveryMinutes;
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      deliveryMinutes = hours * 60 + minutes;
    } else {
      deliveryMinutes = parseInt(kitchenTime) || 60;
    }
    const created = new Date(createdAt);
    const estimated = new Date(created.getTime() + deliveryMinutes * 60000);
    return `Taxminiy: ${estimated.toLocaleString('uz-UZ')}`;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => order.id.toString().includes(searchQuery));
  }, [orders, searchQuery]);

  if (loading && orders.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: isMobile ? 1.5 : 3, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Header */}
        <Stack direction="column" spacing={1.5} mb={3}>
          <Typography variant={isMobile ? 'subtitle1' : 'h5'} fontWeight="bold" color="primary.main">
            Buyurtmalar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Buyurtma holatini kuzating yoki ID bo‘yicha qidiring.
          </Typography>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={1.5} sx={{ mt: 1.5 }}>
            <TextField
              size="small"
              placeholder="Buyurtma ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: isMobile ? '100%' : 250, bgcolor: 'white', borderRadius: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<Refresh fontSize="small" />}
              onClick={fetchOrders}
              size="small"
              sx={{ minHeight: 40, borderRadius: 2 }}
            >
              Yangilash
            </Button>
          </Stack>
        </Stack>

        {/* Alerts */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setError('')}
            action={
              error === 'Internet yo‘q' ? (
                <Button color="error" size="small" onClick={fetchOrders}>
                  Qayta
                </Button>
              ) : null
            }
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2, borderRadius: 2 }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}

        {/* Orders List */}
        <Box>
          {filteredOrders.length === 0 ? (
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: 'white' }}>
              <Typography variant="body2" color="text.secondary" mb={1.5}>
                Faol buyurtma yo‘q
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate('/')}
                sx={{ minHeight: 40, borderRadius: 2 }}
              >
                Buyurtma berish
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={isMobile ? 1.5 : 2}>
              {filteredOrders.map((order) => (
                <Grid item xs={12} key={order.id}>
                  <Card sx={{ borderLeft: `3px solid ${getStatusColor(order.status)}`, bgcolor: 'white' }}>
                    <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          Buyurtma #{order.id}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {getStatusChip(order.status)}
                          <IconButton
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            size="small"
                          >
                            {expandedOrder === order.id ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                          </IconButton>
                        </Stack>
                      </Stack>
                      <Stack spacing={1} mb={1.5}>
                        <Typography variant="body2" fontWeight="medium">
                          {getStatusMessage(order.status)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getEstimatedDelivery(order.kitchen_time, order.created_at)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Jami: {parseFloat(order.total_amount || 0).toLocaleString('uz-UZ')} so‘m
                        </Typography>
                        <Stepper
                          activeStep={getTimelineStep(order.status)}
                          alternativeLabel
                          sx={{ mt: 1.5 }}
                        >
                          {[
                            { label: 'Yangi', status: 'buyurtma_tushdi' },
                            { label: 'Tayyor', status: 'oshxona_vaqt_belgiladi' },
                            { label: 'Kuryer', status: 'kuryer_oldi' },
                            { label: 'Yo‘lda', status: 'kuryer_yolda' },
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
                                    fontWeight: getTimelineStep(order.status) >= index ? 500 : 400,
                                  },
                                }}
                              >
                                {step.label}
                              </StepLabel>
                            </Step>
                          ))}
                        </Stepper>
                        <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel fontSize="small" />}
                            onClick={() => returnOrder(order.id)}
                            disabled={isReturnDisabled(order.status)}
                            size="small"
                            sx={{ minHeight: 40, borderRadius: 2 }}
                          >
                            Qaytarish
                          </Button>
                        </Stack>
                      </Stack>
                      <Collapse in={expandedOrder === order.id}>
                        <Box sx={{ mt: 2 }}>
                          <Divider sx={{ mb: 2 }} />
                          <Grid container spacing={isMobile ? 1.5 : 2}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" fontWeight="bold" mb={1.5}>
                                Tafsilotlar
                              </Typography>
                              <Stack spacing={1}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Phone fontSize="small" color="action" />
                                  <Typography variant="caption">
                                    {order.contact_number || 'Noma’lum'}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <LocationOn fontSize="small" color="action" />
                                  <Typography variant="caption">
                                    {order.shipping_address || 'Noma’lum'}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Payment fontSize="small" color="action" />
                                  <Typography variant="caption">
                                    To‘lov:{' '}
                                    {order.payment === 'naqd'
                                      ? 'Naqd'
                                      : order.payment === 'karta'
                                      ? 'Karta'
                                      : 'Noma’lum'}
                                  </Typography>
                                </Stack>
                                {order.notes && (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography variant="caption">
                                      Izoh: {order.notes}
                                    </Typography>
                                  </Stack>
                                )}
                              </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" fontWeight="bold" mb={1.5}>
                                Mahsulotlar ({order.items?.length || 0})
                              </Typography>
                              <List dense>
                                {order.items && order.items.length > 0 ? (
                                  order.items.map((item, index) => (
                                    <ListItem key={index} sx={{ py: 0.5 }}>
                                      <ListItemAvatar>
                                        <Avatar
                                          variant="rounded"
                                          src={
                                            item.product?.photo
                                              ? `${BASE_URL}${item.product.photo}`
                                              : undefined
                                          }
                                          sx={{ bgcolor: 'grey.200', width: 28, height: 28 }}
                                        >
                                          <Restaurant fontSize="small" />
                                        </Avatar>
                                      </ListItemAvatar>
                                      <ListItemText
                                        primary={item.product?.title || 'Noma’lum'}
                                        secondary={`${item.quantity} × ${item.price || 0} so‘m`}
                                        primaryTypographyProps={{ variant: 'caption' }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                      />
                                      <Typography variant="caption" fontWeight="bold">
                                        {(item.quantity * parseFloat(item.price || 0)).toLocaleString(
                                          'uz-UZ'
                                        )}{' '}
                                        so‘m
                                      </Typography>
                                    </ListItem>
                                  ))
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    Mahsulot yo‘q
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
            sx={{ mt: 2, display: 'block', textAlign: 'center' }}
          >
            Yangilandi: {new Date(lastFetch).toLocaleString('uz-UZ')}
          </Typography>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default ActiveOrdersDashboard;
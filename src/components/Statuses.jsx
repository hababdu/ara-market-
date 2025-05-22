import React, { useEffect, useState } from 'react';
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
  Paper,
  IconButton,
  Collapse,
  useMediaQuery,
  ThemeProvider,
  createTheme
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
  Search
} from '@mui/icons-material';

const ACTIVE_ORDERS_API = 'https://hosilbek.pythonanywhere.com/api/user/active-orders/';
const BASE_URL = 'https://hosilbek.pythonanywhere.com';

// Modern theme
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' }, // buyurtma_tushdi
    secondary: { main: '#7b1fa2' }, // kuryer_oldi
    warning: { main: '#f57c00' }, // kuryer_yolda
    success: { main: '#388e3c' }, // buyurtma_topshirildi
    info: { main: '#0288d1' }, // oshxona_vaqt_belgiladi
    background: { default: '#f5f7fa' }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 6px 24px rgba(0,0,0,0.15)' }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: '12px', textTransform: 'none', fontWeight: 600 }
      }
    }
  }
});

const ActiveOrdersDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetch, setLastFetch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish talab qilinadi');
      localStorage.setItem('authError', 'Tizimga kirish talab qilinadi. Iltimos, login qiling.');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(ACTIVE_ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const ordersData = Array.isArray(response.data) ? response.data : [];
      setOrders(ordersData);
      setLastFetch(new Date().toISOString());
    } catch (err) {
      let errorMessage = 'Buyurtmalarni olishda xato yuz berdi';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Sessiya tugagan. Iltimos, qayta kiring';
          localStorage.setItem('authError', errorMessage);
          localStorage.removeItem('authToken');
          navigate('/login', { replace: true });
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || JSON.stringify(err.response.data) || errorMessage;
        }
      } else if (err.request) {
        errorMessage = 'Internet aloqasi yo‘q';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusChip = (status) => {
    const statusMap = {
      'buyurtma_tushdi': { label: 'Yangi', color: 'primary', icon: <AccessTime /> },
      'oshxona_vaqt_belgiladi': { label: 'Oshxona vaqt belgilaydi', color: 'info', icon: <AccessTime /> },
      'kuryer_oldi': { label: 'Qabul qilindi', color: 'secondary', icon: <CheckCircle /> },
      'kuryer_yolda': { label: 'Yetkazilmoqda', color: 'warning', icon: <LocalShipping /> },
      'buyurtma_topshirildi': { label: 'Yetkazib berildi', color: 'success', icon: <CheckCircle /> }
    };
    const config = statusMap[status] || { label: status, color: 'default', icon: null };
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
      default:
        return theme.palette.grey[500];
    }
  };

  const formatTime = (kitchenTime) => {
    if (!kitchenTime) return 'Belgilanmagan';
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      return `${hours > 0 ? `${hours} soat` : ''} ${minutes > 0 ? `${minutes} minut` : ''}`.trim();
    }
    const hours = Math.floor(kitchenTime / 60);
    const mins = kitchenTime % 60;
    return `${hours > 0 ? `${hours} soat` : ''} ${mins > 0 ? `${mins} minut` : ''}`.trim();
  };

  const filteredOrders = orders.filter(order =>
    order.id.toString().includes(searchQuery) ||
    (order.user && order.user.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const statusGroups = {
    new: filteredOrders.filter(o => ['buyurtma_tushdi', 'oshxona_vaqt_belgiladi'].includes(o.status)),
    accepted: filteredOrders.filter(o => o.status === 'kuryer_oldi'),
    inDelivery: filteredOrders.filter(o => o.status === 'kuryer_yolda'),
    completed: filteredOrders.filter(o => o.status === 'buyurtma_topshirildi')
  };

  if (loading && orders.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>
        {error}
        <Button onClick={fetchOrders} sx={{ ml: 2, color: 'error.main' }}>Qayta urinish</Button>
      </Alert>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: isMobile ? 2 : 4, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Header */}
        <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold" color="primary.main">
            Faol Buyurtmalar
          </Typography>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ mt: isMobile ? 2 : 0 }}>
            <TextField
              size="small"
              placeholder="ID yoki mijoz bo'yicha qidirish"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
              sx={{ width: isMobile ? '100%' : 300 }}
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

        {/* Summary Cards */}
        <Grid container spacing={isMobile ? 2 : 3} mb={4}>
          {[
            { title: 'Jami Buyurtmalar', value: filteredOrders.length, color: 'text.primary' },
            { title: 'Yangi', value: statusGroups.new.length, color: 'primary.main' },
            { title: 'Qabul qilingan', value: statusGroups.accepted.length, color: 'secondary.main' },
            { title: 'Yetkazilmoqda', value: statusGroups.inDelivery.length, color: 'warning.main' },
            { title: 'Bajarilgan', value: statusGroups.completed.length, color: 'success.main' }
          ].map((item, index) => (
            <Grid item xs={12} sm={6} md={2.4} key={index}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 3,
                  borderLeft: `4px solid ${item.color}`,
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.02)' }
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">{item.title}</Typography>
                <Typography variant="h5" color={item.color} fontWeight="bold">{item.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Orders List */}
        <Box>
          {filteredOrders.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="body1" color="text.secondary">
                Faol buyurtmalar mavjud emas
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={isMobile ? 2 : 3}>
              {filteredOrders.map(order => (
                <Grid item xs={12} key={order.id}>
                  <Card
                    sx={{
                      borderLeft: `4px solid ${getStatusColor(order.status)}`
                    }}
                  >
                    <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="bold">#{order.id}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {getStatusChip(order.status)}
                          <IconButton onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                            {expandedOrder === order.id ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Stack>
                      </Stack>
                      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          Restoran: {order.kitchen?.name || 'Mavjud emas'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mijoz: {order.user || 'Noma’lum'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Oshxona vaqti: {formatTime(order.kitchen_time)}
                        </Typography>
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
                                  <Typography variant="body2">{order.contact_number || 'Noma’lum'}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <LocationOn fontSize="small" color="action" />
                                  <Typography variant="body2">{order.shipping_address || 'Noma’lum'}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Payment fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    To‘lov: {order.payment === 'naqd' ? 'Naqd' : order.payment === 'karta' ? 'Karta' : 'Noma’lum'}
                                  </Typography>
                                </Stack>
                                {order.notes && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Assignment fontSize="small" color="action" />
                                    <Typography variant="body2">Eslatmalar: {order.notes}</Typography>
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
                                          src={item.product?.photo ? `${BASE_URL}${item.product.photo}` : undefined}
                                          sx={{ bgcolor: 'grey.200', width: 40, height: 40 }}
                                        >
                                          <Restaurant fontSize="small" />
                                        </Avatar>
                                      </ListItemAvatar>
                                      <ListItemText
                                        primary={item.product?.title || 'Noma’lum Mahsulot'}
                                        secondary={`${item.quantity} × ${item.price} so‘m`}
                                      />
                                      <Typography variant="body2" fontWeight="bold">
                                        {(item.quantity * parseFloat(item.price || 0)).toLocaleString('uz-UZ')} so‘m
                                      </Typography>
                                    </ListItem>
                                  ))
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Mahsulotlar mavjud emas
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
          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block', textAlign: 'center' }}>
            Oxirgi yangilanish: {new Date(lastFetch).toLocaleString('uz-UZ')}
          </Typography>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default ActiveOrdersDashboard;
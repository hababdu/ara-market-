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
} from '@mui/material';
import {
  CheckCircle,
  LocalShipping,
  Restaurant,
  Payment,
  LocationOn,
  Phone,
  AccessTime,
  Cancel,
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const ACTIVE_ORDERS_API = 'https://hosilbek.pythonanywhere.com/api/user/active-orders/';
const BASE_URL = 'https://hosilbek.pythonanywhere.com';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#7b1fa2' },
    warning: { main: '#f57c00' },
    error: { main: '#d32f2f' },
    info: { main: '#0288d1' },
    background: { default: '#f5f7fa' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: '8px', textTransform: 'none' },
      },
    },
  },
});

const ActiveOrdersDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish kerak');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(ACTIVE_ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      let errorMessage = 'Buyurtmalarni olishda xato';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Sessiya tugagan. Qayta kiring';
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

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish kerak');
      navigate('/login', { replace: true });
      return;
    }

    try {
      const response = await axios.put(
        `${ACTIVE_ORDERS_API}${orderId}/`,
        { status: 'qaytarildi' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(orders.filter((order) => order.id !== orderId)); // Qaytarilgan buyurtmani ro‘yxatdan olib tashlash
      console.log('Buyurtma qaytarildi:', response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Qaytarishda xato yuz berdi');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusChip = (status) => {
    const statusMap = {
      oshxona_vaqt_belgiladi: { label: 'Tayyorlanmoqda', color: 'info', icon: <AccessTime /> },
      kuryer_oldi: { label: 'Kuryer oldi', color: 'secondary', icon: <CheckCircle /> },
      kuryer_yolda: { label: 'Yetkazilmoqda', color: 'warning', icon: <LocalShipping /> },
      qaytarildi: { label: 'Qaytarildi', color: 'error', icon: <Cancel /> },
    };
    const config = statusMap[status] || { label: status, color: 'default', icon: null };
    return <Chip label={config.label} color={config.color} icon={config.icon} size="small" />;
  };  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button onClick={fetchOrders} sx={{ ml: 2 }}>Qayta urinish</Button>
      </Alert>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 2, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Typography variant="h5" fontWeight="bold" color="primary.main" mb={3}>
          Faol Buyurtmalar
        </Typography>

        {orders.length === 0 ? (
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Faol buyurtmalar yo‘q
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {orders.map((order) => (
              <Grid item xs={12} key={order.id}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">#{order.id}</Typography>
                      {getStatusChip(order.status)}
                    </Stack>
                    <Stack spacing={1} mb={2}>
                      <Typography variant="body2">
                        Restoran: {order.kitchen?.name || 'Mavjud emas'}
                      </Typography>
                      <Typography variant="body2">Mijoz: {order.user || 'Noma’lum'}</Typography>
                      <Typography variant="body2">
                        Umumiy: {parseFloat(order.total_amount).toLocaleString('uz-UZ')} so‘m
                      </Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Phone fontSize="small" />
                        <Typography variant="body2">{order.contact_number || 'Noma’lum'}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocationOn fontSize="small" />
                        <Typography variant="body2">{order.shipping_address || 'Noma’lum'}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Payment fontSize="small" />
                        <Typography variant="body2">
                          To‘lov: {order.payment === 'naqd' ? 'Naqd' : order.payment === 'karta' ? 'Karta' : 'Noma’lum'}
                        </Typography>
                      </Stack>
                    </Stack>
                    <Typography variant="subtitle2" fontWeight="bold" mt={2} mb={1}>
                      Mahsulotlar ({order.items?.length || 0})
                    </Typography>
                    <List dense>
                      {order.items?.length > 0 ? (
                        order.items.map((item, index) => (
                          <ListItem key={index}>
                            <ListItemAvatar>
                              <Avatar
                                variant="rounded"
                                src={item.product?.photo ? `${BASE_URL}${item.product.photo}` : undefined}
                                sx={{ bgcolor: 'grey.200', width: 32, height: 32 }}
                              >
                                <Restaurant fontSize="small" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={item.product?.title || 'Noma’lum'}
                              secondary={`${item.quantity} × ${item.price} so‘m`}
                            />
                            <Typography variant="body2">
                              {(item.quantity * parseFloat(item.price || 0)).toLocaleString('uz-UZ')} so‘m
                            </Typography>                          </ListItem>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Mahsulotlar yo‘q
                        </Typography>
                      )}
                    </List>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => returnOrder(order.id)}
                      disabled={order.status === 'qaytarildi'}
                      sx={{ mt: 2 }}
                    >
                      Qaytarish
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default ActiveOrdersDashboard;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  Stack,
  Chip,
  Button,
} from '@mui/material';
import { LocalShipping, Restaurant, Person, AttachMoney, Phone, Home, AccessTime } from '@mui/icons-material';

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const token = localStorage.getItem('token');
  const BASE_API_URL = 'https://hosilbek.pythonanywhere.com/api/';
  const ORDERS_API = `${BASE_API_URL}order-history/`; // Update this if endpoint changes, e.g., 'orders/'
  const PRODUCTS_API = `${BASE_API_URL}product/`;

  const fetchOrders = async () => {
    if (!token) {
      setError('Tizimga kirish uchun token topilmadi. Iltimos, qayta kiring.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('Fetching orders with token:', token); // Debug: Log token

      const orderRes = await axios.get(ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Order response:', orderRes.data); // Debug: Log response

      // Handle API response structure
      const ordersData = Array.isArray(orderRes.data)
        ? orderRes.data
        : Array.isArray(orderRes.data?.data)
        ? orderRes.data.data
        : [];

      if (!ordersData.length) {
        setOrders([]);
        setLoading(false);
        return;
      }

      setOrders(ordersData);

      // Extract unique product IDs
      const productIds = [...new Set(
        ordersData.flatMap(order => (order.order_items || []).map(item => item.product).filter(Boolean))
      )];

      if (productIds.length) {
        const productRes = await Promise.all(
          productIds.map(id =>
            axios
              .get(`${PRODUCTS_API}${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .catch(err => {
                console.warn(`Failed to fetch product ${id}:`, err.message);
                return null;
              })
          )
        );

        const productMap = {};
        productRes.forEach(res => {
          if (res?.data) productMap[res.data.id] = res.data;
        });
        setProductsMap(productMap);
      }
    } catch (err) {
      console.error('Order fetch error:', err);
      let errorMessage = 'Buyurtmalarni yuklashda xatolik yuz berdi';
      if (err.response?.status === 404) {
        errorMessage = 'Buyurtmalar tarixi topilmadi. API manzili to‘g‘riligini tekshiring.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Autentifikatsiya xatosi: Token yaroqsiz yoki muddati o‘tgan.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Auto-retry up to 3 times
      if (retryCount < 3) {
        console.log(`Retrying... Attempt ${retryCount + 1}/3`);
        setTimeout(() => setRetryCount(c => c + 1), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [retryCount]);

  const getStatusChip = (status) => {
    if (!status) return <Chip label="Noma'lum" color="default" size="small" />;

    const lowerStatus = status.toLowerCase();
    let color = 'default';

    if (lowerStatus.includes('tayyor') || lowerStatus.includes('completed')) color = 'success';
    else if (lowerStatus.includes('kutish') || lowerStatus.includes('pending')) color = 'warning';
    else if (lowerStatus.includes('bekor') || lowerStatus.includes('cancel')) color = 'error';
    else if (lowerStatus.includes('yetkazish') || lowerStatus.includes('deliver')) color = 'primary';

    return <Chip label={status} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
        {retryCount > 0 && (
          <Typography variant="body2" color="text.secondary" ml={2}>
            Qayta urinish {retryCount}/3...
          </Typography>
        )}
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setRetryCount(0);
                fetchOrders();
              }}
            >
              Qayta urinish
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!orders.length) {
    return (
      <Box p={3} textAlign="center">
        <Alert severity="info" sx={{ maxWidth: 600, margin: '0 auto' }}>
          Hozircha buyurtmalar mavjud emas
          <Button
            variant="outlined"
            sx={{ mt: 2, display: 'block', mx: 'auto' }}
            onClick={() => window.location.href = '/products'}
          >
            Mahsulotlar sahifasiga o'tish
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth="1200px" margin="0 auto">
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Buyurtmalar tarixi
      </Typography>

      <Stack spacing={3}>
        {orders.map(order => (
          <Card key={order.id} elevation={3}>
            <CardContent>
              <Stack spacing={2}>
                {/* Order Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight="bold">
                    Buyurtma #{order.id}
                  </Typography>
                  {getStatusChip(order.status)}
                </Box>

                <Box display="flex" justifyContent="space-between" flexWrap="wrap">
                  <Typography variant="body2" color="text.secondary">
                    <AccessTime fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    {new Date(order.created_at).toLocaleString('uz-UZ')}
                  </Typography>
                  <Typography variant="body2">
                    <AttachMoney fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Jami: {order.total_amount?.toLocaleString() || '0'} so'm
                  </Typography>
                </Box>

                <Divider />

                {/* Customer Info */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    <Person fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Mijoz ma'lumotlari
                  </Typography>
                  <Stack spacing={1} pl={3}>
                    <Typography variant="body2">
                      <Phone fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Telefon: {order.contact_number || '—'}
                    </Typography>
                    <Typography variant="body2">
                      <Home fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Manzil: {order.shipping_address || '—'}
                    </Typography>
                    <Typography variant="body2">
                      To'lov usuli: {order.payment === 'naqd' ? 'Naqd' : order.payment || '—'}
                    </Typography>
                    {order.notes && (
                      <Typography variant="body2" fontStyle="italic">
                        Izoh: {order.notes}
                      </Typography>
                    )}
                  </Stack>
                </Box>

                <Divider />

                {/* Products */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Mahsulotlar
                  </Typography>
                  <List dense>
                    {order.order_items?.length ? (
                      order.order_items.map(item => {
                        const product = productsMap[item.product];
                        return (
                          <ListItem key={item.id} divider>
                            <ListItemText
                              primary={product?.title || 'Nomaʼlum mahsulot'}
                              secondary={`${item.quantity} x ${item.price?.toLocaleString() || '0'} so'm`}
                            />
                            <Typography fontWeight="bold">
                              {(item.quantity * (item.price || 0)).toLocaleString()} so'm
                            </Typography>
                          </ListItem>
                        );
                      })
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Mahsulotlar mavjud emas
                      </Typography>
                    )}
                  </List>
                </Box>

                <Divider />

                {/* Kitchen Info */}
                {order.kitchen && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      <Restaurant fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Oshxona
                    </Typography>
                    <Stack spacing={1} pl={3}>
                      <Typography variant="body2">
                        Nomi: {order.kitchen.name || '—'}
                      </Typography>
                      <Typography variant="body2">
                        Maosh: {order.kitchen_salary?.toLocaleString() || '0'} so'm
                      </Typography>
                      {order.kitchen_time && (
                        <Typography variant="body2">
                          Tayyorlanish vaqti: {order.kitchen_time}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Courier Info */}
                {order.courier && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        <LocalShipping fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Kuryer
                      </Typography>
                      <Stack spacing={1} pl={3}>
                        <Typography variant="body2">
                          Nomi: {order.courier || '—'}
                        </Typography>
                        <Typography variant="body2">
                          Maosh: {order.courier_salary?.toLocaleString() || '0'} so'm
                        </Typography>
                        {order.courier_time && (
                          <Typography variant="body2">
                            Yetkazish vaqti: {order.courier_time}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default OrderPage;
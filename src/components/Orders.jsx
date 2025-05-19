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
  Paper,
  Alert
} from '@mui/material';

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('authToken'); // 'token' o‘rniga 'authToken' ishlatildi
  const ORDERS_API = 'https://hosilbek.pythonanywhere.com/api/user/orders/'; // Endpoint to‘g‘irlandi
  const PRODUCTS_API = 'https://hosilbek.pythonanywhere.com/api/product/';

  // Fetch all orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(ORDERS_API, {
          headers: { Authorization: `Bearer ${token}` } // Sintaksis xatosi tuzatildi
        });
        const ordersData = response.data;
        setOrders(ordersData);

        // Extract all unique product IDs
        const productIds = [...new Set(
          ordersData.flatMap(order => 
            order.order_items
              .filter(item => item.product)
              .map(item => item.product)
          )
        )].filter(id => id); // Faqat mavjud ID’larni olamiz

        // Fetch all product details in parallel
        if (productIds.length > 0) {
          const productResponses = await Promise.all(
            productIds.map(id => axios.get(`${PRODUCTS_API}${id}/`, {
              headers: { Authorization: `Bearer ${token}` }
            }))
          );

          const productMap = {};
          productResponses.forEach(res => {
            productMap[res.data.id] = res.data;
          });

          setProductsMap(productMap);
        }
      } catch (err) {
        console.error('Fetch orders error:', err.response ? err.response.data : err.message);
        setError(`Buyurtmalarni yuklashda xatolik yuz berdi: ${err.response?.status === 404 ? 'Endpoint topilmadi' : err.response?.data?.message || err.message}`);
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login'; // Autentifikatsiya xatosi bo‘lsa login sahifasiga yo‘naltirish
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Buyurtmalar ro'yxati</Typography>
      {orders.length === 0 ? (
        <Alert severity="info">Hech qanday buyurtma mavjud emas.</Alert>
      ) : (
        orders.map(order => (
          <Card key={order.id} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Buyurtma ID: {order.id}</Typography>
              <Typography variant="body2" color="text.secondary">
                Sana: {new Date(order.created_at).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {order.status}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Yetkazib berish manzili: {order.shipping_address || 'Mavjud emas'}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1">Mahsulotlar:</Typography>
              <List dense>
                {order.order_items.map(item => {
                  const product = productsMap[item.product] || { title: 'Mahsulot topilmadi', price: item.price };
                  return (
                    <ListItem key={item.id}>
                      <ListItemText
                        primary={product.title}
                        secondary={`Miqdori: ${item.quantity} | Narxi: ${product.price || item.price} so'm`}
                      />
                    </ListItem>
                  );
                })}
              </List>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1">
                To‘lov turi: {order.payment || 'Noma’lum'}
              </Typography>
              <Typography variant="body1">
                Telefon raqam: {order.contact_number || 'Mavjud emas'}
              </Typography>
              {order.notes && (
                <Typography variant="body1">
                  Izoh: {order.notes}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};

export default OrderPage;
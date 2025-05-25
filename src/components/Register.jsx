
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Snackbar,
  Alert as MuiAlert,
  InputAdornment,
  IconButton,
  Fade,
  Tooltip, 

} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LockIcon from '@mui/icons-material/Lock';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { Email } from '@mui/icons-material';
                 

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2', contrastText: '#fff' },
    secondary: { main: '#f50057' },
    background: { default: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, color: '#1976d2' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontSize: '1rem',
          padding: '10px 20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': { transform: 'scale(1.05)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            '&:hover fieldset': { borderColor: '#1976d2' },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          backgroundColor: '#ffffff',
        },
      },
    },
  },
});

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    address: '',
    phone_number: '',
    location: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleDetectLocation = (retries = 3, delay = 2000) => {
    setIsLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
      setIsLoading(false);
      return;
    }

    const attemptLocation = (attemptsLeft) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = `Kenglik: ${latitude.toFixed(4)}, Uzunlik: ${longitude.toFixed(4)}`;
          setFormData({ ...formData, location });
          setSuccess('Joylashuv muvaffaqiyatli aniqlandi!');
          setIsLoading(false);
        },
        (err) => {
          console.error('Geolokatsiya xatosi:', err.message, 'Kod:', err.code);
          if (err.code === 1) {
            setError("Joylashuvga ruxsat berilmadi. Qo'lda kiriting.");
          } else if (err.code === 2) {
            if (attemptsLeft > 0) {
              setTimeout(() => attemptLocation(attemptsLeft - 1), delay);
            } else {
              setError('Joylashuvni aniqlash imkonsiz. Internet aloqasini tekshiring.');
            }
          } else if (err.code === 3) {
            setError('Joylashuvni aniqlash vaqti o‘tdi. Qayta urinib ko‘ring.');
          } else {
            setError('Joylashuvni aniqlashda noma‘lum xatolik yuz berdi.');
          }
          setIsLoading(false);
        },
        { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
      );
    };

    attemptLocation(retries);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (formData.username.length < 3) {
      setError("Foydalanuvchi ismi kamida 3 belgidan iborat bo'lishi kerak.");
      setIsLoading(false);
      return;
    }
    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      setError("Telefon raqami +998 bilan boshlanib, 9 ta raqamdan iborat bo'lishi kerak.");
      setIsLoading(false);
      return;
    }
    if (!formData.location) {
      setError("Joylashuv maydonini to'ldiring (masalan, Toshkent shahri).");
      setIsLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError("Parol kamida 6 belgidan iborat bo'lishi kerak.");
      setIsLoading(false);
      return;
    }

    const payload = {
      username: formData.username.trim(),
      address: formData.address,
      phone_number: formData.phone_number,
      location: formData.location,
      password: formData.password,
      email: 'user@gmail.com'
    };

    try {
      const registerResponse = await axios.post(
        'https://hosilbek.pythonanywhere.com/api/user/user-profiles/',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const loginResponse = await axios.post(
        'https://hosilbek.pythonanywhere.com/api/token/',
        {
          username: formData.username.trim(),
          password: formData.password,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { access: authToken, refresh: refreshToken } = loginResponse.data;

      localStorage.setItem('authToken', authToken);
      localStorage.setItem('refreshToken', refreshToken);

      setSuccess("Ro'yxatdan o'tish muvaffaqiyatli! Profil sahifasiga o'tilmoqda...");
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      console.error('Registration Error:', err.response?.data);
      let errorMessage = "Ro'yxatdan o'tishda xatolik yuz berdi.";
      if (err.response) {
        if (err.response.status === 400) {
          if (err.response.data.username) {
            errorMessage = `Foydalanuvchi nomi band: ${err.response.data.username.join(' ')}`;
          } else {
            errorMessage = err.response.data.message || "Noto'g'ri ma'lumotlar kiritildi.";
          }
        } else if (err.response.status === 500) {
          errorMessage = "Server xatosi. Iltimos, keyinroq urinib ko'ring.";
        }
      } else if (err.request) {
        errorMessage = 'Tarmoq xatosi. Internet aloqangizni tekshiring.';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setError('');
    setSuccess('');
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.background.default,
        padding: 2,
      }}
      >
      <Container maxWidth="sm">
        <Fade in={true} timeout={1000}>
        <Card>
          <CardContent sx={{ p: 4 }}>
          <Box display="flex" justifyContent="center" mb={3}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <PersonIcon fontSize="large" />
            </Avatar>
          </Box>
          <Typography variant="h4" align="center" gutterBottom>
            Ro‘yxatdan o‘tish
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
            fullWidth
            label="Foydalanuvchi ismi"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="username"
            InputProps={{
              startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
              ),
            }}
            />
            <TextField
            fullWidth
            label="Manzil"
            name="address"
            value={formData.address}
            onChange={handleChange}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
              <InputAdornment position="start">
                <HomeIcon color="action" />
              </InputAdornment>
              ),
            }}
            />
            <TextField
            fullWidth
            label="Telefon raqami"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            margin="normal"
            type="tel"
            required
            placeholder="+998901234567"
            InputProps={{
              startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon color="action" />
              </InputAdornment>
              ),
            }}
            />
            <Box display="flex" alignItems="center" gap={1}>
            <TextField
              fullWidth
              label="Joylashuv (masalan, Toshkent shahri)"
              name="location"
              value={formData.location}
              onChange={handleChange}
              margin="normal"
              required
              placeholder="Toshkent shahri"
              InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                <LocationOnIcon color="action" />
                </InputAdornment>
              ),
              }}
            />
            <Tooltip title="Joriy joylashuvni aniqlash">
              <IconButton
              onClick={() => handleDetectLocation()}
              disabled={isLoading}
              color="primary"
              sx={{ mt: 1 }}
              >
              <MyLocationIcon />
              </IconButton>
            </Tooltip>
            </Box>
            <TextField
            fullWidth
            label="Parol"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="new-password"
            InputProps={{
              startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
              ),
              endAdornment: (
              <InputAdornment position="end">
                <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                edge="end"
                >
                {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
              ),
            }}
            />
            {isLoading && <LinearProgress sx={{ mt: 2, mb: 2, borderRadius: 4 }} />}
            <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={isLoading}
            >
            {isLoading ? 'Yuklanmoqda...' : 'Ro‘yxatdan o‘tish'}
            </Button>
            <Button
            fullWidth
            variant="outlined"
            color="secondary"
            sx={{ mb: 2, py: 1.5 }}
            onClick={() => navigate('/login')}
            disabled={isLoading}
            >
            Tizimga kirish
            </Button>
          </Box>
          </CardContent>
        </Card>
        </Fade>
        <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
        <MuiAlert
          onClose={handleClose}
          severity={error ? 'error' : 'success'}
          elevation={6}
          variant="filled"
          sx={{ borderRadius: 8 }}
        >
          {error || success}
        </MuiAlert>
        </Snackbar>
      </Container>
      </Box>
    </ThemeProvider>
    );
};

export default Register;

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
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Zamonaviy MUI tema
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

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Formadagi o‘zgarishlarni boshqarish
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Parol ko‘rinishini almashtirish
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Formani yuborish
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validatsiya
    if (!formData.username) {
      setError('Foydalanuvchi ismini kiriting.');
      setIsLoading(false);
      return;
    }
    if (!formData.password) {
      setError('Parolni kiriting.');
      setIsLoading(false);
      return;
    }

    try {
      // Tokenlarni olish
      const response = await axios.post(
        'https://hosilbek.pythonanywhere.com/api/token/',
        {
          username: formData.username,
          password: formData.password,
        }
      );

      const { access: authToken, refresh: refreshToken } = response.data;

      // Tokenlarni saqlash
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('refreshToken', refreshToken);

      setSuccess('Tizimga kirish muvaffaqiyatli! Profil sahifasiga o‘tilmoqda...');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      console.log('Login Error:', err.response?.data);
      let errorMessage = 'Tizimga kirishda xatolik yuz berdi.';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Noto‘g‘ri foydalanuvchi ismi yoki parol.';
        } else if (err.response.status === 400) {
          errorMessage = err.response.data.detail || 'Noto‘g‘ri ma‘lumotlar kiritildi.';
        } else if (err.response.status === 500) {
          errorMessage = 'Server xatosi. Iltimos, keyinroq urinib ko‘ring.';
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Snackbar yopish
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
                  Tizimga kirish
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
                    label="Parol"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    margin="normal"
                    required
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
                  {isLoading && <LinearProgress sx={{ mt: 2, mb: 2 }} />}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Yuklanmoqda...' : 'Kirish'}
                  </Button>
                  {/* Ro‘yxatdan o‘tish uchun navigatsiya tugmasi */}
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    sx={{ mb: 2 }}
                    onClick={() => navigate('/register')}
                  >
                    Ro‘yxatdan o‘tish
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
              sx={{ width: '100%' }}
            >
              {error || success}
            </MuiAlert>
          </Snackbar>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Login;
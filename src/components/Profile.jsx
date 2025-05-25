
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Avatar,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  Badge,
  Chip,
  useMediaQuery,
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import {
  Person as PersonIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Logout as LogoutIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Default avatar URL
const defaultAvatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';

// Register.jsx dan olingan tema
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2', contrastText: '#fff' },
    secondary: { main: '#f50057' },
    background: { default: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, color: '#1976d2' },
    h5: { fontWeight: 600, color: '#333' },
    body1: { color: '#555' },
    body2: { color: '#777' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          backgroundColor: '#ffffff',
          overflow: 'visible',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: 96,
          height: 96,
          border: '3px solid #fff',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      },
    },
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
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 600,
          padding: '4px 8px',
        },
      },
    },
  },
});

const ProfileCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  marginTop: theme.spacing(8),
  [theme.breakpoints.up('sm')]: {
    marginTop: theme.spacing(10),
  },
}));

const AvatarContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    transform: 'translate(-50%, -40%)',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: '8px 16px',
  textTransform: 'none',
  fontWeight: 500,
}));

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Tizimga kirish talab qilinadi');
          navigate('/login');
          return;
        }

        const response = await axios.get('https://hosilbek.pythonanywhere.com/api/user/user-profiles/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        let profileData = response.data;
        if (Array.isArray(response.data) && response.data.length > 0) {
          profileData = response.data[0];
        } else if (!profileData.id) {
          throw new Error('Profil ma\'lumotlari topilmadi');
        }

        setUserData({
          ...profileData,
          avatar: profileData.avatar || defaultAvatar,
          stats: {
            orders: profileData.orders?.length || 0,
            favorites: profileData.favorites?.length || 0,
            notifications: profileData.notifications?.length || 0,
          },
        });
        localStorage.setItem('userData', JSON.stringify(profileData));
      } catch (err) {
        console.error('Fetch user data error:', err.response ? err.response.data : err.message);
        let errorMessage = 'Profil ma\'lumotlarini yuklashda xato yuz berdi';
        if (err.response?.status === 401) {
          errorMessage = 'Sessiya muddati tugagan. Iltimos, qayta kiring';
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
          navigate('/login');
        } else if (err.response?.status === 404) {
          errorMessage = 'Profil ma\'lumotlari topilmadi';
        } else if (err.response?.status === 500) {
          errorMessage = 'Server xatosi. Keyinroq urinib ko\'ring';
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    setSnackbar({ open: true, message: 'Tizimdan chiqildi!', severity: 'success' });
    setTimeout(() => navigate('/login'), 1500);
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
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
          <Box textAlign="center">
            <CircularProgress size={60} thickness={4} color="primary" />
            <Typography variant="h6" mt={3} color="text.secondary">
              Profil yuklanmoqda...
            </Typography>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  if (!userData) {
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
            <Typography variant="h5" align="center" gutterBottom color="error">
              {error || 'Profil ma\'lumotlari topilmadi'}
            </Typography>
            <Box mt={4} display="flex" justifyContent="center" gap={2}>
              <ActionButton variant="contained" color="primary" onClick={() => navigate('/login')}>
                Tizimga kirish
              </ActionButton>
              <ActionButton variant="outlined" color="secondary" onClick={() => navigate('/register')}>
                Ro‘yxatdan o‘tish
              </ActionButton>
              <ActionButton
                variant="outlined"
                color="primary"
                onClick={() => window.location.reload()}
              >
                Qayta urinish
              </ActionButton>
            </Box>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, pb: 8 }}>
       

        <Container maxWidth="md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <ProfileCard>
              <AvatarContainer>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        '&:hover': { bgcolor: theme.palette.primary.dark },
                      }}
                      onClick={handleEditProfile}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <Avatar
                    src={userData.avatar}
                    alt={userData.user.username || 'Foydalanuvchi'}
                    sx={{ width: 96, height: 96, border: '3px solid white' }}
                  />
                </Badge>
              </AvatarContainer>

              <CardContent sx={{ pt: 8, pb: 4 }}>
                <Box textAlign="center" mb={3}>
                  <Typography variant="h5" fontWeight="bold">
                    {userData.user.username || 'Foydalanuvchi'}
                  </Typography>
                </Box>

              
                <List disablePadding>
                  {userData.phone_number && (
                    <>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <PhoneIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Telefon"
                          secondary={userData.phone_number}
                          secondaryTypographyProps={{ color: 'text.secondary' }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </>
                  )}

                  {userData.address && (
                    <>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <HomeIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Manzil"
                          secondary={userData.address}
                          secondaryTypographyProps={{ color: 'text.secondary' }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </>
                  )}

                  {userData.location && (
                    <ListItem disableGutters>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <LocationOnIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Joylashuv"
                        secondary={userData.location}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                    </ListItem>
                  )}
                </List>

                <Box textAlign="center" mt={4} display="flex" justifyContent="center" gap={2}>
                  <ActionButton
                    variant="contained"
                    color="secondary"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                  >
                    Chiqish
                  </ActionButton>
                  <ActionButton
                    variant="outlined"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={handleEditProfile}
                  >
                    Profilni tahrirlash
                  </ActionButton>
                </Box>
              </CardContent>
            </ProfileCard>
          </motion.div>
        </Container>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <MuiAlert
            severity={snackbar.severity}
            variant="filled"
            onClose={handleSnackbarClose}
            sx={{ borderRadius: 8 }}
          >
            {snackbar.message}
          </MuiAlert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default Profile;

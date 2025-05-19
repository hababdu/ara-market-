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
  Fab
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import {
  Person as PersonIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Logout as LogoutIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  History as HistoryIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Online avatar rasmi
const defaultAvatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';

// Custom theme
const theme = createTheme({
  palette: {
    primary: { main: '#4f46e5', contrastText: '#fff' },
    secondary: { main: '#f43f5e' },
    background: { default: '#f8fafc' },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, color: '#1e293b' },
    h5: { fontWeight: 600, color: '#334155' },
    body1: { color: '#475569' },
    body2: { color: '#64748b' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
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
  },
});

// Styled components
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
  const [notificationCount, setNotificationCount] = useState(3);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          navigate('/login');
          return;
        }

        // Simulate API call
        const response = await axios.get('https://hosilbek.pythonanywhere.com/api/user/user-profiles/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data?.length > 0) {
          const profileData = response.data[0];
          setUserData({
            ...profileData,
            avatar: profileData.avatar || defaultAvatar,
            stats: {
              orders: 12,
              favorites: 8,
              notifications: 3,
            }
          });
          console.log('Profil ma\'lumotlari:', profileData);
          localStorage.setItem('userData', JSON.stringify(profileData));
        } else {
          setError('Profil ma\'lumotlari topilmadi');
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err.response?.data?.message || 'Server xatosi');
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
    setSnackbarOpen(true);
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

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.palette.background.default
        }}>
          <Box textAlign="center">
            <CircularProgress size={60} thickness={4} />
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
        <Box sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.palette.background.default
        }}>
          <Container maxWidth="sm">
            <Typography variant="h5" align="center" gutterBottom>
              {error || "Profil ma'lumotlari topilmadi"}
            </Typography>
            <Box mt={4} display="flex" justifyContent="center" gap={2}>
              <ActionButton 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/login')}
              >
                Tizimga kirish
              </ActionButton>
              <ActionButton 
                variant="outlined" 
                color="primary" 
                onClick={() => navigate('/register')}
              >
                Ro'yxatdan o'tish
              </ActionButton>
            </Box>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        minHeight: '100vh',
        background: theme.palette.background.default,
        pb: 8
      }}>
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          height: isMobile ? 120 : 160,
          position: 'relative'
        }}>
          <IconButton 
            onClick={handleBack}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            <BackIcon />
          </IconButton>
          
          <Typography 
            variant="h5" 
            sx={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontWeight: 600
            }}
          >
            Mening Profilim
          </Typography>
        </Box>

        <Container maxWidth="md">
          {/* Avatar and basic info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
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
                        '&:hover': {
                          bgcolor: theme.palette.primary.dark
                        }
                      }}
                      onClick={handleEditProfile}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <Avatar 
                    src={userData.avatar} 
                    alt={userData.user?.split('@')[0]}
                    sx={{
                      width: 96,
                      height: 96,
                      border: '3px solid white'
                    }}
                  />
                </Badge>
              </AvatarContainer>

              <CardContent sx={{ pt: 8, pb: 4 }}>
                <Box textAlign="center" mb={3}>
                  <Typography variant="h5" fontWeight="bold">
                    {userData.user?.split('@')[0] || 'Foydalanuvchi'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userData.user || 'email@example.com'}
                  </Typography>
                </Box>

                {/* Stats */}
                <Box display="flex" justifyContent="center" gap={2} mb={4}>
                  <Chip 
                    icon={<CartIcon />}
                    label={`${userData.stats?.orders || 0} buyurtma`}
                    variant="outlined"
                    onClick={() => handleNavigation('/orders')}
                    clickable
                  />
                  <Chip 
                    icon={<FavoriteIcon />}
                    label={`${userData.stats?.favorites || 0} sevimli`}
                    variant="outlined"
                    onClick={() => handleNavigation('/favorites')}
                    clickable
                  />
                  <Chip 
                    icon={<NotificationIcon />}
                    label={`${userData.stats?.notifications || 0} xabar`}
                    variant="outlined"
                    onClick={() => handleNavigation('/notifications')}
                    clickable
                  />
                </Box>

                {/* Profile details */}
                <List disablePadding>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <EmailIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Email" 
                      secondary={userData.user || 'Mavjud emas'}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                  
                  <Divider variant="inset" component="li" />

                  {userData.phone_number && (
                    <>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <PhoneIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Telefon raqam" 
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
                    <>
                      <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <LocationIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Joylashuv" 
                          secondary={userData.location}
                          secondaryTypographyProps={{ color: 'text.secondary' }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </>
                  )}
                </List>

                {/* Action buttons */}
                <Box mt={4} display="flex" justifyContent="space-between">
                  <ActionButton
                    variant="outlined"
                    color="secondary"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                  >
                    Chiqish
                  </ActionButton>
                  <ActionButton
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={handleEditProfile}
                  >
                    Tahrirlash
                  </ActionButton>
                </Box>
              </CardContent>
            </ProfileCard>
          </motion.div>

          {/* Quick actions */}
          <Box mt={4}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Tezkor amallar
            </Typography>
            <Box display="grid" gridTemplateColumns={isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr"} gap={2}>
              <Button 
                variant="outlined" 
                startIcon={<CartIcon />}
                onClick={() => handleNavigation('/cart')}
                sx={{ py: 2, borderRadius: 2 }}
              >
                Savat
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<HistoryIcon />}
                onClick={() => handleNavigation('/order-history')}
                sx={{ py: 2, borderRadius: 2 }}
              >
                Buyurtmalar tarixi
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<FavoriteIcon />}
                onClick={() => handleNavigation('/favorites')}
                sx={{ py: 2, borderRadius: 2 }}
              >
                Sevimlilar
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<NotificationIcon />}
                onClick={() => handleNavigation('/notifications')}
                sx={{ py: 2, borderRadius: 2 }}
              >
                Xabarlar
                {notificationCount > 0 && (
                  <Chip 
                    label={notificationCount} 
                    size="small" 
                    color="error"
                    sx={{ ml: 1 }}
                  />
                )}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="edit"
          onClick={handleEditProfile}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
          }}
        >
          <EditIcon />
        </Fab>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert 
          elevation={6} 
          variant="filled" 
          severity="success"
          onClose={() => setSnackbarOpen(false)}
        >
          Tizimdan muvaffaqiyatli chiqdingiz
        </MuiAlert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default Profile;
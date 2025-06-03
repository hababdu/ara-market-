
   import React, { memo } from 'react';
   import { ThemeProvider } from '@mui/material/styles';
   import {
     Card,
     CardContent,
     Box,
     Typography,
     TextField,
     Button,
     Avatar,
     LinearProgress,
     IconButton,
     InputAdornment,
     Fade,
   } from '@mui/material';
   import {
     Person as PersonIcon,
     Phone,
     Lock as LockIcon,
     Close as CloseIcon,
     Visibility,
     VisibilityOff,
   } from '@mui/icons-material';
   import theme from './theme';

   const AuthModal = memo(
     ({
       type,
       formData,
       onFormChange,
       onSubmit,
       onClose,
       onSwitchType,
       isFormLoading,
       isOnline,
       showPassword,
       onTogglePassword,
       availableProfiles,
       formError,
       formSuccess,
     }) => (
       <ThemeProvider theme={theme}>
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
           <Fade in={!!type} timeout={500} key={type}>
             <div
               className="bg-white w-full sm:w-[90%] sm:max-w-md rounded-t-2xl sm:rounded-2xl h-[90%] sm:h-auto overflow-y-auto"
               onClick={(e) => e.stopPropagation()}
             >
               {type === 'register' ? (
                 <Card sx={{ borderRadius: '16px' }}>
                   <CardContent sx={{ p: 4 }}>
                     <Box display="flex" justifyContent="flex-end" mb={2}>
                       <IconButton
                         onClick={onClose}
                         aria-label="Modalni yopish"
                         sx={{ color: '#FF6200' }}
                       >
                         <CloseIcon />
                       </IconButton>
                     </Box>
                     <Box display="flex" justifyContent="center" mb={3}>
                       <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                         <PersonIcon fontSize="large" />
                       </Avatar>
                     </Box>
                     <Typography variant="h4" align="center" gutterBottom>
                       Ro‘yxatdan o‘tish
                     </Typography>
                     <Box component="form" onSubmit={onSubmit} sx={{ mt: 2 }}>
                       <TextField
                         fullWidth
                         label="Foydalanuvchi ismi"
                         name="username"
                         value={formData.username}
                         onChange={onFormChange}
                         margin="normal"
                         required
                         autoComplete="username"
                         disabled={isFormLoading || !isOnline}
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
                         label="Telefon raqami"
                         name="phone_number"
                         value={formData.phone_number}
                         onChange={onFormChange}
                         margin="normal"
                         type="tel"
                         required
                         placeholder="+998901234567"
                         disabled={isFormLoading || !isOnline}
                         InputProps={{
                           startAdornment: (
                             <InputAdornment position="start">
                               <Phone color="action" />
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
                         onChange={onFormChange}
                         margin="normal"
                         required
                         autoComplete="new-password"
                         disabled={isFormLoading || !isOnline}
                         InputProps={{
                           startAdornment: (
                             <InputAdornment position="start">
                               <LockIcon color="action" />
                             </InputAdornment>
                           ),
                           endAdornment: (
                             <InputAdornment position="end">
                               <IconButton
                                 aria-label="Parolni ko‘rsatish/yashirish"
                                 onClick={onTogglePassword}
                                 edge="end"
                                 disabled={isFormLoading || !isOnline}
                               >
                                 {showPassword ? <VisibilityOff /> : <Visibility />}
                               </IconButton>
                             </InputAdornment>
                           ),
                         }}
                       />
                       {isFormLoading && <LinearProgress sx={{ mt: 2, mb: 2, borderRadius: 4 }} />}
                       {(formError || formSuccess) && (
                         <Typography
                           color={formError ? 'error' : 'success'}
                           variant="body2"
                           sx={{ mt: 1, mb: 2 }}
                         >
                           {formError || formSuccess}
                         </Typography>
                       )}
                       <Button
                         type="submit"
                         fullWidth
                         variant="contained"
                         color="primary"
                         sx={{ mt: 3, mb: 2, py: 1.5 }}
                         disabled={isFormLoading || !isOnline}
                       >
                         {isFormLoading ? 'Yuklanmoqda...' : 'Ro‘yxatdan o‘tish'}
                       </Button>
                       <Button
                         fullWidth
                         variant="outlined"
                         color="secondary"
                         sx={{ mb: 2, py: 1.5 }}
                         onClick={() => onSwitchType('login')}
                         disabled={isFormLoading || !isOnline}
                       >
                         Tizimga kirish
                       </Button>
                     </Box>
                   </CardContent>
                 </Card>
               ) : (
                 <div className="bg-[#FFF3E0] w-full sm:w-[90%] sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 h-[90%] sm:h-auto overflow-y-auto">
                   <div className="flex justify-between items-center mb-4">
                     <h2 className="text-2xl font-bold text-[#FF6200]">Tizimga kirish</h2>
                     <button
                       onClick={onClose}
                       className="text-[#FF6200] hover:text-[#FFAB40] transition-colors"
                       aria-label="Modalni yopish"
                     >
                       <CloseIcon />
                     </button>
                   </div>
                   <div className="flex justify-center mb-6">
                     <div className="bg-[#FF6200] rounded-full p-4">
                       <PersonIcon className="text-white" fontSize="large" />
                     </div>
                   </div>
                   <form onSubmit={onSubmit} className="space-y-4">
                     {availableProfiles.length > 0 && (
                       <div className="relative">
                         <PersonIcon className="absolute top-3 left-3 text-gray-500" />
                         <select
                           name="selectedProfile"
                           value={formData.selectedProfile}
                           onChange={onFormChange}
                           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200]"
                           aria-label="Foydalanuvchi profilini tanlash"
                           disabled={isFormLoading || !isOnline}
                         >
                           <option value="">Profilni tanlang</option>
                           {availableProfiles.map((profile) => (
                             <option key={profile.id} value={profile.id}>
                               {profile.user?.username || 'Noma‘lum'}
                             </option>
                           ))}
                         </select>
                       </div>
                     )}
                     <div className="relative">
                       <PersonIcon className="absolute top-3 left-3 text-gray-500" />
                       <input
                         type="text"
                         name="username"
                         value={formData.username}
                         onChange={onFormChange}
                         placeholder="Foydalanuvchi ismi"
                         required
                         autoComplete="username"
                         className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200]"
                         aria-label="Username"
                         disabled={isFormLoading || !isOnline}
                       />
                     </div>
                     <div className="relative">
                       <LockIcon className="absolute top-3 left-3 text-gray-500" />
                       <input
                         type={showPassword ? 'text' : 'password'}
                         name="password"
                         value={formData.password}
                         onChange={onFormChange}
                         placeholder="Parol"
                         required
                         autoComplete="current-password"
                         className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6200] focus:border-[#FF6200]"
                         aria-label="Password"
                         disabled={isFormLoading || !isOnline}
                       />
                       <button
                         type="button"
                         onClick={onTogglePassword}
                         className="absolute top-3 right-3 text-gray-500"
                         aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
                         disabled={isFormLoading || !isOnline}
                       >
                         {showPassword ? <VisibilityOff /> : <Visibility />}
                       </button>
                     </div>
                     {isFormLoading && (
                       <div className="h-1 w-full bg-gray-200 rounded">
                         <div className="h-full bg-[#FF6200] rounded animate-pulse" />
                       </div>
                     )}
                     {(formError || formSuccess) && (
                       <Typography
                         color={formError ? 'error' : 'success'}
                         variant="body2"
                         sx={{ mt: 1, mb: 2 }}
                       >
                         {formError || formSuccess}
                       </Typography>
                     )}
                     <button
                       type="submit"
                       className="w-full bg-[#FF6200] text-white py-3 rounded-lg font-medium shadow-md hover:scale-105 transition-transform disabled:bg-gray-400 disabled:cursor-not-allowed"
                       disabled={isFormLoading || !isOnline}
                     >
                       {isFormLoading ? 'Yuklanmoqda...' : 'Kirish'}
                     </button>
                     <button
                       type="button"
                       className="w-full border border-[#FFAB40] text-[#FFAB40] py-3 rounded-lg font-medium shadow-md hover:scale-105 transition-transform disabled:bg-gray-200 disabled:cursor-not-allowed"
                       onClick={() => onSwitchType('register')}
                       disabled={isFormLoading || !isOnline}
                     >
                       Ro‘yxatdan o‘tish
                     </button>
                   </form>
                 </div>
               )}
             </div>
           </Fade>
         </div>
       </ThemeProvider>
     )
   );

   export default AuthModal;
   

   import React, { memo } from 'react';
   import { Button } from '@mui/material';
   import { Phone, Logout as LogoutIcon } from '@mui/icons-material';
   import { motion } from 'framer-motion';

   const defaultAvatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';

   const ProfileCard = memo(({ userData, onLogout }) => (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.3 }}
       className="mt-16 sm:mt-20"
     >
       <div
         style={{
           background: 'linear-gradient(to bottom, #FFFFFF, #FFFFFF, #FFF3E0)',
         }}
         className="relative rounded-2xl p-6"
       >
         <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 sm:-translate-y-1/3">
           <img
             src={userData.avatar}
             alt={userData.user?.username || 'Foydalanuvchi'}
             className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
             onError={(e) => (e.target.src = defaultAvatar)}
           />
         </div>
         <div className="pt-16 pb-6 text-center">
           <h2 className="text-2xl font-bold text-gray-800">
             {userData.user?.username || 'Foydalanuvchi'}
           </h2>
           {userData.email && (
             <p className="text-gray-600 mt-1">{userData.email}</p>
           )}
         </div>

         <div className="mt-6">
           <ul className="space-y-4">
             {userData.phone_number && (
               <>
                 <li className="flex items-center">
                   <Phone className="text-[#FF6200] mr-3" />
                   <div>
                     <p className="font-semibold text-gray-700">Telefon</p>
                     <p className="text-gray-600">{userData.phone_number}</p>
                   </div>
                 </li>
                 <hr className="ml-12 border-gray-300" />
               </>
             )}
             {userData.address && (
               <>
                 <li className="flex items-center">
                   <Phone className="text-[#FF6200] mr-3" />
                   <div>
                     <p className="font-semibold text-gray-700">Manzil</p>
                     <p className="text-gray-600">{userData.address}</p>
                   </div>
                 </li>
                 <hr className="ml-12 border-gray-300" />
               </>
             )}
             {userData.location && (
               <li className="flex items-center">
                 <Phone className="text-[#FF6200] mr-3" />
                 <div>
                   <p className="font-semibold text-gray-700">Joylashuv</p>
                   <p className="text-gray-600">{userData.location}</p>
                 </div>
               </li>
             )}
           </ul>
           <div className="flex justify-center gap-4 mt-6">
             <Button
               variant="contained"
               color="secondary"
               startIcon={<LogoutIcon />}
               onClick={onLogout}
               aria-label="Tizimdan chiqish"
             >
               Chiqish
             </Button>
           </div>
         </div>
       </div>
     </motion.div>
   ));

   export default ProfileCard;
   
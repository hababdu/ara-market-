
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart as CartIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const EmptyCart = memo(({ navigate }) => (
  <div className="max-w-6xl mx-auto py-6 px-4">
    <button
      onClick={() => navigate('/')}
      className="flex items-center text-[#FF6200] hover:text-[#FFAB40] mb-6 transition-colors"
    >
      <ArrowBackIcon className="mr-2" />
      Bosh sahifaga qaytish
    </button>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#FFF3E0] border border-orange-100 rounded-2xl p-8 text-center"
    >
      <CartIcon className="w-16 h-16 mx-auto mb-4 text-[#FF6200]" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Savat bo‘sh</h2>
      <p className="text-gray-600 mb-6">Sizning savatingizda hozircha mahsulotlar yo‘q</p>
      <button
        onClick={() => navigate('/')}
        className="bg-[#FF6200] hover:bg-[#FFAB40] text-white px-6 py-3 rounded-lg font-medium transition-transform shadow-md hover:scale-105"
      >
        Mahsulotlarni ko‘rish
      </button>
    </motion.div>
  </div>
));

export default EmptyCart;

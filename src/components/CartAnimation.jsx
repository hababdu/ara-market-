
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart as CartIcon } from '@mui/icons-material';
import LazyImage from './LazyImage';

const CartAnimation = memo(({ animation }) => {
  return (
    <motion.div
      key={animation.id}
      className="fixed z-[100] pointer-events-none"
     
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      {animation.photo ? (
        <LazyImage
          src={`https://hosilbek.pythonanywhere.com${animation.photo}`}
          placeholder="/images/placeholder.jpg"
          alt="Product"
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <CartIcon className="w-8 h-8 text-[#FF6200]" />
      )}
    </motion.div>
  );
});

export default CartAnimation;


import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart as CartIcon } from '@mui/icons-material';

const CartButton = memo(({ cartCount,  isDragging, onClick, onDragStart }) => {
  return (
    <motion.button
      onClick={onClick}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
      className={`fixed z-[60] right-5 bottom-25 bg-gradient-to-r from-[#FF6200] to-[#FFAB40] text-white p-4 rounded-full shadow-lg transition-transform ${
        isDragging ? 'cursor-grabbing' : 'cursor-pointer'
      } hover:scale-110`}
     
      aria-label="Savat"
      whileTap={{ scale: 0.9 }}
    >
      <div className="relative">
        <CartIcon className="w-6 h-6" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
      </div>
    </motion.button>
  );
});

export default CartButton;

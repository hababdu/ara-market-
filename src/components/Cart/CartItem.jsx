
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Remove as RemoveIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const BASE_URL = 'https://hosilbek.pythonanywhere.com';
const DEFAULT_IMAGE = 'https://via.placeholder.com/100x100?text=No+Image';

const CartItem = memo(({ item, index, updateQuantity, setConfirmDelete, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="flex items-center p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
  >
    <img
      src={item.photo ? `${BASE_URL}${item.photo}` : DEFAULT_IMAGE}
      alt={item.title}
      className="w-24 h-24 object-contain rounded-lg mr-4 border border-gray-200"
    />
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-gray-800 hover:text-[#FF6200] transition-colors">
        {item.title}
      </h3>
      <p className="text-gray-600 mb-2">
        {parseFloat(item.discounted_price || item.price).toLocaleString()} so‘m
      </p>
      <div className="flex items-center">
        <button
          onClick={() => updateQuantity(item.id, -1)}
          disabled={item.quantity === 1 || loading}
          className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors"
        >
          <RemoveIcon className="text-gray-600" />
        </button>
        <span className="mx-3 font-medium text-gray-800 min-w-[20px] text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => updateQuantity(item.id, 1)}
          disabled={loading}
          className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <AddIcon className="text-gray-600" />
        </button>
      </div>
    </div>
    <button
      onClick={() => setConfirmDelete(item.id)}
      className="text-gray-400 hover:text-red-500 p-2 transition-colors"
      aria-label="O‘chirish"
    >
      <DeleteIcon />
    </button>
  </motion.div>
));

export default CartItem;

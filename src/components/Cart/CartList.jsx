
import React, { memo } from 'react';
import { Delete as DeleteIcon } from '@mui/icons-material';
import CartItem from './CartItem';

const CartList = memo(({ cart, updateQuantity, setConfirmDelete, clearCart, loading }) => (
  <div className="lg:w-2/3">
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      {cart.map((item, index) => (
        <CartItem
          key={item.id}
          item={item}
          index={index}
          updateQuantity={updateQuantity}
          setConfirmDelete={setConfirmDelete}
          loading={loading}
        />
      ))}
    </div>
    <button
      onClick={clearCart}
      className="mt-4 flex items-center text-red-500 hover:text-red-700 transition-colors"
    >
      <DeleteIcon className="mr-1" />
      Savatni tozalash
    </button>
  </div>
));

export default CartList;


import React, { memo } from 'react';
import { Payment as PaymentIcon, Discount as DiscountIcon } from '@mui/icons-material';

const CartSummary = memo(({ totalItems, subtotal, discount, total, handleCheckout }) => (
  <div className="lg:w-1/3">
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sticky top-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-[#FF6200]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        Buyurtma xulosasi
      </h2>
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Mahsulotlar:</span>
          <span className="font-medium">{totalItems} ta</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Jami narx:</span>
          <span className="font-medium">{subtotal.toLocaleString()} so‘m</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Chegirma:</span>
            <span>-{discount.toLocaleString()} so‘m</span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-800">
          <span>Umumiy:</span>
          <span>{total.toLocaleString()} so‘m</span>
        </div>
      </div>
      
      <button
        onClick={handleCheckout}
        className="w-full bg-[#FF6200] hover:bg-[#FFAB40] text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-transform shadow-md hover:scale-105"
      >
        <PaymentIcon className="mr-2" />
        Buyurtma berish
      </button>
    </div>
  </div>
));

export default CartSummary;

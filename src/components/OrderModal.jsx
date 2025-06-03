
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Close as CloseIcon } from '@mui/icons-material';
import OrderTable from './OrderTable';

const OrderModal = memo(({ order, onClose, formatDate }) => (
  <motion.div
    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
    onClick={onClose}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    <motion.div
      className="bg-[#FFF3E0] w-full rounded-t-2xl p-4 h-[90%] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-[#FF6200]">
          Buyurtma #{order.id}
        </h2>
        <button
          onClick={onClose}
          className="text-[#FF6200] hover:text-[#FFAB40]"
          aria-label="Modalni yopish"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-md font-medium text-[#333] mb-3">Buyurtma ma'lumotlari</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[#666]">Umumiy summa:</span>
                <span className="text-sm font-medium">{order.total_amount} so'm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#666]">To'lov usuli:</span>
                <span className="text-sm font-medium">{order.payment === 'naqd' ? 'Naqd pul' : order.payment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#666]">Telefon raqam:</span>
                <span className="text-sm font-medium">{order.contact_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#666]">Buyurtma vaqti:</span>
                <span className="text-sm font-medium">{formatDate(order.created_at)}</span>
              </div>
              {order.detected_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#666]">Qabul qilingan vaqt:</span>
                  <span className="text-sm font-medium">{formatDate(order.detected_at)}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[#666]">Manzil:</span>
                <span className="text-sm font-medium">{order.shipping_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#666]">Restoran:</span>
                <span className="text-sm font-medium">{order.kitchen?.name || 'N/A'}</span>
              </div>
              {order.notes && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#666]">Qo'shimcha izoh:</span>
                  <span className="text-sm font-medium">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <OrderTable items={order.items} totalAmount={order.total_amount} />
      </div>
    </motion.div>
  </motion.div>
));

export default OrderModal;

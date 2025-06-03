
import React, { memo } from 'react';

const OrderCard = memo(({ order, onSelect, formatDate, getStatusColor, translateStatus }) => (
  <li
    className="px-4 py-6 sm:px-6 cursor-pointer hover:bg-[#FFF3E0]"
    onClick={() => onSelect(order)}
  >
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
      <div className="flex items-center space-x-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-medium text-[#333]">
            Buyurtma #{order.id}
          </h3>
          <p className="mt-1 text-sm text-[#666]">
            {formatDate(order.created_at)}
          </p>
        </div>
      </div>
      <div className="mt-4 sm:mt-0 sm:ml-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          {translateStatus(order.status)}
        </span>
      </div>
    </div>
  </li>
));

export default OrderCard;
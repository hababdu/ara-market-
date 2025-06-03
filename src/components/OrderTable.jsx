
import React, { memo } from 'react';

const OrderTable = memo(({ items, totalAmount }) => (
  <div>
    <h4 className="text-md font-medium text-[#333] mb-3">Buyurtma mahsulotlari</h4>
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-[#FFAB40]">
        <thead className="bg-[#FFF3E0]">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#333] sm:pl-6">
              Mahsulot
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#333]">
              Narxi
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#333]">
              Miqdori
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#333]">
              Summa
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#FFAB40] bg-white">
          {items.map((item) => (
            <tr key={`${item.order_id}-${item.product.id}`}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-[#333] sm:pl-6">
                {item.product.title}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-[#666]">
                {item.price} so'm
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-[#666]">
                {item.quantity}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-[#666]">
                {(parseFloat(item.price) * item.quantity).toFixed(2)} so'm
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3" className="text-right py-3 pl-4 pr-3 text-sm font-medium text-[#333] sm:pl-6">
              Jami:
            </td>
            <td className="px-3 py-3 text-sm font-bold text-[#FF6200]">
              {totalAmount} so'm
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
));

export default OrderTable;
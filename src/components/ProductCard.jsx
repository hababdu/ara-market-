
import React, { memo, useMemo } from 'react';
import { Fastfood as FastfoodIcon, LocalOffer as DiscountIcon } from '@mui/icons-material';
import LazyImage from './LazyImage';

const ProductCard = memo(({ product, onSelect }) => {
  const discountPercentage = useMemo(() => {
    if (parseFloat(product.discount) > 0) {
      return Math.round(
        ((parseFloat(product.price) - parseFloat(product.discounted_price)) /
          parseFloat(product.price)) * 100
      );
    }
    return 0;
  }, [product.price, product.discounted_price]);

  return (
    <div
      style={{
        background: 'linear-gradient(to bottom, #FFFFFF, #FFF3E0, #FFF3E0)',
      }}
      className="w-40 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col flex-shrink-0 cursor-pointer"
      onClick={() => onSelect(product)}
      aria-label={`Mahsulot: ${product.title || 'Yangi mahsulot'}`}
    >
      <div className="relative pt-[75%] overflow-hidden">
        {product.photo ? (
          <LazyImage
            src={`https://hosilbek.pythonanywhere.com${product.photo}`}
            placeholder="/images/placeholder.jpg"
            alt={product.title || 'Mahsulot rasmi'}
            className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 hover:scale-100 loaded"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-[#FFF3E0] flex items-center justify-center">
            <FastfoodIcon className="w-12 h-12" />
          </div>
        )}
        {discountPercentage > 0 && (
          <div className="absolute top-2 right-2 bg-[#FF6200] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
            <DiscountIcon className="w-3 h-3 mr-1" />
            {discountPercentage}%
          </div>
        )}
      </div>
      <div
        style={{
          background: 'linear-gradient(to bottom, #FFFFFF, #FFF3E0)',
        }}
        className="p-3 flex flex-col items-start justify-between"
      >
        <h3
          className="font-semibold text-center text-sm text-[#333] truncate"
          title={product.title}
        >
          {product.title || 'Loading...'}
        </h3>
        <p className="text-[#666] text-xs mb-3 line-clamp-2 flex-grow">
          {product.description || 'Tavsif mavjud emas'}
        </p>
        <div className="mt-auto">
          <div className="flex items-center mb-1">
            <span
              className={`font-bold text-sm ${
                discountPercentage > 0 ? 'line-through text-[#666]' : 'text-[#333]'
              }`}
            >
              {parseFloat(product.price).toLocaleString('uz-UZ')} so‘m
            </span>
          </div>
          {discountPercentage > 0 && (
            <p className="text-[#FF6200] font-bold text-sm">
              {parseFloat(product.discounted_price).toLocaleString('uz-UZ')} so‘m
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

export default ProductCard;

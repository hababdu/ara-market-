
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';

const CategorySection = memo(({ category, products, onSelect }) => {
  if (!products) return null;

  return (
    <div className="mb-6 max-w-sm mx-auto">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-[#FF6200]">{category}</h2>
        <Link
          to={`/category/${encodeURIComponent(category)}`}
          className="text-[#FF6200] hover:text-[#FFAB40] text-sm flex items-center"
        >
          Barchasini ko‘rish
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
      <div className="overflow-x-auto flex gap-2 pb-2 scroll-smooth hide-scrollbar">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
});

export default CategorySection;

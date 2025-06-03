
import React, { memo } from 'react';

const SubcategoryFilter = memo(({ subcategories, selectedSubcategory, onSelect }) => {
  if (subcategories.length <= 1) return null;

  return (
    <div className="mb-4 max-w-sm mx-auto">
      <ul className="flex space-x-2 overflow-x-auto scrollbar-hide">
        {subcategories.map((subcategory) => (
          <li key={subcategory}>
            <button
              onClick={() => onSelect(subcategory)}
              className={`px-4 py-2 text-sm rounded-full whitespace-nowrap ${
                selectedSubcategory === subcategory
                  ? 'bg-[#FF6200] text-white'
                  : 'bg-white text-[#FF6200] border border-[#FF6200] hover:bg-[#FFF3E0]'
              } transition-colors`}
            >
              {subcategory === 'all' ? 'Barchasi' : subcategory}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default SubcategoryFilter;

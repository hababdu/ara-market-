// src/components/Promotions.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocalOffer as OfferIcon } from '@mui/icons-material';

const Promotions = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([
    { id: 1, title: '2+1 Bepul', description: 'Ikki taom oling, uchinchisi bepul!', productId: 4 },
    // API dan olish mumkin
  ]);

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold text-blue-600 mb-6 flex items-center">
        <OfferIcon className="mr-2" /> Aksiyalar
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promotions.map((promo) => (
          <div key={promo.id} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold">{promo.title}</h2>
            <p className="text-gray-600">{promo.description}</p>
            <button
              onClick={() => navigate(`/products/${promo.productId}`)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Hozir sotib olish
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Promotions;
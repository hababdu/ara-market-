import React from 'react';
import ProductsList from './ProductList'; // This could cause the error if ProductsList.jsx fails

const Home = () => {
  return (
    <div>
      <ProductsList />
    </div>
  );
};

export default Home;
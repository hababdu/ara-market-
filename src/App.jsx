// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MenuSlider from './componenta/MenuSlider'; // Import your MenuSlider component

const App = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<MenuSlider />} />
        {/* Add more routes as needed */}
      </Routes>
    </div>
  );
};

export default App; // Ensure this default export is present
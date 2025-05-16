import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-white shadow p-4">
      <ul className="flex gap-6 list-none">
        <li><Link to="/" className="text-blue-600 hover:underline">Asosiy</Link></li>
        {!user ? (
          <>
            <li><Link to="/register" className="text-blue-600 hover:underline">Ro'yxatdan o'tish</Link></li>
            <li><Link to="/login" className="text-blue-600 hover:underline">Kirish</Link></li>
          </>
        ) : (
          <li>
            <button onClick={onLogout} className="text-red-600 hover:underline">Chiqish</button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
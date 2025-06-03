
import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const NavItem = memo(({ path, Icon, label, ariaLabel, onClick }) => (
  <NavLink
    to={path}
    className={({ isActive }) =>
      `flex flex-col items-center p-2 rounded-full transition-all duration-300 ${
        isActive ? 'bg-white/20' : 'hover:bg-white/10'
      }`
    }
    onClick={onClick}
    aria-label={ariaLabel}
    aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
  >
    {({ isActive }) => (
      <motion.div
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
        className="flex flex-col items-center"
      >
        <Icon className="text-white" style={{ fontSize: 24 }} />
        {isActive && (
          <motion.div
            className="w-1 h-1 bg-white rounded-full mt-1 nav-active-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.div>
    )}
  </NavLink>
));

export default NavItem;

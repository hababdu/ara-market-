import React, { memo, useState, useEffect, useRef } from 'react';
import NavItem from './NavItem';

const MobileNav = memo(({ navItems, closeMobileMenu }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const inactivityTimeoutRef = useRef(null);

  // Reset the inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    setIsVisible(true); // Show nav on interaction
    inactivityTimeoutRef.current = setTimeout(() => {
      setIsVisible(false); // Hide after 3 seconds of inactivity
    }, 3000);
  };

  // Handle scroll events
  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    // Hide nav when scrolling up (scrollY > 0) and show when at top or scrolling down
    if (currentScrollY > lastScrollY && currentScrollY > 0) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }

    setLastScrollY(currentScrollY);
    resetInactivityTimer(); // Reset timer on scroll
  };

  // Handle touch events
  const handleTouchStart = () => {
    resetInactivityTimer(); // Reset timer on touch
  };

  // Handle toggle button click
  const handleToggleNav = () => {
    setIsVisible(true);
    resetInactivityTimer(); // Reset timer on toggle
  };

  useEffect(() => {
    // Start the inactivity timer
    resetInactivityTimer();

    // Add event listeners for scroll and touch
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Cleanup on unmount
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [lastScrollY]);

  return (
    <>
      <nav
        className="fixed bottom-0 w-full bg-gradient-to-r from-[#FF6200] to-[#FFAB40] text-white md:hidden z-50 shadow-lg transition-transform duration-300"
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div className="flex justify-around items-center py-3">
          {navItems.map(({ path, icon, label, ariaLabel }) => (
            <NavItem
              key={path}
              path={path}
              Icon={icon}
              label={label}
              ariaLabel={ariaLabel}
              onClick={() => {
                closeMobileMenu();
                resetInactivityTimer(); // Reset timer on nav item click
              }}
            />
          ))}
        </div>
      </nav>
      {!isVisible && (
        <button
          onClick={handleToggleNav}
          className="fixed bottom-4 right-4 bg-[#FF6200] text-white rounded-full p-2 shadow-lg hover:bg-[#FFAB40] transition-colors md:hidden z-50"
          aria-label="Navigatsiyani ochish"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      )}
    </>
  );
});

export default MobileNav;
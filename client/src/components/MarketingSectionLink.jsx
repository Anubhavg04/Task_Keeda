import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const MarketingSectionLink = ({ sectionId, children, className = '', onClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.hash === `#${sectionId}`;

  const handleClick = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
    if (location.pathname !== '/') {
      onClick?.(event);
      return;
    }

    const section = document.getElementById(sectionId);
    if (!section) {
      onClick?.(event);
      return;
    }

    event.preventDefault();
    onClick?.(event);
    if (isActive) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      return;
    }

    navigate(`/#${sectionId}`);
  };

  return (
    <Link
      to={`/#${sectionId}`}
      onClick={handleClick}
      aria-current={isActive ? 'location' : undefined}
      className={`${className} transition-colors ${isActive ? 'text-orange-800' : 'text-slate-600 hover:text-orange-800'}`}
    >
      {children}
    </Link>
  );
};

export default MarketingSectionLink;

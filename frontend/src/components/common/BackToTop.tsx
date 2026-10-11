import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const isNearbyPage = location.pathname === '/diem-du-lich';

  useEffect(() => {
    const handleScroll = () => {
      if (isNearbyPage) {
        // On /diem-du-lich, show only after scrolling more than 1.5 viewport heights
        const threshold = window.innerHeight * 1.5;
        const isPlayerActive = Boolean(document.querySelector('.nearby-sticky-player-bar'));
        setVisible(window.scrollY > threshold && !isPlayerActive);
      } else {
        setVisible(window.scrollY >= 600);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    let observer: MutationObserver | null = null;
    if (isNearbyPage && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        handleScroll();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [isNearbyPage]);

  const scrollToTop = () => {
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!visible) return null;

  return (
    <button
      id="up"
      type="button"
      className={isNearbyPage ? 'is-nearby-page' : undefined}
      aria-label="Lên đầu trang"
      onClick={scrollToTop}
    >
      ↑
    </button>
  );
};

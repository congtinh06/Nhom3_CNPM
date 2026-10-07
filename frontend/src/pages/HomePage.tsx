import React, { useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGsapAnimations } from '../hooks/useGsapAnimations';
import { CoverSection } from '../components/sections/CoverSection';
import { IntroSection } from '../components/sections/IntroSection';
import { CultureSection } from '../components/sections/CultureSection';
import { CostumeSection } from '../components/sections/CostumeSection';
import { FoodSection } from '../components/sections/FoodSection';
import { DrinksSection } from '../components/sections/DrinksSection';
import { TourismTeaserSection } from '../components/sections/TourismTeaserSection';
import { PlacesSection } from '../components/places/PlacesSection';
import { ContactSection } from '../components/sections/ContactSection';

export const HomePage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useGsapAnimations(containerRef);

  useEffect(() => {
    if (location.hash === '#don-hang') {
      navigate('/don-hang', { replace: true });
      return;
    }

    if (location.hash && location.hash.length > 1) {
      const targetId = location.hash.substring(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        setTimeout(() => {
          if (window.__lenis) {
            window.__lenis.scrollTo(targetEl, { offset: targetId === 'top' ? 0 : -20, duration: 1.2 });
          } else {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  }, [location.hash, navigate]);

  return (
    <div ref={containerRef}>
      <CoverSection />
      <IntroSection />
      <CultureSection />
      <CostumeSection />
      <FoodSection />
      <DrinksSection />
      <TourismTeaserSection />
      <PlacesSection />
      <ContactSection />
    </div>
  );
};

import React, { useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGsapAnimations } from '../hooks/useGsapAnimations';
import { CoverSection } from '../components/sections/CoverSection';
import { IntroSection } from '../components/sections/IntroSection';
import { CostumeSection } from '../components/sections/CostumeSection';
import { FoodSection } from '../components/sections/FoodSection';
import { TourismTeaserSection } from '../components/sections/TourismTeaserSection';
import { HowItWorksSection } from '../components/sections/HowItWorksSection';
import { FeaturesSection } from '../components/sections/FeaturesSection';
import { FaqSection } from '../components/sections/FaqSection';
import { AboutSection } from '../components/sections/AboutSection';
import { CtaBandSection } from '../components/sections/CtaBandSection';
import { HomeNewsSection } from '../components/sections/HomeNewsSection';
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
      <CostumeSection />
      <FoodSection />
      <TourismTeaserSection />
      <HowItWorksSection />
      <FeaturesSection />
      <FaqSection />
      <AboutSection />
      <HomeNewsSection />
      <CtaBandSection />
      <ContactSection />
    </div>
  );
};

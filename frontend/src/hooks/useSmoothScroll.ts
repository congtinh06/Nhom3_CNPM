import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

const isNativeScrollRoute = (pathname: string): boolean => {
  return (
    pathname.startsWith('/quan-tri') ||
    pathname.startsWith('/diem-du-lich') ||
    pathname.startsWith('/thuyet-minh') ||
    pathname.startsWith('/gan-toi') ||
    pathname.startsWith('/van-hoa') ||
    pathname.startsWith('/culture') ||
    pathname.startsWith('/kham-pha') ||
    pathname.startsWith('/explore')
  );
};

export const useSmoothScroll = () => {
  const location = useLocation();

  useEffect(() => {
    // 1. If user prefers reduced motion, or if route requires native scrolling
    // (such as /diem-du-lich which features sticky split-columns and Leaflet map),
    // disable Lenis to prevent scroll-momentum jitter and layout thrashing.
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      isNativeScrollRoute(location.pathname)
    ) {
      document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped');
      document.body.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped');
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    window.__lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      delete window.__lenis;
      document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped');
      document.body.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped');
    };
  }, [location.pathname]);
};

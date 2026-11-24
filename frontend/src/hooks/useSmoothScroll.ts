import { useEffect, useRef } from 'react';
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

const AUTH_MODAL_PATHS = ['/dang-nhap', '/dang-ky', '/quen-mat-khau'];
const isAuthModalPath = (pathname: string): boolean => AUTH_MODAL_PATHS.includes(pathname);

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

  const currentPathRef = useRef(location.pathname);
  currentPathRef.current = location.pathname;

  const lenisRef = useRef<Lenis | null>(null);
  const tickerRef = useRef<((time: number) => void) | null>(null);

  useEffect(() => {
    const removeClasses = () => {
      document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped');
      document.body.classList.remove('lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped');
    };

    const dispose = () => {
      if (tickerRef.current) {
        gsap.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      delete window.__lenis;
      removeClasses();
    };

    // Form đăng nhập/đăng ký chỉ là lớp phủ trên trang hiện tại. Giữ nguyên
    // Lenis thay vì destroy rồi tạo lại, tránh trang nền (và modal) bị giật.
    if (isAuthModalPath(location.pathname)) {
      return;
    }

    // Dọn instance còn sót lại (kể cả instance vừa giữ lại khi đóng modal).
    dispose();

    // 1. If user prefers reduced motion, or if route requires native scrolling
    // (such as /diem-du-lich which features sticky split-columns and Leaflet map),
    // disable Lenis to prevent scroll-momentum jitter and layout thrashing.
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      isNativeScrollRoute(location.pathname)
    ) {
      removeClasses();
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

    lenisRef.current = lenis;
    window.__lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    tickerRef.current = tickerCallback;

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      // Vừa chuyển sang route form đăng nhập: giữ Lenis cho trang nền.
      if (isAuthModalPath(currentPathRef.current)) {
        return;
      }
      dispose();
    };
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (tickerRef.current) {
        gsap.ticker.remove(tickerRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
    };
  }, []);
};

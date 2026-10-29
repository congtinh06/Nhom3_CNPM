import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const AUTH_MODAL_PATHS = ['/dang-nhap', '/dang-ky', '/quen-mat-khau'];

const isAuthModalPath = (pathname: string): boolean => AUTH_MODAL_PATHS.includes(pathname);

export const scrollToTopInstant = (smooth: boolean = false) => {
  if (typeof window === 'undefined') return;

  if (window.__lenis) {
    try {
      window.__lenis.scrollTo(0, { immediate: !smooth, force: true });
    } catch {
      // Bỏ qua nếu Lenis đang trong quá trình huỷ hoặc khởi động
    }
  }

  const html = document.documentElement;
  const previousBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = smooth ? 'smooth' : 'auto';
  window.scrollTo(0, 0);
  html.scrollTop = 0;
  if (document.body) {
    document.body.scrollTop = 0;
  }
  html.style.scrollBehavior = previousBehavior;
};

/**
 * Reset scroll on route change and browser reload.
 *
 * React Router keeps the window scroll position when only the route changes.
 * Without this hook, navigating from a scrolled page (footer links, account
 * menu, etc.) or reloading lands the user in the middle of the next page.
 *
 * Auth modal routes are skipped so opening/closing the login dialog keeps the
 * underlying page exactly where it was.
 */
export const useScrollRestoration = () => {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const firstRunRef = useRef(true);
  const authBackgroundPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
    } catch {
      // Ignored
    }
  }, []);

  useLayoutEffect(() => {
    const previousPath = previousPathRef.current;
    previousPathRef.current = location.pathname;

    const scheduleResets = () => {
      // 1. Reset ngay lập tức trong layout effect
      scrollToTopInstant(false);

      // 2. Reset ở animation frame tiếp theo khi DOM đã gắn kết
      const rafId = window.requestAnimationFrame(() => {
        scrollToTopInstant(false);
      });

      // 3. Reset sau 60ms, 180ms, 350ms đề phòng các route chunk lazy load (Suspense)
      // hay ảnh tải về làm thay đổi layout height
      const t1 = window.setTimeout(() => scrollToTopInstant(false), 60);
      const t2 = window.setTimeout(() => scrollToTopInstant(false), 180);
      const t3 = window.setTimeout(() => scrollToTopInstant(false), 350);

      return () => {
        window.cancelAnimationFrame(rafId);
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
      };
    };

    if (firstRunRef.current) {
      firstRunRef.current = false;
      if (isAuthModalPath(location.pathname)) {
        const backgroundPath = (
          location.state as { backgroundLocation?: { pathname?: string } } | null
        )?.backgroundLocation?.pathname;
        authBackgroundPathRef.current = backgroundPath ?? null;
      }
      if (!location.hash) {
        return scheduleResets();
      }
      return;
    }

    if (isAuthModalPath(location.pathname)) {
      // Remember the page behind the dialog so closing it does not jump.
      const backgroundPath = (
        location.state as { backgroundLocation?: { pathname?: string } } | null
      )?.backgroundLocation?.pathname;
      authBackgroundPathRef.current = backgroundPath ?? null;
      return;
    }

    if (isAuthModalPath(previousPath)) {
      const backgroundPath = authBackgroundPathRef.current;
      authBackgroundPathRef.current = null;
      // Closing the dialog back onto its background page: keep scroll.
      if (backgroundPath && backgroundPath === location.pathname) {
        return;
      }
      // Leaving the dialog for a real page (e.g. the QR scanner): scroll top.
    }

    if (location.hash) {
      // Pages with in-page anchors handle their own scrolling.
      return;
    }

    return scheduleResets();
  }, [location.pathname, location.hash, location.key]);
};

export default useScrollRestoration;

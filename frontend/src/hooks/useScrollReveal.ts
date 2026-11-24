import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const REVEAL_SELECTOR = '[data-reveal]';
const REVEAL_READY_CLASS = 'reveal-ready';

/**
 * Reveals `[data-reveal]` blocks as they scroll into view.
 *
 * CSS only hides them while `<html>` carries `reveal-ready`, and that class is
 * added in a layout effect right before paint. Pages rendered outside the app
 * shell (tests, isolated components) therefore stay fully visible.
 *
 * Users who prefer reduced motion, and browsers without IntersectionObserver,
 * get every block revealed immediately instead of animated.
 */
export const useScrollReveal = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const revealAll = () => {
      root.classList.remove(REVEAL_READY_CLASS);
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
        el.classList.add('is-revealed');
      });
    };

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      revealAll();
      return;
    }

    root.classList.add(REVEAL_READY_CLASS);

    const observed = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Reveal on first contact, and also when the block is already above
          // the viewport (anchor jumps, restored scroll positions) so nothing
          // is left permanently invisible.
          const passedAbove = entry.boundingClientRect.bottom <= 0;
          if (!entry.isIntersecting && !passedAbove) continue;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -48px 0px' }
    );

    let frame = 0;
    const scan = () => {
      frame = 0;
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
        if (el.classList.contains('is-revealed') || observed.has(el)) return;
        observed.add(el);
        observer.observe(el);
      });
    };
    const scheduleScan = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(scan);
    };

    scan();

    // Lazy routes and async lists add their blocks after this effect runs.
    const mutationObserver = new MutationObserver(scheduleScan);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [location.pathname]);
};

export default useScrollReveal;

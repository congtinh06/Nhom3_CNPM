import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useGsapAnimations = (containerRef: React.RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    (window as unknown as { __cards?: () => void }).__cards = () => {
      gsap.fromTo(
        '.cd',
        { y: 50, opacity: 0, scale: 0.94 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.55,
          stagger: 0.07,
          ease: 'power2.out',
          overwrite: true,
          clearProps: 'transform,opacity',
        }
      );
    };

    (window as unknown as { __pop?: () => void }).__pop = () => {
      gsap.fromTo('#cb', { scale: 1.3 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
    };

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        // Sections with photos and text
        const sections = root.querySelectorAll<HTMLElement>('.s');
        sections.forEach((s) => {
          const phs = s.querySelectorAll<HTMLElement>('.ph');
          if (!phs.length || s.classList.contains('sp') || s.classList.contains('od')) return;

          gsap.fromTo(
            phs,
            {
              clipPath: 'inset(3% 2% 3% 2% round 6px)',
              scale: 0.98,
            },
            {
              clipPath: 'inset(0% 0% 0% 0% round 0px)',
              scale: 1,
              duration: 0.75,
              stagger: 0.05,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: s,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
            }
          );

          const h2 = s.querySelector('h2');
          if (h2) {
            const isCostume = s.classList.contains('cos');
            gsap.fromTo(
              h2,
              { x: isCostume ? 45 : -45, opacity: 0 },
              {
                x: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: s,
                  start: 'top 85%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }

          const ps = s.querySelectorAll('p');
          if (ps.length > 0) {
            gsap.fromTo(
              ps,
              { y: 24, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.05,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: s,
                  start: 'top 85%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }

          if (s.classList.contains('food')) {
            const topRow = s.querySelector('.t');
            const bottomRow = s.querySelector('.b');
            if (topRow) {
              gsap.fromTo(
                topRow,
                { xPercent: -20 },
                {
                  xPercent: 0,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: s,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.2,
                  },
                }
              );
            }
            if (bottomRow) {
              gsap.fromTo(
                bottomRow,
                { xPercent: 20 },
                {
                  xPercent: 0,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: s,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.2,
                  },
                }
              );
            }
          }

          if (s.classList.contains('pl')) {
            const fourPhs = s.querySelectorAll('.four .ph');
            if (fourPhs.length > 0) {
              gsap.fromTo(
                fourPhs,
                { y: 65, rotate: (i: number) => (i % 2 ? 4 : -4), opacity: 0 },
                {
                  y: 0,
                  rotate: 0,
                  opacity: 1,
                  duration: 0.85,
                  stagger: 0.08,
                  ease: 'power3.out',
                  scrollTrigger: {
                    trigger: s,
                    start: 'top 82%',
                    toggleActions: 'play none none reverse',
                  },
                }
              );
            }
          }
        });

        // Parallax for big photos
        const parallaxIms = root.querySelectorAll('.big .im, .four .im');
        parallaxIms.forEach((im) => {
          gsap.to(im, {
            yPercent: -10,
            ease: 'none',
            scrollTrigger: {
              trigger: im.parentElement,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2,
            },
          });
        });

        // Places section entrance
        const sp = root.querySelector('#diem-den');
        if (sp) {
          const h2 = sp.querySelector('h2');
          if (h2) {
            gsap.fromTo(
              h2,
              { x: -45, opacity: 0 },
              {
                x: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: sp,
                  start: 'top 85%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }
          const ct = sp.querySelector('.ct');
          if (ct) {
            gsap.fromTo(
              ct,
              { y: 25, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: sp,
                  start: 'top 85%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }
          const cg = sp.querySelector('.cg');
          if (cg) {
            ScrollTrigger.create({
              trigger: cg,
              start: 'top 88%',
              once: true,
              onEnter: () => {
                const runCards = (window as unknown as { __cards?: () => void }).__cards;
                if (typeof runCards === 'function') runCards();
              },
            });
          }
        }

        // Contact section entrance
        const ft = root.querySelector('.ft');
        if (ft) {
          gsap.fromTo(
            ft,
            { scale: 0.97, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.85,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: ft,
                start: 'top 88%',
                toggleActions: 'play none none reverse',
              },
            }
          );

          const leftChildren = ft.querySelectorAll('.ft > div > *');
          if (leftChildren.length > 0) {
            gsap.fromTo(
              leftChildren,
              { x: -40, opacity: 0 },
              {
                x: 0,
                opacity: 1,
                duration: 0.75,
                stagger: 0.08,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: ft,
                  start: 'top 88%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }

          const formChildren = ft.querySelectorAll('.ft form > *');
          if (formChildren.length > 0) {
            gsap.fromTo(
              formChildren,
              { y: 30, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.75,
                stagger: 0.08,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: ft,
                  start: 'top 88%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          }
        }

        // Footer columns entrance
        const ftrCols = root.querySelectorAll('.ftr .col');
        if (ftrCols.length > 0) {
          gsap.fromTo(
            ftrCols,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.08,
              duration: 0.75,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: '.ftr',
                start: 'top 95%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        const timeoutId = setTimeout(() => {
          if (document.documentElement.scrollHeight <= window.innerHeight * 1.1) {
            ScrollTrigger.getAll().forEach((t) => t.kill(true));
            gsap.set(
              '.ph, .im, .s h2, .s p, .t, .b, .ct, .cg, .cd, .ft, .ft > div > *, .ft form > *, #cb, .ftr .col',
              { clearProps: 'all' }
            );
          }
        }, 2500);

        return () => {
          clearTimeout(timeoutId);
        };
      }, root);

      return () => {
        ctx.revert();
      };
    });

    if (document.fonts) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }

    return () => {
      mm.revert();
      delete (window as unknown as { __cards?: () => void }).__cards;
      delete (window as unknown as { __pop?: () => void }).__pop;
    };
  }, [containerRef]);
};

import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heroImg from '../../img/gioi_thieu.png';
import { useNavbarLanguage } from '../../content/languages';
import { getCoverContent } from '../../content/staticSections';

gsap.registerPlugin(ScrollTrigger);

export const CoverSection: React.FC = () => {
  const { lang } = useNavbarLanguage();
  const cover = getCoverContent(lang);
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const fit = () => {
      const t = titleRef.current, hero = heroRef.current;
      if (!t || !hero) return;
      const ctx = document.createElement('canvas').getContext('2d')!;
      ctx.font = '100px Anton';
      const cap = ctx.measureText('T').actualBoundingBoxAscent / 100 || 0.72;
      t.style.letterSpacing = '0px';
      t.style.marginRight = '0px';
      t.style.fontSize = '100px';
      const w100 = t.offsetWidth;
      const target = hero.clientWidth * (hero.clientWidth < 600 ? 0.90 : 0.86);
      let size = (100 * target) / w100;
      size = Math.min(size, (hero.clientHeight * 0.22) / cap);
      t.style.fontSize = `${size}px`;
      const n = t.querySelectorAll('span').length;
      const extra = target - t.offsetWidth;
      const ls = Math.max(0, Math.min(extra / (n - 1), size * 0.12));
      t.style.letterSpacing = `${ls}px`;
      t.style.marginRight = '0px';
      t.style.marginTop = `${size * cap * 0.22 + 4}px`;
    };

    fit();
    if (document.fonts) {
      document.fonts.ready.then(() => {
        fit();
        ScrollTrigger.refresh();
      });
    }

    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        tl.fromTo(
          '.hero-kicker',
          { y: 25, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.0, delay: 0.1 }
        )
          .fromTo(
            '.hero-title span',
            { y: 65, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, stagger: 0.025 },
            '-=0.75'
          )
          .fromTo(
            '.hero-date',
            { y: 25, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.0 },
            '-=0.8'
          );

        gsap.to('.hero-wrap', {
          y: -80,
          opacity: 0,
          scale: 0.96,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: '75% top',
            scrub: 1.2,
          },
        });

        gsap.to('.hero-bg', {
          yPercent: 12,
          scale: 1.04,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.2,
          },
        });
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" id="top" ref={heroRef}>
      <img className="hero-bg" src={heroImg} alt="Sài Gòn" />
      <div className="hero-shade" />
      <div className="hero-block">
        <div className="hero-wrap">
          <p className="hero-kicker">{cover.kicker}</p>
          <h1 className="hero-title" ref={titleRef} aria-label={cover.title}>
            {cover.title.split('').map((c, i) => (
              <span key={i} aria-hidden="true">
                {c === ' ' ? '\u00A0' : c}
              </span>
            ))}
          </h1>
          <p className="hero-date">{cover.date}</p>
        </div>
      </div>
    </section>
  );
};

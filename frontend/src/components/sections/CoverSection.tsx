import React, { useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heroImg from '../../img/gioi_thieu.png';
import { useHomeI18n } from '../../content/homeI18n';

gsap.registerPlugin(ScrollTrigger);

export const CoverSection: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { t } = useHomeI18n();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        tl.fromTo(
          '.hero-kicker',
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, delay: 0.1 }
        )
          .fromTo(
            '.hero-title',
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.0 },
            '-=0.55'
          )
          .fromTo(
            '.hero-desc',
            { y: 28, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9 },
            '-=0.6'
          )
          .fromTo(
            '.hero-cta > *',
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, stagger: 0.12 },
            '-=0.5'
          );

        gsap.to('.hero-wrap', {
          y: -60,
          opacity: 0,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: '70% top',
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
      <img className="hero-bg" src={heroImg} alt="" aria-hidden="true" />
      <div className="hero-shade" />
      <div className="hero-block">
        <div className="hero-wrap">
          <p className="hero-kicker">{t.heroKicker}</p>
          <h1 className="hero-title">{t.heroTitle}</h1>
          <p className="hero-desc">{t.heroDesc}</p>
          <div className="hero-cta">
            <Link className="hero-btn hero-btn-primary" to="/diem-du-lich">
              {t.heroCtaPrimary}
            </Link>
            <Link className="hero-btn hero-btn-secondary" to="/quet-ma">
              {t.heroCtaSecondary}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

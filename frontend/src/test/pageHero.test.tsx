import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageHero } from '../components/common/PageHero';

describe('PageHero component', () => {
  const defaultProps = {
    eyebrow: 'TUYẾN THUYẾT MINH · 5 ĐIỂM',
    title: 'Điểm du lịch Sài Gòn',
    subtitle: 'Khám phá các điểm đến di sản nổi tiếng tại trung tâm Thành phố Hồ Chí Minh',
    imageSrc: '/hero/hero-diem-du-lich.webp',
    imageSrcMobile: '/hero/hero-diem-du-lich-mobile.webp',
  };

  it('renders title, eyebrow, subtitle and exactly one H1', () => {
    const { container } = render(<PageHero {...defaultProps} />);

    expect(screen.getByText('TUYẾN THUYẾT MINH · 5 ĐIỂM')).toBeInTheDocument();
    expect(screen.getByText('Điểm du lịch Sài Gòn')).toBeInTheDocument();
    expect(
      screen.getByText('Khám phá các điểm đến di sản nổi tiếng tại trung tâm Thành phố Hồ Chí Minh')
    ).toBeInTheDocument();

    const h1Elements = container.querySelectorAll('h1');
    expect(h1Elements).toHaveLength(1);
    expect(h1Elements[0]!).toHaveClass('page-hero-title');
    expect(h1Elements[0]!.textContent).toBe('Điểm du lịch Sài Gòn');
  });

  it('renders decorative image with alt="", explicit dimensions, and responsive source', () => {
    const { container } = render(<PageHero {...defaultProps} />);

    const img = container.querySelector('img.page-hero-img') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('width')).toBe('2400');
    expect(img.getAttribute('height')).toBe('1200');
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('decoding')).toBe('async');

    const source = container.querySelector('picture source');
    expect(source).toBeInTheDocument();
    expect(source?.getAttribute('srcset')).toBe('/hero/hero-diem-du-lich-mobile.webp');
  });

  it('renders rightSlot when provided', () => {
    render(
      <PageHero
        {...defaultProps}
        rightSlot={<span data-testid="test-right-slot">THỨ HAI, 12 THÁNG 10, 2026</span>}
      />
    );

    expect(screen.getByTestId('test-right-slot')).toBeInTheDocument();
    expect(screen.getByText('THỨ HAI, 12 THÁNG 10, 2026')).toBeInTheDocument();
  });

  it('renders image credit when provided and image is valid', () => {
    render(<PageHero {...defaultProps} imageCredit="Sài Gòn Voice Heritage" />);
    expect(screen.getByText('Ảnh: Sài Gòn Voice Heritage')).toBeInTheDocument();
  });

  it('falls back to decorative tile pattern when image fails to load (onError)', () => {
    const { container } = render(
      <PageHero {...defaultProps} imageCredit="Some Photographer" />
    );

    const img = container.querySelector('img.page-hero-img') as HTMLImageElement;
    expect(img).toBeInTheDocument();

    // Trigger onError simulation
    fireEvent.error(img);

    // Fallback banner should now be visible
    const fallback = container.querySelector('.page-hero-fallback');
    expect(fallback).toBeInTheDocument();

    // Title and text must remain intact and legible
    expect(screen.getByText('Điểm du lịch Sài Gòn')).toBeInTheDocument();
    expect(screen.getByText('TUYẾN THUYẾT MINH · 5 ĐIỂM')).toBeInTheDocument();

    // Credit is hidden on fallback to avoid misleading attribution
    expect(container.querySelector('.page-hero-credit')).toBeNull();
  });

  it('falls back immediately when imageSrc is empty', () => {
    const { container } = render(
      <PageHero
        eyebrow="HỖ TRỢ & GÓP Ý"
        title="Liên hệ"
        subtitle="Góp ý, báo lỗi bản dịch, cần hỗ trợ hoặc hợp tác cùng dự án."
        imageSrc=""
      />
    );

    const fallback = container.querySelector('.page-hero-fallback');
    expect(fallback).toBeInTheDocument();
    expect(screen.getByText('Liên hệ')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});

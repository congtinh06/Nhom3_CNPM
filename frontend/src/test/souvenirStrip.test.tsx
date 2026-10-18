import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SouvenirStrip } from '../components/souvenir/SouvenirStrip';

describe('SouvenirStrip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ẩn hoàn toàn khi điểm du lịch chưa có quà lưu niệm', () => {
    const { container } = render(
      <MemoryRouter>
        <SouvenirStrip poiSlug="cho-ben-thanh" lang="vi" />
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Quà lưu niệm tại điểm này')).not.toBeInTheDocument();

    cleanup();
  });

  it('ẩn khi không có điểm du lịch (poiSlug rỗng)', () => {
    const { container } = render(
      <MemoryRouter>
        <SouvenirStrip poiSlug={null} lang="vi" />
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });
});

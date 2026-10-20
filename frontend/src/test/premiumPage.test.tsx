import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PremiumPage } from '../pages/PremiumPage';
import { PremiumProvider, PREMIUM_STORAGE_KEY } from '../context/PremiumContext';
import { getStoredLanguage, setStoredLanguage } from '../content/languages';

function renderPremium(initialRoute = '/nang-cap') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <PremiumProvider>
        <Routes>
          <Route path="/nang-cap" element={<PremiumPage />} />
          <Route path="/diem-du-lich" element={<div>Danh sách điểm đến</div>} />
        </Routes>
      </PremiumProvider>
    </MemoryRouter>
  );
}

describe('PremiumPage', () => {
  beforeEach(() => {
    localStorage.clear();
    setStoredLanguage('vi');
  });

  it('renders Premium benefits and all five stops', () => {
    const { container } = renderPremium();

    expect(screen.getByRole('heading', { name: 'Quyền lợi Premium' })).toBeInTheDocument();
    expect(container.querySelectorAll('.premium-poi-card')).toHaveLength(5);
    expect(screen.getByText('Dinh Độc Lập')).toBeInTheDocument();
    expect(screen.getByText('Bảo tàng Chứng tích Chiến tranh')).toBeInTheDocument();
  });

  it('activates Premium, keeps the requested language, and returns to the previous page', () => {
    renderPremium('/nang-cap?lang=en&returnTo=/diem-du-lich');

    expect(screen.getByText(/Bạn đã chọn ngôn ngữ cần Premium/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Mở khóa Premium' })[0]!);

    expect(localStorage.getItem(PREMIUM_STORAGE_KEY)).toBe('1');
    expect(getStoredLanguage()).toBe('en');
    expect(screen.getByText('Danh sách điểm đến')).toBeInTheDocument();
  });

  it('deactivates Premium and falls back to Vietnamese', () => {
    localStorage.setItem(PREMIUM_STORAGE_KEY, '1');
    setStoredLanguage('en');
    renderPremium();

    fireEvent.click(
      screen.getByRole('button', { name: 'Deactivate on this device' })
    );

    expect(localStorage.getItem(PREMIUM_STORAGE_KEY)).toBeNull();
    expect(getStoredLanguage()).toBe('vi');
  });
});

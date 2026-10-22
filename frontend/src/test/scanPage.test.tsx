import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { api } from '../api/client';
import { PoiDetail } from '../types';
import { PremiumProvider } from '../context/PremiumContext';

const { playAudioMock, stopAudioMock, authState } = vi.hoisted(() => ({
  playAudioMock: vi.fn(),
  stopAudioMock: vi.fn(),
  authState: { premium: true },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    status: 'authenticated',
    isAuthenticated: true,
    user: {
      id: 1,
      email: 'user@example.com',
      fullName: 'Người dùng Echora',
      role: 'USER',
      emailVerified: true,
      plan: authState.premium ? 'PREMIUM' : 'FREE',
      premiumActive: authState.premium,
    },
    reloadUser: vi.fn(),
  }),
}));

vi.mock('../hooks/useAudioPlayer', () => ({
  useAudioPlayer: () => ({
    playAudio: playAudioMock,
    stopAudio: stopAudioMock,
    isPlaying: () => false,
    playingPoiId: null,
    playerState: 'idle',
  }),
}));

vi.mock('../lib/audioUnlock', () => ({
  unlockAudio: vi.fn(),
  getSharedAudio: vi.fn(),
}));

import { ScanPage } from '../pages/ScanPage';

const mockDetail = {
  id: 1,
  code: 'POI_DINH_DOC_LAP_01',
  qrToken: 'qr-dinh-doc-lap-01',
  name: 'Dinh Độc Lập',
  title: 'Dinh Độc Lập',
  summary: 'Tóm tắt',
  description: 'Mô tả chi tiết',
  languageCode: 'vi',
  latitude: 10.77695,
  longitude: 106.69537,
  triggerRadiusMeters: 50,
  zoneId: 1,
  zoneCode: 'Z1',
  categoryCode: 'C1',
  categoryNameVi: 'Di tích lịch sử',
  audioStatus: 'PENDING',
  fallbackLanguage: false,
} as unknown as PoiDetail;

async function renderScanPage() {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={['/qr/qr-dinh-doc-lap-01']}>
        <PremiumProvider>
          <Routes>
            <Route path="/qr/:token" element={<ScanPage />} />
            <Route path="/nang-cap" element={<div>Trang nâng cấp Premium</div>} />
          </Routes>
        </PremiumProvider>
      </MemoryRouter>
    );
  });
}

describe('ScanPage language chips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    authState.premium = true;
    vi.spyOn(api, 'getPoiByQr').mockResolvedValue(mockDetail);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stops audio and resets the listen button when the language chip changes', async () => {
    await renderScanPage();

    fireEvent.click(screen.getByRole('button', { name: 'Bấm để nghe' }));
    expect(playAudioMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    });

    expect(stopAudioMock).toHaveBeenCalledTimes(1);
    expect(playAudioMock).toHaveBeenCalledTimes(1);
    expect(api.getPoiByQr).toHaveBeenLastCalledWith('qr-dinh-doc-lap-01', 'en');
    expect(screen.getByRole('button', { name: 'Bấm để nghe' })).toBeInTheDocument();
  });

  it('does not stop audio when the already active chip is clicked again', async () => {
    await renderScanPage();

    fireEvent.click(screen.getByRole('button', { name: 'Bấm để nghe' }));
    expect(playAudioMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'VI' }));

    expect(stopAudioMock).not.toHaveBeenCalled();
    expect(playAudioMock).toHaveBeenCalledTimes(1);
  });

  it('routes free users to Premium instead of loading a locked language', async () => {
    authState.premium = false;
    await renderScanPage();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    });

    expect(screen.getByText('Trang nâng cấp Premium')).toBeInTheDocument();
    expect(api.getPoiByQr).not.toHaveBeenLastCalledWith('qr-dinh-doc-lap-01', 'en');
  });
});

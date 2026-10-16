import { ComponentProps } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PoiAudioStatusPanel } from '../admin/components/PoiAudioStatusPanel';
import { poiApi } from '../admin/api/poiApi';
import { AdminPoiTranslation } from '../admin/types/poi';
import { AxiosError, AxiosHeaders } from 'axios';

vi.mock('../admin/api/poiApi', () => ({
  poiApi: {
    republish: vi.fn(),
  },
}));

const translations: Record<string, AdminPoiTranslation> = {
  vi: { languageCode: 'vi', title: 'Chợ Bến Thành', summary: '', description: '', audioStatus: 'READY', audioDurationSeconds: 30 },
  en: { languageCode: 'en', title: 'Ben Thanh', summary: '', description: '', audioStatus: 'PENDING' },
  ko: { languageCode: 'ko', title: '벤탄', summary: '', description: '', audioStatus: 'FAILED_TTS' },
};

const renderPanel = (overrides: Partial<ComponentProps<typeof PoiAudioStatusPanel>> = {}) => {
  const onReload = vi.fn().mockResolvedValue(undefined);
  render(
    <PoiAudioStatusPanel
      poiId={5}
      publishStatus="PUBLISHED"
      publishAttempts={2}
      lastPublishAttemptAt="2026-01-02T03:04:05Z"
      translations={translations}
      onReload={onReload}
      reloading={false}
      {...overrides}
    />
  );
  return { onReload };
};

describe('PoiAudioStatusPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hiển thị trạng thái phát hành và trạng thái audio theo từng ngôn ngữ', () => {
    renderPanel();

    expect(screen.getByText('Đã phát')).toBeInTheDocument();
    expect(screen.getByText('Số lần thử: 2')).toBeInTheDocument();
    expect(screen.getByText('Sẵn sàng')).toBeInTheDocument();
    expect(screen.getByText('Tiếng Việt')).toBeInTheDocument();
    expect(screen.getByText('Tiếng Nhật')).toBeInTheDocument();
    expect(screen.getByText('Chưa có bản dịch')).toBeInTheDocument();
    expect(screen.getByText('Lỗi tổng hợp')).toBeInTheDocument();
  });

  it('hiển thị cảnh báo tiếng Việt khi phát hành thất bại', () => {
    renderPanel({ publishStatus: 'FAILED', publishAttempts: 1 });

    expect(screen.getByText('Thất bại')).toBeInTheDocument();
    expect(
      screen.getByText(/quá trình phát hành thuyết minh cho điểm này đã thất bại/i)
    ).toBeInTheDocument();
  });

  it('hủy hộp thoại thì không gọi phát hành lại', async () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: /phát hành lại/i }));
    await screen.findByRole('heading', { name: /xác nhận phát hành lại thuyết minh/i });

    fireEvent.click(screen.getByRole('button', { name: /hủy bỏ/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /xác nhận phát hành lại thuyết minh/i })
      ).not.toBeInTheDocument();
    });
    expect(poiApi.republish).not.toHaveBeenCalled();
  });

  it('xác nhận phát hành lại thành công, báo thành công và tải lại dữ liệu', async () => {
    vi.mocked(poiApi.republish).mockResolvedValueOnce({
      poiId: 5,
      poiCode: 'BEN_THANH',
      publishStatus: 'PUBLISHED',
    });
    const { onReload } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: /phát hành lại/i }));
    fireEvent.click(
      await screen.findByRole('button', { name: /xác nhận phát hành lại/i })
    );

    await waitFor(() => {
      expect(poiApi.republish).toHaveBeenCalledWith(5);
      expect(screen.getByRole('status')).toHaveTextContent(/đã gửi yêu cầu phát hành lại/i);
      expect(onReload).toHaveBeenCalledTimes(1);
    });
  });

  it('hiển thị lỗi tiếng Việt khi phát hành lại thất bại', async () => {
    const axios500 = new AxiosError(
      'Request failed with status code 500',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      {
        status: 500,
        statusText: 'Internal Server Error',
        data: {},
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    );
    vi.mocked(poiApi.republish).mockRejectedValueOnce(axios500);
    const { onReload } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: /phát hành lại/i }));
    fireEvent.click(
      await screen.findByRole('button', { name: /xác nhận phát hành lại/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/không thể phát hành lại: máy chủ đang gặp sự cố/i)
      ).toBeInTheDocument();
      expect(onReload).not.toHaveBeenCalled();
    });
  });
});

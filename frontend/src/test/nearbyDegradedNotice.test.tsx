import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  NEARBY_DEGRADED_FALLBACK,
  NearbyDegradedNotice,
} from '../components/nearby/NearbyDegradedNotice';

describe('NearbyDegradedNotice', () => {
  it('renders the server notice and retries on demand', () => {
    const onRetry = vi.fn();

    render(
      <NearbyDegradedNotice
        notice="Không thể tải danh sách điểm gần bạn lúc này. Vui lòng thử lại sau."
        onRetry={onRetry}
      />
    );

    expect(screen.getByTestId('nearby-degraded-notice')).toBeInTheDocument();
    expect(screen.getByText(/Vui lòng thử lại sau/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('uses a friendly fallback when the server sends no notice', () => {
    render(<NearbyDegradedNotice />);

    expect(screen.getByText(NEARBY_DEGRADED_FALLBACK)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
  });
});

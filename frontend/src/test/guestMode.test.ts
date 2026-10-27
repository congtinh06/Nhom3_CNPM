import { describe, it, expect, beforeEach } from 'vitest';
import {
  enterGuestMode,
  exitGuestMode,
  isGuestMode,
  useGuestMode,
} from '../lib/guestMode';
import { renderHook, act } from '@testing-library/react';

describe('guestMode (chế độ Khách có chủ đích)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('mặc định KHÔNG ở chế độ Khách (người mới truy cập)', () => {
    expect(isGuestMode()).toBe(false);
  });

  it('enterGuestMode() bật flag và phát sự kiện thay đổi', () => {
    let changed = false;
    window.addEventListener('echora-guest-mode-changed', () => {
      changed = true;
    });

    act(() => {
      enterGuestMode();
    });

    expect(isGuestMode()).toBe(true);
    expect(changed).toBe(true);
  });

  it('exitGuestMode() gỡ flag và chỉ phát sự kiện khi trước đó có flag', () => {
    let changes = 0;
    window.addEventListener('echora-guest-mode-changed', () => {
      changes += 1;
    });

    act(() => {
      enterGuestMode();
      exitGuestMode();
    });

    expect(isGuestMode()).toBe(false);
    expect(changes).toBe(2);

    act(() => {
      exitGuestMode();
    });
    expect(changes).toBe(2);
  });

  it('useGuestMode() phản ứng khi flag đổi giữa chừng', () => {
    const { result } = renderHook(() => useGuestMode());
    expect(result.current).toBe(false);

    act(() => {
      enterGuestMode();
    });
    expect(result.current).toBe(true);

    act(() => {
      exitGuestMode();
    });
    expect(result.current).toBe(false);
  });
});

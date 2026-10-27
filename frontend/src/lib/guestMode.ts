import { useEffect, useState } from 'react';

/**
 * Chế độ Khách "có chủ đích": đánh dấu trình duyệt đang dùng thử Echora với tư cách Khách
 * (quét QR guest hoặc bấm "Tiếp tục với tư cách Khách").
 * - Lưu cả sessionStorage và localStorage để duy trì qua các tab/reload, tự đồng bộ qua các tab.
 * - Được AuthContext gỡ khi người dùng đăng nhập/đăng ký thật.
 */
const STORAGE_KEY = 'echora_guest_mode';
const CHANGE_EVENT = 'echora-guest-mode-changed';

export function isGuestMode(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return (
      window.sessionStorage.getItem(STORAGE_KEY) === '1' ||
      window.localStorage.getItem(STORAGE_KEY) === '1'
    );
  } catch {
    return false;
  }
}

export function enterGuestMode(): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, '1');
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Storage chặn (chế độ riêng tư)...: chỉ cần thông báo thay đổi cho listeners hiện tại.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function exitGuestMode(): void {
  let existed = false;
  try {
    existed =
      window.sessionStorage.getItem(STORAGE_KEY) === '1' ||
      window.localStorage.getItem(STORAGE_KEY) === '1';
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Bỏ qua.
  }
  if (existed) {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

/** Hook: đăng ký theo dõi sự kiện mode-khách thay đổi. */
export function useGuestMode(): boolean {
  const [guest, setGuest] = useState(isGuestMode);

  useEffect(() => {
    const sync = () => setGuest(isGuestMode());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return guest;
}

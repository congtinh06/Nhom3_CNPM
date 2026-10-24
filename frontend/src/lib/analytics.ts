export const ANALYTICS_SESSION_KEY = 'sv:session_id';
const VISIT_RECORDED_KEY = 'sv:visit_recorded_session';

export type VisitTrigger = 'QR' | 'DIRECT';

export function getAnalyticsSessionId(): string {
  try {
    let sid = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
      sessionStorage.setItem(ANALYTICS_SESSION_KEY, sid);
    }
    return sid;
  } catch (err) {
    console.warn('[analytics] sessionStorage unavailable, using default session id', err);
    return 'sid_default';
  }
}

/**
 * Lượt truy cập này đến từ quét mã QR (trang /qr/:token hay /quet-ma)
 * hay từ người dùng tự mở web (DIRECT).
 */
export function getVisitTrigger(pathname: string): VisitTrigger {
  return pathname.startsWith('/qr/') || pathname.startsWith('/quet-ma')
    ? 'QR'
    : 'DIRECT';
}

/**
 * Đánh dấu phiên đã ghi nhận lượt truy cập VISIT (mỗi phiên tab chỉ 1 lần
 * để không phồng số liệu). Trả về false nếu đã ghi trong phiên này.
 */
export function markVisitRecorded(): boolean {
  try {
    if (sessionStorage.getItem(VISIT_RECORDED_KEY)) {
      return false;
    }
    sessionStorage.setItem(VISIT_RECORDED_KEY, '1');
    return true;
  } catch {
    // sessionStorage không khả dụng: cứ gửi (client sẽ bị rate-limit ở gateway).
    return true;
  }
}

/** Ngôn ngữ đang chọn trên thiết bị (mặc định tiếng Việt). */
export function getClientLanguage(): 'vi' | 'en' | 'ja' | 'ko' {
  try {
    const saved = localStorage.getItem('sv:lang');
    if (saved && ['vi', 'en', 'ja', 'ko'].includes(saved)) {
      return saved as 'vi' | 'en' | 'ja' | 'ko';
    }
  } catch {
    // localStorage không khả dụng
  }
  return 'vi';
}

/**
 * Origin dùng để nhúng vào mã QR (đăng nhập bằng QR và QR của địa điểm).
 *
 * - Ưu tiên `VITE_QR_BASE_URL` khi được cấu hình. Đặt về URL HTTPS của tunnel
 *   (ví dụ ngrok: https://xyz.ngrok-free.app) để điện thoại quét được mã mà
 *   không bị chặn bởi IP LAN / Google OAuth.
 * - Không cấu hình thì dùng đúng origin của trang đang mở
 *   (ví dụ http://localhost:5173 khi chạy dev trên máy tính).
 *
 * Không tự đổi sang IP LAN (192.168.x.x) vì sẽ lệch origin với Google OAuth
 * và với phiên đăng nhập đang mở trên trình duyệt.
 */
export function resolveQrBaseUrl(): string {
  const configured = import.meta.env?.VITE_QR_BASE_URL;

  if (typeof configured === 'string' && configured.trim()) {
    return configured.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

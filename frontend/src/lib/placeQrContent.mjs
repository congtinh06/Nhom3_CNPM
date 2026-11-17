// Shared QR content builder used by BOTH the Vite frontend (PlaceQR component)
// and the Node tooling (scripts/generate-qr.mjs).
//
// Keep this file dependency-free, plain ESM so it can be imported from the
// browser bundle and from Node without any transform step.

/**
 * Remove trailing slashes from a base URL so segments join cleanly.
 * @param {string | null | undefined} baseUrl
 * @returns {string}
 */
export function normalizeQrBaseUrl(baseUrl) {
  return String(baseUrl ?? '').trim().replace(/\/+$/, '');
}

/** Ánh xạ mã token sang slug chuẩn của 7 điểm du lịch */
const TOKEN_TO_SLUG = {
  'qr-dinh-doc-lap-01': 'dinh-doc-lap',
  'qr-duc-ba-01': 'nha-tho-duc-ba',
  'qr-buu-dien-01': 'buu-dien-trung-tam',
  'qr-ben-thanh-01': 'cho-ben-thanh',
  'qr-bao-tang-chung-tich-01': 'bao-tang-chung-tich-chien-tranh',
  'qr-thien-hau-01': 'chua-ba-thien-hau',
  'qr-ba-son-01': 'cau-ba-son',
};

/**
 * Build the URL encoded in a POI's QR code.
 *
 * Quét mã QR dẫn trực tiếp vào giao diện web đầy đủ của điểm tham quan (/diem-du-lich?stop=<slug>),
 * hiển thị bản đồ tương tác, thanh nghe âm thanh, lộ trình gợi ý và bài thuyết minh.
 * Tham số `src=qr` đánh dấu lượt mở trang đến từ mã QR để trang điểm thuyết minh
 * ghi nhận sự kiện SCAN cho thống kê "QR nghe audio" ở trang quản trị.
 * @param {string | null | undefined} baseUrl
 * @param {string | null | undefined} qrToken
 * @param {string | null | undefined} slug
 * @returns {string}
 */
export function buildPlaceQrContent(baseUrl, qrToken, slug) {
  const token = String(qrToken ?? '').trim();
  const explicitSlug = String(slug ?? '').trim();
  const targetSlug = explicitSlug || TOKEN_TO_SLUG[token] || token;
  if (!targetSlug) return '';
  const prefix = normalizeQrBaseUrl(baseUrl);
  const path = `/diem-du-lich?stop=${encodeURIComponent(targetSlug)}&src=qr`;
  return prefix ? `${prefix}${path}` : path;
}

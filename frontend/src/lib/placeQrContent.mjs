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

/**
 * Build the URL encoded in a POI's QR code.
 *
 * Mỗi điểm có link riêng dạng <baseUrl>/diem/<slug>, nên nội dung mã QR dùng slug
 * của POI. Giữ fallback sang token (/qr/<token>) cho dữ liệu chưa có slug.
 * @param {string | null | undefined} baseUrl
 * @param {string | null | undefined} qrToken
 * @param {string | null | undefined} slug
 * @returns {string}
 */
export function buildPlaceQrContent(baseUrl, qrToken, slug) {
  const token = String(qrToken ?? '').trim();
  const targetSlug = String(slug ?? '').trim();
  if (!targetSlug && !token) return '';
  const prefix = normalizeQrBaseUrl(baseUrl);
  const path = targetSlug
    ? `/diem/${encodeURIComponent(targetSlug)}`
    : `/qr/${encodeURIComponent(token)}`;
  return prefix ? `${prefix}${path}` : path;
}

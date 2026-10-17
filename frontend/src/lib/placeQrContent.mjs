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
 * Build the URL encoded in a POI QR code. ScanPage parses the token back out of
 * the "/qr/<token>" segment, so the shape must stay: <baseUrl>/qr/<token>.
 * @param {string | null | undefined} baseUrl
 * @param {string | null | undefined} qrToken
 * @returns {string}
 */
export function buildPlaceQrContent(baseUrl, qrToken) {
  const token = String(qrToken ?? '').trim();
  if (!token) return '';
  const prefix = normalizeQrBaseUrl(baseUrl);
  const path = `/qr/${encodeURIComponent(token)}`;
  return prefix ? `${prefix}${path}` : path;
}

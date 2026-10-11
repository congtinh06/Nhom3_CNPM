// VietQR receiving account configuration.
// Values are injected via Vite env vars (VITE_VIETQR_*) so they are never
// bundled as literal secrets. The fallbacks are public test-only values used
// when the env vars are not provided (local / dev).

export const VIETQR_BANK_ID = import.meta.env.VITE_VIETQR_BANK_ID || 'VCB';
export const VIETQR_BANK_NAME = import.meta.env.VITE_VIETQR_BANK_NAME || 'Vietcombank';
export const VIETQR_ACCOUNT_NO = import.meta.env.VITE_VIETQR_ACCOUNT_NO || '1234567890';
export const VIETQR_ACCOUNT_NAME =
  import.meta.env.VITE_VIETQR_ACCOUNT_NAME || 'CONG TY SAI GON FOOD';

export const VIETQR_EXPIRY_MINUTES = 15;
export const VIETQR_POLL_INTERVAL_MS = 3000;

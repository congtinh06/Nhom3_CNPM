package com.saigonvoice.auth.security;

/**
 * Xác minh Google ID token (credential) do Google Identity Services phát hành.
 *
 * <p>Trừu tượng hóa để tầng service có thể được kiểm thử với verifier giả.</p>
 */
public interface GoogleTokenVerifier {

    /**
     * Xác minh credential và trả về định danh Google.
     *
     * @throws com.saigonvoice.auth.exception.ServiceUnavailableException khi chưa cấu hình GOOGLE_CLIENT_ID
     * @throws com.saigonvoice.auth.exception.BadRequestException          khi credential trống/quá dài
     * @throws com.saigonvoice.auth.exception.UnauthorizedException        khi token không hợp lệ
     */
    GoogleIdentity verify(String credential);
}

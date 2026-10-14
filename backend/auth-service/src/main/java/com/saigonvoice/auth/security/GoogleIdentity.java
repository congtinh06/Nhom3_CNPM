package com.saigonvoice.auth.security;

/**
 * Thông tin người dùng đã được xác minh từ Google ID token.
 * Chỉ những giá trị lấy từ token đã xác minh chữ ký/issuer/audience/hạn mới được dùng.
 *
 * @param subject       claim "sub" — định danh Google, dùng để tra cứu/lưu google_sub
 * @param email         email đã được Google xác thực (chuẩn hóa chữ thường)
 * @param emailVerified luôn true khi vượt qua xác minh (email_verified phải là true)
 * @param name          tên hiển thị từ token (có thể null)
 */
public record GoogleIdentity(String subject, String email, boolean emailVerified, String name) {
}

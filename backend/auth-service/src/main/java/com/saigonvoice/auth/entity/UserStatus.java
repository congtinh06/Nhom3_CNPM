package com.saigonvoice.auth.entity;

public enum UserStatus {
    /** Đã đăng ký nhưng chưa xác thực email. */
    PENDING,
    /** Đã xác thực email, được phép đăng nhập. */
    ACTIVE,
    /** Bị khóa, không được đăng nhập. */
    BLOCKED
}

package com.echora.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    /** Luôn được chuẩn hóa về chữ thường trước khi lưu. */
    @Column(name = "email", nullable = false, length = 320, unique = true)
    private String email;

    /** NULL đối với tài khoản chỉ đăng nhập bằng Google (không có mật khẩu). */
    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    /** Định danh Google (claim "sub"), NULL với tài khoản đăng nhập bằng mật khẩu. */
    @Column(name = "google_sub", length = 255)
    private String googleSub;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.PENDING;

    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "`plan`", nullable = false, length = 20)
    @Builder.Default
    private UserPlan plan = UserPlan.FREE;

    @Column(name = "premium_expires_at")
    private LocalDateTime premiumExpiresAt;

    @Column(name = "premium_source_order_code", length = 64)
    private String premiumSourceOrderCode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public boolean isEmailVerified() {
        return emailVerifiedAt != null;
    }

    public boolean hasActivePremium() {
        return plan == UserPlan.PREMIUM
                && (premiumExpiresAt == null || premiumExpiresAt.isAfter(LocalDateTime.now()));
    }

    public UserPlan effectivePlan() {
        return hasActivePremium() ? UserPlan.PREMIUM : UserPlan.FREE;
    }
}

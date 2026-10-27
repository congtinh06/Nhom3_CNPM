package com.echora.auth.dto;

import com.echora.auth.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * ============================================================================
 * DTO: DỮ LIỆU NGƯỜI DÙNG DÀNH CHO TRANG QUẢN TRỊ (Admin User Response DTO)
 * ============================================================================
 * 
 * Mục đích:
 * - Đại diện cho thông tin an toàn của người dùng hiển thị trên giao diện Admin.
 * - Tuyệt đối không để lộ thông tin nhạy cảm (passwordHash, googleSub...).
 * 
 * Các trường bổ sung mới để kiểm tra trạng thái Premium:
 * - `plan`: Gói tài khoản hiện tại (FREE / PREMIUM).
 * - `premiumActive`: Trạng thái hiệu lực của gói Premium (true/false).
 * - `premiumExpiresAt`: Thời điểm hết hạn gói Premium (null nếu vĩnh viễn).
 * - `premiumSourceOrderCode`: Mã đơn hàng kích hoạt gói Premium (nếu mua qua cổng thanh toán).
 * ============================================================================
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserResponse {

    public static final String PROVIDER_LOCAL = "LOCAL";
    public static final String PROVIDER_GOOGLE = "GOOGLE";
    public static final String PROVIDER_LOCAL_GOOGLE = "LOCAL_GOOGLE";

    private Long id;
    private String fullName;
    private String email;
    private String role;
    private String status;
    private String provider;
    private boolean emailVerified;
    private String plan;
    private boolean premiumActive;
    private LocalDateTime premiumExpiresAt;
    private String premiumSourceOrderCode;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;

    public static AdminUserResponse from(User user) {
        boolean hasPassword = user.getPasswordHash() != null;
        boolean hasGoogle = user.getGoogleSub() != null;

        String provider;
        if (hasPassword && hasGoogle) {
            provider = PROVIDER_LOCAL_GOOGLE;
        } else if (hasGoogle) {
            provider = PROVIDER_GOOGLE;
        } else {
            provider = PROVIDER_LOCAL;
        }

        return AdminUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .provider(provider)
                .emailVerified(user.isEmailVerified())
                .plan(user.effectivePlan().name())
                .premiumActive(user.hasActivePremium())
                .premiumExpiresAt(user.getPremiumExpiresAt())
                .premiumSourceOrderCode(user.getPremiumSourceOrderCode())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

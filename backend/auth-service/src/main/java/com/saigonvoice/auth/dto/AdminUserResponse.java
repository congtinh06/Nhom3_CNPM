package com.saigonvoice.auth.dto;

import com.saigonvoice.auth.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Thông tin người dùng trả về cho khu vực quản trị.
 *
 * <p>Không bao giờ chứa {@code passwordHash}, {@code googleSub} hay bất kỳ bí mật nào.
 * "Nhà cung cấp đăng nhập" được suy ra an toàn từ sự hiện diện của các trường nội bộ.</p>
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
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

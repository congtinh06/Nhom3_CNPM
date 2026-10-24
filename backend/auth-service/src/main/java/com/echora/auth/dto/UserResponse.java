package com.echora.auth.dto;

import com.echora.auth.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private String role;
    private boolean emailVerified;
    private String plan;
    private boolean premiumActive;
    private LocalDateTime premiumExpiresAt;
    private LocalDateTime createdAt;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .emailVerified(user.isEmailVerified())
                .plan(user.effectivePlan().name())
                .premiumActive(user.hasActivePremium())
                .premiumExpiresAt(user.getPremiumExpiresAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

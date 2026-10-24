package com.echora.auth.dto;

import com.echora.auth.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntitlementResponse {

    private Long userId;
    private String plan;
    private boolean premiumActive;
    private LocalDateTime premiumExpiresAt;

    public static EntitlementResponse from(User user) {
        return EntitlementResponse.builder()
                .userId(user.getId())
                .plan(user.effectivePlan().name())
                .premiumActive(user.hasActivePremium())
                .premiumExpiresAt(user.getPremiumExpiresAt())
                .build();
    }
}

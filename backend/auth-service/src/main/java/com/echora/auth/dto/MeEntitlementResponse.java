package com.echora.auth.dto;

import com.echora.auth.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Trả về cho du khách sau đăng nhập: trạng thái gói Premium toàn tài khoản
 * và danh sách POI đã mua lẻ (mở ngoại ngữ riêng cho từng điểm).
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeEntitlementResponse {

    private String plan;
    private boolean premiumActive;
    private LocalDateTime premiumExpiresAt;
    private List<UserPoiEntitlementResponse> purchasedPois;

    public static MeEntitlementResponse from(User user, List<UserPoiEntitlementResponse> purchasedPois) {
        return MeEntitlementResponse.builder()
                .plan(user.effectivePlan().name())
                .premiumActive(user.hasActivePremium())
                .premiumExpiresAt(user.getPremiumExpiresAt())
                .purchasedPois(purchasedPois)
                .build();
    }
}

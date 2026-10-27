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
    private boolean premium;
    private List<Long> unlockedPoiIds;
    private boolean hasAnyPurchase;

    public static MeEntitlementResponse from(User user, List<UserPoiEntitlementResponse> purchasedPois) {
        List<UserPoiEntitlementResponse> activePois = purchasedPois == null ? List.of() : purchasedPois;
        List<Long> unlockedPoiIds = activePois.stream()
                .map(UserPoiEntitlementResponse::getPoiId)
                .filter(java.util.Objects::nonNull)
                .toList();
        boolean premiumActive = user != null && user.hasActivePremium();
        return MeEntitlementResponse.builder()
                .plan(user != null ? user.effectivePlan().name() : "FREE")
                .premiumActive(premiumActive)
                .premiumExpiresAt(user != null ? user.getPremiumExpiresAt() : null)
                .purchasedPois(activePois)
                .premium(premiumActive)
                .unlockedPoiIds(unlockedPoiIds)
                .hasAnyPurchase(premiumActive || !unlockedPoiIds.isEmpty())
                .build();
    }
}

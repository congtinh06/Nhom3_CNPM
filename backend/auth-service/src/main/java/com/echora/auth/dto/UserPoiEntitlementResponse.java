package com.echora.auth.dto;

import com.echora.auth.entity.UserPoiEntitlement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPoiEntitlementResponse {

    private Long poiId;
    private LocalDateTime expiresAt;
    private Long orderId;
    private LocalDateTime paidAt;
    private LocalDateTime grantedAt;

    public static UserPoiEntitlementResponse from(UserPoiEntitlement entitlement) {
        return UserPoiEntitlementResponse.builder()
                .poiId(entitlement.getPoiId())
                .expiresAt(entitlement.getExpiresAt())
                .orderId(entitlement.getOrderId())
                .paidAt(entitlement.getPaidAt())
                .grantedAt(entitlement.getGrantedAt())
                .build();
    }
}

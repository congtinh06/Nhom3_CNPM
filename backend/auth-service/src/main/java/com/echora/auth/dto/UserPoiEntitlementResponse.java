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

    public static UserPoiEntitlementResponse from(UserPoiEntitlement entitlement) {
        return UserPoiEntitlementResponse.builder()
                .poiId(entitlement.getPoiId())
                .expiresAt(entitlement.getExpiresAt())
                .build();
    }
}

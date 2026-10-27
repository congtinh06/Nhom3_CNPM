package com.echora.auth.controller;

import com.echora.auth.dto.EntitlementResponse;
import com.echora.auth.dto.PoiGrantRequest;
import com.echora.auth.dto.PremiumActivationRequest;
import com.echora.auth.dto.UserPoiEntitlementResponse;
import com.echora.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth/internal/entitlements")
@RequiredArgsConstructor
public class InternalEntitlementController {

    private final AuthService authService;

    @GetMapping("/{userId}")
    public EntitlementResponse getEntitlement(@PathVariable Long userId) {
        return authService.entitlement(userId);
    }

    @GetMapping("/{userId}/pois")
    public List<UserPoiEntitlementResponse> getPoiEntitlements(@PathVariable Long userId) {
        return authService.poiEntitlements(userId);
    }

    @GetMapping("/{userId}/pois/{poiId}")
    public EntitlementResponse getPoiEntitlement(@PathVariable Long userId, @PathVariable Long poiId) {
        // Dùng EntitlementResponse để giữ cấu trúc {userId, plan=PREMIUM khi có quyền, ...}.
        EntitlementResponse base = authService.entitlement(userId);
        boolean poiActive = authService.hasPoiEntitlement(userId, poiId);
        boolean active = base.isPremiumActive() || poiActive;
        return EntitlementResponse.builder()
                .userId(userId)
                .plan(active ? "PREMIUM" : base.getPlan())
                .premiumActive(active)
                .premiumExpiresAt(base.getPremiumExpiresAt())
                .build();
    }

    @PostMapping("/{userId}/pois/{poiId}/grant")
    public UserPoiEntitlementResponse grantPoiEntitlement(@PathVariable Long userId,
                                                          @PathVariable Long poiId,
                                                          @Valid @RequestBody PoiGrantRequest request) {
        return authService.grantPoiEntitlement(userId, poiId, request);
    }

    @GetMapping("/has-access")
    public com.echora.auth.dto.AccessResponse hasAccess(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Long userId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Long poiId,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "vi") String lang) {
        return authService.access(userId, poiId, lang);
    }

    @GetMapping("/{userId}/discount-eligible")
    public java.util.Map<String, Boolean> isDiscountEligible(@PathVariable Long userId) {
        return java.util.Map.of("eligible", authService.isEligibleForSouvenirDiscount(userId));
    }

    @PostMapping("/{userId}/premium")
    public EntitlementResponse activatePremium(@PathVariable Long userId,
                                               @Valid @RequestBody PremiumActivationRequest request) {
        return authService.activatePremium(userId, request);
    }
}

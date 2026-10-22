package com.saigonvoice.auth.controller;

import com.saigonvoice.auth.dto.EntitlementResponse;
import com.saigonvoice.auth.dto.PremiumActivationRequest;
import com.saigonvoice.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/internal/entitlements")
@RequiredArgsConstructor
public class InternalEntitlementController {

    private final AuthService authService;

    @GetMapping("/{userId}")
    public EntitlementResponse getEntitlement(@PathVariable Long userId) {
        return authService.entitlement(userId);
    }

    @PostMapping("/{userId}/premium")
    public EntitlementResponse activatePremium(@PathVariable Long userId,
                                               @Valid @RequestBody PremiumActivationRequest request) {
        return authService.activatePremium(userId, request);
    }
}

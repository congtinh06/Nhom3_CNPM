package com.echora.auth.service;

import com.echora.auth.dto.AccessResponse;
import com.echora.auth.dto.ChangePasswordRequest;
import com.echora.auth.dto.CookieResult;
import com.echora.auth.dto.EntitlementResponse;
import com.echora.auth.dto.GoogleLoginRequest;
import com.echora.auth.dto.LoginRequest;
import com.echora.auth.dto.MeEntitlementResponse;
import com.echora.auth.dto.MessageResponse;
import com.echora.auth.dto.RegisterRequest;
import com.echora.auth.dto.PremiumActivationRequest;
import com.echora.auth.dto.PoiGrantRequest;
import com.echora.auth.dto.ResetPasswordRequest;
import com.echora.auth.dto.UserResponse;
import com.echora.auth.dto.UserPoiEntitlementResponse;
import com.echora.auth.dto.VerifyEmailRequest;
import com.echora.auth.dto.UpdateProfileRequest;

import java.util.List;

public interface AuthService {

    MessageResponse register(RegisterRequest request, String ipAddress, String userAgent);

    CookieResult login(LoginRequest request, String ipAddress, String userAgent);

    CookieResult loginWithGoogle(GoogleLoginRequest request, String ipAddress, String userAgent);

    CookieResult refresh(String rawRefreshToken, String ipAddress, String userAgent);

    void logout(String rawRefreshToken);

    void logoutAll(Long userId);

    MessageResponse verifyEmail(VerifyEmailRequest request);

    MessageResponse resendVerification(String email, String ipAddress);

    MessageResponse forgotPassword(String email, String ipAddress);

    void resetPassword(ResetPasswordRequest request);

    void changePassword(Long userId, ChangePasswordRequest request, String currentRawRefreshToken);

    UserResponse me(Long userId);

    UserResponse updateProfile(Long userId, UpdateProfileRequest request);

    EntitlementResponse entitlement(Long userId);

    EntitlementResponse activatePremium(Long userId, PremiumActivationRequest request);

    // ------------------------------------------------------------------ POI MUA LẺ

    List<UserPoiEntitlementResponse> poiEntitlements(Long userId);

    boolean hasPoiEntitlement(Long userId, Long poiId);

    boolean hasAccess(Long userId, Long poiId, String language);

    AccessResponse access(Long userId, Long poiId, String language);

    boolean isEligibleForSouvenirDiscount(Long userId);

    UserPoiEntitlementResponse grantPoiEntitlement(Long userId, Long poiId, PoiGrantRequest request);

    MeEntitlementResponse meEntitlement(Long userId);
}


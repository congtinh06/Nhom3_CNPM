package com.echora.auth.service;

import com.echora.auth.dto.ChangePasswordRequest;
import com.echora.auth.dto.CookieResult;
import com.echora.auth.dto.EntitlementResponse;
import com.echora.auth.dto.GoogleLoginRequest;
import com.echora.auth.dto.LoginRequest;
import com.echora.auth.dto.MessageResponse;
import com.echora.auth.dto.RegisterRequest;
import com.echora.auth.dto.PremiumActivationRequest;
import com.echora.auth.dto.ResetPasswordRequest;
import com.echora.auth.dto.UserResponse;
import com.echora.auth.dto.VerifyEmailRequest;

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

    EntitlementResponse entitlement(Long userId);

    EntitlementResponse activatePremium(Long userId, PremiumActivationRequest request);
}


package com.saigonvoice.auth.service;

import com.saigonvoice.auth.dto.ChangePasswordRequest;
import com.saigonvoice.auth.dto.CookieResult;
import com.saigonvoice.auth.dto.LoginRequest;
import com.saigonvoice.auth.dto.MessageResponse;
import com.saigonvoice.auth.dto.RegisterRequest;
import com.saigonvoice.auth.dto.ResetPasswordRequest;
import com.saigonvoice.auth.dto.UserResponse;
import com.saigonvoice.auth.dto.VerifyEmailRequest;

import java.util.List;

public interface AuthService {

    MessageResponse register(RegisterRequest request, String ipAddress, String userAgent);

    CookieResult login(LoginRequest request, String ipAddress, String userAgent);

    CookieResult refresh(String rawRefreshToken, String ipAddress, String userAgent);

    void logout(String rawRefreshToken);

    void logoutAll(Long userId);

    MessageResponse verifyEmail(VerifyEmailRequest request);

    MessageResponse resendVerification(String email, String ipAddress);

    MessageResponse forgotPassword(String email, String ipAddress);

    void resetPassword(ResetPasswordRequest request);

    void changePassword(Long userId, ChangePasswordRequest request, String currentRawRefreshToken);

    UserResponse me(Long userId);

    List<UserResponse> listUsers();
}

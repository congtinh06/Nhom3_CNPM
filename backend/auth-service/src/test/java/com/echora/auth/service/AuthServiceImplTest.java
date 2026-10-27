package com.echora.auth.service;

import com.echora.auth.dto.ChangePasswordRequest;
import com.echora.auth.dto.CookieResult;
import com.echora.auth.dto.LoginRequest;
import com.echora.auth.dto.MessageResponse;
import com.echora.auth.dto.RegisterRequest;
import com.echora.auth.dto.ResetPasswordRequest;
import com.echora.auth.dto.VerifyEmailRequest;
import com.echora.auth.entity.EmailVerificationToken;
import com.echora.auth.entity.RefreshToken;
import com.echora.auth.entity.UserRole;
import com.echora.auth.entity.UserStatus;
import com.echora.auth.exception.BadRequestException;
import com.echora.auth.exception.ConflictException;
import com.echora.auth.exception.FieldValidationException;
import com.echora.auth.exception.ForbiddenException;
import com.echora.auth.exception.UnauthorizedException;
import com.echora.auth.repository.EmailVerificationTokenRepository;
import com.echora.auth.repository.PasswordResetTokenRepository;
import com.echora.auth.repository.UserRepository;
import com.echora.auth.security.JwtService;
import com.echora.auth.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceImplTest {

    private static final String JWT_SECRET = "unit-test-secret-with-at-least-32-characters!";
    private static final String IP = "1.2.3.4";

    private final UserRepository userRepository = mock(UserRepository.class);
    private final EmailVerificationTokenRepository emailVerificationTokenRepository = mock(EmailVerificationTokenRepository.class);
    private final PasswordResetTokenRepository passwordResetTokenRepository = mock(PasswordResetTokenRepository.class);
    private final RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
    private final RateLimitService rateLimitService = mock(RateLimitService.class);
    private final MailService mailService = mock(MailService.class);
    private final TokenService tokenService = new TokenService();
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
    private final JwtService jwtService = mock(JwtService.class);
    private final com.echora.auth.security.GoogleTokenVerifier googleTokenVerifier =
            mock(com.echora.auth.security.GoogleTokenVerifier.class);

    private AuthServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AuthServiceImpl(
                userRepository,
                mock(com.echora.auth.repository.UserPoiEntitlementRepository.class),
                emailVerificationTokenRepository,
                passwordResetTokenRepository,
                passwordEncoder,
                new PasswordPolicy(),
                tokenService,
                refreshTokenService,
                rateLimitService,
                mailService,
                jwtService,
                googleTokenVerifier);

        ReflectionTestUtils.setField(service, "loginMaxFailures", 5);
        ReflectionTestUtils.setField(service, "loginLock", Duration.ofMinutes(15));
        ReflectionTestUtils.setField(service, "loginIpMaxFailures", 20);
        ReflectionTestUtils.setField(service, "loginWindow", Duration.ofMinutes(15));
        ReflectionTestUtils.setField(service, "registerPerHour", 10);
        ReflectionTestUtils.setField(service, "forgotPerHour", 5);
        ReflectionTestUtils.setField(service, "emailVerificationTtl", Duration.ofHours(24));
        ReflectionTestUtils.setField(service, "passwordResetTtl", Duration.ofMinutes(20));
        service.initDummyHash();

        when(jwtService.getAccessTtlSeconds()).thenReturn(900L);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User saved = inv.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(42L);
            }
            return saved;
        });
        when(emailVerificationTokenRepository.save(any(EmailVerificationToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(passwordResetTokenRepository.save(any(com.echora.auth.entity.PasswordResetToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    // ------------------------------------------------------------------ helper

    private User activeUser() {
        return User.builder()
                .id(42L)
                .fullName("Nguyễn Văn A")
                .email("a@echora.local")
                .passwordHash(passwordEncoder.encode("Secret123"))
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private RegisterRequest registerRequest(String email, String password, String confirm) {
        return RegisterRequest.builder()
                .fullName("Nguyễn Văn A")
                .email(email)
                .password(password)
                .confirmPassword(confirm)
                .build();
    }

    private void stubIssueNewRefreshToken() {
        when(refreshTokenService.issue(any(User.class), anyBoolean(), anyString(), any()))
                .thenAnswer(inv -> {
                    User user = inv.getArgument(0);
                    RefreshToken created = RefreshToken.builder()
                            .id(99L)
                            .user(user)
                            .tokenHash(tokenService.sha256Hex("new-raw-token"))
                            .createdAt(LocalDateTime.now())
                            .expiresAt(LocalDateTime.now().plusDays(7))
                            .build();
                    return new RefreshTokenService.Issued("new-raw-token", created, Duration.ofDays(7));
                });
    }

    // --------------------------------------------------------------- REGISTER

    @Test
    @DisplayName("Đăng ký thành công: băm mật khẩu, tạo token xác thực, gửi email")
    void registerSuccess() {
        when(userRepository.existsByEmail("a@echora.local")).thenReturn(false);

        MessageResponse response = service.register(
                registerRequest("A@Echora.Local", "Abcdefg1", "Abcdefg1"), IP, "junit");

        assertThat(response.getMessage()).contains("Đăng ký thành công");
        verify(userRepository).save(any(User.class));
        verify(emailVerificationTokenRepository).deleteAllForUser(42L);
        verify(mailService).sendVerificationEmail(eq("a@echora.local"), anyString());
        assertThat(response.getMessage()).doesNotContain("Abcdefg1");
    }

    @Test
    @DisplayName("Email trùng (không phân biệt hoa thường) bị 409")
    void registerDuplicateEmailIsRejected() {
        when(userRepository.existsByEmail("a@echora.local")).thenReturn(true);

        assertThatThrownBy(() -> service.register(
                registerRequest("A@ECHORA.LOCAL", "Abcdefg1", "Abcdefg1"), IP, "junit"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("đã được sử dụng");
        verify(mailService, never()).sendVerificationEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("Mật khẩu yếu trả lỗi theo từng ô")
    void registerWeakPasswordReturnsFieldErrors() {
        assertThatThrownBy(() -> service.register(
                registerRequest("a@echora.local", "abcdefg1", "abcdefg1"), IP, "junit"))
                .isInstanceOf(FieldValidationException.class)
                .satisfies(ex -> assertThat(((FieldValidationException) ex).getDetails()).containsKey("password"));
    }

    @Test
    @DisplayName("Nhập lại mật khẩu không khớp trả lỗi ô confirmPassword")
    void registerPasswordMismatchReturnsFieldError() {
        assertThatThrownBy(() -> service.register(
                registerRequest("a@echora.local", "Abcdefg1", "Abcdefg2"), IP, "junit"))
                .isInstanceOf(FieldValidationException.class)
                .satisfies(ex -> assertThat(((FieldValidationException) ex).getDetails())
                        .containsKey("confirmPassword"));
    }

    // ------------------------------------------------------------------ LOGIN

    @Test
    @DisplayName("Đăng nhập đúng trả access token + refresh token")
    void loginSuccess() {
        User user = activeUser();
        when(userRepository.findByEmail("a@echora.local")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(user)).thenReturn("access-token");
        stubIssueNewRefreshToken();

        CookieResult result = service.login(
                LoginRequest.builder().email("a@echora.local").password("Secret123").build(), IP, "junit");

        assertThat(result.getBody().getAccessToken()).isEqualTo("access-token");
        assertThat(result.getBody().getExpiresIn()).isEqualTo(900);
        assertThat(result.getRawRefreshToken()).isEqualTo("new-raw-token");
        verify(rateLimitService).clear(anyString());
        verify(refreshTokenService).issue(eq(user), eq(false), eq(IP), eq("junit"));
    }

    @Test
    @DisplayName("Sai mật khẩu trả đúng thông điệp chung")
    void loginWrongPasswordReturnsGenericMessage() {
        when(userRepository.findByEmail("a@echora.local")).thenReturn(Optional.of(activeUser()));

        assertThatThrownBy(() -> service.login(
                LoginRequest.builder().email("a@echora.local").password("Wrong123").build(), IP, "junit"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage(AuthServiceImpl.GENERIC_LOGIN_ERROR);

        verify(rateLimitService).recordFailure(anyString(), eq(5), any(), any());
    }

    @Test
    @DisplayName("Email không tồn tại trả cùng thông điệp với sai mật khẩu")
    void loginUnknownEmailReturnsSameGenericMessage() {
        when(userRepository.findByEmail("khong-ton-tai@echora.local")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(
                LoginRequest.builder().email("khong-ton-tai@echora.local").password("Secret123").build(), IP, "junit"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage(AuthServiceImpl.GENERIC_LOGIN_ERROR);
    }

    @Test
    @DisplayName("Email chưa xác thực chỉ bị từ chối SAU khi mật khẩu đúng")
    void loginUnverifiedEmailRejectedAfterPasswordMatch() {
        User pending = activeUser();
        pending.setStatus(UserStatus.PENDING);
        pending.setEmailVerifiedAt(null);
        when(userRepository.findByEmail("a@echora.local")).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> service.login(
                LoginRequest.builder().email("a@echora.local").password("Secret123").build(), IP, "junit"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("chưa được xác thực");
    }

    @Test
    @DisplayName("Tài khoản bị khóa không được đăng nhập dù đúng mật khẩu")
    void loginBlockedAccountRejected() {
        User blocked = activeUser();
        blocked.setStatus(UserStatus.BLOCKED);
        when(userRepository.findByEmail("a@echora.local")).thenReturn(Optional.of(blocked));

        assertThatThrownBy(() -> service.login(
                LoginRequest.builder().email("a@echora.local").password("Secret123").build(), IP, "junit"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("bị khóa");
    }

    @Test
    @DisplayName("Tài khoản Google-only (password_hash NULL) không thể đăng nhập bằng mật khẩu")
    void loginGoogleOnlyAccountHasNoPassword() {
        User googleUser = activeUser();
        googleUser.setPasswordHash(null);
        googleUser.setGoogleSub("google-sub-123");
        when(userRepository.findByEmail("a@echora.local")).thenReturn(Optional.of(googleUser));

        assertThatThrownBy(() -> service.login(
                LoginRequest.builder().email("a@echora.local").password("BatKy123").build(), IP, "junit"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage(AuthServiceImpl.GENERIC_LOGIN_ERROR);

        verify(rateLimitService).recordFailure(anyString(), eq(5), any(), any());
    }

    @Test
    @DisplayName("Đang bị khóa 15 phút thì trả 429 ngay khi thử đăng nhập")
    void loginRejectedWhileRateLimited() {
        doAnswerThrowingRateLimit();

        assertThatThrownBy(() -> service.login(
                LoginRequest.builder().email("a@echora.local").password("Secret123").build(), IP, "junit"))
                .isInstanceOf(com.echora.auth.exception.TooManyRequestsException.class);
    }

    private void doAnswerThrowingRateLimit() {
        org.mockito.Mockito.doThrow(new com.echora.auth.exception.TooManyRequestsException(
                "Quá nhiều lần thử.", 900))
                .when(rateLimitService).assertNotLocked(anyString());
    }

    // ---------------------------------------------------------------- REFRESH

    @Test
    @DisplayName("Refresh hợp lệ -> luân chuyển token mới, token cũ bị ROTATED")
    void refreshRotatesToken() {
        User user = activeUser();
        RefreshToken old = RefreshToken.builder()
                .id(10L)
                .user(user)
                .tokenHash(tokenService.sha256Hex("raw-old"))
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        when(refreshTokenService.findByRawToken("raw-old")).thenReturn(Optional.of(old));
        when(refreshTokenService.isRememberMe(old)).thenReturn(false);
        when(jwtService.generateAccessToken(user)).thenReturn("access-2");
        stubIssueNewRefreshToken();

        CookieResult result = service.refresh("raw-old", IP, "junit");

        assertThat(result.getRawRefreshToken()).isEqualTo("new-raw-token");
        assertThat(result.getBody().getAccessToken()).isEqualTo("access-2");
        assertThat(old.getReplacedById()).isEqualTo(99L);
        verify(refreshTokenService).revoke(eq(old), eq(RefreshToken.REASON_ROTATED));
    }

    @Test
    @DisplayName("Refresh token đã bị thu hồi (reuse) -> thu hồi toàn bộ phiên và trả 401")
    void refreshReuseRevokesAllSessions() {
        User user = activeUser();
        RefreshToken reused = RefreshToken.builder()
                .id(11L)
                .user(user)
                .tokenHash(tokenService.sha256Hex("raw-reused"))
                .revokedAt(LocalDateTime.now())
                .revokedReason(RefreshToken.REASON_ROTATED)
                .createdAt(LocalDateTime.now().minusDays(1))
                .expiresAt(LocalDateTime.now().plusDays(6))
                .build();
        when(refreshTokenService.findByRawToken("raw-reused")).thenReturn(Optional.of(reused));

        assertThatThrownBy(() -> service.refresh("raw-reused", IP, "junit"))
                .isInstanceOf(UnauthorizedException.class);

        verify(refreshTokenService).revokeAllForUser(42L, RefreshToken.REASON_REUSE_DETECTED);
        verify(refreshTokenService, never()).issue(any(), anyBoolean(), any(), any());
    }

    @Test
    @DisplayName("Không có refresh token trong cookie -> 401")
    void refreshWithoutCookieRejected() {
        assertThatThrownBy(() -> service.refresh(null, IP, "junit"))
                .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> service.refresh("   ", IP, "junit"))
                .isInstanceOf(UnauthorizedException.class);
    }

    // --------------------------------------------------- FORGOT / RESET PASSWORD

    @Test
    @DisplayName("Quên mật khẩu luôn trả cùng một thông điệp dù email có hay không")
    void forgotPasswordAlwaysReturnsSameMessage() {
        when(userRepository.findByEmail("co-tai-khoan@echora.local"))
                .thenReturn(Optional.of(activeUser()));
        when(userRepository.findByEmail("khong-ton-tai@echora.local"))
                .thenReturn(Optional.empty());

        MessageResponse existing = service.forgotPassword("Co-Tai-Khoan@Echora.Local", IP);
        MessageResponse missing = service.forgotPassword("khong-ton-tai@echora.local", IP);

        assertThat(existing.getMessage()).isEqualTo(missing.getMessage());
        assertThat(existing.getMessage()).isEqualTo(AuthServiceImpl.GENERIC_FORGOT_MESSAGE);
        verify(mailService).sendPasswordResetEmail(eq("a@echora.local"), anyString());
        verify(mailService, org.mockito.Mockito.times(1)).sendPasswordResetEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("Token đặt lại mật khẩu không hợp lệ bị 400")
    void resetPasswordInvalidTokenRejected() {
        assertThatThrownBy(() -> service.resetPassword(ResetPasswordRequest.builder()
                .token("sai-token")
                .newPassword("Abcdefg1")
                .confirmPassword("Abcdefg1")
                .build()))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thành công -> thu hồi toàn bộ phiên")
    void resetPasswordRevokesAllSessions() {
        User user = activeUser();
        String rawToken = "reset-token-value";
        var resetToken = com.echora.auth.entity.PasswordResetToken.builder()
                .id(7L)
                .user(user)
                .tokenHash(tokenService.sha256Hex(rawToken))
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(20))
                .build();
        when(passwordResetTokenRepository.findByTokenHash(tokenService.sha256Hex(rawToken)))
                .thenReturn(Optional.of(resetToken));

        service.resetPassword(ResetPasswordRequest.builder()
                .token(rawToken)
                .newPassword("NewPass123")
                .confirmPassword("NewPass123")
                .build());

        assertThat(passwordEncoder.matches("NewPass123", user.getPasswordHash())).isTrue();
        verify(refreshTokenService).revokeAllForUser(42L, RefreshToken.REASON_PASSWORD_CHANGED);
        verify(passwordResetTokenRepository).deleteAllForUser(42L);
    }

    // -------------------------------------------------------- CHANGE PASSWORD

    @Test
    @DisplayName("Đổi mật khẩu sai mật khẩu cũ -> 401, không thu hồi phiên")
    void changePasswordWrongOldPassword() {
        User user = activeUser();
        when(userRepository.findById(42L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.changePassword(42L, ChangePasswordRequest.builder()
                .oldPassword("Wrong123")
                .newPassword("Abcdefg1")
                .confirmPassword("Abcdefg1")
                .build(), "raw-cookie"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Mật khẩu hiện tại không đúng");

        verify(refreshTokenService, never()).revokeAllExceptCurrent(anyLong(), any(), anyString());
    }

    @Test
    @DisplayName("Đổi mật khẩu đúng -> chỉ thu hồi các phiên khác, giữ phiên hiện tại")
    void changePasswordKeepsCurrentSession() {
        User user = activeUser();
        when(userRepository.findById(42L)).thenReturn(Optional.of(user));

        service.changePassword(42L, ChangePasswordRequest.builder()
                .oldPassword("Secret123")
                .newPassword("NewPass123")
                .confirmPassword("NewPass123")
                .build(), "raw-cookie");

        assertThat(passwordEncoder.matches("NewPass123", user.getPasswordHash())).isTrue();
        verify(refreshTokenService).revokeAllExceptCurrent(
                eq(42L), eq("raw-cookie"), eq(RefreshToken.REASON_PASSWORD_CHANGED));
    }

    // ------------------------------------------------------------ VERIFY EMAIL

    @Test
    @DisplayName("Xác thực email thành công chuyển tài khoản sang ACTIVE")
    void verifyEmailActivatesAccount() {
        User pending = activeUser();
        pending.setStatus(UserStatus.PENDING);
        pending.setEmailVerifiedAt(null);

        String rawToken = "verify-token";
        EmailVerificationToken verification = EmailVerificationToken.builder()
                .id(5L)
                .user(pending)
                .tokenHash(tokenService.sha256Hex(rawToken))
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        when(emailVerificationTokenRepository.findByTokenHash(tokenService.sha256Hex(rawToken)))
                .thenReturn(Optional.of(verification));

        MessageResponse response = service.verifyEmail(VerifyEmailRequest.builder().token(rawToken).build());

        assertThat(response.getMessage()).contains("đã được xác thực");
        assertThat(pending.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(pending.getEmailVerifiedAt()).isNotNull();
        assertThat(verification.getUsedAt()).isNotNull();
    }

    @Test
    @DisplayName("Token xác thực đã hết hạn bị 400")
    void verifyEmailExpiredTokenRejected() {
        String rawToken = "expired-token";
        EmailVerificationToken verification = EmailVerificationToken.builder()
                .id(6L)
                .user(activeUser())
                .tokenHash(tokenService.sha256Hex(rawToken))
                .createdAt(LocalDateTime.now().minusDays(2))
                .expiresAt(LocalDateTime.now().minusHours(1))
                .build();
        when(emailVerificationTokenRepository.findByTokenHash(tokenService.sha256Hex(rawToken)))
                .thenReturn(Optional.of(verification));

        assertThatThrownBy(() -> service.verifyEmail(VerifyEmailRequest.builder().token(rawToken).build()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("hết hạn");
    }
}

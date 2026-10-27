package com.echora.auth.service;

import com.echora.auth.dto.CookieResult;
import com.echora.auth.dto.GoogleLoginRequest;
import com.echora.auth.entity.RefreshToken;
import com.echora.auth.entity.User;
import com.echora.auth.entity.UserRole;
import com.echora.auth.entity.UserStatus;
import com.echora.auth.exception.ForbiddenException;
import com.echora.auth.exception.ServiceUnavailableException;
import com.echora.auth.exception.UnauthorizedException;
import com.echora.auth.repository.EmailVerificationTokenRepository;
import com.echora.auth.repository.PasswordResetTokenRepository;
import com.echora.auth.repository.UserRepository;
import com.echora.auth.security.GoogleIdentity;
import com.echora.auth.security.GoogleTokenVerifier;
import com.echora.auth.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Kiểm thử luồng đăng nhập Google ở tầng service với verifier được mock.
 * Việc kiểm tra chữ ký/audience/hạn thực tế do thư viện Google đảm nhiệm;
 * ở đây mô phỏng verifier chấp nhận hoặc từ chối token.
 */
class AuthServiceImplGoogleTest {

    private static final String IP = "1.2.3.4";
    private static final String CREDENTIAL = "google-credential";

    private final UserRepository userRepository = mock(UserRepository.class);
    private final EmailVerificationTokenRepository emailVerificationTokenRepository = mock(EmailVerificationTokenRepository.class);
    private final PasswordResetTokenRepository passwordResetTokenRepository = mock(PasswordResetTokenRepository.class);
    private final RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
    private final RateLimitService rateLimitService = mock(RateLimitService.class);
    private final MailService mailService = mock(MailService.class);
    private final TokenService tokenService = new TokenService();
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
    private final JwtService jwtService = mock(JwtService.class);
    private final GoogleTokenVerifier googleTokenVerifier = mock(GoogleTokenVerifier.class);

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
        when(refreshTokenService.issue(any(User.class), anyBoolean(), anyString(), any()))
                .thenAnswer(inv -> {
                    RefreshToken created = RefreshToken.builder()
                            .id(99L)
                            .user(inv.getArgument(0))
                            .createdAt(LocalDateTime.now())
                            .expiresAt(LocalDateTime.now().plusDays(7))
                            .build();
                    return new RefreshTokenService.Issued("new-raw-token", created, Duration.ofDays(7));
                });
    }

    private GoogleLoginRequest request() {
        return GoogleLoginRequest.builder().credential(CREDENTIAL).build();
    }

    @Test
    @DisplayName("Token hợp lệ + người dùng mới -> tạo tài khoản USER ACTIVE, không có mật khẩu")
    void validTokenCreatesNewGoogleUser() {
        when(googleTokenVerifier.verify(CREDENTIAL))
                .thenReturn(new GoogleIdentity("sub-1", "new@echora.local", true, "Nguyễn Văn B"));
        when(userRepository.findByGoogleSub("sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("new@echora.local")).thenReturn(Optional.empty());
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("access-token");

        CookieResult result = service.loginWithGoogle(request(), IP, "junit");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, org.mockito.Mockito.atLeastOnce()).save(captor.capture());
        User created = captor.getAllValues().get(0);

        assertThat(created.getRole()).isEqualTo(UserRole.USER);
        assertThat(created.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(created.getPasswordHash()).isNull();
        assertThat(created.getGoogleSub()).isEqualTo("sub-1");
        assertThat(created.getEmail()).isEqualTo("new@echora.local");
        assertThat(created.getFullName()).isEqualTo("Nguyễn Văn B");
        assertThat(created.getEmailVerifiedAt()).isNotNull();
        assertThat(created.getLastLoginAt()).isNotNull();
        assertThat(result.getBody().getAccessToken()).isEqualTo("access-token");
        assertThat(result.getRawRefreshToken()).isEqualTo("new-raw-token");
    }

    @Test
    @DisplayName("Tên trong token trống -> dùng phần trước @ của email làm tên hiển thị")
    void newUserWithoutNameFallsBackToEmailLocalPart() {
        when(googleTokenVerifier.verify(CREDENTIAL))
                .thenReturn(new GoogleIdentity("sub-2", "fallback@echora.local", true, "  "));
        when(userRepository.findByGoogleSub("sub-2")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("fallback@echora.local")).thenReturn(Optional.empty());
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("access-token");

        service.loginWithGoogle(request(), IP, "junit");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, org.mockito.Mockito.atLeastOnce()).save(captor.capture());
        assertThat(captor.getAllValues().get(0).getFullName()).isEqualTo("fallback");
    }

    @Test
    @DisplayName("Email đã tồn tại (chưa xác thực) -> liên kết Google, giữ nguyên role, kích hoạt tài khoản")
    void linksExistingUnverifiedAccountWithoutChangingRole() {
        User existing = User.builder()
                .id(7L)
                .fullName("Nguyễn Văn A")
                .email("a@echora.local")
                .passwordHash(passwordEncoder.encode("Secret123"))
                .role(UserRole.USER)
                .status(UserStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        when(googleTokenVerifier.verify(CREDENTIAL))
                .thenReturn(new GoogleIdentity("sub-3", "a@echora.local", true, null));
        when(userRepository.findByGoogleSub("sub-3")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("a@echora.local")).thenReturn(Optional.of(existing));
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("access-token");

        service.loginWithGoogle(request(), IP, "junit");

        assertThat(existing.getGoogleSub()).isEqualTo("sub-3");
        assertThat(existing.getRole()).isEqualTo(UserRole.USER);
        assertThat(existing.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(existing.getEmailVerifiedAt()).isNotNull();
        // Mật khẩu cũ vẫn dùng được cho luồng đăng nhập bằng mật khẩu
        assertThat(passwordEncoder.matches("Secret123", existing.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("Đã từng đăng nhập Google -> tra theo google_sub (không cần tra email)")
    void returningGoogleUserLooksUpByGoogleSub() {
        User existing = User.builder()
                .id(9L)
                .fullName("Khách Google")
                .email("returning@echora.local")
                .googleSub("sub-9")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        when(googleTokenVerifier.verify(CREDENTIAL))
                .thenReturn(new GoogleIdentity("sub-9", "returning@echora.local", true, "Khách Google"));
        when(userRepository.findByGoogleSub("sub-9")).thenReturn(Optional.of(existing));
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("access-token");

        CookieResult result = service.loginWithGoogle(request(), IP, "junit");

        assertThat(result.getBody().getAccessToken()).isEqualTo("access-token");
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    @DisplayName("Email chưa được Google xác thực (email_verified=false) -> 401, không tạo tài khoản")
    void unverifiedGoogleEmailRejected() {
        when(googleTokenVerifier.verify(CREDENTIAL))
                .thenReturn(new GoogleIdentity("sub-x", "unverified@echora.local", false, "X"));

        assertThatThrownBy(() -> service.loginWithGoogle(request(), IP, "junit"))
                .isInstanceOf(UnauthorizedException.class);

        verify(userRepository, never()).save(any(User.class));
        verify(refreshTokenService, never()).issue(any(), anyBoolean(), any(), any());
    }

    @Test
    @DisplayName("Token sai audience/hết hạn (verifier từ chối) -> 401")
    void rejectedTokenPropagatesUnauthorized() {
        when(googleTokenVerifier.verify(CREDENTIAL))
                .thenThrow(new UnauthorizedException("Không thể xác minh tài khoản Google."));

        assertThatThrownBy(() -> service.loginWithGoogle(request(), IP, "junit"))
                .isInstanceOf(UnauthorizedException.class);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Chưa cấu hình Client ID -> 503")
    void notConfiguredPropagatesServiceUnavailable() {
        when(googleTokenVerifier.verify(CREDENTIAL))
                .thenThrow(new ServiceUnavailableException("Đăng nhập Google chưa được cấu hình."));

        assertThatThrownBy(() -> service.loginWithGoogle(request(), IP, "junit"))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    @DisplayName("Tài khoản bị khóa -> 403 kể cả khi Google hợp lệ")
    void blockedGoogleUserRejected() {
        User blocked = User.builder()
                .id(11L)
                .fullName("Bị khóa")
                .email("blocked@echora.local")
                .googleSub("sub-blocked")
                .role(UserRole.USER)
                .status(UserStatus.BLOCKED)
                .emailVerifiedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        when(googleTokenVerifier.verify(CREDENTIAL))
                .thenReturn(new GoogleIdentity("sub-blocked", "blocked@echora.local", true, null));
        when(userRepository.findByGoogleSub("sub-blocked")).thenReturn(Optional.of(blocked));

        assertThatThrownBy(() -> service.loginWithGoogle(request(), IP, "junit"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("bị khóa");

        verify(refreshTokenService, never()).issue(any(), anyBoolean(), any(), any());
    }
}

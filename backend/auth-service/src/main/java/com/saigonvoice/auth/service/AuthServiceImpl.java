package com.saigonvoice.auth.service;

import com.saigonvoice.auth.dto.AuthResponse;
import com.saigonvoice.auth.dto.ChangePasswordRequest;
import com.saigonvoice.auth.dto.CookieResult;
import com.saigonvoice.auth.dto.LoginRequest;
import com.saigonvoice.auth.dto.MessageResponse;
import com.saigonvoice.auth.dto.RegisterRequest;
import com.saigonvoice.auth.dto.ResetPasswordRequest;
import com.saigonvoice.auth.dto.UserResponse;
import com.saigonvoice.auth.dto.VerifyEmailRequest;
import com.saigonvoice.auth.entity.EmailVerificationToken;
import com.saigonvoice.auth.entity.PasswordResetToken;
import com.saigonvoice.auth.entity.RefreshToken;
import com.saigonvoice.auth.entity.User;
import com.saigonvoice.auth.entity.UserRole;
import com.saigonvoice.auth.entity.UserStatus;
import com.saigonvoice.auth.exception.BadRequestException;
import com.saigonvoice.auth.exception.ConflictException;
import com.saigonvoice.auth.exception.FieldValidationException;
import com.saigonvoice.auth.exception.ForbiddenException;
import com.saigonvoice.auth.exception.NotFoundException;
import com.saigonvoice.auth.exception.UnauthorizedException;
import com.saigonvoice.auth.repository.EmailVerificationTokenRepository;
import com.saigonvoice.auth.repository.PasswordResetTokenRepository;
import com.saigonvoice.auth.repository.UserRepository;
import com.saigonvoice.auth.security.JwtService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Toàn bộ luồng đăng ký / đăng nhập / phiên / khôi phục mật khẩu.
 *
 * <p>Lưu ý về transaction: {@code login}, {@code refresh}, {@code logout} KHÔNG được
 * {@code @Transactional} để mỗi lần ghi (rate limit, revoke, issue) commit độc lập —
 * nếu đặt chung một transaction thì việc ném exception 401/403 sẽ rollback luôn
 * bản ghi "5 lần sai" và mất tính năng khóa tài khoản.</p>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    public static final String GENERIC_LOGIN_ERROR = "Email hoặc mật khẩu không đúng.";
    public static final String GENERIC_FORGOT_MESSAGE =
            "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.";
    public static final String GENERIC_RESEND_MESSAGE =
            "Nếu email tồn tại và chưa được xác thực, chúng tôi đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.";

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final TokenService tokenService;
    private final RefreshTokenService refreshTokenService;
    private final RateLimitService rateLimitService;
    private final MailService mailService;
    private final JwtService jwtService;

    private String dummyHash;

    @Value("${app.rate-limit.login-max-failures:5}")
    private int loginMaxFailures;

    @Value("${app.rate-limit.login-lock:PT15M}")
    private Duration loginLock;

    @Value("${app.rate-limit.login-ip-max-failures:20}")
    private int loginIpMaxFailures;

    @Value("${app.rate-limit.login-window:PT15M}")
    private Duration loginWindow;

    @Value("${app.rate-limit.register-per-hour:10}")
    private int registerPerHour;

    @Value("${app.rate-limit.forgot-per-hour:5}")
    private int forgotPerHour;

    @Value("${app.token.email-verification-ttl:PT24H}")
    private Duration emailVerificationTtl;

    @Value("${app.token.password-reset-ttl:PT20M}")
    private Duration passwordResetTtl;

    /**
     * Hash giả để so sánh khi email không tồn tại, đảm bảo thời gian trả về
     * xấp xỉ bằng lúc email có thật (chống dò email qua timing).
     */
    @PostConstruct
    void initDummyHash() {
        this.dummyHash = passwordEncoder.encode("Dummy-Placeholder-Not-A-Real-Password-1!");
    }

    // ---------------------------------------------------------------- REGISTER

    @Override
    @Transactional
    public MessageResponse register(RegisterRequest request, String ipAddress, String userAgent) {
        rateLimitService.assertAllowed(rateKey("register-ip", ipAddress), registerPerHour, Duration.ofHours(1));

        Map<String, String> errors = new LinkedHashMap<>();

        String fullName = request.getFullName() == null ? "" : request.getFullName().trim();
        if (fullName.length() < 2) {
            errors.put("fullName", "Họ tên phải có ít nhất 2 ký tự.");
        }

        String email = normalizeEmail(request.getEmail());

        List<String> passwordViolations = passwordPolicy.validate(request.getPassword());
        if (!passwordViolations.isEmpty()) {
            errors.put("password", String.join(" ", passwordViolations));
        }
        if (!Objects.equals(request.getPassword(), request.getConfirmPassword())) {
            errors.put("confirmPassword", "Mật khẩu nhập lại không khớp.");
        }
        if (!errors.isEmpty()) {
            throw new FieldValidationException(errors);
        }

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email đã được sử dụng.");
        }

        LocalDateTime now = LocalDateTime.now();
        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.USER)
                .status(UserStatus.PENDING)
                .createdAt(now)
                .updatedAt(now)
                .build();
        userRepository.save(user);

        String rawToken = createEmailVerificationToken(user);
        mailService.sendVerificationEmail(email, rawToken);

        log.info("Đăng ký thành công userId={} email={}", user.getId(), email);
        return new MessageResponse("Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.");
    }

    // ------------------------------------------------------------------ LOGIN

    @Override
    public CookieResult login(LoginRequest request, String ipAddress, String userAgent) {
        String email = normalizeEmail(request.getEmail());
        String password = request.getPassword() == null ? "" : request.getPassword();

        String failBucket = failBucket(email, ipAddress);
        String ipFailBucket = "login-fail-ip|" + normalizeIp(ipAddress);

        rateLimitService.assertNotLocked(failBucket);
        rateLimitService.assertNotLocked(ipFailBucket);

        Optional<User> found = userRepository.findByEmail(email);
        String candidateHash = found.map(User::getPasswordHash).orElseGet(() -> dummyHash);
        boolean passwordMatches = passwordEncoder.matches(password, candidateHash);

        if (found.isEmpty() || !passwordMatches) {
            rateLimitService.recordFailure(failBucket, loginMaxFailures, loginWindow, loginLock);
            rateLimitService.recordFailure(ipFailBucket, loginIpMaxFailures, loginWindow, loginLock);
            log.info("Đăng nhập thất bại cho email {} từ IP {}", email, normalizeIp(ipAddress));
            throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
        }

        User user = found.get();
        if (user.getStatus() == UserStatus.BLOCKED) {
            log.warn("Từ chối đăng nhập: tài khoản BLOCKED userId={}", user.getId());
            throw new ForbiddenException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }
        if (!user.isEmailVerified()) {
            // Chỉ trả lời sau khi mật khẩu đã đúng -> không mở kênh dò email
            log.info("Từ chối đăng nhập: email chưa xác thực userId={}", user.getId());
            throw new ForbiddenException("Tài khoản chưa được xác thực email. Vui lòng kiểm tra hộp thư của bạn.");
        }

        rateLimitService.clear(failBucket);

        boolean rememberMe = Boolean.TRUE.equals(request.getRememberMe());
        LocalDateTime now = LocalDateTime.now();
        user.setLastLoginAt(now);
        user.setUpdatedAt(now);
        userRepository.save(user);

        RefreshTokenService.Issued issued = refreshTokenService.issue(user, rememberMe, ipAddress, userAgent);
        String accessToken = jwtService.generateAccessToken(user);

        log.info("Đăng nhập thành công userId={}", user.getId());
        return buildResult(user, accessToken, issued);
    }

    // ----------------------------------------------------------------- REFRESH

    @Override
    public CookieResult refresh(String rawRefreshToken, String ipAddress, String userAgent) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }

        Optional<RefreshToken> found = refreshTokenService.findByRawToken(rawRefreshToken);
        if (found.isEmpty()) {
            throw new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }

        RefreshToken token = found.get();
        if (token.isRevoked()) {
            // Token đã bị thu hồi mà vẫn xuất hiện -> nghi ngờ bị đánh cắp/dùng lại:
            // thu hồi toàn bộ phiên của người dùng.
            log.warn("Phát hiện refresh token reuse, thu hồi toàn bộ phiên userId={}", token.getUser().getId());
            refreshTokenService.revokeAllForUser(token.getUser().getId(), RefreshToken.REASON_REUSE_DETECTED);
            throw new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }
        if (token.isExpired()) {
            refreshTokenService.revoke(token, RefreshToken.REASON_EXPIRED);
            throw new UnauthorizedException("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        User user = token.getUser();
        if (user.getStatus() != UserStatus.ACTIVE || !user.isEmailVerified()) {
            refreshTokenService.revokeAllForUser(user.getId(), RefreshToken.REASON_ACCOUNT_DISABLED);
            throw new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
        }

        boolean rememberMe = refreshTokenService.isRememberMe(token);
        RefreshTokenService.Issued issued = refreshTokenService.issue(user, rememberMe, ipAddress, userAgent);
        token.setReplacedById(issued.entity().getId());
        refreshTokenService.revoke(token, RefreshToken.REASON_ROTATED);

        String accessToken = jwtService.generateAccessToken(user);
        log.info("Đã luân chuyển refresh token cho userId={}", user.getId());
        return buildResult(user, accessToken, issued);
    }

    // ----------------------------------------------------------------- LOGOUT

    @Override
    public void logout(String rawRefreshToken) {
        refreshTokenService.findByRawToken(rawRefreshToken).ifPresent(token -> {
            refreshTokenService.revoke(token, RefreshToken.REASON_LOGOUT);
            log.info("Đăng xuất userId={}", token.getUser().getId());
        });
    }

    @Override
    public void logoutAll(Long userId) {
        refreshTokenService.revokeAllForUser(userId, RefreshToken.REASON_LOGOUT_ALL);
        log.info("Đăng xuất mọi thiết bị userId={}", userId);
    }

    // ----------------------------------------------------------- EMAIL VERIFY

    @Override
    @Transactional
    public MessageResponse verifyEmail(VerifyEmailRequest request) {
        String hash = tokenService.sha256Hex(request.getToken().trim());
        Optional<EmailVerificationToken> found = emailVerificationTokenRepository.findByTokenHash(hash);
        if (found.isEmpty()) {
            throw new BadRequestException("Liên kết xác thực không hợp lệ.");
        }

        EmailVerificationToken verificationToken = found.get();
        if (verificationToken.isUsed()) {
            throw new BadRequestException("Liên kết xác thực đã được sử dụng.");
        }
        if (verificationToken.isExpired()) {
            throw new BadRequestException("Liên kết xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email.");
        }

        User user = verificationToken.getUser();
        LocalDateTime now = LocalDateTime.now();
        if (!user.isEmailVerified()) {
            user.setStatus(UserStatus.ACTIVE);
            user.setEmailVerifiedAt(now);
            user.setUpdatedAt(now);
            userRepository.save(user);
            log.info("Xác thực email thành công userId={}", user.getId());
        }

        verificationToken.setUsedAt(now);
        emailVerificationTokenRepository.save(verificationToken);
        return new MessageResponse("Email đã được xác thực. Bạn có thể đăng nhập ngay.");
    }

    @Override
    @Transactional
    public MessageResponse resendVerification(String email, String ipAddress) {
        rateLimitService.assertAllowed(rateKey("resend-ip", ipAddress), registerPerHour, Duration.ofHours(1));

        userRepository.findByEmail(normalizeEmail(email))
                .filter(user -> !user.isEmailVerified())
                .ifPresent(user -> {
                    String rawToken = createEmailVerificationToken(user);
                    mailService.sendVerificationEmail(user.getEmail(), rawToken);
                    log.info("Đã gửi lại email xác thực userId={}", user.getId());
                });

        return new MessageResponse(GENERIC_RESEND_MESSAGE);
    }

    // ------------------------------------------------------- FORGOT / RESET PW

    @Override
    @Transactional
    public MessageResponse forgotPassword(String email, String ipAddress) {
        rateLimitService.assertAllowed(rateKey("forgot-ip", ipAddress), forgotPerHour, Duration.ofHours(1));

        userRepository.findByEmail(normalizeEmail(email)).ifPresent(user -> {
            String rawToken = createPasswordResetToken(user);
            mailService.sendPasswordResetEmail(user.getEmail(), rawToken);
            log.info("Đã gửi yêu cầu đặt lại mật khẩu cho userId={}", user.getId());
        });

        // Luôn trả cùng một thông điệp, không tiết lộ email có tồn tại hay không
        return new MessageResponse(GENERIC_FORGOT_MESSAGE);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        List<String> passwordViolations = passwordPolicy.validate(request.getNewPassword());
        if (!passwordViolations.isEmpty()) {
            errors.put("newPassword", String.join(" ", passwordViolations));
        }
        if (!Objects.equals(request.getNewPassword(), request.getConfirmPassword())) {
            errors.put("confirmPassword", "Mật khẩu nhập lại không khớp.");
        }
        if (!errors.isEmpty()) {
            throw new FieldValidationException(errors);
        }

        String hash = tokenService.sha256Hex(request.getToken().trim());
        Optional<PasswordResetToken> found = passwordResetTokenRepository.findByTokenHash(hash);
        if (found.isEmpty()) {
            throw new BadRequestException("Liên kết đặt lại mật khẩu không hợp lệ.");
        }

        PasswordResetToken resetToken = found.get();
        if (resetToken.isUsed()) {
            throw new BadRequestException("Liên kết đặt lại mật khẩu đã được sử dụng.");
        }
        if (resetToken.isExpired()) {
            throw new BadRequestException("Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.");
        }

        User user = resetToken.getUser();
        LocalDateTime now = LocalDateTime.now();

        // Đóng mọi token đặt lại còn hiệu lực (kể cả token vừa dùng) trước khi đổi mật khẩu
        passwordResetTokenRepository.deleteAllForUser(user.getId());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(now);
        userRepository.save(user);

        // Đổi mật khẩu -> đóng mọi phiên đang đăng nhập
        refreshTokenService.revokeAllForUser(user.getId(), RefreshToken.REASON_PASSWORD_CHANGED);
        log.info("Đặt lại mật khẩu thành công userId={}", user.getId());
    }

    // -------------------------------------------------------- CHANGE PASSWORD

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request, String currentRawRefreshToken) {
        Map<String, String> errors = new LinkedHashMap<>();
        List<String> passwordViolations = passwordPolicy.validate(request.getNewPassword());
        if (!passwordViolations.isEmpty()) {
            errors.put("newPassword", String.join(" ", passwordViolations));
        }
        if (!Objects.equals(request.getNewPassword(), request.getConfirmPassword())) {
            errors.put("confirmPassword", "Mật khẩu nhập lại không khớp.");
        }
        if (!errors.isEmpty()) {
            throw new FieldValidationException(errors);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn."));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Mật khẩu hiện tại không đúng.");
        }
        if (Objects.equals(request.getOldPassword(), request.getNewPassword())) {
            throw new FieldValidationException(Map.of("newPassword", "Mật khẩu mới phải khác mật khẩu hiện tại."));
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        refreshTokenService.revokeAllExceptCurrent(userId, currentRawRefreshToken, RefreshToken.REASON_PASSWORD_CHANGED);
        log.info("Đổi mật khẩu thành công userId={}", userId);
    }

    // --------------------------------------------------------------- ME / LIST

    @Override
    public UserResponse me(Long userId) {
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng."));
    }

    @Override
    public List<UserResponse> listUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(UserResponse::from)
                .toList();
    }

    // -------------------------------------------------------------- INTERNALS

    private CookieResult buildResult(User user, String accessToken, RefreshTokenService.Issued issued) {
        return CookieResult.builder()
                .rawRefreshToken(issued.rawToken())
                .refreshTtl(issued.ttl())
                .body(AuthResponse.builder()
                        .accessToken(accessToken)
                        .expiresIn(jwtService.getAccessTtlSeconds())
                        .tokenType("Bearer")
                        .user(UserResponse.from(user))
                        .build())
                .build();
    }

    private String createEmailVerificationToken(User user) {
        emailVerificationTokenRepository.deleteAllForUser(user.getId());
        String rawToken = tokenService.newToken();
        LocalDateTime now = LocalDateTime.now();
        emailVerificationTokenRepository.save(EmailVerificationToken.builder()
                .user(user)
                .tokenHash(tokenService.sha256Hex(rawToken))
                .expiresAt(now.plus(emailVerificationTtl))
                .createdAt(now)
                .build());
        return rawToken;
    }

    private String createPasswordResetToken(User user) {
        passwordResetTokenRepository.deleteAllForUser(user.getId());
        String rawToken = tokenService.newToken();
        LocalDateTime now = LocalDateTime.now();
        passwordResetTokenRepository.save(PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenService.sha256Hex(rawToken))
                .expiresAt(now.plus(passwordResetTtl))
                .createdAt(now)
                .build());
        return rawToken;
    }

    private static String failBucket(String email, String ipAddress) {
        return "login-fail|" + email + "|" + normalizeIp(ipAddress);
    }

    private static String rateKey(String prefix, String ipAddress) {
        return prefix + "|" + normalizeIp(ipAddress);
    }

    private static String normalizeIp(String ipAddress) {
        return ipAddress == null || ipAddress.isBlank() ? "unknown" : ipAddress.trim();
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}

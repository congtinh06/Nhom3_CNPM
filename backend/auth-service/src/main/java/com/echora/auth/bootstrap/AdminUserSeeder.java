package com.echora.auth.bootstrap;

import com.echora.auth.entity.User;
import com.echora.auth.entity.UserPlan;
import com.echora.auth.entity.UserRole;
import com.echora.auth.entity.UserStatus;
import com.echora.auth.repository.UserRepository;
import com.echora.auth.service.PasswordPolicy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Tạo tài khoản ADMIN và USER kiểm thử mặc định từ biến môi trường (không hard-code).
 * Tài khoản được kích hoạt sẵn (ACTIVE) để phục vụ kiểm thử và chấm đồ án nhanh chóng.
 */
@Component
@Slf4j
public class AdminUserSeeder implements ApplicationRunner {

    private static final String LEGACY_ADMIN_EMAIL = "admin@echora.local";
    /** Các giá trị mật khẩu mặc định (ví dụ .env.example / legacy) — bị cấm ở profile deploy/prod. */
    private static final String DEFAULT_ADMIN_SEED_PASSWORD = "ChangeMe_Admin123";
    private static final List<String> DEFAULT_ADMIN_SEED_PASSWORDS = List.of(
            "ChangeMe_Admin123",
            "Admin@123456"
    );

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final String adminEmail;
    private final String adminPassword;
    private final String testUserEmail;
    private final String testUserPassword;
    private final String demoPremiumEmail;
    private final String demoPremiumPassword;
    private final boolean demoPremiumSeedEnabled;
    private final String springProfiles;

    public AdminUserSeeder(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           PasswordPolicy passwordPolicy,
                           @Value("${app.admin.email:}") String adminEmail,
                           @Value("${app.admin.password:}") String adminPassword,
                           @Value("${app.test-user.email:user@echora.local}") String testUserEmail,
                           @Value("${app.test-user.password:}") String testUserPassword,
                           @Value("${app.demo-premium.email:}") String demoPremiumEmail,
                           @Value("${app.demo-premium.password:}") String demoPremiumPassword,
                           @Value("${app.demo-premium.seed-enabled:false}") boolean demoPremiumSeedEnabled,
                           @Value("${spring.profiles.active:}") String springProfiles) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.testUserPassword = testUserPassword;
        this.testUserEmail = testUserEmail;
        this.demoPremiumEmail = demoPremiumEmail;
        this.demoPremiumPassword = demoPremiumPassword;
        this.demoPremiumSeedEnabled = demoPremiumSeedEnabled;
        this.springProfiles = springProfiles;
    }

    @Override
    public void run(ApplicationArguments args) {
        ensureSeedAllowedInDeployProfile();
        seedAdmin();
        seedTestUser();
        if (demoPremiumSeedEnabled) {
            seedDemoPremiumUser();
        } else {
            log.info("ECHORA_SEED_DEMO=false -> bỏ qua seed tài khoản demo Premium.");
        }
    }

    /**
     * An toàn cho môi trường deploy/prod: không được khởi động tài khoản ADMIN mặc định
     * (hoặc để trống mật khẩu seed khi email có cấu hình) khi đang chạy ở profile deploy/prod.
     */
    private void ensureSeedAllowedInDeployProfile() {
        List<String> profiles = Arrays.stream(springProfiles.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(value -> value.toLowerCase(Locale.ROOT))
                .toList();
        boolean deployLike = profiles.contains("deploy")
                || profiles.contains("prod")
                || profiles.contains("production");
        if (!deployLike) {
            return;
        }

        String email = adminEmail == null ? "" : adminEmail.trim();
        String password = adminPassword == null ? "" : adminPassword.trim();
        if (email.isEmpty() && password.isEmpty()) {
            return;
        }

        boolean isDefault = DEFAULT_ADMIN_SEED_PASSWORDS.stream().anyMatch(d -> d.equalsIgnoreCase(password));
        if (password.isEmpty() || isDefault) {
            throw new IllegalStateException(
                    "AUTH_SEED: auth-service đang chạy ở profile deploy/prod nhưng ADMIN_SEED_PASSWORD "
                            + "đang để trống hoặc bằng giá trị mặc định (" + DEFAULT_ADMIN_SEED_PASSWORDS + "). "
                            + "Không cho phép seed tài khoản ADMIN mặc định. Hãy đặt ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD "
                            + "thật cho production (hoặc để trống cả hai để tắt seed).");
        }
    }

    private void seedAdmin() {
        boolean hasEmail = adminEmail != null && !adminEmail.isBlank();
        boolean hasPassword = adminPassword != null && !adminPassword.isBlank();

        if (!hasEmail || !hasPassword) {
            log.info("ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD chưa được đặt đầy đủ -> bỏ qua việc tạo tài khoản ADMIN mặc định.");
            return;
        }

        List<String> violations = passwordPolicy.validate(adminPassword);
        if (!violations.isEmpty()) {
            throw new IllegalStateException("ADMIN_SEED_PASSWORD không đạt yêu cầu: " + violations);
        }

        String normalizedEmail = adminEmail.trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            log.info("Tài khoản ADMIN {} đã tồn tại, không tạo lại.", normalizedEmail);
            return;
        }

        User legacyAdmin = userRepository.findByEmail(LEGACY_ADMIN_EMAIL).orElse(null);
        if (legacyAdmin != null) {
            legacyAdmin.setEmail(normalizedEmail);
            legacyAdmin.setUpdatedAt(LocalDateTime.now());
            userRepository.save(legacyAdmin);
            log.info("Đã chuyển email tài khoản ADMIN {} sang {} (giữ nguyên mật khẩu và vai trò).",
                    LEGACY_ADMIN_EMAIL, normalizedEmail);
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        User admin = User.builder()
                .fullName("Quản trị viên")
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build();
        userRepository.save(admin);
        log.info("Đã tạo tài khoản ADMIN mặc định với email {}.", normalizedEmail);
    }

    private void seedTestUser() {
        boolean hasEmail = testUserEmail != null && !testUserEmail.isBlank();
        boolean hasPassword = testUserPassword != null && !testUserPassword.isBlank();

        if (!hasEmail || !hasPassword) {
            return;
        }

        List<String> violations = passwordPolicy.validate(testUserPassword);
        if (!violations.isEmpty()) {
            log.warn("SEED_TEST_USER_PASSWORD không hợp lệ: {}, bỏ qua seed user.", violations);
            return;
        }

        String normalizedEmail = testUserEmail.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(normalizedEmail)) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        User testUser = User.builder()
                .fullName("Nguyễn Văn Du Khách")
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(testUserPassword))
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build();
        userRepository.save(testUser);
        log.info("Đã tạo tài khoản USER kiểm thử mặc định với email {}.", normalizedEmail);
    }

    /**
     * Tài khoản demo Premium để nghe audio EN/JA/KO. Mật khẩu lấy từ
     * DEMO_PREMIUM_PASSWORD (.env/.env.example), không hard-code trong mã.
     * Chỉ seed khi cờ {@code app.demo-premium.seed-enabled} (env {@code ECHORA_SEED_DEMO}) = true.
     */
    private void seedDemoPremiumUser() {
        boolean hasEmail = demoPremiumEmail != null && !demoPremiumEmail.isBlank();
        boolean hasPassword = demoPremiumPassword != null && !demoPremiumPassword.isBlank();

        if (!hasEmail || !hasPassword) {
            log.info("DEMO_PREMIUM_EMAIL/DEMO_PREMIUM_PASSWORD chưa được đặt đầy đủ -> bỏ qua tài khoản demo Premium.");
            return;
        }

        if (!demoPremiumSeedEnabled) {
            log.info("ECHORA_SEED_DEMO=false -> bỏ qua seed tài khoản demo Premium.");
            return;
        }

        List<String> violations = passwordPolicy.validate(demoPremiumPassword);
        if (!violations.isEmpty()) {
            log.warn("DEMO_PREMIUM_PASSWORD không hợp lệ: {}, bỏ qua tài khoản demo Premium.", violations);
            return;
        }

        String normalizedEmail = demoPremiumEmail.trim().toLowerCase(Locale.ROOT);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime premiumExpiresAt = now.plusYears(10);

        User demo = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (demo == null) {
            demo = User.builder()
                    .fullName("Khách Demo Premium")
                    .email(normalizedEmail)
                    .passwordHash(passwordEncoder.encode(demoPremiumPassword))
                    .role(UserRole.USER)
                    .status(UserStatus.ACTIVE)
                    .emailVerifiedAt(now)
                    .plan(UserPlan.PREMIUM)
                    .premiumExpiresAt(premiumExpiresAt)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            userRepository.save(demo);
            log.info("Đã tạo tài khoản demo Premium {} (hết hạn {}).", normalizedEmail, premiumExpiresAt);
            return;
        }

        // Idempotent: bảo đảm tài khoản demo luôn ACTIVE + PREMIUM khi stack được dựng lại.
        demo.setFullName("Khách Demo Premium");
        demo.setRole(UserRole.USER);
        demo.setStatus(UserStatus.ACTIVE);
        demo.setEmailVerifiedAt(demo.getEmailVerifiedAt() != null ? demo.getEmailVerifiedAt() : now);
        demo.setPlan(UserPlan.PREMIUM);
        demo.setPremiumExpiresAt(premiumExpiresAt);
        demo.setUpdatedAt(now);
        userRepository.save(demo);
        log.info("Đã bảo đảm tài khoản demo Premium {} ở trạng thái PREMIUM (hết hạn {}).",
                normalizedEmail, premiumExpiresAt);
    }
}

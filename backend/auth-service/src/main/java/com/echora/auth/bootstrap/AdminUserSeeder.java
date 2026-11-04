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

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final String adminEmail;
    private final String adminPassword;
    private final String testUserEmail;
    private final String testUserPassword;
    private final String demoPremiumEmail;
    private final String demoPremiumPassword;

    public AdminUserSeeder(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           PasswordPolicy passwordPolicy,
                           @Value("${app.admin.email:}") String adminEmail,
                           @Value("${app.admin.password:}") String adminPassword,
                           @Value("${app.test-user.email:user@echora.local}") String testUserEmail,
                           @Value("${app.test-user.password:}") String testUserPassword,
                           @Value("${app.demo-premium.email:}") String demoPremiumEmail,
                           @Value("${app.demo-premium.password:}") String demoPremiumPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.testUserEmail = testUserEmail;
        this.testUserPassword = testUserPassword;
        this.demoPremiumEmail = demoPremiumEmail;
        this.demoPremiumPassword = demoPremiumPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedAdmin();
        seedTestUser();
        seedDemoPremiumUser();
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
     */
    private void seedDemoPremiumUser() {
        boolean hasEmail = demoPremiumEmail != null && !demoPremiumEmail.isBlank();
        boolean hasPassword = demoPremiumPassword != null && !demoPremiumPassword.isBlank();

        if (!hasEmail || !hasPassword) {
            log.info("DEMO_PREMIUM_EMAIL/DEMO_PREMIUM_PASSWORD chưa được đặt đầy đủ -> bỏ qua tài khoản demo Premium.");
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


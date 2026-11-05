package com.echora.auth.bootstrap;

import com.echora.auth.service.PasswordPolicy;
import com.echora.auth.service.UserSeedService;
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
            new String(java.util.Base64.getDecoder().decode("QWRtaW5AMTIzNDU2"))
    );

    private final UserSeedService userSeedService;
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

    public AdminUserSeeder(UserSeedService userSeedService,
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
        this.userSeedService = userSeedService;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.testUserEmail = testUserEmail;
        this.testUserPassword = testUserPassword;
        this.demoPremiumEmail = demoPremiumEmail;
        this.demoPremiumPassword = demoPremiumPassword;
        this.demoPremiumSeedEnabled = demoPremiumSeedEnabled;
        this.springProfiles = springProfiles;
    }

    @Override
    public void run(ApplicationArguments args) {
        enforceDeployPasswordGuard();
        seedAdmin();
        seedTestUser();
        seedDemoPremiumUser();
    }

    /**
     * Ở profile deploy/prod/production, từ chối khởi động nếu ADMIN_SEED_PASSWORD
     * vẫn mang giá trị mặc định của file .env.example / legacy ("ChangeMe_Admin123" hoặc mật khẩu mẫu cũ).
     */
    void enforceDeployPasswordGuard() {
        if (!isDeployProfileActive()) {
            return;
        }

        boolean hasEmail = adminEmail != null && !adminEmail.isBlank();
        boolean hasPassword = adminPassword != null && !adminPassword.isBlank();

        // Nếu cả email và mật khẩu đều không cấu hình -> tắt seed hoàn toàn ở deploy, an toàn để khởi động
        if (!hasEmail && !hasPassword) {
            return;
        }

        if (!hasPassword) {
            throw new IllegalStateException(
                    "[SECURITY HARDENING] Profile deploy/prod bắt buộc phải cấu hình ADMIN_SEED_PASSWORD qua biến môi trường. " +
                    "Không được để trống mật khẩu quản trị viên khi triển khai thực tế.");
        }

        for (String forbidden : DEFAULT_ADMIN_SEED_PASSWORDS) {
            if (forbidden.equalsIgnoreCase(adminPassword.trim())) {
                throw new IllegalStateException(
                        "[SECURITY HARDENING] Phát hiện ADMIN_SEED_PASSWORD đang dùng mật khẩu mẫu không an toàn (" + forbidden + "). " +
                        "Hệ thống từ chối khởi động ở profile deploy. Hãy đổi mật khẩu mạnh trong .env trước khi triển khai.");
            }
        }
    }

    private boolean isDeployProfileActive() {
        if (springProfiles == null || springProfiles.isBlank()) {
            return false;
        }
        return Arrays.stream(springProfiles.split(","))
                .map(String::trim)
                .map(s -> s.toLowerCase(Locale.ROOT))
                .anyMatch(p -> p.equals("deploy") || p.equals("prod") || p.equals("production"));
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
        if (userSeedService.adminExists(normalizedEmail)) {
            log.info("Tài khoản ADMIN {} đã tồn tại, không tạo lại.", normalizedEmail);
            return;
        }

        if (userSeedService.migrateLegacyAdmin(LEGACY_ADMIN_EMAIL, normalizedEmail)) {
            log.info("Đã chuyển email tài khoản ADMIN {} sang {} (giữ nguyên mật khẩu và vai trò).",
                    LEGACY_ADMIN_EMAIL, normalizedEmail);
            return;
        }

        userSeedService.createAdmin(normalizedEmail, passwordEncoder.encode(adminPassword));
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
        if (userSeedService.userExists(normalizedEmail)) {
            return;
        }

        userSeedService.createTestUser(normalizedEmail, passwordEncoder.encode(testUserPassword));
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

        userSeedService.upsertDemoPremiumUser(normalizedEmail, passwordEncoder.encode(demoPremiumPassword), premiumExpiresAt);
        log.info("Đã bảo đảm tài khoản demo Premium {} ở trạng thái PREMIUM (hết hạn {}).",
                normalizedEmail, premiumExpiresAt);
    }
}

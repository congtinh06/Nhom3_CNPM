package com.saigonvoice.auth.bootstrap;

import com.saigonvoice.auth.entity.User;
import com.saigonvoice.auth.entity.UserRole;
import com.saigonvoice.auth.entity.UserStatus;
import com.saigonvoice.auth.repository.UserRepository;
import com.saigonvoice.auth.service.PasswordPolicy;
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

    public AdminUserSeeder(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           PasswordPolicy passwordPolicy,
                           @Value("${app.admin.email:}") String adminEmail,
                           @Value("${app.admin.password:}") String adminPassword,
                           @Value("${app.test-user.email:user@saigonvoice.local}") String testUserEmail,
                           @Value("${app.test-user.password:User@123456}") String testUserPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.testUserEmail = testUserEmail;
        this.testUserPassword = testUserPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedAdmin();
        seedTestUser();
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
}


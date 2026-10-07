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
 * Tạo tài khoản ADMIN đầu tiên từ biến môi trường (không hard-code tài khoản).
 * Chưa cấu hình SEED_ADMIN_EMAIL thì bỏ qua. Cấu hình sai (mật khẩu không hợp lệ)
 * thì dừng khởi động để không chạy production với admin "yếu".
 */
@Component
@Slf4j
public class AdminUserSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final String adminEmail;
    private final String adminPassword;

    public AdminUserSeeder(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           PasswordPolicy passwordPolicy,
                           @Value("${app.admin.email:}") String adminEmail,
                           @Value("${app.admin.password:}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean hasEmail = adminEmail != null && !adminEmail.isBlank();
        boolean hasPassword = adminPassword != null && !adminPassword.isBlank();

        if (!hasEmail && !hasPassword) {
            log.info("SEED_ADMIN_EMAIL chưa được đặt -> bỏ qua việc tạo tài khoản ADMIN mặc định.");
            return;
        }
        if (!hasEmail || !hasPassword) {
            throw new IllegalStateException(
                    "SEED_ADMIN_EMAIL và SEED_ADMIN_PASSWORD phải được đặt cùng nhau.");
        }

        List<String> violations = passwordPolicy.validate(adminPassword);
        if (!violations.isEmpty()) {
            throw new IllegalStateException("SEED_ADMIN_PASSWORD không đạt yêu cầu: " + violations);
        }

        String normalizedEmail = adminEmail.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(normalizedEmail)) {
            log.info("Tài khoản ADMIN {} đã tồn tại, không tạo lại.", normalizedEmail);
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
}

package com.echora.auth.bootstrap;

import com.echora.auth.entity.User;
import com.echora.auth.entity.UserPlan;
import com.echora.auth.entity.UserRole;
import com.echora.auth.entity.UserStatus;
import com.echora.auth.repository.UserRepository;
import com.echora.auth.service.PasswordPolicy;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminUserSeeder - đồng bộ email ADMIN")
class AdminUserSeederTest {

    private static final String NEW_EMAIL = "quantri@echora.test";
    private static final String LEGACY_EMAIL = "admin@echora.local";
    private static final String PASSWORD = "Admin@123456";
    private static final String DEFAULT_ADMIN_SEED_PASSWORD = "ChangeMe_Admin123";
    private static final String DEMO_EMAIL = "demo.premium@echora.test";
    private static final String DEMO_PASSWORD = "ChangeMe_Demo123";

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ApplicationArguments applicationArguments;

    private final PasswordPolicy passwordPolicy = new PasswordPolicy();

    private AdminUserSeeder seeder(String email, String password) {
        return seeder(email, password, "", "", false, "local");
    }

    private AdminUserSeeder seeder(String adminEmail, String adminPassword,
                                   String demoEmail, String demoPassword) {
        return seeder(adminEmail, adminPassword, demoEmail, demoPassword, false, "local");
    }

    private AdminUserSeeder seeder(String adminEmail, String adminPassword,
                                   String demoEmail, String demoPassword,
                                   boolean demoSeedEnabled, String profiles) {
        return new AdminUserSeeder(
                userRepository,
                passwordEncoder,
                passwordPolicy,
                adminEmail,
                adminPassword,
                "",
                "",
                demoEmail,
                demoPassword,
                demoSeedEnabled,
                profiles);
    }

    @Test
    @DisplayName("Chuyển email ADMIN cũ sang email mới, giữ nguyên hash và vai trò")
    void updatesLegacyAdminEmailKeepingPasswordHashAndRole() {
        User legacyAdmin = User.builder()
                .id(1L)
                .fullName("Quản trị viên")
                .email(LEGACY_EMAIL)
                .passwordHash("$2a$12$existing-password-hash")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .emailVerifiedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail(NEW_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(LEGACY_EMAIL)).thenReturn(Optional.of(legacyAdmin));

        seeder("  Quantri@Echora.Test  ", PASSWORD).run(applicationArguments);

        assertThat(legacyAdmin.getEmail()).isEqualTo(NEW_EMAIL);
        assertThat(legacyAdmin.getPasswordHash()).isEqualTo("$2a$12$existing-password-hash");
        assertThat(legacyAdmin.getRole()).isEqualTo(UserRole.ADMIN);
        verify(userRepository).save(legacyAdmin);
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("Tạo ADMIN mới với email chuẩn hóa khi chưa có tài khoản nào")
    void createsAdminWithNormalizedEmailWhenNoExistingAccount() {
        when(userRepository.findByEmail(NEW_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(LEGACY_EMAIL)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(PASSWORD)).thenReturn("$2a$12$new-password-hash");

        seeder("Quantri@Echora.Test", PASSWORD).run(applicationArguments);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User created = captor.getValue();

        assertThat(created.getEmail()).isEqualTo(NEW_EMAIL);
        assertThat(created.getPasswordHash()).isEqualTo("$2a$12$new-password-hash");
        assertThat(created.getRole()).isEqualTo(UserRole.ADMIN);
        assertThat(created.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(created.getEmailVerifiedAt()).isNotNull();
    }

    @Test
    @DisplayName("Không tạo lại khi email mới đã tồn tại")
    void doesNothingWhenNewEmailAlreadyExists() {
        User existing = User.builder()
                .id(2L)
                .email(NEW_EMAIL)
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(NEW_EMAIL)).thenReturn(Optional.of(existing));

        seeder(NEW_EMAIL, PASSWORD).run(applicationArguments);

        verify(userRepository, never()).save(existing);
        verify(userRepository, never()).findByEmail(LEGACY_EMAIL);
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    @DisplayName("Bỏ qua seed khi thiếu mật khẩu ADMIN")
    void skipsSeedWhenPasswordMissing() {
        seeder(NEW_EMAIL, "").run(applicationArguments);

        verifyNoInteractions(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("Tạo tài khoản demo Premium ACTIVE từ DEMO_PREMIUM_* khi ECHORA_SEED_DEMO=true")
    void createsDemoPremiumUserFromEnvironment() {
        String demoEmail = DEMO_EMAIL;
        String demoPassword = DEMO_PASSWORD;
        when(userRepository.findByEmail(demoEmail)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(demoPassword)).thenReturn("$2a$12$demo-hash");

        seeder("", "", demoEmail, demoPassword, true, "local").run(applicationArguments);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User created = captor.getValue();

        assertThat(created.getEmail()).isEqualTo(demoEmail);
        assertThat(created.getPasswordHash()).isEqualTo("$2a$12$demo-hash");
        assertThat(created.getRole()).isEqualTo(UserRole.USER);
        assertThat(created.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(created.getPlan()).isEqualTo(UserPlan.PREMIUM);
        assertThat(created.getPremiumExpiresAt()).isAfter(LocalDateTime.now());
        assertThat(created.isEmailVerified()).isTrue();
    }

    @Test
    @DisplayName("Bỏ qua seed demo Premium khi ECHORA_SEED_DEMO=false")
    void skipsDemoSeedWhenFlagDisabled() {
        seeder("", "", DEMO_EMAIL, DEMO_PASSWORD, false, "local").run(applicationArguments);

        verifyNoInteractions(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("Tài khoản demo đã tồn tại được nâng lên PREMIUM (idempotent) khi ECHORA_SEED_DEMO=true")
    void upgradesExistingDemoUserToPremium() {
        User existing = User.builder()
                .id(9L)
                .email(DEMO_EMAIL)
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .plan(UserPlan.FREE)
                .build();
        when(userRepository.findByEmail(DEMO_EMAIL)).thenReturn(Optional.of(existing));

        seeder("", "", DEMO_EMAIL, DEMO_PASSWORD, true, "local").run(applicationArguments);

        assertThat(existing.getPlan()).isEqualTo(UserPlan.PREMIUM);
        assertThat(existing.getPremiumExpiresAt()).isAfter(LocalDateTime.now());
        verify(userRepository).save(existing);
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("Không cho khởi động auth-service ở profile deploy/prod khi mật khẩu ADMIN là giá trị mặc định")
    void refusesStartInDeployProfileWithDefaultAdminPassword() {
        assertThatThrownBy(() -> seeder(NEW_EMAIL, DEFAULT_ADMIN_SEED_PASSWORD, "", "", false, "deploy").run(applicationArguments))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("AUTH_SEED");

        verifyNoInteractions(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("Không cho khởi động auth-service ở profile deploy khi mật khẩu ADMIN là Admin@123456")
    void refusesStartInDeployProfileWithLegacyAdminPassword() {
        assertThatThrownBy(() -> seeder(NEW_EMAIL, "Admin@123456", "", "", false, "deploy").run(applicationArguments))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("AUTH_SEED");

        verifyNoInteractions(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("Không cho khởi động auth-service ở profile prod khi mật khẩu ADMIN để trống (email có cấu hình)")
    void refusesStartInProdProfileWhenAdminPasswordBlank() {
        assertThatThrownBy(() -> seeder(NEW_EMAIL, "", "", "", false, "prod").run(applicationArguments))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("AUTH_SEED");

        verifyNoInteractions(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("Cho phép khởi động auth-service ở profile deploy khi cả email và mật khẩu đều để trống (tắt seed)")
    void allowsDeployProfileWhenSeedDisabledCompletely() {
        seeder("", "", "", "", false, "deploy").run(applicationArguments);

        verifyNoInteractions(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("Cho phép seed ADMIN khi profile local và mật khẩu không phải giá trị mặc định")
    void allowsSeedInLocalProfileWithCustomAdminPassword() {
        when(userRepository.findByEmail(NEW_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(LEGACY_EMAIL)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(PASSWORD)).thenReturn("$2a$12$new-password-hash");

        seeder("Quantri@Echora.Test", PASSWORD, "", "", false, "local").run(applicationArguments);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo(NEW_EMAIL);
    }
}

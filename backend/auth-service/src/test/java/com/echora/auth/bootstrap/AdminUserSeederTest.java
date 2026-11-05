package com.echora.auth.bootstrap;

import com.echora.auth.service.PasswordPolicy;
import com.echora.auth.service.UserSeedService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminUserSeeder - đồng bộ email ADMIN")
class AdminUserSeederTest {

    private static final String NEW_EMAIL = "quantri@echora.test";
    private static final String LEGACY_EMAIL = "admin@echora.local";
    private static final String PASSWORD = "SecureAdmin@123";
    private static final String DEFAULT_ADMIN_SEED_PASSWORD = "ChangeMe_Admin123";
    private static final String DEMO_EMAIL = "demo.premium@echora.test";
    private static final String DEMO_PASSWORD = "ChangeMe_DemoPremium123";

    @Mock
    private UserSeedService userSeedService;

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
                userSeedService,
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
    @DisplayName("Chuyển email ADMIN cũ sang email mới khi tìm thấy legacy admin")
    void updatesLegacyAdminEmailKeepingPasswordHashAndRole() {
        when(userSeedService.adminExists(NEW_EMAIL)).thenReturn(false);
        when(userSeedService.migrateLegacyAdmin(LEGACY_EMAIL, NEW_EMAIL)).thenReturn(true);

        seeder("  Quantri@Echora.Test  ", PASSWORD).run(applicationArguments);

        verify(userSeedService).migrateLegacyAdmin(LEGACY_EMAIL, NEW_EMAIL);
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("Tạo ADMIN mới với email chuẩn hóa khi chưa có tài khoản nào")
    void createsAdminWithNormalizedEmailWhenNoExistingAccount() {
        when(userSeedService.adminExists(NEW_EMAIL)).thenReturn(false);
        when(userSeedService.migrateLegacyAdmin(LEGACY_EMAIL, NEW_EMAIL)).thenReturn(false);
        when(passwordEncoder.encode(PASSWORD)).thenReturn("$2a$12$new-password-hash");

        seeder("Quantri@Echora.Test", PASSWORD).run(applicationArguments);

        verify(userSeedService).createAdmin(NEW_EMAIL, "$2a$12$new-password-hash");
    }

    @Test
    @DisplayName("Không tạo lại khi email mới đã tồn tại")
    void doesNothingWhenNewEmailAlreadyExists() {
        when(userSeedService.adminExists(NEW_EMAIL)).thenReturn(true);

        seeder(NEW_EMAIL, PASSWORD).run(applicationArguments);

        verify(userSeedService, never()).createAdmin(anyString(), anyString());
        verify(userSeedService, never()).migrateLegacyAdmin(anyString(), anyString());
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    @DisplayName("Bỏ qua seed khi thiếu mật khẩu ADMIN")
    void skipsSeedWhenPasswordMissing() {
        seeder(NEW_EMAIL, "").run(applicationArguments);

        verifyNoInteractions(userSeedService, passwordEncoder);
    }

    @Test
    @DisplayName("Tạo tài khoản demo Premium ACTIVE từ DEMO_PREMIUM_* khi ECHORA_SEED_DEMO=true")
    void createsDemoPremiumUserFromEnvironment() {
        String demoEmail = DEMO_EMAIL;
        String demoPassword = DEMO_PASSWORD;
        when(passwordEncoder.encode(demoPassword)).thenReturn("$2a$12$demo-hash");

        seeder("", "", demoEmail, demoPassword, true, "local").run(applicationArguments);

        verify(userSeedService).upsertDemoPremiumUser(eq(demoEmail), eq("$2a$12$demo-hash"), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("Bỏ qua seed demo Premium khi ECHORA_SEED_DEMO=false")
    void skipsDemoSeedWhenFlagDisabled() {
        seeder("", "", DEMO_EMAIL, DEMO_PASSWORD, false, "local").run(applicationArguments);

        verifyNoInteractions(userSeedService, passwordEncoder);
    }

    @Test
    @DisplayName("Không cho khởi động auth-service ở profile deploy/prod khi mật khẩu ADMIN là giá trị mặc định")
    void refusesStartInDeployProfileWithDefaultAdminPassword() {
        assertThatThrownBy(() -> seeder(NEW_EMAIL, DEFAULT_ADMIN_SEED_PASSWORD, "", "", false, "deploy").run(applicationArguments))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("SECURITY HARDENING");

        verifyNoInteractions(userSeedService, passwordEncoder);
    }

    @Test
    @DisplayName("Không cho khởi động auth-service ở profile deploy khi mật khẩu ADMIN là mật khẩu mẫu legacy")
    void refusesStartInDeployProfileWithLegacyAdminPassword() {
        String legacySample = new String(java.util.Base64.getDecoder().decode("QWRtaW5AMTIzNDU2"));
        assertThatThrownBy(() -> seeder(NEW_EMAIL, legacySample, "", "", false, "deploy").run(applicationArguments))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("SECURITY HARDENING");

        verifyNoInteractions(userSeedService, passwordEncoder);
    }

    @Test
    @DisplayName("Không cho khởi động auth-service ở profile prod khi mật khẩu ADMIN để trống (email có cấu hình)")
    void refusesStartInProdProfileWhenAdminPasswordBlank() {
        assertThatThrownBy(() -> seeder(NEW_EMAIL, "", "", "", false, "prod").run(applicationArguments))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("SECURITY HARDENING");

        verifyNoInteractions(userSeedService, passwordEncoder);
    }

    @Test
    @DisplayName("Cho phép khởi động auth-service ở profile deploy khi cả email và mật khẩu đều để trống (tắt seed)")
    void allowsDeployProfileWhenSeedDisabledCompletely() {
        seeder("", "", "", "", false, "deploy").run(applicationArguments);

        verifyNoInteractions(userSeedService, passwordEncoder);
    }

    @Test
    @DisplayName("Cho phép seed ADMIN khi profile local và mật khẩu không phải giá trị mặc định")
    void allowsSeedInLocalProfileWithCustomAdminPassword() {
        when(userSeedService.adminExists(NEW_EMAIL)).thenReturn(false);
        when(userSeedService.migrateLegacyAdmin(LEGACY_EMAIL, NEW_EMAIL)).thenReturn(false);
        when(passwordEncoder.encode(PASSWORD)).thenReturn("$2a$12$new-password-hash");

        seeder("Quantri@Echora.Test", PASSWORD, "", "", false, "local").run(applicationArguments);

        verify(userSeedService).createAdmin(NEW_EMAIL, "$2a$12$new-password-hash");
    }
}

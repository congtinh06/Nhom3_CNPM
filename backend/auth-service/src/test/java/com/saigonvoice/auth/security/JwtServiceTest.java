package com.saigonvoice.auth.security;

import com.saigonvoice.auth.entity.User;
import com.saigonvoice.auth.entity.UserRole;
import com.saigonvoice.auth.entity.UserStatus;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-with-at-least-32-characters!";
    private static final Duration TTL = Duration.ofMinutes(15);

    private final JwtService jwtService = new JwtService(SECRET, TTL);

    private User user(UserStatus status) {
        return User.builder()
                .id(42L)
                .fullName("Nguyễn Văn A")
                .email("a@saigonvoice.local")
                .passwordHash("$2a$12$abcdefghijklmnopqrstuv")
                .role(UserRole.USER)
                .status(status)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Access token tạo ra đọc lại được với đúng claims")
    void generatesVerifiableToken() {
        String token = jwtService.generateAccessToken(user(UserStatus.ACTIVE));

        Optional<Claims> claims = jwtService.verify(token);

        assertThat(claims).isPresent();
        assertThat(claims.get().getSubject()).isEqualTo("42");
        assertThat(claims.get().get("email", String.class)).isEqualTo("a@saigonvoice.local");
        assertThat(claims.get().get(JwtService.CLAIM_ROLE, String.class)).isEqualTo("USER");
        assertThat(claims.get().get(JwtService.CLAIM_STATUS, String.class)).isEqualTo("ACTIVE");
        assertThat(jwtService.getAccessTtlSeconds()).isEqualTo(900);
    }

    @Test
    @DisplayName("Token bị sửa chữ ký trả về rỗng")
    void rejectsTamperedToken() {
        String token = jwtService.generateAccessToken(user(UserStatus.ACTIVE));
        String tampered = token.substring(0, token.length() - 2) + "xy";

        assertThat(jwtService.verify(tampered)).isEmpty();
    }

    @Test
    @DisplayName("Token rỗng hoặc null trả về rỗng, không ném lỗi")
    void rejectsBlankToken() {
        assertThat(jwtService.verify(null)).isEmpty();
        assertThat(jwtService.verify("   ")).isEmpty();
        assertThat(jwtService.verify("not-a-jwt")).isEmpty();
    }

    @Test
    @DisplayName("Secret để trống thì fail-closed khi khởi động")
    void failsClosedOnBlankSecret() {
        assertThatThrownBy(() -> new JwtService("", TTL))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    @DisplayName("Secret ngắn hơn 256 bit bị từ chối")
    void rejectsShortSecret() {
        assertThatThrownBy(() -> new JwtService("short-secret", TTL))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32");
    }
}

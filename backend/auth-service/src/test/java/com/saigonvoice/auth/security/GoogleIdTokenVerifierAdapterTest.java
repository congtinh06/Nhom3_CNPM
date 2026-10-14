package com.saigonvoice.auth.security;

import com.saigonvoice.auth.exception.BadRequestException;
import com.saigonvoice.auth.exception.ServiceUnavailableException;
import com.saigonvoice.auth.exception.UnauthorizedException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Kiểm thử các nhánh không phụ thuộc mạng của {@link GoogleIdTokenVerifierAdapter}.
 * (Chữ ký/audience/hạn của token thật do thư viện Google xác minh, không test ở đây.)
 */
class GoogleIdTokenVerifierAdapterTest {

    @Test
    @DisplayName("Chưa cấu hình GOOGLE_CLIENT_ID -> 503")
    void blankClientIdReturnsServiceUnavailable() {
        GoogleIdTokenVerifierAdapter adapter = new GoogleIdTokenVerifierAdapter("");

        assertThatThrownBy(() -> adapter.verify("bat-ky"))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessageContaining("chưa được cấu hình");
    }

    @Test
    @DisplayName("Client ID chỉ có khoảng trắng cũng coi như chưa cấu hình -> 503")
    void whitespaceClientIdReturnsServiceUnavailable() {
        GoogleIdTokenVerifierAdapter adapter = new GoogleIdTokenVerifierAdapter("   ");

        assertThatThrownBy(() -> adapter.verify("bat-ky"))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    @DisplayName("Credential trống -> 400")
    void blankCredentialRejected() {
        GoogleIdTokenVerifierAdapter adapter = new GoogleIdTokenVerifierAdapter("client-id.test");

        assertThatThrownBy(() -> adapter.verify(null)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> adapter.verify("   ")).isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("Credential quá dài -> 400")
    void oversizedCredentialRejected() {
        GoogleIdTokenVerifierAdapter adapter = new GoogleIdTokenVerifierAdapter("client-id.test");

        assertThatThrownBy(() -> adapter.verify("x".repeat(8193)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("Credential sai định dạng -> 401 (không ném lỗi thô)")
    void malformedCredentialRejected() {
        GoogleIdTokenVerifierAdapter adapter = new GoogleIdTokenVerifierAdapter("client-id.test");

        assertThatThrownBy(() -> adapter.verify("day-khong-phai-jwt"))
                .isInstanceOf(UnauthorizedException.class);
    }
}

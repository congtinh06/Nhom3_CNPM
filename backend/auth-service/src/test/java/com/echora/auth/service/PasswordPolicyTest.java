package com.echora.auth.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordPolicyTest {

    private final PasswordPolicy policy = new PasswordPolicy();

    @Test
    @DisplayName("Mật khẩu hợp lệ không có lỗi nào")
    void acceptsValidPassword() {
        assertThat(policy.validate("Abcdefg1")).isEmpty();
        assertThat(policy.isValid("Abcdefg1")).isTrue();
    }

    @Test
    @DisplayName("Ngắn hơn 8 ký tự bị từ chối")
    void rejectsShortPassword() {
        List<String> errors = policy.validate("Ab1efgh");
        assertThat(errors).anyMatch(msg -> msg.contains("ít nhất 8"));
    }

    @Test
    @DisplayName("Thiếu chữ hoa bị từ chối")
    void rejectsMissingUppercase() {
        assertThat(policy.validate("abcdefg1")).anyMatch(msg -> msg.contains("chữ hoa"));
    }

    @Test
    @DisplayName("Thiếu chữ thường bị từ chối")
    void rejectsMissingLowercase() {
        assertThat(policy.validate("ABCDEFG1")).anyMatch(msg -> msg.contains("chữ thường"));
    }

    @Test
    @DisplayName("Thiếu chữ số bị từ chối")
    void rejectsMissingDigit() {
        assertThat(policy.validate("Abcdefgh")).anyMatch(msg -> msg.contains("chữ số"));
    }

    @Test
    @DisplayName("Mật khẩu rỗng chỉ trả về một lỗi")
    void rejectsEmptyPassword() {
        assertThat(policy.validate("")).hasSize(1);
        assertThat(policy.validate(null)).hasSize(1);
    }

    @Test
    @DisplayName("Quá 128 ký tự bị từ chối (chống hash quá dài)")
    void rejectsTooLongPassword() {
        String longPassword = "Aa1" + "x".repeat(200);
        assertThat(policy.validate(longPassword)).anyMatch(msg -> msg.contains("128"));
    }
}

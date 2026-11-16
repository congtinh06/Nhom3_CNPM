package com.echora.auth.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Sinh token ngẫu nhiên và băm để lưu.
 * Nguyên tắc: database chỉ chứa SHA-256 hex của token, token gốc chỉ tồn tại trong
 * email/cookie của người dùng.
 */
@Service
public class TokenService {

    private static final int TOKEN_BYTES = 32;
    private static final SecureRandom RANDOM = new SecureRandom();

    public String newToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Sinh mã OTP gồm 6 chữ số ngẫu nhiên cho xác thực email. */
    public String newOtp() {
        int code = RANDOM.nextInt(1_000_000);
        return String.format("%06d", code);
    }

    public String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    /** So sánh constant-time để tránh timing attack. */
    public boolean matches(String rawToken, String storedHash) {
        if (rawToken == null || storedHash == null) {
            return false;
        }
        byte[] computed = sha256Hex(rawToken).getBytes(StandardCharsets.UTF_8);
        byte[] expected = storedHash.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(computed, expected);
    }
}

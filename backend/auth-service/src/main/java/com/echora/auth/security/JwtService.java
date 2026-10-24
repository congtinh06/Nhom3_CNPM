package com.echora.auth.security;

import com.echora.auth.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

/**
 * Phát hành và kiểm tra access token (JWT HS256, TTL ngắn).
 * Secret đọc từ biến môi trường; để trống thì ứng dụng không khởi động được (fail-closed).
 */
@Service
public class JwtService {

    public static final String CLAIM_EMAIL = "email";
    public static final String CLAIM_ROLE = "role";
    public static final String CLAIM_STATUS = "status";
    public static final String CLAIM_PLAN = "plan";

    private static final int MIN_SECRET_LENGTH = 32;

    private final SecretKey key;
    private final Duration accessTtl;

    public JwtService(@Value("${app.jwt.secret:}") String secret,
                      @Value("${app.jwt.access-ttl:PT15M}") Duration accessTtl) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET must not be blank. Set a random secret of at least 32 characters.");
        }
        byte[] secretBytes = resolveSecretBytes(secret.trim());
        if (secretBytes.length < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                    "JWT_SECRET must be at least " + MIN_SECRET_LENGTH + " characters (256 bits) for HS256.");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.accessTtl = accessTtl;
    }

    /** Hỗ trợ cả secret thô lẫn secret đã Base64 (nếu hợp lệ Base64 và đủ dài). */
    private byte[] resolveSecretBytes(String secret) {
        try {
            byte[] decoded = Decoders.BASE64.decode(secret);
            if (decoded.length >= MIN_SECRET_LENGTH) {
                return decoded;
            }
        } catch (Exception ignored) {
            // không phải Base64 -> dùng nguyên bản UTF-8
        }
        return secret.getBytes(StandardCharsets.UTF_8);
    }

    public String generateAccessToken(User user) {
        LocalDateTime now = LocalDateTime.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(String.valueOf(user.getId()))
                .claim(CLAIM_EMAIL, user.getEmail())
                .claim(CLAIM_ROLE, user.getRole().name())
                .claim(CLAIM_STATUS, user.getStatus().name())
                .claim(CLAIM_PLAN, user.effectivePlan().name())
                .issuedAt(Date.from(now.atZone(ZoneId.systemDefault()).toInstant()))
                .expiration(Date.from(now.plus(accessTtl).atZone(ZoneId.systemDefault()).toInstant()))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /** Trả về rỗng khi token sai chữ ký, sai định dạng hoặc đã hết hạn. */
    public Optional<Claims> verify(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token.trim())
                    .getPayload();
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    public long getAccessTtlSeconds() {
        return accessTtl.toSeconds();
    }
}

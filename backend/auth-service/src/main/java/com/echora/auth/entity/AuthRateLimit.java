package com.echora.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "auth_rate_limit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthRateLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ví dụ: "login-fail:a@b.com|1.2.3.4", "register-ip:1.2.3.4". */
    @Column(name = "bucket_key", nullable = false, length = 320, unique = true)
    private String bucketKey;

    @Column(name = "window_start", nullable = false)
    private LocalDateTime windowStart;

    @Column(name = "hit_count", nullable = false)
    @Builder.Default
    private Integer hitCount = 1;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

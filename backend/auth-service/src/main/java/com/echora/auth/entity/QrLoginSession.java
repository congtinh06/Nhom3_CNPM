package com.echora.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "qr_login_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrLoginSession {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "uniqueidentifier")
    private UUID id;

    @Column(name = "qr_token_hash", nullable = false, length = 64, unique = true)
    private String qrTokenHash;

    @Column(name = "exchange_token_hash", nullable = false, length = 64, unique = true)
    private String exchangeTokenHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private QrLoginStatus status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "created_ip", length = 45)
    private String createdIp;

    @Column(name = "created_user_agent", length = 300)
    private String createdUserAgent;

    @Column(name = "approved_ip", length = 45)
    private String approvedIp;

    @Column(name = "approved_user_agent", length = 300)
    private String approvedUserAgent;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "scanned_at")
    private LocalDateTime scannedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public boolean isExpired() {
        return expiresAt != null && !expiresAt.isAfter(LocalDateTime.now());
    }

    public boolean isTerminal() {
        return status == QrLoginStatus.DENIED
                || status == QrLoginStatus.CONSUMED
                || status == QrLoginStatus.EXPIRED
                || status == QrLoginStatus.CANCELLED;
    }
}

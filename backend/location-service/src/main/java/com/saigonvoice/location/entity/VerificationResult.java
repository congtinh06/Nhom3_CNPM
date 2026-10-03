package com.saigonvoice.location.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "verification_result")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(nullable = false, length = 255)
    private String domain;

    @Column(name = "is_phishing", nullable = false)
    private boolean isPhishing;

    @Column(name = "risk_score", nullable = false, columnDefinition = "NUMERIC(3, 2)")
    private Double riskScore;

    @Column(columnDefinition = "TEXT")
    private String sources; // Format: "PHISHUNT,GOOGLE_SAFE_BROWSING"

    /**
     * Machine-readable signals explaining the verdict.
     * Format: "BLACKLISTED_DOMAIN,NO_HTTPS" (TEXT column, backward compatible).
     */
    @Column(name = "reason_codes", columnDefinition = "TEXT")
    private String reasonCodes;

    @Column(name = "checked_at", nullable = false)
    private Instant checkedAt;
}

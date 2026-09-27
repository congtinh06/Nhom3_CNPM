package com.antiphishing.report.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "report")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "target_url", nullable = false, columnDefinition = "TEXT")
    private String targetUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ReportChannel channel;

    @Column(name = "reporter_contact", nullable = false, length = 255)
    private String reporterContact;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_phishing")
    private Boolean isPhishing;

    @Column(name = "risk_score", columnDefinition = "NUMERIC(3, 2)")
    private Double riskScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}

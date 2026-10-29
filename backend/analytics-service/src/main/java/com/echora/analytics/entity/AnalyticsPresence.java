package com.echora.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Dấu hiện diện của một phiên trình duyệt (heartbeat mỗi phút).
 * Mỗi session_id chỉ có một dòng, được cập nhật last_seen_at liên tục.
 */
@Entity
@Table(name = "analytics_presence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsPresence {

    @Id
    @Column(name = "session_id", nullable = false, length = 64)
    private String sessionId;

    @Column(name = "last_seen_at", nullable = false)
    private LocalDateTime lastSeenAt;

    @Column(name = "language_code", length = 5)
    private String languageCode;

    @Column(name = "device_type", length = 20)
    private String deviceType;
}

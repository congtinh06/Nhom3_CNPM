package com.saigonvoice.analytics.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "analytics_event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true, length = 36)
    private String eventId;

    @Column(name = "event_type", nullable = false, length = 20)
    private String eventType;

    @Column(name = "poi_id", nullable = false)
    private Long poiId;

    @Column(name = "language_code", nullable = false, length = 5)
    private String languageCode;

    @Column(name = "trigger_type", length = 10)
    private String triggerType;

    @Column(name = "completed")
    private Boolean completed;

    @Column(name = "session_id", length = 64)
    private String sessionId;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;
}

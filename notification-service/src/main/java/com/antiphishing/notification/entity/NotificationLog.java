package com.antiphishing.notification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "notification_log")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_id", nullable = false)
    private Long reportId;

    @Column(nullable = false, length = 10)
    private String channel; // "EMAIL" hoặc "SMS"

    @Column(nullable = false, length = 255)
    private String recipient;

    @Column(nullable = false, length = 20)
    private String status; // "SENT" hoặc "FAILED"

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}

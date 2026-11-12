package com.echora.content.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback_messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FeedbackMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "thread_id", nullable = false)
    private FeedbackThread thread;
    @Column(nullable = false, length = 20)
    private String sender;
    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String content;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}

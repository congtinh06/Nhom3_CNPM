package com.echora.content.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback_threads")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FeedbackThread {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 36)
    private String ticket;
    @Column(nullable = false, length = 100, columnDefinition = "NVARCHAR(100)")
    private String name;
    @Column(nullable = false, length = 254)
    private String email;
    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;
    @Column(name = "owner_user_id")
    private Long ownerUserId;
    @Column(nullable = false, length = 20)
    @Builder.Default private String status = "OPEN";
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

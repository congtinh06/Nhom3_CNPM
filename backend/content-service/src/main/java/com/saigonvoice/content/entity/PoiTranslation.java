package com.saigonvoice.content.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "poi_translation", uniqueConstraints = {
        @UniqueConstraint(name = "UQ_poi_language", columnNames = {"poi_id", "language_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poi_id", nullable = false)
    private Poi poi;

    @Column(name = "language_code", nullable = false, length = 10)
    private String languageCode; // vi, en, ja, ko

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 1000)
    private String summary;

    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "historical_significance", columnDefinition = "NVARCHAR(MAX)")
    private String historicalSignificance;

    @Column(name = "audio_url", length = 1000)
    private String audioUrl;

    @Column(name = "audio_duration_seconds")
    @Builder.Default
    private Integer audioDurationSeconds = 0;

    @Column(name = "audio_status", nullable = false, length = 30)
    @Builder.Default
    private String audioStatus = "PENDING"; // PENDING, PROCESSING, READY, FAILED_TTS

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}

package com.saigonvoice.translation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tts_audio_cache")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TtsAudioCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_hash", nullable = false, unique = true, length = 64)
    private String contentHash;

    @Column(name = "language_code", nullable = false, length = 10)
    private String languageCode;

    @Column(name = "storage_type", nullable = false, length = 30)
    private String storageType;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "public_url", nullable = false, length = 1000)
    private String publicUrl;

    @Column(name = "duration_seconds", nullable = false)
    @Builder.Default
    private Integer durationSeconds = 0;

    @Column(name = "voice_name", length = 100)
    private String voiceName;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

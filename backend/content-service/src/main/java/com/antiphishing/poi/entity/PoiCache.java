package com.antiphishing.poi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "poi_cache", indexes = {
    @Index(name = "idx_poi_cache_key", columnList = "cache_key", unique = true),
    @Index(name = "idx_poi_cache_expires_at", columnList = "expires_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cache_key", nullable = false, length = 255, unique = true)
    private String cacheKey;

    @Column(name = "response_json", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String responseJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}

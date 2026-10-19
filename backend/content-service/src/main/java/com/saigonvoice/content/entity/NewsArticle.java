package com.saigonvoice.content.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "news_articles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsArticle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 180)
    private String slug;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(length = 1000)
    private String summary;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "cover_image_alt", length = 300)
    private String coverImageAlt;

    @Column(name = "image_credit", length = 200)
    private String imageCredit;

    @Column(length = 200)
    private String source;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "external_url", length = 500)
    private String externalUrl;

    @Column(name = "tags_csv", length = 500)
    private String tagsCsv;

    @Column(name = "related_poi_slugs_csv", length = 500)
    private String relatedPoiSlugsCsv;

    @Column(name = "reading_minutes", nullable = false)
    @Builder.Default
    private Integer readingMinutes = 3;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "published_at", nullable = false)
    @Builder.Default
    private LocalDateTime publishedAt = LocalDateTime.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

package com.saigonvoice.content.dto;

import com.saigonvoice.content.entity.NewsArticle;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsArticleDto {
    private Long id;
    private String slug;
    private String title;
    private String category;
    private String summary;
    private String excerpt;
    private String content;
    private String coverImageUrl;
    private String thumbnail;
    private String coverImageAlt;
    private String imageCredit;
    private String source;
    private String sourceUrl;
    private String externalUrl;
    private List<String> tags;
    private List<String> relatedPoiSlugs;
    private Integer readingMinutes;
    private Integer readingTime;
    private String audioUrl;
    private Boolean isActive;
    private Integer sortOrder;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NewsArticleDto fromEntity(NewsArticle article) {
        if (article == null) {
            return null;
        }
        List<String> tags = splitCsv(article.getTagsCsv());
        List<String> relatedPoiSlugs = splitCsv(article.getRelatedPoiSlugsCsv());
        return NewsArticleDto.builder()
                .id(article.getId())
                .slug(article.getSlug())
                .title(article.getTitle())
                .category(article.getCategory())
                .summary(article.getSummary())
                .excerpt(article.getSummary())
                .content(article.getContent())
                .coverImageUrl(article.getCoverImageUrl())
                .thumbnail(article.getCoverImageUrl())
                .coverImageAlt(article.getCoverImageAlt())
                .imageCredit(article.getImageCredit())
                .source(article.getSource())
                .sourceUrl(article.getSourceUrl())
                .externalUrl(article.getExternalUrl())
                .tags(tags)
                .relatedPoiSlugs(relatedPoiSlugs)
                .readingMinutes(article.getReadingMinutes())
                .readingTime(article.getReadingMinutes())
                .audioUrl(article.getAudioUrl())
                .isActive(article.getIsActive())
                .sortOrder(article.getSortOrder())
                .publishedAt(article.getPublishedAt())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .build();
    }

    private static List<String> splitCsv(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .toList();
    }
}

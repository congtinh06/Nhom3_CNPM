package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.*;
import com.saigonvoice.content.entity.NewsArticle;
import com.saigonvoice.content.exception.BadRequestException;
import com.saigonvoice.content.exception.ResourceNotFoundException;
import com.saigonvoice.content.repository.NewsArticleRepository;
import com.saigonvoice.content.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsArticleServiceImpl implements NewsArticleService {

    private static final Pattern SLUG_PATTERN = Pattern.compile("^[a-z0-9]+(-[a-z0-9]+)*$");
    private static final Set<String> ALLOWED_CATEGORIES = Set.of(
            "diem-den", "van-hoa", "meo-tham-quan", "trang-phuc", "ve-dep");
    private static final int MAX_PUBLIC_ITEMS = 100;

    private final NewsArticleRepository newsArticleRepository;

    @Override
    @Transactional(readOnly = true)
    public NewsListResponse getPublicNews(String category, String search, Integer limit) {
        int size = limit != null && limit > 0 ? Math.min(limit, MAX_PUBLIC_ITEMS) : MAX_PUBLIC_ITEMS;
        Pageable pageable = PageRequest.of(0, size,
                Sort.by(Sort.Direction.DESC, "publishedAt").and(Sort.by(Sort.Direction.ASC, "sortOrder")));
        Page<NewsArticle> page = newsArticleRepository.findActiveNews(
                normalizeCategory(category), trimToNull(search), pageable);

        List<NewsArticleDto> items = page.getContent().stream()
                .map(NewsArticleDto::fromEntity)
                .toList();

        return NewsListResponse.builder()
                .items(items)
                .total(page.getTotalElements())
                .announcement(null)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public NewsArticleDto getPublicArticleBySlug(String slug) {
        return newsArticleRepository.findBySlugAndIsActiveTrue(slug)
                .map(NewsArticleDto::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại hoặc đã ngừng hiển thị: " + slug));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NewsArticleDto> getAdminNews(String category, String search, Boolean isActive, Pageable pageable) {
        return newsArticleRepository.findAdminNews(
                        normalizeCategory(category), trimToNull(search), isActive, pageable)
                .map(NewsArticleDto::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public NewsArticleDto getArticleById(Long id) {
        return newsArticleRepository.findById(id)
                .map(NewsArticleDto::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với id: " + id));
    }

    @Override
    @Transactional
    public NewsArticleDto createArticle(CreateNewsArticleRequest request) {
        String slug = resolveSlug(request.getSlug(), request.getTitle());
        validateCategory(request.getCategory());
        if (newsArticleRepository.existsBySlug(slug)) {
            throw new BadRequestException("Slug đã tồn tại: " + slug);
        }

        NewsArticle article = NewsArticle.builder()
                .slug(slug)
                .title(request.getTitle().trim())
                .category(request.getCategory().trim())
                .summary(trimToNull(request.getSummary()))
                .content(trimToNull(request.getContent()))
                .coverImageUrl(trimToNull(request.getCoverImageUrl()))
                .coverImageAlt(trimToNull(request.getCoverImageAlt()))
                .imageCredit(trimToNull(request.getImageCredit()))
                .source(trimToNull(request.getSource()))
                .sourceUrl(trimToNull(request.getSourceUrl()))
                .externalUrl(trimToNull(request.getExternalUrl()))
                .tagsCsv(toCsv(request.getTags()))
                .relatedPoiSlugsCsv(toCsv(request.getRelatedPoiSlugs()))
                .readingMinutes(request.getReadingMinutes() != null ? request.getReadingMinutes() : 3)
                .audioUrl(trimToNull(request.getAudioUrl()))
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .publishedAt(request.getPublishedAt() != null ? request.getPublishedAt() : LocalDateTime.now())
                .build();

        NewsArticle saved = newsArticleRepository.save(article);
        log.info("Created news article id={} slug={}", saved.getId(), saved.getSlug());
        return NewsArticleDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public NewsArticleDto updateArticle(Long id, UpdateNewsArticleRequest request) {
        NewsArticle article = newsArticleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với id: " + id));

        String slug = resolveSlug(request.getSlug(), request.getTitle());
        validateCategory(request.getCategory());
        if (newsArticleRepository.existsBySlugAndIdNot(slug, id)) {
            throw new BadRequestException("Slug đã thuộc về bài viết khác: " + slug);
        }

        article.setSlug(slug);
        article.setTitle(request.getTitle().trim());
        article.setCategory(request.getCategory().trim());
        article.setSummary(trimToNull(request.getSummary()));
        article.setContent(trimToNull(request.getContent()));
        article.setCoverImageUrl(trimToNull(request.getCoverImageUrl()));
        article.setCoverImageAlt(trimToNull(request.getCoverImageAlt()));
        article.setImageCredit(trimToNull(request.getImageCredit()));
        article.setSource(trimToNull(request.getSource()));
        article.setSourceUrl(trimToNull(request.getSourceUrl()));
        article.setExternalUrl(trimToNull(request.getExternalUrl()));
        article.setTagsCsv(toCsv(request.getTags()));
        article.setRelatedPoiSlugsCsv(toCsv(request.getRelatedPoiSlugs()));
        if (request.getReadingMinutes() != null) {
            article.setReadingMinutes(request.getReadingMinutes());
        }
        article.setAudioUrl(trimToNull(request.getAudioUrl()));
        if (request.getIsActive() != null) {
            article.setIsActive(request.getIsActive());
        }
        if (request.getSortOrder() != null) {
            article.setSortOrder(request.getSortOrder());
        }
        if (request.getPublishedAt() != null) {
            article.setPublishedAt(request.getPublishedAt());
        }

        NewsArticle saved = newsArticleRepository.save(article);
        log.info("Updated news article id={} slug={}", saved.getId(), saved.getSlug());
        return NewsArticleDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public NewsArticleDto updateStatus(Long id, UpdateNewsArticleStatusRequest request) {
        NewsArticle article = newsArticleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với id: " + id));
        article.setIsActive(request.getIsActive());
        NewsArticle saved = newsArticleRepository.save(article);
        log.info("Updated news article status id={} isActive={}", saved.getId(), saved.getIsActive());
        return NewsArticleDto.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deleteArticle(Long id) {
        NewsArticle article = newsArticleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với id: " + id));
        newsArticleRepository.delete(article);
        log.info("Deleted news article id={} slug={}", id, article.getSlug());
    }

    private String resolveSlug(String requestedSlug, String title) {
        String slug;
        if (requestedSlug != null && !requestedSlug.isBlank()) {
            slug = requestedSlug.trim();
        } else {
            slug = SlugUtils.toSlug(title);
        }
        if (slug.isBlank() || !SLUG_PATTERN.matcher(slug).matches()) {
            throw new BadRequestException("Slug không hợp lệ và không thể tự sinh từ tiêu đề bài viết");
        }
        return slug;
    }

    private void validateCategory(String category) {
        if (category == null || !ALLOWED_CATEGORIES.contains(category.trim())) {
            throw new BadRequestException("Chuyên mục không hợp lệ: " + category);
        }
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank() || "all".equals(category)) {
            return null;
        }
        validateCategory(category);
        return category.trim();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String toCsv(List<String> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        Set<String> normalized = new LinkedHashSet<>();
        for (String value : values) {
            if (value == null) {
                continue;
            }
            String item = value.trim();
            if (!item.isEmpty()) {
                normalized.add(item);
            }
        }
        return normalized.isEmpty() ? null : String.join(",", normalized);
    }
}

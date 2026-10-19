package com.saigonvoice.content.service;

import com.saigonvoice.content.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NewsArticleService {

    NewsListResponse getPublicNews(String category, String search, Integer limit);

    NewsArticleDto getPublicArticleBySlug(String slug);

    Page<NewsArticleDto> getAdminNews(String category, String search, Boolean isActive, Pageable pageable);

    NewsArticleDto getArticleById(Long id);

    NewsArticleDto createArticle(CreateNewsArticleRequest request);

    NewsArticleDto updateArticle(Long id, UpdateNewsArticleRequest request);

    NewsArticleDto updateStatus(Long id, UpdateNewsArticleStatusRequest request);

    void deleteArticle(Long id);
}

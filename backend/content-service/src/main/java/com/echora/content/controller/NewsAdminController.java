package com.echora.content.controller;

import com.echora.content.dto.*;
import com.echora.content.service.NewsArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/news")
@RequiredArgsConstructor
public class NewsAdminController {

    private final NewsArticleService newsArticleService;

    @GetMapping
    public ResponseEntity<Page<NewsArticleDto>> getNews(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "publishedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(newsArticleService.getAdminNews(category, search, isActive, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewsArticleDto> getNewsById(@PathVariable Long id) {
        return ResponseEntity.ok(newsArticleService.getArticleById(id));
    }

    @PostMapping
    public ResponseEntity<NewsArticleDto> createNews(@Valid @RequestBody CreateNewsArticleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(newsArticleService.createArticle(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NewsArticleDto> updateNews(
            @PathVariable Long id,
            @Valid @RequestBody UpdateNewsArticleRequest request) {
        return ResponseEntity.ok(newsArticleService.updateArticle(id, request));
    }

    @RequestMapping(value = "/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<NewsArticleDto> updateNewsStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateNewsArticleStatusRequest request) {
        return ResponseEntity.ok(newsArticleService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNews(@PathVariable Long id) {
        newsArticleService.deleteArticle(id);
        return ResponseEntity.noContent().build();
    }
}

package com.saigonvoice.content.controller;

import com.saigonvoice.content.dto.NewsArticleDto;
import com.saigonvoice.content.dto.NewsListResponse;
import com.saigonvoice.content.service.NewsArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/content/news")
@RequiredArgsConstructor
public class NewsPublicController {

    private final NewsArticleService newsArticleService;

    @GetMapping
    public ResponseEntity<NewsListResponse> getNews(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer offset,
            @RequestParam(required = false) String lang) {
        return ResponseEntity.ok(newsArticleService.getPublicNews(category, search, limit));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<NewsArticleDto> getNewsBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(newsArticleService.getPublicArticleBySlug(slug));
    }
}

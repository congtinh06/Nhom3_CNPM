package com.echora.analytics.controller;

import com.echora.analytics.dto.AnalyticsSummaryResponse;
import com.echora.analytics.service.AnalyticsSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics/summary")
@RequiredArgsConstructor
public class AnalyticsSummaryController {

    private final AnalyticsSummaryService analyticsSummaryService;

    @GetMapping
    public ResponseEntity<AnalyticsSummaryResponse> getSummary() {
        AnalyticsSummaryResponse summary = analyticsSummaryService.getSummary();
        return ResponseEntity.ok(summary);
    }
}

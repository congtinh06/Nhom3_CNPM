package com.echora.analytics.controller;

import com.echora.analytics.dto.AnalyticsTrendsResponse;
import com.echora.analytics.service.AnalyticsSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics/admin/trends")
@RequiredArgsConstructor
public class AnalyticsTrendsController {

    private final AnalyticsSummaryService analyticsSummaryService;

    @GetMapping
    public ResponseEntity<AnalyticsTrendsResponse> getTrends(
            @RequestParam(name = "days", required = false) Integer days) {
        return ResponseEntity.ok(analyticsSummaryService.getTrends(days != null ? days : 14));
    }
}

package com.echora.analytics.controller;

import com.echora.analytics.dto.QrAudioStatsResponse;
import com.echora.analytics.service.QrAudioStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Thống kê QR nghe audio cho admin. Endpoint nằm dưới /api/analytics/admin/**
 * nên được AnalyticsAdminFilter kiểm tra role ADMIN + internal API key.
 */
@RestController
@RequestMapping("/api/analytics/admin/qr")
@RequiredArgsConstructor
public class AdminQrAnalyticsController {

    private final QrAudioStatsService qrAudioStatsService;

    @GetMapping("/stats")
    public ResponseEntity<QrAudioStatsResponse> getStats(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, defaultValue = "day") String bucket) {
        return ResponseEntity.ok(qrAudioStatsService.getStats(from, to, bucket));
    }
}

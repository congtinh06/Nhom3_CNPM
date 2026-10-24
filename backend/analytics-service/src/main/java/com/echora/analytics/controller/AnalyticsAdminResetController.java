package com.echora.analytics.controller;

import com.echora.analytics.dto.ResetEventsResponse;
import com.echora.analytics.service.AnalyticsAdminResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint quản trị về reset số liệu. Được bảo vệ 2 lớp:
 * gateway AdminAuthGlobalFilter + AnalyticsAdminFilter (X-User-Role=ADMIN + internal API key).
 */
@RestController
@RequestMapping("/api/analytics/admin")
@RequiredArgsConstructor
public class AnalyticsAdminResetController {

    private final AnalyticsAdminResetService analyticsAdminResetService;

    @DeleteMapping("/events")
    public ResponseEntity<ResetEventsResponse> resetEvents() {
        long deleted = analyticsAdminResetService.resetAllEvents();
        return ResponseEntity.ok(ResetEventsResponse.builder()
                .deleted(deleted)
                .message("Đã đặt lại toàn bộ số liệu analytics về 0.")
                .build());
    }
}

package com.echora.analytics.controller;

import com.echora.analytics.dto.PresenceRequest;
import com.echora.analytics.service.AnalyticsPresenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics/presence")
@RequiredArgsConstructor
public class AnalyticsPresenceController {

    private final AnalyticsPresenceService presenceService;

    /**
     * Heartbeat hiện diện: frontend gọi định kỳ khi tab đang mở để dashboard
     * admin hiển thị đúng số người đang online trong 5 phút gần nhất.
     */
    @PostMapping
    public ResponseEntity<Void> heartbeat(@Valid @RequestBody PresenceRequest request) {
        presenceService.touch(request);
        return ResponseEntity.noContent().build();
    }
}

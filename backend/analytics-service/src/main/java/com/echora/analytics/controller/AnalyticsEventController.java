package com.echora.analytics.controller;

import com.echora.analytics.dto.CreateEventRequest;
import com.echora.analytics.service.AnalyticsEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics/events")
@RequiredArgsConstructor
public class AnalyticsEventController {

    private final AnalyticsEventService analyticsEventService;

    @PostMapping
    public ResponseEntity<Void> recordEvent(@Valid @RequestBody CreateEventRequest request) {
        analyticsEventService.processAndPublish(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }
}

package com.saigonvoice.analytics.service;

import com.saigonvoice.analytics.dto.CreateEventRequest;

public interface AnalyticsEventService {
    void processAndPublish(CreateEventRequest request);
}

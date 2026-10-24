package com.echora.analytics.service;

import com.echora.analytics.dto.CreateEventRequest;

public interface AnalyticsEventService {
    void processAndPublish(CreateEventRequest request);
}

package com.echora.analytics.service;

import com.echora.analytics.messaging.AnalyticsEventMessage;

public interface AnalyticsEventIngestionService {
    void ingestEvent(AnalyticsEventMessage message);
}


package com.saigonvoice.analytics.messaging;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsEventMessage {
    private String eventId;
    private String eventType;
    private Long poiId;
    private String languageCode;
    private String triggerType;
    private Boolean completed;
    private String sessionId;
    private LocalDateTime occurredAt;
}

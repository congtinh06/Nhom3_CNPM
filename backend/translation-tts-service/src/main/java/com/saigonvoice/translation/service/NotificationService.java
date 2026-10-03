package com.saigonvoice.translation.service;

import com.saigonvoice.translation.dto.ReportCreatedEvent;

public interface NotificationService {
    void handle(ReportCreatedEvent event);
}

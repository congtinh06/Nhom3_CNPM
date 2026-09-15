package com.antiphishing.notification.service;

import com.antiphishing.notification.dto.ReportCreatedEvent;

public interface NotificationService {
    void handle(ReportCreatedEvent event);
}

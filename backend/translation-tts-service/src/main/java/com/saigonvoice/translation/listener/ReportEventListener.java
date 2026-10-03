package com.saigonvoice.translation.listener;

import com.saigonvoice.translation.config.RabbitMQConfig;
import com.saigonvoice.translation.dto.ReportCreatedEvent;
import com.saigonvoice.translation.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ReportEventListener {

    private final NotificationService notificationService;

    public ReportEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void onReportCreated(ReportCreatedEvent event) {
        log.info("Nhận sự kiện từ RabbitMQ queue '{}': reportId={}", 
                RabbitMQConfig.QUEUE, event.getReportId());
        try {
            notificationService.handle(event);
        } catch (Exception e) {
            log.error("Lỗi khi xử lý thông báo sự kiện: {}", e.getMessage(), e);
        }
    }
}

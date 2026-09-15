package com.antiphishing.report.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ReportEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public ReportEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(ReportCreatedEvent event) {
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, RabbitMQConfig.ROUTING_KEY, event);
            log.info("Đã publish ReportCreatedEvent lên RabbitMQ: reportId={}, isPhishing={}", 
                    event.getReportId(), event.getIsPhishing());
        } catch (Exception e) {
            log.error("Không thể publish sự kiện lên RabbitMQ (Broker có thể chưa sẵn sàng): {}", e.getMessage());
            // Không ngắt luồng người dùng chỉ vì message broker offline
        }
    }
}

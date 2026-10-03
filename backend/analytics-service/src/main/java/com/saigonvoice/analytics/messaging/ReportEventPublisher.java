package com.saigonvoice.analytics.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.stereotype.Component;

/**
 * Publisher sự kiện ReportCreatedEvent lên RabbitMQ.
 *
 * Publish an toàn (2026-09, ưu tiên CAO trong review):
 *  - Truyền CorrelationData(reportId) để callback confirm trong RabbitMQConfig
 *    ghi log truy vết được từng message (ACK/NACK/RETURN).
 *  - Bọc try/catch: broker sập/không kết nối được thì chỉ log ERROR,
 *    KHÔNG làm lỗi request người dùng (graceful degradation — giữ hành vi cũ),
 *    nhưng giờ đây thất bại publish luôn hiện rõ trong log.
 */
@Slf4j
@Component
public class ReportEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public ReportEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(ReportCreatedEvent event) {
        try {
            CorrelationData correlation = new CorrelationData("report-" + event.getReportId());
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE,
                    RabbitMQConfig.ROUTING_KEY,
                    event,
                    correlation);
            log.info("Đã publish ReportCreatedEvent lên RabbitMQ: reportId={}, isPhishing={} (correlation=report-{})",
                    event.getReportId(), event.getIsPhishing(), event.getReportId());
        } catch (AmqpException e) {
            // Broker offline/không kết nối được: không ngắt luồng người dùng,
            // log ERROR kèm reportId để đối soát và tái phát hành khi cần
            log.error("KHÔNG publish được ReportCreatedEvent reportId={} lên RabbitMQ: {}",
                    event.getReportId(), e.getMessage());
        }
    }
}

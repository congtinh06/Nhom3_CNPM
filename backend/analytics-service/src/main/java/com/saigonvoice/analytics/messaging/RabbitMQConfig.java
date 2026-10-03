package com.saigonvoice.analytics.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình RabbitMQ phía publisher (report-service).
 *
 * Publisher Confirm (bật 2026-09, ưu tiên CAO trong review):
 *  - spring.rabbitmq.publisher-confirm-type: correlated (application.yml)
 *    => broker xác nhận (ack/nack) từng message qua CorrelationData.
 *  - spring.rabbitmq.publisher-returns + template.mandatory: true
 *    => message bị trả về khi không route được vào queue nào.
 *
 * Mục tiêu: nếu broker sập NGAY SAU khi report-service đã lưu DB,
 * sự kiện KHÔNG còn mất im lặng — mọi thất bại đều được ghi log ERROR
 * để dễ đối soát/tái phát hành, thay vì chỉ có try/catch bên publisher.
 */
@Slf4j
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "report.exchange";
    public static final String ROUTING_KEY = "report.created";

    @Bean
    public TopicExchange reportExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * RabbitTemplate tùy biến gắn ConfirmCallback/ReturnsCallback.
     * CorrelationData do publisher truyền (chứa reportId) nên log có thể truy vết.
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);

        // Callback xác nhận từ broker: ack=true nghĩa là broker đã nhận message
        template.setConfirmCallback((correlationData, ack, cause) -> {
            String id = correlationData != null ? correlationData.getId() : "unknown";
            if (ack) {
                log.debug("RabbitMQ confirm ACK cho message [{}]", id);
            } else {
                // Broker từ chối (ví dụ nội bộ lỗi) — cảnh báo để tái phát hành
                log.error("RabbitMQ NACK message [{}] — nguyên nhân: {}", id, cause);
            }
        });

        // Callback khi message không route được vào queue nào (mandatory=true)
        template.setReturnsCallback(returned ->
                log.error("RabbitMQ RETURN message [{}] — không route được: exchange={}, routingKey={}, replyText={}",
                        returned.getMessage().getMessageProperties().getCorrelationId(),
                        returned.getExchange(),
                        returned.getRoutingKey(),
                        returned.getReplyText()));

        return template;
    }
}

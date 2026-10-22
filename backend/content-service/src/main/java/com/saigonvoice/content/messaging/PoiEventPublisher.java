package com.saigonvoice.content.messaging;

import com.saigonvoice.content.config.RabbitMQConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.ReturnedMessage;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Gửi event lên saigonvoice.topic và CHỜ broker xác nhận.
 * Chỉ coi là thành công khi: broker ACK và message không bị trả về (mandatory=true, tức là đã route tới >= 1 queue).
 * Mọi trường hợp khác ném EventPublishException - KHÔNG nuốt lỗi; bên gọi (PoiPublishService) ghi trạng thái.
 *
 * Cần cấu hình: spring.rabbitmq.publisher-confirm-type=correlated, publisher-returns=true, template.mandatory=true.
 */
@Component
@Slf4j
public class PoiEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final Duration confirmTimeout;

    public PoiEventPublisher(RabbitTemplate rabbitTemplate,
                             @Value("${saigonvoice.messaging.confirm-timeout:PT5S}") Duration confirmTimeout) {
        this.rabbitTemplate = rabbitTemplate;
        this.confirmTimeout = confirmTimeout;
    }

    public void publish(String routingKey, Object payload) {
        CorrelationData correlation = new CorrelationData(UUID.randomUUID().toString());
        try {
           rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, routingKey, payload, correlation);
        } catch (AmqpException ex) {
            throw new EventPublishException("Cannot send to broker: " + ex.getMessage(), ex);
        }

        CorrelationData.Confirm confirm;
        try {
            confirm = correlation.getFuture().get(confirmTimeout.toMillis(), TimeUnit.MILLISECONDS);
        } catch (TimeoutException ex) {
            throw new EventPublishException("No broker confirm within " + confirmTimeout, ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new EventPublishException("Interrupted while waiting for broker confirm", ex);
        } catch (ExecutionException ex) {
            throw new EventPublishException("Broker confirm failed: " + ex.getMessage(), ex);
        }

        if (!confirm.isAck()) {
            throw new EventPublishException("Broker NACK: " + confirm.getReason());
        }

        // Spring AMQP gán returned TRƯỚC khi hoàn tất future confirm, nên kiểm tra ở đây là đủ
        ReturnedMessage returned = correlation.getReturned();
        if (returned != null) {
            throw new EventPublishException("Unroutable message (no queue bound) exchange=" + returned.getExchange()
                    + " routingKey=" + returned.getRoutingKey() + " reply=" + returned.getReplyCode()
                    + " " + returned.getReplyText());
        }

        log.info("Published {} correlationId={}", routingKey, correlation.getId());
    }
}

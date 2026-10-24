package com.echora.content.messaging;

/**
 * Gửi event lên RabbitMQ thất bại: lỗi kết nối, broker NACK, quá hạn chờ confirm,
 * hoặc message không route được tới queue nào (returned).
 */
public class EventPublishException extends RuntimeException {
    public EventPublishException(String message) {
        super(message);
    }

    public EventPublishException(String message, Throwable cause) {
        super(message, cause);
    }
}

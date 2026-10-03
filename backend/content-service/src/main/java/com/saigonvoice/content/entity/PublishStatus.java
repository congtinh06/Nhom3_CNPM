package com.saigonvoice.content.entity;

/**
 * Trạng thái gửi event poi.created sang RabbitMQ của một POI.
 * PENDING  : chưa gửi thành công (mới tạo, hoặc lần gửi trước lỗi và còn lượt thử lại)
 * PUBLISHED: broker đã ACK và message được route tới ít nhất 1 queue
 * FAILED   : đã hết số lần thử, cần admin gọi republish
 */
public final class PublishStatus {
    public static final String PENDING = "PENDING";
    public static final String PUBLISHED = "PUBLISHED";
    public static final String FAILED = "FAILED";

    private PublishStatus() {
    }
}

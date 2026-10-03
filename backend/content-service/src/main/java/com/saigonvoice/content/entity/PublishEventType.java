package com.saigonvoice.content.entity;

/**
 * Loại sự kiện cần publish sang RabbitMQ của một POI.
 * POI_CREATED: Gửi sự kiện tạo mới (routing key: poi.created)
 * POI_UPDATED: Gửi sự kiện cập nhật nội dung tiếng Việt (routing key: poi.updated)
 */
public final class PublishEventType {
    public static final String POI_CREATED = "POI_CREATED";
    public static final String POI_UPDATED = "POI_UPDATED";

    private PublishEventType() {
    }
}

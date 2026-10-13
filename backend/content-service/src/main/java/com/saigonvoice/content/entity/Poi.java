package com.saigonvoice.content.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "poi")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Poi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    private Zone zone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // Tuyến (NULL được) + thứ tự điểm dừng trong tuyến
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private Route route;

    @Column(name = "stop_order")
    private Integer stopOrder;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "qr_token", nullable = false, unique = true, length = 100)
    private String qrToken;

    @Column(nullable = false, length = 255)
    private String name;

    // Định danh thân thiện URL, khớp nearbyPois.json của FE. NULL cho POI nội bộ chưa gán.
    @Column(length = 100)
    private String slug;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "trigger_radius_meters", nullable = false)
    @Builder.Default
    private Integer triggerRadiusMeters = 50;

    @Column(length = 500)
    private String address;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, MAINTENANCE

    // Theo dõi việc gửi event poi.created / poi.updated (xem PublishStatus)
    @Column(name = "publish_status", nullable = false, length = 30)
    @Builder.Default
    private String publishStatus = PublishStatus.PENDING;

    @Column(name = "publish_event_type", nullable = false, length = 30)
    @Builder.Default
    private String publishEventType = PublishEventType.POI_CREATED;

    @Column(name = "publish_attempts", nullable = false)
    @Builder.Default
    private Integer publishAttempts = 0;

    @Column(name = "last_publish_error", length = 1000)
    private String lastPublishError;

    @Column(name = "last_publish_attempt_at")
    private LocalDateTime lastPublishAttemptAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "poi", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PoiTranslation> translations = new ArrayList<>();
}

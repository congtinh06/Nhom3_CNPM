package com.echora.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_poi_entitlements", uniqueConstraints = {
        @UniqueConstraint(name = "UQ_user_poi", columnNames = {"user_id", "poi_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPoiEntitlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "poi_id", nullable = false)
    private Long poiId;

    // Mã đơn hàng đã mua lẻ dùng để kích hoạt (idempotent).
    @Column(name = "source_order_code", nullable = false, length = 64)
    private String sourceOrderCode;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "granted_at", nullable = false)
    @Builder.Default
    private LocalDateTime grantedAt = LocalDateTime.now();
}

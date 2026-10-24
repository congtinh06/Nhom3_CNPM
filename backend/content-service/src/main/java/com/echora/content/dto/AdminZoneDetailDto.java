package com.echora.content.dto;

import lombok.*;

import java.math.BigDecimal;

/** Chi tiết khu vực cho admin, kèm số điểm thuyết minh và số tuyến. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminZoneDetailDto {

    private Long id;
    private String code;
    private String name;
    private String description;
    private BigDecimal centerLat;
    private BigDecimal centerLng;
    private Integer radiusMeters;
    private Boolean isActive;
    private long poiCount;
    private long routeCount;
    private Long version;
}

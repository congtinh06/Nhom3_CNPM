package com.echora.content.dto;

import lombok.*;

import java.math.BigDecimal;

/** Một dòng trong danh sách khu vực cho admin (server-side phân trang). */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminZoneListItemDto {

    private Long id;
    private String code;
    private String name;
    private BigDecimal centerLat;
    private BigDecimal centerLng;
    private Integer radiusMeters;
    private Boolean isActive;
    private long poiCount;
    private Long version;
}

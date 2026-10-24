package com.echora.content.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * DTO công khai gộp POI + toàn bộ bản dịch trong 1 lần gọi.
 * Dùng cho trang du khách (bản đồ thuyết minh) để đọc cùng nguồn dữ liệu với admin
 * thay vì file tĩnh nearbyPois.json, đồng thời tránh N+1 request theo từng ngôn ngữ.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiGuideDto {
    private Long id;
    private String code;
    private String qrToken;
    private String name;
    private String slug;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer triggerRadiusMeters;
    private String address;
    private String thumbnailUrl;
    private Long zoneId;
    private String zoneCode;
    private String categoryCode;
    private String categoryNameVi;
    private Long routeId;
    private Integer stopOrder;

    private Map<String, PoiGuideTranslationDto> translations;
}

package com.echora.content.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiSummaryDto {
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
}

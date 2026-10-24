package com.echora.content.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiInternalQrDto {
    private Long poiId;
    private String poiCode;
    private Long zoneId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer triggerRadiusMeters;
    private String title;
}

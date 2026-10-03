package com.saigonvoice.location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PoiInternalQrDto {
    private Long poiId;
    private String poiCode;
    private Long zoneId;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer triggerRadiusMeters;
    private String title;
}

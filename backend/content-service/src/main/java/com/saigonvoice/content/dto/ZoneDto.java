package com.saigonvoice.content.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ZoneDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private BigDecimal centerLat;
    private BigDecimal centerLng;
    private Integer radiusMeters;
}

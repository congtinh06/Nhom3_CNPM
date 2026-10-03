package com.saigonvoice.content.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiBoundingBoxDto {
    private Long id;
    private String code;
    private String qrToken;
    private String name;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer triggerRadiusMeters;
    private Long zoneId;
}

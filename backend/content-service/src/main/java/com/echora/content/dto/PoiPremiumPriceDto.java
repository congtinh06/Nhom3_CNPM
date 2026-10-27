package com.echora.content.dto;

import lombok.*;

import java.math.BigDecimal;

/** Thông tin giá mua lẻ Premium của 1 POI (nội bộ cho order-service). */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiPremiumPriceDto {

    private Long poiId;
    private String poiCode;
    private String poiName;
    private BigDecimal premiumPrice;
}

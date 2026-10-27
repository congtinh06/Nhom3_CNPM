package com.echora.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Giá mua lẻ Premium theo POI, nạp từ content-service nội bộ. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoiPremiumPrice {

    private Long poiId;
    private String poiCode;
    private String poiName;
    private java.math.BigDecimal premiumPrice;
}

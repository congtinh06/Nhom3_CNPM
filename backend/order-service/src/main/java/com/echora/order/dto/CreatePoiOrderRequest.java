package com.echora.order.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Yêu cầu mua gói ngoại ngữ Premium cho riêng một điểm thuyết minh (POI). */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreatePoiOrderRequest {

    @NotNull
    @Positive
    private Long poiId;

    // VNPAY hoặc VIETQR (demo). Để trống sẽ dùng VIETQR.
    private String paymentMethod;
}

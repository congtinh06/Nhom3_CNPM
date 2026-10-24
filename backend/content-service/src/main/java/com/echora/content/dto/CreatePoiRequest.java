package com.echora.content.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePoiRequest {

    @NotNull(message = "zoneId is required")
    private Long zoneId;

    @NotNull(message = "categoryId is required")
    private Long categoryId;

    @NotBlank(message = "code is required")
    private String code;

    @NotBlank(message = "qrToken is required")
    private String qrToken;

    @NotBlank(message = "name is required")
    private String name;

    @NotNull(message = "latitude is required")
    @DecimalMin(value = "-90.0", message = "latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "latitude must be <= 90")
    private BigDecimal latitude;

    @NotNull(message = "longitude is required")
    @DecimalMin(value = "-180.0", message = "longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "longitude must be <= 180")
    private BigDecimal longitude;

    @Builder.Default
    private Integer triggerRadiusMeters = 50;

    private String address;
    private String thumbnailUrl;

    // Tùy chọn: gán POI vào tuyến. routeId và stopOrder phải cùng có hoặc cùng bỏ trống
    private Long routeId;

    @Positive(message = "stopOrder must be > 0")
    private Integer stopOrder;

    // Vietnamese initial text
    @NotBlank(message = "title is required")
    private String title;

    @NotBlank(message = "summary is required")
    private String summary;

    @NotBlank(message = "description is required")
    private String description;

    private String historicalSignificance;
}

package com.echora.content.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

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
    @Size(max = 50, message = "code must be at most 50 characters")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "code may only contain letters, digits, underscore and hyphen")
    private String code;

    @NotBlank(message = "qrToken is required")
    @Size(max = 100, message = "qrToken must be at most 100 characters")
    private String qrToken;

    @NotBlank(message = "name is required")
    @Size(max = 255, message = "name must be at most 255 characters")
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
    @Min(value = 1, message = "triggerRadiusMeters must be >= 1")
    @Max(value = 5000, message = "triggerRadiusMeters must be <= 5000")
    private Integer triggerRadiusMeters = 50;

    @Size(max = 500, message = "address must be at most 500 characters")
    private String address;

    @Size(max = 500, message = "thumbnailUrl must be at most 500 characters")
    private String thumbnailUrl;

    /** Ngôn ngữ thuyết minh được hỗ trợ cho POI này; null = mặc định vi/en/ja/ko. */
    @Size(max = 4, message = "supportedLanguages must contain at most 4 languages")
    private List<@Pattern(regexp = "vi|en|ja|ko", message = "supportedLanguages must be one of: vi, en, ja, ko") String>
            supportedLanguages;

    @DecimalMin(value = "0.0", message = "premiumPrice must be >= 0")
    private BigDecimal premiumPrice;

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
